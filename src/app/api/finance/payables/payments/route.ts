import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {supplierPaymentSchema} from '@/lib/validators';
import {audit} from '@/lib/audit';

export async function POST(req:Request){
  try{
    const s=await requirePermission('finance.ap');
    const d=supplierPaymentSchema.parse(await req.json());
    const result=await prisma.$transaction(async tx=>{
      const inv=await tx.supplierInvoice.findUnique({where:{id:d.supplierInvoiceId},include:{supplier:true}});
      if(!inv||inv.companyId!==s.companyId)throw Object.assign(new Error('فاتورة المورد غير موجودة'),{status:404});
      const outstanding=Math.max(0,Number(inv.totalAmount)-Number(inv.paidAmount));
      if(d.amount>outstanding)throw Object.assign(new Error('قيمة الدفع تتجاوز الرصيد المستحق'),{status:409});
      const reserved=await tx.supplierInvoice.updateMany({where:{id:inv.id,companyId:s.companyId,paidAmount:{lte:Number(inv.totalAmount)-d.amount}},data:{paidAmount:{increment:d.amount}}});
      if(reserved.count!==1)throw Object.assign(new Error('تغير الرصيد المستحق أثناء الدفع؛ أعد المحاولة'),{status:409});
      const refreshed=await tx.supplierInvoice.findUniqueOrThrow({where:{id:inv.id},select:{paidAmount:true,totalAmount:true}});
      const payment=await tx.supplierPayment.create({data:{supplierInvoiceId:inv.id,amount:d.amount,method:d.method,reference:d.reference,userId:s.userId}});
      const newPaid=Number(refreshed.paidAmount);
      const status=newPaid>=Number(refreshed.totalAmount)?'PAID':'PARTIAL';
      await tx.supplierInvoice.update({where:{id:inv.id},data:{status}});
      await audit(tx,{userId:s.userId,entityType:'SupplierInvoice',entityId:inv.id,action:'PAYMENT',after:{amount:d.amount,status,reference:d.reference}});
      return payment;
    });
    return Response.json({ok:true,payment:result},{status:201});
  }catch(e){return apiError(e)}
}
