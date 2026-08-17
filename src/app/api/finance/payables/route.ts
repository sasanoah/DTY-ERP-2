import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {supplierInvoiceSchema} from '@/lib/validators';
import {audit} from '@/lib/audit';

export async function GET(){
  try{
    const s=await requirePermission('finance.read');
    const invoices=await prisma.supplierInvoice.findMany({where:{companyId:s.companyId},include:{supplier:true,purchaseOrder:true,payments:true},orderBy:{dueDate:'asc'}});
    const now=Date.now();
    const rows=invoices.map(i=>({
      id:i.id,invoiceNo:i.invoiceNo,supplier:i.supplier.nameAr,poNo:i.purchaseOrder?.poNo||'—',invoiceDate:i.invoiceDate,dueDate:i.dueDate,
      currency:i.currency,total:Number(i.totalAmount),paid:Number(i.paidAmount),outstanding:Math.max(0,Number(i.totalAmount)-Number(i.paidAmount)),status:i.status,
      daysOverdue:Math.max(0,Math.floor((now-i.dueDate.getTime())/86400000)),payments:i.payments.length
    }));
    return Response.json({ok:true,rows,summary:{outstanding:rows.reduce((a,r)=>a+r.outstanding,0),overdue:rows.filter(r=>r.daysOverdue>0&&r.outstanding>0).reduce((a,r)=>a+r.outstanding,0)}});
  }catch(e){return apiError(e)}
}

export async function POST(req:Request){
  try{
    const s=await requirePermission('finance.ap');
    const d=supplierInvoiceSchema.parse(await req.json());
    const supplier=await prisma.supplier.findFirst({where:{id:d.supplierId,companyId:s.companyId}});
    if(!supplier)throw Object.assign(new Error('المورد غير موجود'),{status:404});
    if(d.purchaseOrderId){
      const po=await prisma.purchaseOrder.findUnique({where:{id:d.purchaseOrderId}});
      if(!po||po.supplierId!==supplier.id||po.plantId!==s.plantId)throw Object.assign(new Error('أمر الشراء لا يطابق المورد أو المصنع'),{status:409});
    }
    const inv=await prisma.supplierInvoice.create({data:{companyId:s.companyId,supplierId:d.supplierId,purchaseOrderId:d.purchaseOrderId||null,invoiceNo:d.invoiceNo,invoiceDate:d.invoiceDate||new Date(),dueDate:d.dueDate,totalAmount:d.totalAmount,currency:d.currency,exchangeRate:d.exchangeRate,notes:d.notes,status:'OPEN'}});
    await audit(prisma,{userId:s.userId,entityType:'SupplierInvoice',entityId:inv.id,action:'CREATE',after:{invoiceNo:inv.invoiceNo,totalAmount:d.totalAmount,supplierId:d.supplierId}});
    return Response.json({ok:true,invoice:inv},{status:201});
  }catch(e){return apiError(e)}
}
