import type {Prisma,PrismaClient} from '@prisma/client';

type DB=Prisma.TransactionClient|PrismaClient;
function safePayload(v:unknown){return JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue}

export async function enqueueIntegrationEvent(db:DB,input:{companyId:string;plantId?:string|null;eventType:string;payload:unknown}){
  return db.integrationEvent.create({data:{companyId:input.companyId,plantId:input.plantId||null,eventType:input.eventType,payload:safePayload(input.payload),status:'PENDING'}})
}

export async function dispatchIntegrationEvents(prisma:PrismaClient,limit=25){
  const url=process.env.N8N_WEBHOOK_URL;
  if(!url) return {sent:0,failed:0,skipped:true,reason:'N8N_WEBHOOK_URL_NOT_CONFIGURED'};
  const secret=process.env.INTEGRATION_WEBHOOK_SECRET||'';
  const events=await prisma.integrationEvent.findMany({where:{status:{in:['PENDING','FAILED']},attempts:{lt:5}},orderBy:{createdAt:'asc'},take:limit});
  let sent=0,failed=0;
  for(const event of events){
    try{
      const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json',...(secret?{'x-dty-erp-secret':secret}:{})},body:JSON.stringify({id:event.id,eventType:event.eventType,companyId:event.companyId,plantId:event.plantId,createdAt:event.createdAt,payload:event.payload})});
      if(!response.ok) throw new Error(`HTTP_${response.status}`);
      await prisma.integrationEvent.update({where:{id:event.id},data:{status:'SENT',sentAt:new Date(),attempts:{increment:1},lastError:null}});sent++;
    }catch(error){
      await prisma.integrationEvent.update({where:{id:event.id},data:{status:'FAILED',attempts:{increment:1},lastError:error instanceof Error?error.message:String(error)}});failed++;
    }
  }
  return {sent,failed,skipped:false};
}
