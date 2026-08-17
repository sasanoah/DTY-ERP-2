import {prisma} from '@/lib/prisma'; import {requirePermission,apiError} from '@/lib/rbac';
export async function GET(_:Request,{params}:{params:Promise<{lotNo:string}>}){try{await requirePermission('traceability.read'); const {lotNo}=await params;
 const raw=await prisma.inventoryLot.findUnique({where:{lotNo},include:{material:true,supplier:true,movements:true,materialIssues:{include:{productionRun:{include:{productionOrder:{include:{product:true,machine:true}},finishedLots:{include:{deliveryLines:{include:{delivery:{include:{salesOrder:{include:{customer:true}}}}}}}}}}}}}});
 if(raw) return Response.json({ok:true,type:'POY',raw});
 const fg=await prisma.finishedLot.findUnique({where:{lotNo},include:{product:true,productionRun:{include:{materialIssues:{include:{inventoryLot:{include:{material:true,supplier:true}}}},productionOrder:{include:{machine:true}}}},deliveryLines:{include:{delivery:{include:{salesOrder:{include:{customer:true}}}}}}}});
 if(fg) return Response.json({ok:true,type:'DTY',finished:fg});
 return Response.json({ok:false,error:'Lot غير موجود'},{status:404});
}catch(e){return apiError(e)}}
