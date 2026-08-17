import {prisma} from '@/lib/prisma'; import {requirePermission,apiError} from '@/lib/rbac'; import {scopedQualityHoldWhere} from '@/lib/quality-scope';
export async function GET(){try{const s=await requirePermission('quality.read');const holdScope=scopedQualityHoldWhere(s.companyId,s.plantId); const [rawLots,finishedLots,holds]=await Promise.all([
 prisma.inventoryLot.findMany({where:{warehouse:{plantId:s.plantId},material:{companyId:s.companyId}},include:{material:true},orderBy:{createdAt:'desc'},take:50}),
 prisma.finishedLot.findMany({where:{product:{companyId:s.companyId},productionRun:{productionOrder:{machine:{plantId:s.plantId}}}},include:{product:true,productionRun:{include:{productionOrder:{include:{machine:true}}}}},orderBy:{id:'desc'},take:50}),
 prisma.qualityHold.findMany({where:{status:{in:['OPEN','INVESTIGATING']},...holdScope},orderBy:{openedAt:'desc'},take:50})
 ]); return Response.json({ok:true,rawLots,finishedLots,holds});}catch(e){return apiError(e)}}
