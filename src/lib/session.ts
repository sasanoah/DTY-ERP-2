import {createHmac, timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';

const COOKIE='dty_erp_session';
function secret(){const s=process.env.SESSION_SECRET;if(s)return s;if(process.env.NODE_ENV==='production')throw new Error('SESSION_SECRET_REQUIRED');return 'DEV_ONLY_DTY_ERP_CHANGE_ME'}
export type SessionPayload={userId:string;companyId:string;plantId?:string;username:string;roles:string[];exp:number};
function b64(v:string){return Buffer.from(v).toString('base64url')}
function unb64(v:string){return Buffer.from(v,'base64url').toString()}
function sign(body:string){return createHmac('sha256',secret()).update(body).digest('base64url')}
export function createSessionToken(payload:Omit<SessionPayload,'exp'>,hours=12){const body=b64(JSON.stringify({...payload,exp:Date.now()+hours*3600_000}));return `${body}.${sign(body)}`}
export function verifySessionToken(token?:string|null):SessionPayload|null{if(!token)return null;const [body,sig]=token.split('.');if(!body||!sig)return null;const a=Buffer.from(sig);const b=Buffer.from(sign(body));if(a.length!==b.length||!timingSafeEqual(a,b))return null;try{const p=JSON.parse(unb64(body)) as SessionPayload;return p.exp>Date.now()?p:null}catch{return null}}
export async function getSession(){const c=await cookies();return verifySessionToken(c.get(COOKIE)?.value)}
export const sessionCookieName=COOKIE;
