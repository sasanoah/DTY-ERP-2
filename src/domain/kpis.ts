export type RunEconomics = {
  poyInputKg:number;
  gradeAKg:number;
  gradeBKg:number;
  wasteKg:number;
  poyLandedCostEgpKg:number;
  electricityKwh:number;
  electricityRate:number;
  laborCost:number;
  maintenanceCost:number;
  packingCost:number;
  financeCost:number;
  sellingPriceEgpKg:number;
  machineHours:number;
};

export function calculateRunEconomics(x:RunEconomics){
  const saleableKg = x.gradeAKg + x.gradeBKg;
  const yieldPct = x.poyInputKg > 0 ? saleableKg/x.poyInputKg : 0;
  const wastePct = x.poyInputKg > 0 ? x.wasteKg/x.poyInputKg : 0;
  const rawCost = x.poyInputKg*x.poyLandedCostEgpKg;
  const energyCost = x.electricityKwh*x.electricityRate;
  const totalCost = rawCost+energyCost+x.laborCost+x.maintenanceCost+x.packingCost+x.financeCost;
  const costPerKg = saleableKg > 0 ? totalCost/saleableKg : 0;
  const revenue = x.gradeAKg*x.sellingPriceEgpKg;
  const contribution = revenue-totalCost;
  return {
    saleableKg,yieldPct,wastePct,rawCost,energyCost,totalCost,costPerKg,revenue,contribution,
    contributionPerKg: saleableKg>0? contribution/saleableKg:0,
    contributionPerMachineHour:x.machineHours>0?contribution/x.machineHours:0,
  };
}

export function daysCover(stockKg:number,dailyUseKg:number){return dailyUseKg>0?stockKg/dailyUseKg:0;}
export function requiredPoyKg(plannedDtyKg:number,yieldPct:number){return yieldPct>0?plannedDtyKg/yieldPct:0;}
