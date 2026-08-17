export function massBalance(inputKg:number,gradeAKg:number,gradeBKg:number,wasteKg:number,tolerancePct=0.005,minToleranceKg=2){
  const accounted=gradeAKg+gradeBKg+wasteKg; const difference=Math.abs(inputKg-accounted); const tolerance=Math.max(minToleranceKg,inputKg*tolerancePct);
  return {ok:difference<=tolerance,inputKg,accounted,difference,tolerance};
}
export function allocatedAncillary(totalAncillary:number,lineQtyKg:number,totalReceiptQtyKg:number){return totalReceiptQtyKg>0?totalAncillary*(lineQtyKg/totalReceiptQtyKg):0}
export function landedCostPerKg(unitPriceForeign:number,exchangeRate:number,allocatedAncillaryEgp:number,qtyKg:number){return qtyKg>0?unitPriceForeign*exchangeRate+allocatedAncillaryEgp/qtyKg:0}
export function creditDecision(creditLimit:number,currentExposure:number,newOrderValue:number,customerBlocked=false){const newExposure=currentExposure+newOrderValue;return {allowed:!customerBlocked&&newExposure<=creditLimit,newExposure,headroom:creditLimit-newExposure}}
export function freeFinishedQty(availableQtyKg:number,reservedQtyKg:number){return Math.max(0,availableQtyKg-reservedQtyKg)}
export function oeeMetrics(plannedMinutes:number,downtimeMin:number,actualSaleableKg:number,gradeAKg:number,inputKg:number,standardKgPerHour:number){
  const planned=Math.max(1,plannedMinutes); const runMin=Math.max(0,planned-downtimeMin); const availability=Math.max(0,Math.min(1,runMin/planned));
  const idealKg=standardKgPerHour*(runMin/60); const performance=idealKg>0?Math.max(0,Math.min(1.25,actualSaleableKg/idealKg)):0;
  const quality=inputKg>0?Math.max(0,Math.min(1,gradeAKg/inputKg)):0; const oee=Math.max(0,Math.min(1,availability*Math.min(1,performance)*quality));
  return {availability,performance,quality,oee,runMinutes:runMin,idealKg};
}
export function runCost(inputLots:{qtyKg:number;landedCostEgpKg:number}[], electricityKwh:number, runHours:number, saleableKg:number, cfg:{energyEgpKwh:number;laborEgpHour:number;packingEgpKg:number;financeAnnualRate:number;defaultWcDays:number}, machine:{maintenanceEgpHour:number;depreciationEgpHour:number}){
  const rawCost=inputLots.reduce((a,x)=>a+x.qtyKg*x.landedCostEgpKg,0); const energyCost=electricityKwh*cfg.energyEgpKwh; const laborCost=runHours*cfg.laborEgpHour;
  const maintenanceCost=runHours*machine.maintenanceEgpHour; const depreciationCost=runHours*machine.depreciationEgpHour; const packingCost=saleableKg*cfg.packingEgpKg;
  const preFinance=rawCost+energyCost+laborCost+maintenanceCost+depreciationCost+packingCost; const financeCost=preFinance*cfg.financeAnnualRate*(cfg.defaultWcDays/365);
  const total=preFinance+financeCost; return {rawCost,energyCost,laborCost,maintenanceCost,depreciationCost,packingCost,financeCost,total,fullCostEgpKg:saleableKg>0?total/saleableKg:0};
}

export function supplierWeightedScore(input:{cost:number;quality:number;yield:number;oee:number;delivery:number;terms:number}){
  const clamp=(x:number)=>Math.max(0,Math.min(100,x));
  const scores={cost:clamp(input.cost),quality:clamp(input.quality),yield:clamp(input.yield),oee:clamp(input.oee),delivery:clamp(input.delivery),terms:clamp(input.terms)};
  const overall=scores.cost*.30+scores.quality*.20+scores.yield*.20+scores.oee*.15+scores.delivery*.10+scores.terms*.05;
  return {...scores,overall};
}

export function customerTrueContribution(input:{revenue:number;cogs:number;creditCost:number;adjustments:number}){
  const contribution=input.revenue-input.cogs-input.creditCost-input.adjustments;
  return {...input,contribution,marginPct:input.revenue>0?contribution/input.revenue:0};
}
