import {prisma} from './prisma';
export async function nextProductionOrderNo(){
  const yy=String(new Date().getFullYear()).slice(-2);
  const prefix=`PRD-${yy}-`;
  const last=await prisma.productionOrder.findFirst({where:{orderNo:{startsWith:prefix}},orderBy:{orderNo:'desc'},select:{orderNo:true}});
  const n=last?Number(last.orderNo.split('-').at(-1))+1:1;
  return `${prefix}${String(n).padStart(6,'0')}`;
}
export function finishedLotNo(productCode:string,machineCode:string){
  const d=new Date(); const y=String(d.getFullYear()).slice(-2); const mm=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0');
  const sku=productCode.match(/DTY-(\d+)-(\d+)/)?.slice(1).join('')||'DTY';
  return `${sku}-${y}${mm}${dd}-${machineCode.replace(/\D/g,'').slice(-2)||'01'}-${String(Date.now()).slice(-4)}`;
}
export async function nextPurchaseRequisitionNo(){
  const yy=String(new Date().getFullYear()).slice(-2); const prefix=`PR-${yy}-`;
  const last=await prisma.purchaseRequisition.findFirst({where:{prNo:{startsWith:prefix}},orderBy:{prNo:'desc'},select:{prNo:true}});
  const n=last?Number(last.prNo.split('-').at(-1))+1:1; return `${prefix}${String(n).padStart(6,'0')}`;
}
export async function nextPurchaseOrderNo(){
  const yy=String(new Date().getFullYear()).slice(-2); const prefix=`PO-${yy}-`;
  const last=await prisma.purchaseOrder.findFirst({where:{poNo:{startsWith:prefix}},orderBy:{poNo:'desc'},select:{poNo:true}});
  const n=last?Number(last.poNo.split('-').at(-1))+1:1; return `${prefix}${String(n).padStart(6,'0')}`;
}
export async function nextGrnNo(){
  const yy=String(new Date().getFullYear()).slice(-2); const prefix=`GRN-${yy}-`;
  const last=await prisma.goodsReceipt.findFirst({where:{grnNo:{startsWith:prefix}},orderBy:{grnNo:'desc'},select:{grnNo:true}});
  const n=last?Number(last.grnNo.split('-').at(-1))+1:1; return `${prefix}${String(n).padStart(6,'0')}`;
}
export async function nextSalesOrderNo(){
  const yy=String(new Date().getFullYear()).slice(-2); const prefix=`SO-${yy}-`;
  const last=await prisma.salesOrder.findFirst({where:{orderNo:{startsWith:prefix}},orderBy:{orderNo:'desc'},select:{orderNo:true}});
  const n=last?Number(last.orderNo.split('-').at(-1))+1:1; return `${prefix}${String(n).padStart(6,'0')}`;
}
export async function nextDeliveryNo(){
  const yy=String(new Date().getFullYear()).slice(-2); const prefix=`DLV-${yy}-`;
  const last=await prisma.delivery.findFirst({where:{deliveryNo:{startsWith:prefix}},orderBy:{deliveryNo:'desc'},select:{deliveryNo:true}});
  const n=last?Number(last.deliveryNo.split('-').at(-1))+1:1; return `${prefix}${String(n).padStart(6,'0')}`;
}
export async function nextInvoiceNo(){
  const yy=String(new Date().getFullYear()).slice(-2); const prefix=`INV-${yy}-`;
  const last=await prisma.invoice.findFirst({where:{invoiceNo:{startsWith:prefix}},orderBy:{invoiceNo:'desc'},select:{invoiceNo:true}});
  const n=last?Number(last.invoiceNo.split('-').at(-1))+1:1; return `${prefix}${String(n).padStart(6,'0')}`;
}
export async function nextMaintenanceOrderNo(){
  const yy=String(new Date().getFullYear()).slice(-2); const prefix=`MO-${yy}-`;
  const last=await prisma.maintenanceOrder.findFirst({where:{moNo:{startsWith:prefix}},orderBy:{moNo:'desc'},select:{moNo:true}});
  const n=last?Number(last.moNo.split('-').at(-1))+1:1; return `${prefix}${String(n).padStart(6,'0')}`;
}
export async function nextStockCountNo(){
  const yy=String(new Date().getFullYear()).slice(-2); const prefix=`CNT-${yy}-`;
  const last=await prisma.stockCount.findFirst({where:{countNo:{startsWith:prefix}},orderBy:{countNo:'desc'},select:{countNo:true}});
  const n=last?Number(last.countNo.split('-').at(-1))+1:1; return `${prefix}${String(n).padStart(6,'0')}`;
}
export async function nextProductionPlanNo(){const yy=String(new Date().getFullYear()).slice(-2),prefix=`PLAN-${yy}-`;const last=await prisma.productionPlan.findFirst({where:{planNo:{startsWith:prefix}},orderBy:{planNo:'desc'},select:{planNo:true}});const n=last?Number(last.planNo.split('-').at(-1))+1:1;return `${prefix}${String(n).padStart(5,'0')}`;}
export async function nextRfqNo(){const yy=String(new Date().getFullYear()).slice(-2),prefix=`RFQ-${yy}-`;const last=await prisma.rfq.findFirst({where:{rfqNo:{startsWith:prefix}},orderBy:{rfqNo:'desc'},select:{rfqNo:true}});const n=last?Number(last.rfqNo.split('-').at(-1))+1:1;return `${prefix}${String(n).padStart(5,'0')}`;}
export async function nextSalesQuotationNo(){const yy=String(new Date().getFullYear()).slice(-2),prefix=`QT-${yy}-`;const last=await prisma.salesQuotation.findFirst({where:{quoteNo:{startsWith:prefix}},orderBy:{quoteNo:'desc'},select:{quoteNo:true}});const n=last?Number(last.quoteNo.split('-').at(-1))+1:1;return `${prefix}${String(n).padStart(5,'0')}`;}
