import {prisma} from '@/lib/prisma';
import pkg from '../../../../../package.json';
export async function GET(){
  try{
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ok:true,service:'dty-erp',version:pkg.version,status:'ready',database:'up',time:new Date().toISOString()});
  }catch(e){
    return Response.json({ok:false,service:'dty-erp',version:pkg.version,status:'not-ready',database:'down',time:new Date().toISOString()},{status:503});
  }
}
