import {prisma} from './prisma';
import {getSession} from './session';

export async function requireUser(){
  const session=await getSession();
  if(!session) throw Object.assign(new Error('UNAUTHORIZED'),{status:401});
  return session;
}
export async function requirePermission(code:string){
  const s=await requireUser();
  if(s.roles.includes('OWNER')) return s;
  const allowed=await prisma.rolePermission.findFirst({where:{role:{code:{in:s.roles}},permission:{code}}});
  if(!allowed) throw Object.assign(new Error('FORBIDDEN'),{status:403});
  return s;
}
export function apiError(error:unknown){
  const e=error as {message?:string;status?:number};
  return Response.json({ok:false,error:e.message||'INTERNAL_ERROR'},{status:e.status||500});
}
