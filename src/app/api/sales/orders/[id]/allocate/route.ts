import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {audit} from '@/lib/audit';

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const s=await requirePermission('sales.allocate');
    if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
    const {id}=await params;
    const result=await prisma.$transaction(async tx=>{
      const order=await tx.salesOrder.findFirst({where:{id,plantId:s.plantId,customer:{companyId:s.companyId}},include:{lines:{include:{allocations:true}}}});
      if(!order)throw Object.assign(new Error('أمر البيع غير موجود داخل المصنع'),{status:404});
      if(order.status!=='CONFIRMED')throw Object.assign(new Error('يجب تأكيد أمر البيع قبل التخصيص'),{status:409});
      const plan:{lineId:string;lotId:string;qty:number}[]=[];
      for(const line of order.lines){
        const allocated=line.allocations.reduce((a,x)=>a+Number(x.qtyKg),0);let need=Number(line.qtyKg)-allocated;if(need<=0)continue;
        const lots=await tx.finishedLot.findMany({where:{productId:line.productId,qcStatus:'RELEASED',availableQtyKg:{gt:0},productionRun:{productionOrder:{machine:{plantId:s.plantId},product:{companyId:s.companyId}}}},orderBy:{createdAt:'asc'}});
        const free=lots.reduce((a,l)=>a+Math.max(0,Number(l.availableQtyKg)-Number(l.reservedQtyKg)),0);
        if(free+0.001<need)throw Object.assign(new Error(`مخزون المنتج المفرج غير كافٍ. عجز ${Math.ceil(need-free)} كجم`),{status:409});
        for(const lot of lots){const available=Math.max(0,Number(lot.availableQtyKg)-Number(lot.reservedQtyKg));if(available<=0)continue;const take=Math.min(need,available);plan.push({lineId:line.id,lotId:lot.id,qty:take});need-=take;if(need<=0.001)break}
      }
      for(const p of plan){
        const u=await tx.finishedLot.updateMany({where:{id:p.lotId,qcStatus:'RELEASED',availableQtyKg:{gte:p.qty}},data:{reservedQtyKg:{increment:p.qty}}});
        if(u.count!==1)throw Object.assign(new Error('تغير رصيد المنتج أثناء التخصيص؛ أعد المحاولة'),{status:409});
        const refreshed=await tx.finishedLot.findUnique({where:{id:p.lotId}});
        if(!refreshed||Number(refreshed.reservedQtyKg)>Number(refreshed.availableQtyKg)+0.001)throw Object.assign(new Error('التخصيص تجاوز المخزون المتاح'),{status:409});
        await tx.allocation.create({data:{salesOrderLineId:p.lineId,finishedLotId:p.lotId,qtyKg:p.qty}});
      }
      await tx.salesOrder.update({where:{id},data:{status:'ALLOCATED'}});
      await audit(tx,{userId:s.userId,entityType:'SalesOrder',entityId:id,action:'ALLOCATE',after:{allocations:plan}});
      return plan;
    });
    return Response.json({ok:true,allocations:result});
  }catch(e){return apiError(e)}
}
