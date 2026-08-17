import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {audit} from '@/lib/audit';
const schema=z.object({disposition:z.enum(['RELEASED','REWORK','B_GRADE','REJECTED']),note:z.string().optional()});

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const s=await requirePermission('quality.release');
    if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
    const {id}=await params;const d=schema.parse(await req.json());
    const hold=await prisma.$transaction(async tx=>{
      const h=await tx.qualityHold.findUnique({where:{id}});if(!h)throw Object.assign(new Error('Hold غير موجود'),{status:404});
      if(!['OPEN','INVESTIGATING'].includes(h.status))throw Object.assign(new Error('تم إغلاق Hold بالفعل'),{status:409});
      if(h.refType==='INVENTORY_LOT'){
        const lot=await tx.inventoryLot.findFirst({where:{id:h.refId,warehouse:{plantId:s.plantId},material:{companyId:s.companyId}}});
        if(!lot)throw Object.assign(new Error('Lot الجودة لا يخص هذا المصنع'),{status:404});
      }else if(h.refType==='FINISHED_LOT'){
        const lot=await tx.finishedLot.findFirst({where:{id:h.refId,product:{companyId:s.companyId},productionRun:{productionOrder:{machine:{plantId:s.plantId}}}}});
        if(!lot)throw Object.assign(new Error('Lot الجودة لا يخص هذا المصنع'),{status:404});
      }else throw Object.assign(new Error('نوع مرجع الجودة غير مدعوم'),{status:400});
      const qc=d.disposition==='RELEASED'||d.disposition==='B_GRADE'?'RELEASED':d.disposition==='REJECTED'?'REJECTED':'HOLD';
      if(h.refType==='INVENTORY_LOT')await tx.inventoryLot.update({where:{id:h.refId},data:{qcStatus:d.disposition==='B_GRADE'?'HOLD':qc}});
      if(h.refType==='FINISHED_LOT')await tx.finishedLot.update({where:{id:h.refId},data:{qcStatus:qc,...(d.disposition==='B_GRADE'?{grade:'B'}:{})}});
      const updated=await tx.qualityHold.update({where:{id},data:{status:d.disposition,closedBy:s.userId,closedAt:new Date()}});
      await audit(tx,{userId:s.userId,entityType:h.refType,entityId:h.refId,action:`QUALITY_${d.disposition}`,after:{holdId:id,note:d.note}});return updated;
    });
    return Response.json({ok:true,hold});
  }catch(e){return apiError(e)}
}
