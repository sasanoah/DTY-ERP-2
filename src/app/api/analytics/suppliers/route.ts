import {prisma} from '@/lib/prisma';import {requirePermission,apiError} from '@/lib/rbac';import {supplierScorecard} from '@/lib/analytics';
export async function GET(){try{const s=await requirePermission('procurement.read');const suppliers=await supplierScorecard(prisma,s.companyId,s.plantId);return Response.json({ok:true,suppliers});}catch(e){return apiError(e)}}
