import {NextResponse} from 'next/server'; import {sessionCookieName} from '@/lib/session';
export async function POST(){const r=NextResponse.json({ok:true}); r.cookies.set(sessionCookieName,'',{httpOnly:true,path:'/',maxAge:0}); return r;}
