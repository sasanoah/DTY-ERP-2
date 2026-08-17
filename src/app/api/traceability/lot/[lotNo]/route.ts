import {prisma} from '@/lib/prisma'; import {requirePermission,apiError} from '@/lib/rbac';
export async function GET(_:Request,{params}:{params:Promise<{lotNo:string}>}){try{const s=await requirePermission('traceability.read');if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400}); const {lotNo}=await params;
 const raw=await prisma.inventoryLot.findFirst({where:{lotNo,warehouse:{plantId:s.plantId},material:{companyId:s.companyId}},include:{material:true,supplier:true,movements:{include:{user:{select:{username:true,fullNameAr:true}}},orderBy:{createdAt:'desc'},take:200},materialIssues:{include:{productionRun:{include:{productionOrder:{include:{product:true,machine:true}},finishedLots:{include:{deliveryLines:{include:{delivery:{include:{salesOrder:{include:{customer:true}}}}}}}}}}}}}});
 if(raw) return Response.json({ok:true,type:'POY',raw});
 const fg=await prisma.finishedLot.findFirst({where:{lotNo,product:{companyId:s.companyId},productionRun:{productionOrder:{machine:{plantId:s.plantId}}}},include:{product:true,productionRun:{include:{materialIssues:{include:{inventoryLot:{include:{material:true,supplier:true}}}},productionOrder:{include:{machine:true}}}},deliveryLines:{include:{delivery:{include:{salesOrder:{include:{customer:true}}}}}}}});
 if(fg) return Response.json({ok:true,type:'DTY',finished:fg});
 return Response.json({ok:false,error:'Lot غير موجود'},{status:404});
}catch(e){return apiError(e)}}
