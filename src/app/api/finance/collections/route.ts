import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {collectionSchema} from '@/lib/validators';
import {audit} from '@/lib/audit';

export async function POST(req:Request){
  try{
    const s=await requirePermission('finance.collect');
    const d=collectionSchema.parse(await req.json());
    const result=await prisma.$transaction(async tx=>{
      const i=await tx.invoice.findFirst({where:{id:d.invoiceId,customer:{companyId:s.companyId}},include:{salesOrder:true}});
      if(!i)throw Object.assign(new Error('الفاتورة غير موجودة داخل الشركة'),{status:404});
      if(s.plantId&&i.salesOrder&&i.salesOrder.plantId!==s.plantId)throw Object.assign(new Error('الفاتورة تخص مصنعًا آخر'),{status:404});
      const outstanding=Number(i.totalAmount)-Number(i.paidAmount);if(d.amount>outstanding+0.01)throw Object.assign(new Error('قيمة التحصيل أكبر من المبلغ المستحق'),{status:409});
      const c=await tx.collection.create({data:{invoiceId:i.id,amount:d.amount,method:d.method,reference:d.reference,userId:s.userId}});const paid=Number(i.paidAmount)+d.amount;const status=paid+0.01>=Number(i.totalAmount)?'PAID':'PARTIAL';
      await tx.invoice.update({where:{id:i.id},data:{paidAmount:paid,status}});
      await audit(tx,{userId:s.userId,entityType:'Invoice',entityId:i.id,action:'COLLECTION',before:{paid:Number(i.paidAmount)},after:{paid,collectionId:c.id}});
      return {collection:c,paid,status};
    });
    return Response.json({ok:true,...result},{status:201});
  }catch(e){return apiError(e)}
}
