import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {supplierQuoteSchema} from '@/lib/validators';
import {audit} from '@/lib/audit';

export async function POST(req:Request){
  try{
    const s=await requirePermission('procurement.rfq');
    const d=supplierQuoteSchema.parse(await req.json());
    const rfq=await prisma.rfq.findUnique({where:{id:d.rfqId},include:{lines:true}});
    if(!rfq||rfq.plantId!==s.plantId)throw Object.assign(new Error('RFQ غير موجود'),{status:404});
    const supplier=await prisma.supplier.findFirst({where:{id:d.supplierId,companyId:s.companyId}});
    if(!supplier)throw Object.assign(new Error('المورد غير موجود'),{status:404});
    const valid=new Set(rfq.lines.map(x=>x.id));
    if(d.lines.some(x=>!valid.has(x.rfqLineId)))throw Object.assign(new Error('سطر RFQ غير صحيح'),{status:400});
    const quote=await prisma.supplierQuote.upsert({
      where:{rfqId_supplierId:{rfqId:rfq.id,supplierId:supplier.id}},
      update:{currency:d.currency,exchangeRate:d.exchangeRate,validUntil:d.validUntil,paymentTermsDays:d.paymentTermsDays,status:'SUBMITTED',lines:{deleteMany:{},create:d.lines}},
      create:{rfqId:rfq.id,supplierId:supplier.id,currency:d.currency,exchangeRate:d.exchangeRate,validUntil:d.validUntil,paymentTermsDays:d.paymentTermsDays,status:'SUBMITTED',lines:{create:d.lines}},
      include:{supplier:true,lines:true}
    });
    await audit(prisma,{userId:s.userId,entityType:'SupplierQuote',entityId:quote.id,action:'UPSERT',after:{supplier:supplier.code}});
    return Response.json({ok:true,quote});
  }catch(e){return apiError(e)}
}
