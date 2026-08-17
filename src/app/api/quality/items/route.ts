import {prisma} from '@/lib/prisma'; import {requirePermission,apiError} from '@/lib/rbac';
export async function GET(){try{const s=await requirePermission('quality.read'); const [rawLots,finishedLots,holds]=await Promise.all([
 prisma.inventoryLot.findMany({where:{warehouse:{plantId:s.plantId}},include:{material:true},orderBy:{createdAt:'desc'},take:50}),
 prisma.finishedLot.findMany({where:{productionRun:{productionOrder:{machine:{plantId:s.plantId}}}},include:{product:true,productionRun:{include:{productionOrder:{include:{machine:true}}}}},orderBy:{id:'desc'},take:50}),
 prisma.qualityHold.findMany({where:{status:{in:['OPEN','INVESTIGATING']}},orderBy:{openedAt:'desc'},take:50})
 ]); return Response.json({ok:true,rawLots,finishedLots,holds});}catch(e){return apiError(e)}}
