import {randomBytes, scryptSync, timingSafeEqual} from 'node:crypto';

export function hashPassword(password:string){
  const salt=randomBytes(16).toString('hex');
  const key=scryptSync(password,salt,64).toString('hex');
  return `${salt}:${key}`;
}

export function verifyPassword(password:string, stored:string){
  const [salt,keyHex]=stored.split(':');
  if(!salt||!keyHex) return false;
  const candidate=scryptSync(password,salt,64);
  const expected=Buffer.from(keyHex,'hex');
  return candidate.length===expected.length && timingSafeEqual(candidate,expected);
}
