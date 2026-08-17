import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';

export async function GET(req:Request){
  try{
    const s=await requirePermission('production.read');
    const url=new URL(req.url);
    const machineCode=url.searchParams.get('machine')||'DTY-CN-02';
    const machine=await prisma.machine.findFirst({where:{plantId:s.plantId,code:machineCode}});
    if(!machine) return Response.json({ok:false,error:'الماكينة غير موجودة'},{status:404});
    const [orders,shifts,lots,openRun]=await Promise.all([
      prisma.productionOrder.findMany({where:{machineId:machine.id,status:{in:['RELEASED','RUNNING']}},include:{product:true},orderBy:{priority:'desc'}}),
      prisma.shift.findMany({where:{plantId:s.plantId},orderBy:{code:'asc'}}),
      prisma.inventoryLot.findMany({where:{warehouse:{plantId:s.plantId},qcStatus:'RELEASED',availableQtyKg:{gt:0},material:{type:'POY'}},include:{material:true},orderBy:{createdAt:'asc'}}),
      prisma.productionRun.findFirst({where:{productionOrder:{machineId:machine.id},status:'OPEN'},include:{productionOrder:{include:{product:true}},materialIssues:{include:{inventoryLot:true}},shift:true,downtimeEvents:{where:{endTime:null},include:{code:true}}}})
    ]);
    return Response.json({ok:true,machine,orders,shifts,lots,openRun});
  }catch(e){return apiError(e)}
}
