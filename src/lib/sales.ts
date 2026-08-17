import {prisma} from './prisma';
export async function customerExposure(customerId:string,excludeOrderId?:string){
  const [invoices,orders]=await Promise.all([
    prisma.invoice.findMany({where:{customerId,status:{in:['OPEN','PARTIAL','OVERDUE']}},select:{totalAmount:true,paidAmount:true}}),
    prisma.salesOrder.findMany({where:{customerId,id:excludeOrderId?{not:excludeOrderId}:undefined,status:{in:['CONFIRMED','ALLOCATED','DELIVERED']}},include:{lines:true}})
  ]);
  const receivables=invoices.reduce((a,x)=>a+Math.max(0,Number(x.totalAmount)-Number(x.paidAmount)),0);
  const openOrders=orders.reduce((a,o)=>a+o.lines.reduce((s,l)=>s+Number(l.qtyKg)*Number(l.unitPrice),0),0);
  return {receivables,openOrders,total:receivables+openOrders};
}
export async function floorRule(companyId:string,productId:string,customerId:string){
  return await prisma.priceRule.findFirst({where:{companyId,productId,customerId,active:true},orderBy:{effectiveFrom:'desc'}})
    || await prisma.priceRule.findFirst({where:{companyId,productId,customerId:null,active:true},orderBy:{effectiveFrom:'desc'}});
}
