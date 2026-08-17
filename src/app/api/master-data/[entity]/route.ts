import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';
import {materialUpsertSchema,productUpsertSchema,supplierUpsertSchema,customerUpsertSchema,machineUpsertSchema,shiftUpsertSchema,warehouseUpsertSchema} from '@/lib/validators';
import {audit} from '@/lib/audit';

const entities=['materials','products','suppliers','customers','machines','shifts','warehouses'] as const;
type Entity=typeof entities[number];
function ensureEntity(v:string):Entity{if(!entities.includes(v as Entity))throw Object.assign(new Error('ENTITY_NOT_SUPPORTED'),{status:404});return v as Entity}

export async function GET(_:Request,{params}:{params:Promise<{entity:string}>}){
  try{
    const s=await requirePermission('master.read');const {entity:raw}=await params;const entity=ensureEntity(raw);
    if(entity==='materials')return Response.json({ok:true,items:await prisma.material.findMany({where:{companyId:s.companyId},orderBy:{code:'asc'}})});
    if(entity==='products')return Response.json({ok:true,items:await prisma.product.findMany({where:{companyId:s.companyId},include:{boms:{where:{active:true},include:{items:{include:{material:true}}}}},orderBy:{code:'asc'}})});
    if(entity==='suppliers')return Response.json({ok:true,items:await prisma.supplier.findMany({where:{companyId:s.companyId},orderBy:{code:'asc'}})});
    if(entity==='customers')return Response.json({ok:true,items:await prisma.customer.findMany({where:{companyId:s.companyId},orderBy:{code:'asc'}})});
    if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
    if(entity==='machines')return Response.json({ok:true,items:await prisma.machine.findMany({where:{plantId:s.plantId},orderBy:{code:'asc'}})});
    if(entity==='shifts')return Response.json({ok:true,items:await prisma.shift.findMany({where:{plantId:s.plantId},orderBy:{code:'asc'}})});
    return Response.json({ok:true,items:await prisma.warehouse.findMany({where:{plantId:s.plantId},orderBy:{code:'asc'}})});
  }catch(e){return apiError(e)}
}

