import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {verifyPassword} from '@/lib/password';
import {createSessionToken,sessionCookieName} from '@/lib/session';
import {clearRate,rateCheck} from '@/lib/login-throttle';

const DUMMY_PASSWORD_HASH='00000000000000000000000000000000:a79be277f4164331643603688348e47bf86ce3900a63b8bc1a837c090f25b555cda39a106f0a1b8766ca7678fda8c3615c23c3b3b0c6b71e24b5628cb8f99a07';

export async function POST(req:Request){
  const body=await req.json().catch(()=>({}));
  const username=String(body.username||'').trim();const password=String(body.password||'');
  if(!username||!password||username.length>100||password.length>1024)return NextResponse.json({ok:false,error:'اسم المستخدم وكلمة المرور مطلوبان'},{status:400});
  const throttle=await rateCheck(username);
  if(!throttle.allowed)return NextResponse.json(
    {ok:false,error:'محاولات دخول كثيرة. حاول لاحقًا'},
    {status:429,headers:{'Retry-After':String(throttle.retryAfter)}},
  );
  const user=await prisma.user.findUnique({where:{username},include:{roles:{include:{role:true,plant:true}}}});
  const validPassword=verifyPassword(password,user?.passwordHash||DUMMY_PASSWORD_HASH);
  if(!user||!user.active||!validPassword)return NextResponse.json({ok:false,error:'بيانات الدخول غير صحيحة'},{status:401});
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
  await clearRate(username);
  const token=createSessionToken({userId:user.id,companyId:user.companyId,plantId,username:user.username,roles});
  const res=NextResponse.json({ok:true,user:{id:user.id,name:user.fullNameAr,username:user.username,roles,plantId}});
  res.cookies.set(sessionCookieName,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*12});
  return res;
}
