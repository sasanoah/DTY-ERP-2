import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {startRunSchema} from '@/lib/validators';
import {audit} from '@/lib/audit';

export async function POST(req:Request){
  try{
    const s=await requirePermission('production.run');
    if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
    const d=startRunSchema.parse(await req.json());
    const run=await prisma.$transaction(async tx=>{
      const order=await tx.productionOrder.findFirst({
        where:{id:d.productionOrderId,machine:{plantId:s.plantId},product:{companyId:s.companyId}},
        include:{machine:true,product:{include:{boms:{where:{active:true},include:{items:true},take:1}}}}
      });
      if(!order)throw Object.assign(new Error('أمر الإنتاج غير موجود داخل المصنع'),{status:404});
      if(!['RELEASED','RUNNING'].includes(order.status))throw Object.assign(new Error('أمر الإنتاج غير مفرج للتشغيل'),{status:409});
      const machineLock=await tx.machine.updateMany({where:{id:order.machineId,plantId:s.plantId,status:order.machine.status},data:{status:order.machine.status}});
      if(machineLock.count!==1)throw Object.assign(new Error('تغيرت حالة الماكينة أثناء بدء التشغيل'),{status:409});
      const shift=await tx.shift.findFirst({where:{id:d.shiftId,plantId:s.plantId}});
      if(!shift)throw Object.assign(new Error('الوردية غير صحيحة لهذا المصنع'),{status:400});
      const openMachineRun=await tx.productionRun.findFirst({where:{status:'OPEN',productionOrder:{machineId:order.machineId}}});
      if(openMachineRun)throw Object.assign(new Error('يوجد تشغيل مفتوح بالفعل على الماكينة'),{status:409});
      const lot=await tx.inventoryLot.findFirst({
        where:{id:d.poyLotId,warehouse:{plantId:s.plantId},material:{companyId:s.companyId}},
        include:{warehouse:true,material:true}
      });
      if(!lot||lot.qcStatus!=='RELEASED')throw Object.assign(new Error('Lot الخامة غير متاح أو غير مفرج'),{status:409});
      const bom=order.product.boms[0];
      if(bom?.items?.length && !bom.items.some(i=>i.materialId===lot.materialId))throw Object.assign(new Error('Lot الخامة لا يطابق BOM للصنف'),{status:409});
      const reserve=await tx.inventoryLot.updateMany({where:{id:lot.id,qcStatus:'RELEASED',availableQtyKg:{gte:d.poyIssueKg}},data:{availableQtyKg:{decrement:d.poyIssueKg}}});
      if(reserve.count!==1)throw Object.assign(new Error('رصيد POY غير كافٍ أو حالة الجودة تغيرت'),{status:409});
      const r=await tx.productionRun.create({data:{productionOrderId:order.id,shiftId:d.shiftId,operatorId:s.userId,startTime:new Date(),inputKg:d.poyIssueKg,status:'OPEN'}});
      await tx.materialIssue.create({data:{productionRunId:r.id,inventoryLotId:lot.id,qtyKg:d.poyIssueKg}});
      await tx.inventoryMovement.create({data:{lotId:lot.id,movementType:'ISSUE',qtyKg:d.poyIssueKg,refType:'PRODUCTION_RUN',refId:r.id,userId:s.userId}});
      await tx.productionOrder.update({where:{id:order.id},data:{status:'RUNNING'}});
      await tx.machine.update({where:{id:order.machineId},data:{status:'RUN'}});
      await audit(tx,{userId:s.userId,entityType:'ProductionRun',entityId:r.id,action:'START',after:{orderNo:order.orderNo,poyLot:lot.lotNo,poyIssueKg:d.poyIssueKg,shiftId:d.shiftId}});
      return r;
    });
    return Response.json({ok:true,run},{status:201});
  }catch(e){return apiError(e)}
}
