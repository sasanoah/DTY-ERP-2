import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {productionOrderSchema} from '@/lib/validators';
import {nextProductionOrderNo} from '@/lib/document-number';
import {audit} from '@/lib/audit';

export async function GET(){
  try{
    const s=await requirePermission('production.read');
    if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
    const orders=await prisma.productionOrder.findMany({
      where:{machine:{plantId:s.plantId},product:{companyId:s.companyId}},
      include:{product:true,machine:true,runs:true},orderBy:{createdAt:'desc'}
    });
    return Response.json({ok:true,orders});
  }catch(e){return apiError(e)}
}

export async function POST(req:Request){
  try{
    const s=await requirePermission('production.order.create');
    if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
    const d=productionOrderSchema.parse(await req.json());
    if(d.plannedEnd && d.plannedEnd<d.plannedStart)throw Object.assign(new Error('تاريخ نهاية أمر الإنتاج قبل البداية'),{status:400});
    const [machine,product]=await Promise.all([
      prisma.machine.findFirst({where:{id:d.machineId,plantId:s.plantId}}),
      prisma.product.findFirst({where:{id:d.productId,companyId:s.companyId,active:true}})
    ]);
    if(!machine)throw Object.assign(new Error('الماكينة غير موجودة داخل المصنع'),{status:404});
    if(!product)throw Object.assign(new Error('الصنف غير موجود داخل الشركة'),{status:404});
    const orderNo=await nextProductionOrderNo();
    const order=await prisma.productionOrder.create({data:{...d,orderNo,status:'DRAFT'}});
    await audit(prisma,{userId:s.userId,entityType:'ProductionOrder',entityId:order.id,action:'CREATE',after:order});
    return Response.json({ok:true,order},{status:201});
  }catch(e){return apiError(e)}
}
