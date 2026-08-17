import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {verifyPassword} from '@/lib/password';
import {createSessionToken,sessionCookieName} from '@/lib/session';

const attempts=new Map<string,{count:number;reset:number}>();
function clientKey(req:Request,username:string){return `${req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local'}:${username.toLowerCase()}`}
function rateCheck(key:string){const now=Date.now();const x=attempts.get(key);if(!x||x.reset<now){attempts.set(key,{count:1,reset:now+10*60_000});return true}if(x.count>=10)return false;x.count++;return true}
function clearRate(key:string){attempts.delete(key)}

export async function POST(req:Request){
  const body=await req.json().catch(()=>({}));
  const username=String(body.username||'').trim();const password=String(body.password||'');
  if(!username||!password)return NextResponse.json({ok:false,error:'اسم المستخدم وكلمة المرور مطلوبان'},{status:400});
  const key=clientKey(req,username);if(!rateCheck(key))return NextResponse.json({ok:false,error:'محاولات دخول كثيرة. حاول لاحقًا'},{status:429});
  const user=await prisma.user.findUnique({where:{username},include:{roles:{include:{role:true,plant:true}}}});
  if(!user||!user.active||!verifyPassword(password,user.passwordHash))return NextResponse.json({ok:false,error:'بيانات الدخول غير صحيحة'},{status:401});
  const roles=user.roles.map(r=>r.role.code);const requestedPlant=body.plantId?String(body.plantId):undefined;
  let plantId:string|undefined;
  if(requestedPlant){
    const plant=await prisma.plant.findFirst({where:{id:requestedPlant,companyId:user.companyId,active:true}});
    const allowed=roles.includes('OWNER')||user.roles.some(r=>r.plantId===requestedPlant);
    if(!plant||!allowed)return NextResponse.json({ok:false,error:'المصنع المختار غير مصرح به'},{status:403});
    plantId=plant.id;
  }else{
    plantId=user.roles.find(r=>r.plantId)?.plantId||undefined;
    if(!plantId&&roles.includes('OWNER'))plantId=(await prisma.plant.findFirst({where:{companyId:user.companyId,active:true},orderBy:{code:'asc'}}))?.id;
  }
  clearRate(key);
  const token=createSessionToken({userId:user.id,companyId:user.companyId,plantId,username:user.username,roles});
  const res=NextResponse.json({ok:true,user:{id:user.id,name:user.fullNameAr,username:user.username,roles,plantId}});
  res.cookies.set(sessionCookieName,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*12});
  return res;
}
