import type {Prisma,PrismaClient} from '@prisma/client';import {enqueueIntegrationEvent} from '@/lib/integrations';
type DB=Prisma.TransactionClient|PrismaClient;
export async function requestApproval(db:DB,input:{companyId:string;plantId?:string|null;entityType:string;entityId:string;approvalType:string;requestedById:string;reason?:string}){
 const existing=await db.approvalRequest.findFirst({where:{entityType:input.entityType,entityId:input.entityId,approvalType:input.approvalType,status:'PENDING'}});if(existing)return existing;
 const a=await db.approvalRequest.create({data:{companyId:input.companyId,plantId:input.plantId||null,entityType:input.entityType,entityId:input.entityId,approvalType:input.approvalType,requestedById:input.requestedById,reason:input.reason}});
 await enqueueIntegrationEvent(db,{companyId:input.companyId,plantId:input.plantId,eventType:'APPROVAL_REQUESTED',payload:{approvalId:a.id,entityType:a.entityType,entityId:a.entityId,approvalType:a.approvalType,reason:a.reason}});return a;
}
