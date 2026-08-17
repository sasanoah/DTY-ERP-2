import pkg from '../../../../package.json';
export async function GET(){
  return Response.json({ok:true,service:'dty-erp',version:pkg.version,status:'live',time:new Date().toISOString()});
}
