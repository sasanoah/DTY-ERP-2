import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {audit} from '@/lib/audit';

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const s=await requirePermission('production.order.create');
    if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
    const {id}=await params;
    const order=await prisma.productionOrder.findFirst({where:{id,machine:{plantId:s.plantId},product:{companyId:s.companyId}}});
    if(!order)return Response.json({ok:false,error:'أمر الإنتاج غير موجود داخل المصنع'},{status:404});
    if(order.status!=='DRAFT')return Response.json({ok:false,error:'يمكن الإفراج عن الأوامر المسودة فقط'},{status:409});
    const updated=await prisma.productionOrder.update({where:{id},data:{status:'RELEASED'}});
    await audit(prisma,{userId:s.userId,entityType:'ProductionOrder',entityId:id,action:'RELEASE',before:{status:'DRAFT'},after:{status:'RELEASED'}});
    return Response.json({ok:true,order:updated});
  }catch(e){return apiError(e)}
}
