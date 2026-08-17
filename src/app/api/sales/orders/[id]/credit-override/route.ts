import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {audit} from '@/lib/audit';

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const s=await requirePermission('sales.credit.override');
    if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
    const {id}=await params;
    const o=await prisma.salesOrder.findFirst({where:{id,plantId:s.plantId,customer:{companyId:s.companyId}}});
    if(!o)return Response.json({ok:false,error:'أمر البيع غير موجود داخل المصنع'},{status:404});
    if(o.status!=='DRAFT')return Response.json({ok:false,error:'الاستثناء الائتماني متاح للمسودة فقط'},{status:409});
    const u=await prisma.$transaction(async tx=>{
      const x=await tx.salesOrder.update({where:{id},data:{creditStatus:'OVERRIDE'}});
      await tx.approvalRequest.updateMany({where:{companyId:s.companyId,plantId:s.plantId,entityType:'SalesOrder',entityId:id,approvalType:'CREDIT_OVERRIDE',status:'PENDING'},data:{status:'APPROVED',decidedById:s.userId,decidedAt:new Date(),decisionNote:'استثناء مباشر من الإدارة'}});
      await audit(tx,{userId:s.userId,entityType:'SalesOrder',entityId:id,action:'CREDIT_OVERRIDE',before:{creditStatus:o.creditStatus},after:{creditStatus:'OVERRIDE'}});
      return x;
    });
    return Response.json({ok:true,order:u});
  }catch(e){return apiError(e)}
}
