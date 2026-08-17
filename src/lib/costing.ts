import {runCost,oeeMetrics} from '@/domain/business-rules';

export async function calculateRunCost(db:any,productionRunId:string,plantId:string){
  const run=await db.productionRun.findUnique({where:{id:productionRunId},include:{materialIssues:{include:{inventoryLot:true}},productionOrder:{include:{machine:true,product:true}}}});
  if(!run) throw Object.assign(new Error('التشغيل غير موجود'),{status:404});
  if(run.productionOrder.machine.plantId!==plantId) throw Object.assign(new Error('التشغيل خارج المصنع الحالي'),{status:403});
  if(run.status==='OPEN'||!run.endTime) throw Object.assign(new Error('يجب إقفال التشغيل قبل احتساب التكلفة'),{status:409});
  const cfg=await db.costConfig.findFirst({where:{plantId,active:true},orderBy:{effectiveFrom:'desc'}}); if(!cfg) throw Object.assign(new Error('إعدادات التكلفة غير موجودة'),{status:409});
  const machineRate=await db.machineCostRate.findFirst({where:{machineId:run.productionOrder.machineId,active:true},orderBy:{effectiveFrom:'desc'}}); if(!machineRate) throw Object.assign(new Error('معدل تكلفة الماكينة غير موجود'),{status:409});
  const elapsedHours=Math.max(0.01,(new Date(run.endTime).getTime()-new Date(run.startTime).getTime())/3600000);
  const saleableKg=Number(run.gradeAKg)+Number(run.gradeBKg);
  const c=runCost(run.materialIssues.map((x:any)=>({qtyKg:Number(x.qtyKg),landedCostEgpKg:Number(x.inventoryLot.landedCostEgpKg)})),Number(run.electricityKwh),elapsedHours,saleableKg,{energyEgpKwh:Number(cfg.energyEgpKwh),laborEgpHour:Number(cfg.laborEgpHour),packingEgpKg:Number(cfg.packingEgpKg),financeAnnualRate:Number(cfg.financeAnnualRate),defaultWcDays:cfg.defaultWcDays},{maintenanceEgpHour:Number(machineRate.maintenanceEgpHour),depreciationEgpHour:Number(machineRate.depreciationEgpHour)});
  const snap=await db.costSnapshot.upsert({where:{productionRunId},update:{rawCost:c.rawCost,energyCost:c.energyCost,laborCost:c.laborCost,maintenanceCost:c.maintenanceCost,packingCost:c.packingCost,financeCost:c.financeCost,depreciationCost:c.depreciationCost,saleableKg,fullCostEgpKg:c.fullCostEgpKg},create:{productionRunId,rawCost:c.rawCost,energyCost:c.energyCost,laborCost:c.laborCost,maintenanceCost:c.maintenanceCost,packingCost:c.packingCost,financeCost:c.financeCost,depreciationCost:c.depreciationCost,saleableKg,fullCostEgpKg:c.fullCostEgpKg}});
  return {run,snapshot:snap,elapsedHours};
}

export async function runOee(db:any,run:any){
  const cap=await db.machineCapability.findUnique({where:{machineId_productId:{machineId:run.productionOrder.machineId,productId:run.productionOrder.productId}}});
  const standardKgPerHour=cap?Number(cap.standardKgPerHour):0;
  return {...oeeMetrics(run.plannedMinutes,run.downtimeMin,Number(run.gradeAKg)+Number(run.gradeBKg),Number(run.gradeAKg),Number(run.inputKg),standardKgPerHour),standardKgPerHour};
}
