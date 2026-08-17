import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {movementSchema} from '@/lib/validators';
import {audit} from '@/lib/audit';
const inbound=new Set(['RECEIVE','RETURN']);const outbound=new Set(['ISSUE','PICK','DISPATCH']);

export async function POST(req:Request){
  try{
    const s=await requirePermission('inventory.move');
    if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
    const d=movementSchema.parse(await req.json());
    if(d.movementType==='ADJUST')await requirePermission('inventory.count');
    const result=await prisma.$transaction(async tx=>{
      const lot=await tx.inventoryLot.findFirst({where:{id:d.lotId,warehouse:{plantId:s.plantId},material:{companyId:s.companyId}},include:{warehouse:true}});
      if(!lot)throw Object.assign(new Error('LOT_NOT_FOUND'),{status:404});
      if(d.toBinCode){const b=await tx.bin.findFirst({where:{code:d.toBinCode,warehouseId:lot.warehouseId}});if(!b)throw Object.assign(new Error('موقع التخزين الوجهة غير صحيح'),{status:400})}
      if(d.fromBinCode){const b=await tx.bin.findFirst({where:{code:d.fromBinCode,warehouseId:lot.warehouseId}});if(!b)throw Object.assign(new Error('موقع التخزين المصدر غير صحيح'),{status:400})}
      if(outbound.has(d.movementType)&&lot.qcStatus!=='RELEASED')throw Object.assign(new Error('لا يمكن صرف Lot غير مفرج من الجودة'),{status:409});
      const before=Number(lot.availableQtyKg);let after=before;
      if(outbound.has(d.movementType)){
        const u=await tx.inventoryLot.updateMany({where:{id:d.lotId,qcStatus:'RELEASED',availableQtyKg:{gte:d.qtyKg}},data:{availableQtyKg:{decrement:d.qtyKg}}});
        if(u.count!==1)throw Object.assign(new Error('الرصيد غير كافٍ أو حالة الجودة تغيرت'),{status:409});after=before-d.qtyKg;
      }else if(inbound.has(d.movementType)){
        await tx.inventoryLot.update({where:{id:d.lotId},data:{availableQtyKg:{increment:d.qtyKg}}});after=before+d.qtyKg;
      }else if(d.movementType==='ADJUST'){
        after=d.qtyKg;await tx.inventoryLot.update({where:{id:d.lotId},data:{availableQtyKg:after}});
      }
      const movement=await tx.inventoryMovement.create({data:{lotId:d.lotId,movementType:d.movementType,qtyKg:d.qtyKg,fromBinCode:d.fromBinCode,toBinCode:d.toBinCode,refType:d.refType,refId:d.refId,userId:s.userId}});
      await audit(tx,{userId:s.userId,entityType:'InventoryLot',entityId:d.lotId,action:`MOVEMENT_${d.movementType}`,before:{availableQtyKg:before},after:{availableQtyKg:after,movementId:movement.id}});
      return {movement,balanceKg:after};
    });
    return Response.json({ok:true,...result});
  }catch(e){return apiError(e)}
}
