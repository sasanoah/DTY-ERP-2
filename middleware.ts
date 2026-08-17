import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

function securityHeaders(res:NextResponse){
  res.headers.set('X-Content-Type-Options','nosniff');
  res.headers.set('X-Frame-Options','DENY');
  res.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy','camera=(self), microphone=(), geolocation=()');
  return res;
}
function sameOrigin(req:NextRequest){
  if(!['POST','PUT','PATCH','DELETE'].includes(req.method))return true;
  const originValue=req.headers.get('origin');
  if(!originValue)return req.headers.get('sec-fetch-site')!=='cross-site';
  try{
    const origin=new URL(originValue);
    const forwardedHost=req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    const requestHost=(forwardedHost||req.headers.get('host')||req.nextUrl.host).toLowerCase();
    const forwardedProto=req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const requestProtocol=`${forwardedProto||req.nextUrl.protocol.replace(':','')}:`;
    return origin.host.toLowerCase()===requestHost&&origin.protocol===requestProtocol;
  }catch{return false}
}
export function middleware(req:NextRequest){
  const p=req.nextUrl.pathname;
  if(!sameOrigin(req))return securityHeaders(NextResponse.json({ok:false,error:'CROSS_ORIGIN_WRITE_BLOCKED'},{status:403}));
  if(p.startsWith('/login')||p.startsWith('/api/auth')||p.startsWith('/api/health')||p.startsWith('/_next'))return securityHeaders(NextResponse.next());
  if(!req.cookies.get('dty_erp_session')){
    if(p.startsWith('/api/'))return securityHeaders(NextResponse.json({ok:false,error:'UNAUTHORIZED'},{status:401}));
    const u=req.nextUrl.clone();u.pathname='/login';return securityHeaders(NextResponse.redirect(u));
  }
  return securityHeaders(NextResponse.next());
}
export const config={matcher:['/((?!favicon.ico).*)']};
