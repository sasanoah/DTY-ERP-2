import {runOee} from '@/lib/costing';
import {supplierWeightedScore,customerTrueContribution} from '@/domain/business-rules';

const n=(v:any)=>Number(v||0);
const clamp=(x:number,min=0,max=100)=>Math.max(min,Math.min(max,x));

export async function supplierScorecard(db:any,companyId:string,plantId?:string){
  const [suppliers,allLots]=await Promise.all([
    db.supplier.findMany({where:{companyId},include:{
      inventoryLots:{where:{material:{type:'POY'}},include:{material:true,grn:{include:{shipment:true}},materialIssues:{include:{productionRun:{include:{productionOrder:{include:{product:true,machine:true}}}}}}}},
      purchaseOrders:{where:plantId?{plantId}:{},include:{shipments:{include:{goodsReceipts:true}}}}
    }}),
    db.inventoryLot.findMany({where:{material:{companyId,type:'POY'},supplierId:{not:null}},select:{materialId:true,receivedQtyKg:true,landedCostEgpKg:true}})
  ]);
  const bench=new Map<string,{value:number;qty:number}>();
  for(const l of allLots){const q=n(l.receivedQtyKg),v=n(l.landedCostEgpKg);const b=bench.get(l.materialId)||{value:0,qty:0};b.value+=q*v;b.qty+=q;bench.set(l.materialId,b)}
  const rows=[];
  for(const s of suppliers){
    const lots=s.inventoryLots; const receivedKg=lots.reduce((a:any,l:any)=>a+n(l.receivedQtyKg),0);
    const landedValue=lots.reduce((a:any,l:any)=>a+n(l.receivedQtyKg)*n(l.landedCostEgpKg),0); const avgLanded=receivedKg?landedValue/receivedKg:0;
    let costWeighted=0,costQty=0,qcWeighted=0,qcQty=0;
    for(const l of lots){const q=n(l.receivedQtyKg);const b=bench.get(l.materialId);if(q>0&&b&&b.qty>0&&n(l.landedCostEgpKg)>0){const bm=b.value/b.qty;costWeighted+=q*clamp((bm/n(l.landedCostEgpKg))*100);costQty+=q}if(l.qcStatus!=='PENDING'){const factor=l.qcStatus==='RELEASED'?1:l.qcStatus==='HOLD'?0.5:0;qcWeighted+=q*factor;qcQty+=q}}
    const costScore=costQty?costWeighted/costQty:0;const qualityScore=qcQty?qcWeighted/qcQty*100:0;
    const runWeights=new Map<string,{run:any;qty:number}>();
    for(const l of lots)for(const mi of l.materialIssues){const id=mi.productionRun.id;const x=runWeights.get(id)||{run:mi.productionRun,qty:0};x.qty+=n(mi.qtyKg);runWeights.set(id,x)}
    let yieldWeighted=0,oeeWeighted=0,runQty=0;
    for(const {run,qty} of runWeights.values()){
      if(qty<=0||n(run.inputKg)<=0)continue; const saleable=n(run.gradeAKg)+n(run.gradeBKg);const actualYield=saleable/n(run.inputKg);const target=n(run.productionOrder.product.standardYield)||.98;yieldWeighted+=qty*clamp(actualYield/target*100);try{const om=await runOee(db,run);oeeWeighted+=qty*clamp(n(om.oee)/.80*100)}catch{oeeWeighted+=0}runQty+=qty;
    }
    const yieldScore=runQty?yieldWeighted/runQty:0;const oeeScore=runQty?oeeWeighted/runQty:0;
    let deliveryKnown=0,onTime=0;
    for(const po of s.purchaseOrders)for(const sh of po.shipments){if(!sh.eta||!sh.goodsReceipts?.length)continue;deliveryKnown++;const first=[...sh.goodsReceipts].sort((a:any,b:any)=>+new Date(a.receiptDate)-+new Date(b.receiptDate))[0];if(+new Date(first.receiptDate)<=+new Date(sh.eta)+86400000)onTime++}
    const deliveryScore=deliveryKnown?onTime/deliveryKnown*100:0;const termsScore=clamp(n(s.paymentTermsDays)/45*100);
    const scores=supplierWeightedScore({cost:costScore,quality:qualityScore,yield:yieldScore,oee:oeeScore,delivery:deliveryScore,terms:termsScore});
    rows.push({supplierId:s.id,code:s.code,nameAr:s.nameAr,country:s.country,receivedKg,avgLandedCost:avgLanded,paymentTermsDays:s.paymentTermsDays,...scores,dataQuality:{lots:lots.length,runCount:runWeights.size,deliverySamples:deliveryKnown,qcAssessedKg:qcQty}});
  }
  return rows.sort((a,b)=>b.overall-a.overall);
}

export async function customerProfitability(db:any,companyId:string,plantId?:string,days=365){
  const start=new Date(Date.now()-days*86400000);const now=new Date();
  const cfg=plantId?await db.costConfig.findFirst({where:{plantId,active:true},orderBy:{effectiveFrom:'desc'}}):null;const annualRate=cfg?n(cfg.financeAnnualRate):.25;
  const customers=await db.customer.findMany({where:{companyId},include:{
    invoices:{where:{invoiceDate:{gte:start}},include:{collections:true,lines:{include:{salesOrderLine:{include:{allocations:{include:{finishedLot:{include:{productionRun:{include:{costSnapshot:true}}}}}}}}}}}},
    costAdjustments:{where:{occurredAt:{gte:start}}}
  }});
  const rows=[];
  for(const c of customers){let revenue=0,cogs=0,unknownCostKg=0,creditCost=0,daysWeighted=0,daysWeight=0,outstanding=0;
    for(const inv of c.invoices){
      const invAmount=n(inv.totalAmount);const invBalance=Math.max(0,invAmount-n(inv.paidAmount));outstanding+=invBalance;
      const lastDate=inv.status==='PAID'&&inv.collections.length?new Date(Math.max(...inv.collections.map((x:any)=>+new Date(x.collectionDate)))):now;const ageDays=Math.max(0,(+lastDate-+new Date(inv.invoiceDate))/86400000);daysWeighted+=ageDays*invAmount;daysWeight+=invAmount;creditCost+=invAmount*annualRate*(ageDays/365);
      for(const line of inv.lines){const qty=n(line.qtyKg),lineRevenue=qty*n(line.unitPrice);revenue+=lineRevenue;const allocs=line.salesOrderLine.allocations||[];let costValue=0,costQty=0;for(const a of allocs){const cost=a.finishedLot?.productionRun?.costSnapshot;if(cost){const aq=n(a.qtyKg);costValue+=aq*n(cost.fullCostEgpKg);costQty+=aq}}if(costQty>0)cogs+=qty*(costValue/costQty);else unknownCostKg+=qty}
    }
    const adjustments=c.costAdjustments.reduce((a:any,x:any)=>a+n(x.amountEgp),0);const result=customerTrueContribution({revenue,cogs,creditCost,adjustments});
    rows.push({customerId:c.id,code:c.code,nameAr:c.nameAr,city:c.city,customerType:c.customerType,creditLimit:n(c.creditLimit),outstanding,avgDays:daysWeight?daysWeighted/daysWeight:0,unknownCostKg,invoiceCount:c.invoices.length,adjustmentCount:c.costAdjustments.length,...result});
  }
  return rows.sort((a,b)=>b.contribution-a.contribution);
}
