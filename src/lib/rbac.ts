import {prisma} from './prisma';
import {getSession} from './session';
import {ZodError} from 'zod';

export async function requireUser(){
  const session=await getSession();
  if(!session) throw Object.assign(new Error('UNAUTHORIZED'),{status:401});
  const user=await prisma.user.findFirst({where:{id:session.userId,companyId:session.companyId,active:true},include:{roles:{where:{role:{companyId:session.companyId},...(session.plantId?{OR:[{plantId:session.plantId},{plantId:null}]}:{plantId:null})},include:{role:true}}}});
  if(!user)throw Object.assign(new Error('UNAUTHORIZED'),{status:401});
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
export function apiError(error:unknown){
  if(error instanceof ZodError)return Response.json({ok:false,error:'VALIDATION_ERROR',issues:error.issues},{status:400});
  const e=error as {message?:string;status?:number};
  return Response.json({ok:false,error:e.message||'INTERNAL_ERROR'},{status:e.status||500});
}
