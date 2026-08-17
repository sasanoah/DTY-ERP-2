import {prisma} from '@/lib/prisma';
import {requirePermission,apiError} from '@/lib/rbac';

export async function GET(){
  try{
    const s=await requirePermission('procurement.read');
    const orders=await prisma.productionOrder.findMany({
      where:{machine:{plantId:s.plantId},status:{in:['DRAFT','RELEASED','RUNNING']}},
      include:{runs:true,product:{include:{boms:{where:{active:true},orderBy:{version:'desc'},take:1,include:{items:{include:{material:true}}}}}}}
    });
    const gross=new Map<string,{material:any;qty:number}>();
    for(const order of orders){
      const produced=order.runs.reduce((a,r)=>a+Number(r.gradeAKg)+Number(r.gradeBKg),0);
      const remaining=Math.max(0,Number(order.plannedQtyKg)-produced);
      const bom=order.product.boms[0]; if(!bom) continue;
      for(const item of bom.items){const qty=remaining*Number(item.qtyPerKg);const prev=gross.get(item.materialId);gross.set(item.materialId,{material:item.material,qty:(prev?.qty||0)+qty})}
    }
    const materialIds=[...gross.keys()];
    const [lots,poLines]=await Promise.all([
      prisma.inventoryLot.findMany({where:{materialId:{in:materialIds},warehouse:{plantId:s.plantId},qcStatus:'RELEASED'}}),
      prisma.purchaseOrderLine.findMany({where:{materialId:{in:materialIds},po:{plantId:s.plantId,status:{in:['APPROVED','SENT','PARTIAL_RECEIVED']}}},include:{po:true}})
    ]);
    const stock=new Map<string,number>(); for(const l of lots)stock.set(l.materialId,(stock.get(l.materialId)||0)+Number(l.availableQtyKg));
    const openPo=new Map<string,number>(); for(const l of poLines)openPo.set(l.materialId,(openPo.get(l.materialId)||0)+Math.max(0,Number(l.qtyKg)-Number(l.receivedQtyKg)));
    const rows=[...gross].map(([materialId,x])=>{const available=stock.get(materialId)||0;const open=openPo.get(materialId)||0;const safety=Number(x.material.safetyStockKg||0);const shortage=Math.max(0,x.qty+safety-available-open);return {materialId,code:x.material.code,nameAr:x.material.nameAr,grossRequirementKg:x.qty,safetyStockKg:safety,availableStockKg:available,openPoKg:open,shortageKg:shortage}}).sort((a,b)=>b.shortageKg-a.shortageKg);
    return Response.json({ok:true,rows,summary:{grossKg:rows.reduce((a,r)=>a+r.grossRequirementKg,0),shortageKg:rows.reduce((a,r)=>a+r.shortageKg,0)}});
  }catch(e){return apiError(e)}
}
