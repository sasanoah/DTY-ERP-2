import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {stockCountSubmitSchema} from '@/lib/validators';
import {audit} from '@/lib/audit';

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const s=await requirePermission('inventory.count'); const {id}=await params; const raw=await req.json(); const action=String(raw.action||'');
    if(action==='SUBMIT'){
      const d=stockCountSubmitSchema.parse(raw);
      const count=await prisma.stockCount.findUnique({where:{id},include:{lines:true}}); if(!count||count.plantId!==s.plantId)throw Object.assign(new Error('الجرد غير موجود'),{status:404});
      if(count.status!=='COUNTING')throw Object.assign(new Error('الجرد ليس في مرحلة العد'),{status:409});
      const allowed=new Set(count.lines.map(x=>x.id)); for(const l of d.lines)if(!allowed.has(l.lineId))throw Object.assign(new Error('سطر جرد غير صحيح'),{status:400});
      await prisma.$transaction(d.lines.map(l=>prisma.stockCountLine.update({where:{id:l.lineId},data:{countedQtyKg:l.countedQtyKg,varianceKg:{set:l.countedQtyKg-Number(count.lines.find(x=>x.id===l.lineId)!.systemQtyKg)},note:l.note}})));
      const u=await prisma.stockCount.update({where:{id},data:{status:'SUBMITTED',countedAt:new Date()}}); await audit(prisma,{userId:s.userId,entityType:'StockCount',entityId:id,action:'SUBMIT'}); return Response.json({ok:true,count:u});
    }
    if(action==='APPROVE'){
      const count=await prisma.stockCount.findUnique({where:{id},include:{lines:true}}); if(!count||count.plantId!==s.plantId)throw Object.assign(new Error('الجرد غير موجود'),{status:404});
      if(count.status!=='SUBMITTED'||count.lines.some(l=>l.countedQtyKg===null))throw Object.assign(new Error('الجرد غير مكتمل أو غير مقدم'),{status:409});
      const u=await prisma.stockCount.update({where:{id},data:{status:'APPROVED',approvedById:s.userId,approvedAt:new Date()}}); await audit(prisma,{userId:s.userId,entityType:'StockCount',entityId:id,action:'APPROVE'}); return Response.json({ok:true,count:u});
    }
    if(action==='POST'){
      const result=await prisma.$transaction(async tx=>{
        const count=await tx.stockCount.findUnique({where:{id},include:{lines:{include:{inventoryLot:true}}}}); if(!count||count.plantId!==s.plantId)throw Object.assign(new Error('الجرد غير موجود'),{status:404});
        if(count.status!=='APPROVED')throw Object.assign(new Error('يجب اعتماد الجرد قبل الترحيل'),{status:409});
        for(const l of count.lines){if(l.countedQtyKg===null)throw Object.assign(new Error('سطر غير معدود'),{status:409}); if(Math.abs(Number(l.inventoryLot.availableQtyKg)-Number(l.systemQtyKg))>0.001)throw Object.assign(new Error(`تغير رصيد Lot ${l.inventoryLot.lotNo} بعد بدء الجرد — أعد الجرد`),{status:409});}
        for(const l of count.lines){const variance=Number(l.countedQtyKg)-Number(l.systemQtyKg); if(Math.abs(variance)>0.001){await tx.inventoryLot.update({where:{id:l.inventoryLotId},data:{availableQtyKg:Number(l.countedQtyKg)}}); await tx.inventoryMovement.create({data:{lotId:l.inventoryLotId,movementType:'ADJUST',qtyKg:variance,refType:'STOCK_COUNT',refId:count.id,userId:s.userId}});}}
        const u=await tx.stockCount.update({where:{id},data:{status:'POSTED',postedAt:new Date()}}); await audit(tx,{userId:s.userId,entityType:'StockCount',entityId:id,action:'POST'}); return u;
      }); return Response.json({ok:true,count:result});
    }
    throw Object.assign(new Error('ACTION_NOT_SUPPORTED'),{status:400});
  }catch(e){return apiError(e)}
}