export async function POST(req:Request,{params}:{params:Promise<{entity:string}>}){
  try{
    const s=await requirePermission('master.write');const {entity:raw}=await params;const entity=ensureEntity(raw);const body=await req.json();let item:any;
    if(entity==='materials'){
      const d=materialUpsertSchema.parse(body);
      if(d.id){const x=await prisma.material.findFirst({where:{id:d.id,companyId:s.companyId}});if(!x)throw Object.assign(new Error('الخامة غير موجودة داخل الشركة'),{status:404});item=await prisma.material.update({where:{id:d.id},data:{code:d.code,nameAr:d.nameAr,type:d.type,denier:d.denier,filaments:d.filaments,lustre:d.lustre,uom:d.uom,safetyStockKg:d.safetyStockKg,active:d.active}})}
      else item=await prisma.material.create({data:{companyId:s.companyId,code:d.code,nameAr:d.nameAr,type:d.type,denier:d.denier,filaments:d.filaments,lustre:d.lustre,uom:d.uom,safetyStockKg:d.safetyStockKg,active:d.active}});
    }else if(entity==='products'){
      const d=productUpsertSchema.parse(body);
      if(d.id){const x=await prisma.product.findFirst({where:{id:d.id,companyId:s.companyId}});if(!x)throw Object.assign(new Error('الصنف غير موجود داخل الشركة'),{status:404});item=await prisma.product.update({where:{id:d.id},data:{code:d.code,nameAr:d.nameAr,denier:d.denier,filaments:d.filaments,intermingle:d.intermingle,lustre:d.lustre,standardYield:d.standardYield,standardPackKg:d.standardPackKg,active:d.active}})}
      else item=await prisma.product.create({data:{companyId:s.companyId,code:d.code,nameAr:d.nameAr,denier:d.denier,filaments:d.filaments,intermingle:d.intermingle,lustre:d.lustre,standardYield:d.standardYield,standardPackKg:d.standardPackKg,active:d.active}});
      if(d.rawMaterialId){
        const rawMat=await prisma.material.findFirst({where:{id:d.rawMaterialId,companyId:s.companyId,active:true}});if(!rawMat)throw Object.assign(new Error('الخامة الأساسية غير موجودة'),{status:404});
        const bom=await prisma.bom.upsert({where:{productId_version:{productId:item.id,version:1}},update:{active:true},create:{productId:item.id,version:1,active:true}});
        await prisma.bomItem.deleteMany({where:{bomId:bom.id}});await prisma.bomItem.create({data:{bomId:bom.id,materialId:rawMat.id,qtyPerKg:1/d.standardYield}});
      }
    }else if(entity==='suppliers'){
      const d=supplierUpsertSchema.parse(body);
      if(d.id){const x=await prisma.supplier.findFirst({where:{id:d.id,companyId:s.companyId}});if(!x)throw Object.assign(new Error('المورد غير موجود داخل الشركة'),{status:404});item=await prisma.supplier.update({where:{id:d.id},data:{code:d.code,nameAr:d.nameAr,country:d.country,currencyDefault:d.currencyDefault,paymentTermsDays:d.paymentTermsDays,qualityStatus:d.qualityStatus}})}
      else item=await prisma.supplier.create({data:{companyId:s.companyId,code:d.code,nameAr:d.nameAr,country:d.country,currencyDefault:d.currencyDefault,paymentTermsDays:d.paymentTermsDays,qualityStatus:d.qualityStatus}});
    }else if(entity==='customers'){
      const d=customerUpsertSchema.parse(body);
      if(d.id){const x=await prisma.customer.findFirst({where:{id:d.id,companyId:s.companyId}});if(!x)throw Object.assign(new Error('العميل غير موجود داخل الشركة'),{status:404});item=await prisma.customer.update({where:{id:d.id},data:{code:d.code,nameAr:d.nameAr,city:d.city,customerType:d.customerType,creditLimit:d.creditLimit,paymentTermsDays:d.paymentTermsDays,blocked:d.blocked}})}
      else item=await prisma.customer.create({data:{companyId:s.companyId,code:d.code,nameAr:d.nameAr,city:d.city,customerType:d.customerType,creditLimit:d.creditLimit,paymentTermsDays:d.paymentTermsDays,blocked:d.blocked}});
    }else if(entity==='machines'){
      const d=machineUpsertSchema.parse(body);if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
      if(d.id){const x=await prisma.machine.findFirst({where:{id:d.id,plantId:s.plantId}});if(!x)throw Object.assign(new Error('الماكينة غير موجودة داخل المصنع'),{status:404});item=await prisma.machine.update({where:{id:d.id},data:{code:d.code,nameAr:d.nameAr,origin:d.origin,year:d.year,spindles:d.spindles,status:d.status}})}
      else item=await prisma.machine.create({data:{plantId:s.plantId,code:d.code,nameAr:d.nameAr,origin:d.origin,year:d.year,spindles:d.spindles,status:d.status}});
    }else if(entity==='shifts'){
      const d=shiftUpsertSchema.parse(body);if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
      if(d.id){const x=await prisma.shift.findFirst({where:{id:d.id,plantId:s.plantId}});if(!x)throw Object.assign(new Error('الوردية غير موجودة داخل المصنع'),{status:404});item=await prisma.shift.update({where:{id:d.id},data:{code:d.code,nameAr:d.nameAr,startTime:d.startTime,endTime:d.endTime}})}
      else item=await prisma.shift.create({data:{plantId:s.plantId,code:d.code,nameAr:d.nameAr,startTime:d.startTime,endTime:d.endTime}});
    }else{
      const d=warehouseUpsertSchema.parse(body);if(!s.plantId)throw Object.assign(new Error('PLANT_REQUIRED'),{status:400});
      if(d.id){const x=await prisma.warehouse.findFirst({where:{id:d.id,plantId:s.plantId}});if(!x)throw Object.assign(new Error('المخزن غير موجود داخل المصنع'),{status:404});item=await prisma.warehouse.update({where:{id:d.id},data:{code:d.code,nameAr:d.nameAr,type:d.type}})}
      else item=await prisma.warehouse.create({data:{plantId:s.plantId,code:d.code,nameAr:d.nameAr,type:d.type}});
    }
    await audit(prisma,{userId:s.userId,entityType:`Master:${entity}`,entityId:item.id,action:body.id?'UPDATE':'CREATE',after:item});
    return Response.json({ok:true,item},{status:body.id?200:201});
  }catch(e){return apiError(e)}
}
