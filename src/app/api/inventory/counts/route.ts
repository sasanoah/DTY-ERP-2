import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {stockCountCreateSchema} from '@/lib/validators';
import {nextStockCountNo} from '@/lib/document-number';
import {audit} from '@/lib/audit';

export async function GET(){
  try{
    const s=await requirePermission('inventory.read');
    const counts=await prisma.stockCount.findMany({where:{plantId:s.plantId},include:{warehouse:true,lines:{include:{inventoryLot:{include:{material:true}}}},createdBy:true,approvedBy:true},orderBy:{createdAt:'desc'},take:50});
    return Response.json({ok:true,counts});
  }catch(e){return apiError(e)}
}

export async function POST(req:Request){
  try{
    const s=await requirePermission('inventory.count'); if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
    const d=stockCountCreateSchema.parse(await req.json());
    const wh=await prisma.warehouse.findFirst({where:{id:d.warehouseId,plantId:s.plantId}}); if(!wh)throw Object.assign(new Error('المخزن غير موجود'),{status:404});
    const lots=await prisma.inventoryLot.findMany({where:{warehouseId:wh.id,availableQtyKg:{gte:0}}});
    const countNo=await nextStockCountNo();
    const count=await prisma.stockCount.create({data:{plantId:s.plantId,warehouseId:wh.id,countNo,status:'COUNTING',createdById:s.userId,notes:d.notes,lines:{create:lots.map(l=>({inventoryLotId:l.id,systemQtyKg:l.availableQtyKg}))}},include:{warehouse:true,lines:true}});
    await audit(prisma,{userId:s.userId,entityType:'StockCount',entityId:count.id,action:'CREATE',after:{countNo,warehouse:wh.code,lines:lots.length}});
    return Response.json({ok:true,count},{status:201});
  }catch(e){return apiError(e)}
}
