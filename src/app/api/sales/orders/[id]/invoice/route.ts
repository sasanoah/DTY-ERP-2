import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {nextInvoiceNo} from '@/lib/document-number';
import {audit} from '@/lib/audit';

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const s=await requirePermission('sales.invoice');
    if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
    const {id}=await params;const invoiceNo=await nextInvoiceNo();
    const result=await prisma.$transaction(async tx=>{
      const o=await tx.salesOrder.findFirst({where:{id,plantId:s.plantId,customer:{companyId:s.companyId}},include:{lines:true,invoices:true}});
      if(!o)throw Object.assign(new Error('أمر البيع غير موجود داخل المصنع'),{status:404});
      if(o.status!=='DELIVERED')throw Object.assign(new Error('يجب الشحن قبل إصدار الفاتورة'),{status:409});
      if(o.invoices.length)throw Object.assign(new Error('تم إصدار فاتورة لهذا الأمر بالفعل'),{status:409});
      const total=o.lines.reduce((a,l)=>a+Number(l.qtyKg)*Number(l.unitPrice),0);const due=new Date();due.setDate(due.getDate()+o.paymentTermsDays);
      const inv=await tx.invoice.create({data:{customerId:o.customerId,salesOrderId:o.id,invoiceNo,dueDate:due,totalAmount:total,currency:o.currency,lines:{create:o.lines.map(l=>({salesOrderLineId:l.id,qtyKg:l.qtyKg,unitPrice:l.unitPrice}))}}});
      await tx.salesOrder.update({where:{id},data:{status:'INVOICED'}});
      await audit(tx,{userId:s.userId,entityType:'Invoice',entityId:inv.id,action:'CREATE',after:{invoiceNo,total,dueDate:due}});
      return inv;
    });
    return Response.json({ok:true,invoice:result});
  }catch(e){return apiError(e)}
}
