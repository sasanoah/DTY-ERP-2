import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {nextDeliveryNo} from '@/lib/document-number';
import {audit} from '@/lib/audit';

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const s=await requirePermission('sales.dispatch');
    if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
    const {id}=await params;
    const result=await prisma.$transaction(async tx=>{
      const order=await tx.salesOrder.findFirst({where:{id,plantId:s.plantId,customer:{companyId:s.companyId}},include:{lines:{include:{allocations:{include:{finishedLot:{include:{productionRun:{include:{productionOrder:{include:{machine:true}}}}}}}}}}}});
      if(!order)throw Object.assign(new Error('أمر البيع غير موجود داخل المصنع'),{status:404});
      if(order.status!=='ALLOCATED')throw Object.assign(new Error('أمر البيع غير مخصص بالكامل'),{status:409});
      const allocations=order.lines.flatMap(l=>l.allocations);
      if(!allocations.length)throw Object.assign(new Error('لا توجد Allocations'),{status:409});
      for(const a of allocations){if(a.finishedLot.productionRun.productionOrder.machine.plantId!==s.plantId)throw Object.assign(new Error('Lot مخصص من مصنع آخر'),{status:409});if(a.finishedLot.qcStatus!=='RELEASED')throw Object.assign(new Error('يوجد Lot لم يعد مفرجًا من الجودة'),{status:409})}
      const claimed=await tx.salesOrder.updateMany({where:{id,plantId:s.plantId,status:'ALLOCATED'},data:{status:'DELIVERED'}});
      if(claimed.count!==1)throw Object.assign(new Error('تم شحن أمر البيع أو تغيرت حالته'),{status:409});
      const deliveryNo=await nextDeliveryNo(tx);
      const delivery=await tx.delivery.create({data:{salesOrderId:id,deliveryNo,deliveryDate:new Date(),status:'DISPATCHED',lines:{create:allocations.map(a=>({finishedLotId:a.finishedLotId,qtyKg:a.qtyKg}))}}});
      for(const a of allocations){
        const qty=Number(a.qtyKg);
        const u=await tx.finishedLot.updateMany({where:{id:a.finishedLotId,qcStatus:'RELEASED',availableQtyKg:{gte:qty},reservedQtyKg:{gte:qty}},data:{availableQtyKg:{decrement:qty},reservedQtyKg:{decrement:qty}}});
        if(u.count!==1)throw Object.assign(new Error('تغير رصيد DTY أو حالة الجودة أثناء الشحن؛ تم إلغاء العملية'),{status:409});
      }
      await audit(tx,{userId:s.userId,entityType:'SalesOrder',entityId:id,action:'DISPATCH',after:{deliveryNo}});
      return delivery;
    });
    return Response.json({ok:true,delivery:result});
  }catch(e){return apiError(e)}
}
