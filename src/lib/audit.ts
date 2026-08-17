import type {Prisma, PrismaClient} from '@prisma/client';
function jsonSafe(value:unknown):Prisma.InputJsonValue|undefined{if(value===undefined)return undefined;return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue}
export async function audit(db:Prisma.TransactionClient|PrismaClient, input:{userId:string;entityType:string;entityId:string;action:string;before?:unknown;after?:unknown}){
  return db.auditLog.create({data:{userId:input.userId,entityType:input.entityType,entityId:input.entityId,action:input.action,beforeJson:jsonSafe(input.before),afterJson:jsonSafe(input.after)}})
}
