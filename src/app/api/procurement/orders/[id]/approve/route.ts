import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {audit} from '@/lib/audit';

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const s=await requirePermission('procurement.approve');
    if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
    const {id}=await params;
    const po=await prisma.purchaseOrder.findFirst({where:{id,plantId:s.plantId,supplier:{companyId:s.companyId}}});
    if(!po)return Response.json({ok:false,error:'أمر الشراء غير موجود داخل المصنع'},{status:404});
    if(po.status!=='DRAFT')return Response.json({ok:false,error:'يمكن اعتماد أمر الشراء المسودة فقط'},{status:409});
    const u=await prisma.$transaction(async tx=>{
      const x=await tx.purchaseOrder.update({where:{id},data:{status:'APPROVED'}});
      await tx.approvalRequest.updateMany({where:{companyId:s.companyId,plantId:s.plantId,entityType:'PurchaseOrder',entityId:id,approvalType:'PURCHASE_ORDER_APPROVAL',status:'PENDING'},data:{status:'APPROVED',decidedById:s.userId,decidedAt:new Date(),decisionNote:'اعتماد مباشر من شاشة المشتريات'}});
      await audit(tx,{userId:s.userId,entityType:'PurchaseOrder',entityId:id,action:'APPROVE',before:{status:'DRAFT'},after:{status:'APPROVED'}});return x;
    });
    return Response.json({ok:true,order:u});
  }catch(e){return apiError(e)}
}
