import {randomUUID} from 'node:crypto';
import {prisma} from './prisma';
import {getSession} from './session';
import {ZodError} from 'zod';

export async function requireUser(){
  const session=await getSession();
  if(!session) throw Object.assign(new Error('UNAUTHORIZED'),{status:401});
  const user=await prisma.user.findFirst({where:{id:session.userId,companyId:session.companyId,active:true},include:{roles:{where:{role:{companyId:session.companyId},...(session.plantId?{OR:[{plantId:session.plantId},{plantId:null}]}:{plantId:null})},include:{role:true}}}});
  if(!user)throw Object.assign(new Error('UNAUTHORIZED'),{status:401});
  if(user.sessionVersion!==session.sessionVersion)throw Object.assign(new Error('UNAUTHORIZED'),{status:401});
  const roles=[...new Set(user.roles.map(x=>x.role.code))];
  if(!roles.length)throw Object.assign(new Error('FORBIDDEN'),{status:403});
  return {...session,roles};
}
export async function requirePermission(code:string){
  const s=await requireUser();
  if(s.roles.includes('OWNER')) return s;
  const allowed=await prisma.rolePermission.findFirst({where:{role:{companyId:s.companyId,code:{in:s.roles}},permission:{code}}});
  if(!allowed) throw Object.assign(new Error('FORBIDDEN'),{status:403});
  return s;
}

function errorStatus(error:unknown){
  const status=(error as {status?:unknown})?.status;
  return typeof status==='number'&&Number.isInteger(status)&&status>=400&&status<=599?status:500;
}

function safeErrorToken(value:unknown){
  return typeof value==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(value)?value:undefined;
}

function logServerError(error:unknown,status:number,errorId:string){
  const candidate=error as {name?:unknown;code?:unknown};
  console.error('API_ERROR',JSON.stringify({
    errorId,
    status,
    name:safeErrorToken(candidate?.name)||'UnknownError',
    code:safeErrorToken(candidate?.code),
  }));
}

export function apiError(error:unknown){
  const headers={'Cache-Control':'no-store'};
  if(error instanceof ZodError)return Response.json({ok:false,error:'VALIDATION_ERROR',issues:error.issues},{status:400,headers});
  const status=errorStatus(error);
  const message=(error as {message?:unknown})?.message;
  if(status<500)return Response.json({ok:false,error:typeof message==='string'&&message?message:'REQUEST_ERROR'},{status,headers});
  const errorId=randomUUID();
  logServerError(error,status,errorId);
  return Response.json({ok:false,error:'INTERNAL_ERROR',errorId},{status,headers:{...headers,'X-Error-Id':errorId}});
}
