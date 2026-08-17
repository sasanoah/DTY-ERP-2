import {prisma} from '@/lib/prisma';
import {calculateRunCost} from '@/lib/costing';
import {massBalance} from '@/domain/business-rules';
import {requirePermission,apiError} from '@/lib/rbac';
import {completeRunSchema} from '@/lib/validators';
import {audit} from '@/lib/audit';
import {finishedLotNo} from '@/lib/document-number';

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const s=await requirePermission('production.run');
    if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
    const {id}=await params;const d=completeRunSchema.parse(await req.json());
    const result=await prisma.$transaction(async tx=>{
      const run=await tx.productionRun.findFirst({where:{id,productionOrder:{machine:{plantId:s.plantId},product:{companyId:s.companyId}}},include:{productionOrder:{include:{product:true,machine:true}}}});
      if(!run)throw Object.assign(new Error('التشغيل غير موجود داخل المصنع'),{status:404});
      if(run.status!=='OPEN')throw Object.assign(new Error('التشغيل مغلق بالفعل'),{status:409});
      const input=Number(run.inputKg);const balance=massBalance(input,d.gradeAKg,d.gradeBKg,d.wasteKg);if(!balance.ok)throw Object.assign(new Error(`ميزان الكتلة غير متزن. الفرق ${balance.difference.toFixed(1)} كجم`),{status:409});
      const claimed=await tx.productionRun.updateMany({where:{id,status:'OPEN'},data:{gradeAKg:d.gradeAKg,gradeBKg:d.gradeBKg,wasteKg:d.wasteKg,electricityKwh:d.electricityKwh,downtimeMin:Math.max(run.downtimeMin,d.downtimeMin),endTime:new Date(),status:'COMPLETED'}});
      if(claimed.count!==1)throw Object.assign(new Error('التشغيل مغلق بالفعل'),{status:409});
      const openDowntime=await tx.downtimeEvent.findFirst({where:{productionRunId:id,endTime:null}});if(openDowntime)throw Object.assign(new Error('يوجد توقف مفتوح؛ أغلق التوقف قبل إنهاء الوردية'),{status:409});
      const closed=await tx.productionRun.findUniqueOrThrow({where:{id}});
      const lots:unknown[]=[];
      if(d.gradeAKg>0)lots.push(await tx.finishedLot.create({data:{productionRunId:id,productId:run.productionOrder.productId,lotNo:finishedLotNo(run.productionOrder.product.code,run.productionOrder.machine.code),grade:'A',qtyKg:d.gradeAKg,availableQtyKg:d.gradeAKg,qcStatus:'PENDING'}}));
      if(d.gradeBKg>0)lots.push(await tx.finishedLot.create({data:{productionRunId:id,productId:run.productionOrder.productId,lotNo:finishedLotNo(run.productionOrder.product.code,run.productionOrder.machine.code)+'-B',grade:'B',qtyKg:d.gradeBKg,availableQtyKg:d.gradeBKg,qcStatus:'PENDING'}}));
      const otherOpen=await tx.productionRun.findFirst({where:{status:'OPEN',productionOrder:{machineId:run.productionOrder.machineId}}});
      if(!otherOpen)await tx.machine.update({where:{id:run.productionOrder.machineId},data:{status:'RUN'}});
      await audit(tx,{userId:s.userId,entityType:'ProductionRun',entityId:id,action:'COMPLETE',before:{status:run.status,inputKg:input},after:d});return {run:closed,finishedLots:lots};
    });
    let costing=null;try{costing=await calculateRunCost(prisma,id,s.plantId)}catch{}
    return Response.json({ok:true,...result,costing});
  }catch(e){return apiError(e)}
}
