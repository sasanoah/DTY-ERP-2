import assert from 'node:assert/strict';
import {massBalance,allocatedAncillary,landedCostPerKg,creditDecision,freeFinishedQty} from '../src/domain/business-rules';
const ok=massBalance(1000,970,10,20);assert.equal(ok.ok,true);
const bad=massBalance(1000,950,10,20);assert.equal(bad.ok,false);
assert.equal(allocatedAncillary(100000,10000,20000),50000);
assert.equal(landedCostPerKg(1.2,50,50000,10000),65);
assert.equal(creditDecision(5_000_000,3_000_000,1_500_000).allowed,true);
assert.equal(creditDecision(5_000_000,4_000_000,1_500_000).allowed,false);
assert.equal(freeFinishedQty(1000,250),750);
console.log({ok:true,tests:7});
import {oeeMetrics,runCost} from '../src/domain/business-rules';
const oee=oeeMetrics(480,48,1800,1760,1900,250);assert.ok(oee.availability>0.89&&oee.availability<0.91);assert.ok(oee.oee>0);
const cost=runCost([{qtyKg:1020,landedCostEgpKg:76}],2000,8,1000,{energyEgpKwh:2.2,laborEgpHour:180,packingEgpKg:0.7,financeAnnualRate:.25,defaultWcDays:45},{maintenanceEgpHour:120,depreciationEgpHour:0});assert.ok(cost.fullCostEgpKg>80);

import {supplierWeightedScore,customerTrueContribution} from '../src/domain/business-rules';
const ss=supplierWeightedScore({cost:90,quality:100,yield:95,oee:80,delivery:100,terms:80});assert.ok(ss.overall>88&&ss.overall<93);
const cp=customerTrueContribution({revenue:1_000_000,cogs:800_000,creditCost:20_000,adjustments:30_000});assert.equal(cp.contribution,150_000);assert.equal(cp.marginPct,.15);
console.log({ok:true,v06Tests:3});
