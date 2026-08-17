import { PrismaClient, MachineStatus, MaterialType, Intermingle, Lustre } from '@prisma/client';
import {hashPassword} from '../src/lib/password';
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({where:{code:'DTYCO'},update:{},create:{code:'DTYCO',nameAr:'شركة مصنع خيوط DTY',nameEn:'DTY Factory Company'}});
  const plant = await prisma.plant.upsert({where:{companyId_code:{companyId:company.id,code:'2100'}},update:{},create:{companyId:company.id,code:'2100',nameAr:'مصنع DTY الرئيسي'}});
  const rawWh = await prisma.warehouse.upsert({where:{plantId_code:{plantId:plant.id,code:'RAW'}},update:{},create:{plantId:plant.id,code:'RAW',nameAr:'مخزن خامات POY',type:'RAW'}});
  const fgWh = await prisma.warehouse.upsert({where:{plantId_code:{plantId:plant.id,code:'FG'}},update:{},create:{plantId:plant.id,code:'FG',nameAr:'مخزن المنتج التام',type:'FG'}});
  for(const [w,code] of [[rawWh,'R01'],[rawWh,'R02'],[fgWh,'F01']] as const) await prisma.bin.upsert({where:{warehouseId_code:{warehouseId:w.id,code}},update:{},create:{warehouseId:w.id,code}});

  const machineSeed = [
    ['DTY-DE-01','الماكينة الألمانية','Germany',2007,214],['DTY-CN-01','الماكينة الصينية 1','China',2012,240],
    ['DTY-CN-02','الماكينة الصينية 2','China',2012,240],['DTY-CN-03','الماكينة الصينية 3','China',2016,240],
    ['DTY-CN-04','الماكينة الصينية 4','China',2016,240],['DTY-CN-05','الماكينة الصينية 5','China',2016,240]
  ] as const;
  const machines:Record<string,string>={};
  for(const [code,nameAr,origin,year,spindles] of machineSeed){const m=await prisma.machine.upsert({where:{plantId_code:{plantId:plant.id,code}},update:{year,spindles,status:MachineStatus.RUN},create:{plantId:plant.id,code,nameAr,origin,year,spindles,status:MachineStatus.RUN}}); machines[code]=m.id}

  const materialSeed = [
    ['RM-POY-0505-096-SD','POY 505D/96F نصف مطفي',505,96,30000],['RM-POY-0250-096-SD','POY 250D/96F نصف مطفي',250,96,20000],
    ['RM-POY-0250-048-SD','POY 250D/48F نصف مطفي',250,48,15000],['RM-POY-0250-144-SD','POY 250D/144F نصف مطفي',250,144,10000]
  ] as const;
  const materials:Record<string,string>={};
  for(const [code,nameAr,denier,filaments,safetyStockKg] of materialSeed){const m=await prisma.material.upsert({where:{companyId_code:{companyId:company.id,code}},update:{safetyStockKg},create:{companyId:company.id,code,nameAr,type:MaterialType.POY,denier,filaments,lustre:Lustre.SD,safetyStockKg}});materials[code]=m.id}

  const productSeed = [
    ['FG-DTY-0300-096-NIM-SD','DTY 300D/96F NIM',300,96,Intermingle.NIM,'RM-POY-0505-096-SD'],
    ['FG-DTY-0150-096-SIM-SD','DTY 150D/96F SIM',150,96,Intermingle.SIM,'RM-POY-0250-096-SD'],
    ['FG-DTY-0150-048-NIM-SD','DTY 150D/48F NIM',150,48,Intermingle.NIM,'RM-POY-0250-048-SD'],
    ['FG-DTY-0150-144-SIM-SD','DTY 150D/144F SIM',150,144,Intermingle.SIM,'RM-POY-0250-144-SD']
  ] as const;
  const products:Record<string,string>={};
  for(const [code,nameAr,denier,filaments,intermingle,rawCode] of productSeed){
    const p=await prisma.product.upsert({where:{companyId_code:{companyId:company.id,code}},update:{},create:{companyId:company.id,code,nameAr,denier,filaments,intermingle,lustre:Lustre.SD,standardYield:0.98}}); products[code]=p.id;
    const bom=await prisma.bom.upsert({where:{productId_version:{productId:p.id,version:1}},update:{active:true},create:{productId:p.id,version:1,active:true}});
    const existing=await prisma.bomItem.findFirst({where:{bomId:bom.id,materialId:materials[rawCode]}}); if(!existing) await prisma.bomItem.create({data:{bomId:bom.id,materialId:materials[rawCode],qtyPerKg:1/0.98}});
  }

  const shifts:Record<string,string>={};
  for(const [code,nameAr,startTime,endTime] of [['A','الوردية الأولى','07:00','15:00'],['B','الوردية الثانية','15:00','23:00'],['C','الوردية الثالثة','23:00','07:00']] as const){const s=await prisma.shift.upsert({where:{plantId_code:{plantId:plant.id,code}},update:{},create:{plantId:plant.id,code,nameAr,startTime,endTime}}); shifts[code]=s.id}

  const permissions=[
    ['inventory.read','inventory','read','عرض المخزون'],['inventory.move','inventory','move','تنفيذ حركة مخزون'],['inventory.count','inventory','count','تنفيذ واعتماد الجرد'],
    ['production.read','production','read','عرض الإنتاج'],['production.plan','production','plan','تخطيط الإنتاج'],['production.order.create','production','create','إنشاء أمر إنتاج'],['production.run','production','run','تشغيل وإقفال الوردية'],
    ['quality.read','quality','read','عرض الجودة'],['quality.hold','quality','hold','حجز جودة'],['quality.release','quality','release','الإفراج/الرفض'],['traceability.read','traceability','read','تتبع Lot'],
    ['procurement.read','procurement','read','عرض المشتريات'],['procurement.rfq','procurement','rfq','طلبات عروض الأسعار'],['procurement.pr','procurement','pr','إنشاء طلب شراء'],['procurement.po','procurement','po','إنشاء أمر شراء'],['procurement.receive','procurement','receive','استلام مشتريات'],['procurement.approve','procurement','approve','اعتماد أمر شراء'],
    ['sales.read','sales','read','عرض المبيعات'],['sales.quotation','sales','quotation','عروض أسعار العملاء'],['sales.order','sales','order','إنشاء أمر بيع'],['sales.confirm','sales','confirm','تأكيد أمر بيع'],['sales.allocate','sales','allocate','تخصيص مخزون'],['sales.dispatch','sales','dispatch','إذن تسليم وشحن'],['sales.invoice','sales','invoice','إصدار فاتورة'],['sales.price.override','sales','price_override','تجاوز سعر الحد الأدنى'],['sales.credit.override','sales','credit_override','تجاوز حد الائتمان'],['finance.read','finance','read','عرض الذمم'],['finance.collect','finance','collect','تسجيل تحصيل'],['finance.ap','finance','ap','إدارة مستحقات الموردين'],
    ['costing.read','costing','read','عرض التكلفة والربحية'],['costing.calculate','costing','calculate','احتساب التكلفة الفعلية'],
    ['maintenance.read','maintenance','read','عرض الصيانة'],['maintenance.create','maintenance','create','إنشاء أمر صيانة'],['maintenance.close','maintenance','close','إقفال أمر صيانة وقطع الغيار'],
    ['finance.adjustment','finance','adjustment','تسجيل تكاليف العميل الإضافية'],['approvals.read','approvals','read','عرض طلبات الاعتماد'],['approvals.decide','approvals','decide','اتخاذ قرار اعتماد'],['integrations.dispatch','integrations','dispatch','إرسال تكاملات n8n'],['pilot.read','pilot','read','عرض جاهزية التشغيل التجريبي'],['master.read','master','read','عرض البيانات الأساسية'],['master.write','master','write','تعديل البيانات الأساسية'],['admin.users','admin','users','إدارة المستخدمين والصلاحيات'],['audit.read','admin','audit','عرض سجل التدقيق'],['alerts.manage','admin','alerts','إدارة التنبيهات'],['reports.read','reports','read','عرض تقارير الإدارة'],['settings.write','admin','settings','تعديل إعدادات النظام'],['ai.assistant','ai','assistant','مساعد المصنع الذكي']
  ] as const;
  const permissionIds:Record<string,string>={};
  for(const [code,module,action,nameAr] of permissions){const p=await prisma.permission.upsert({where:{code},update:{},create:{code,module,action,nameAr}});permissionIds[code]=p.id}
  const roleDefs=[
    ['OWNER','المالك / الإدارة العليا',permissions.map(x=>x[0])],
    ['WAREHOUSE','المخزن',['inventory.read','inventory.move','inventory.count','traceability.read']],
    ['PRODUCTION_MANAGER','مدير الإنتاج',['ai.assistant','inventory.read','production.read','production.plan','production.order.create','production.run','traceability.read','costing.read','maintenance.read','pilot.read']],
    ['OPERATOR','عامل تشغيل',['production.read','production.run']],
    ['QUALITY','الجودة',['ai.assistant','inventory.read','quality.read','quality.hold','quality.release','traceability.read']],
    ['PROCUREMENT','المشتريات',['ai.assistant','inventory.read','procurement.read','procurement.rfq','procurement.pr','procurement.po','procurement.receive','traceability.read']],
    ['SALES','المبيعات',['ai.assistant','sales.read','sales.quotation','sales.order','sales.confirm','sales.allocate','sales.dispatch','sales.invoice','traceability.read']],
    ['FINANCE','المالية',['ai.assistant','finance.read','finance.collect','finance.ap','finance.adjustment','sales.read','costing.read','costing.calculate','reports.read']],
    ['MAINTENANCE','الصيانة',['ai.assistant','maintenance.read','maintenance.create','maintenance.close','production.read','inventory.read','costing.read']]
  ] as const;
  const roles:Record<string,string>={};
  for(const [code,nameAr,perms] of roleDefs){const role=await prisma.role.upsert({where:{companyId_code:{companyId:company.id,code}},update:{nameAr},create:{companyId:company.id,code,nameAr}});roles[code]=role.id; for(const pc of perms) await prisma.rolePermission.upsert({where:{roleId_permissionId:{roleId:role.id,permissionId:permissionIds[pc]}},update:{},create:{roleId:role.id,permissionId:permissionIds[pc]}})}

  const demoPasswordPlain=process.env.SEED_DEMO_PASSWORD || (process.env.NODE_ENV==='production' ? (()=>{throw new Error('SEED_DEMO_PASSWORD_REQUIRED')})() : 'DevOnly123!');
  const demoPassword=hashPassword(demoPasswordPlain);
  const userDefs=[['owner','الإدارة العليا','OWNER'],['warehouse','أمين المخزن','WAREHOUSE'],['prod_mgr','مدير الإنتاج','PRODUCTION_MANAGER'],['operator_cn2','مشغل الماكينة الصينية 2','OPERATOR'],['quality','مسؤول الجودة','QUALITY'],['procurement','مسؤول المشتريات','PROCUREMENT'],['sales','مسؤول المبيعات','SALES'],['finance','مسؤول المالية','FINANCE'],['maintenance','مسؤول الصيانة','MAINTENANCE']] as const;
  const users:Record<string,string>={};
  for(const [username,fullNameAr,roleCode] of userDefs){const u=await prisma.user.upsert({where:{username},update:{passwordHash:demoPassword,active:true},create:{companyId:company.id,username,fullNameAr,passwordHash:demoPassword,language:'ar'}});users[username]=u.id; const existing=await prisma.userRole.findFirst({where:{userId:u.id,roleId:roles[roleCode],plantId:plant.id}}); if(!existing) await prisma.userRole.create({data:{userId:u.id,roleId:roles[roleCode],plantId:plant.id}})}

  const supplier=await prisma.supplier.upsert({where:{companyId_code:{companyId:company.id,code:'SUP-A'}},update:{},create:{companyId:company.id,code:'SUP-A',nameAr:'مورد POY معتمد A',country:'China',currencyDefault:'USD',paymentTermsDays:30}});
  const customerA=await prisma.customer.upsert({where:{companyId_code:{companyId:company.id,code:'CUST-A'}},update:{creditLimit:5000000},create:{companyId:company.id,code:'CUST-A',nameAr:'عميل صناعي A',city:'المحلة',customerType:'INDUSTRIAL',creditLimit:5000000,paymentTermsDays:45}});
  const customerB=await prisma.customer.upsert({where:{companyId_code:{companyId:company.id,code:'CUST-B'}},update:{creditLimit:1500000},create:{companyId:company.id,code:'CUST-B',nameAr:'عميل تجاري B',city:'القاهرة',customerType:'TRADER',creditLimit:1500000,paymentTermsDays:30}});
  for(const [productCode,floorPrice,targetPrice] of [['FG-DTY-0300-096-NIM-SD',96,101],['FG-DTY-0150-096-SIM-SD',98,103],['FG-DTY-0150-048-NIM-SD',95,99],['FG-DTY-0150-144-SIM-SD',103,108]] as const){const existing=await prisma.priceRule.findFirst({where:{companyId:company.id,productId:products[productCode],customerId:null,active:true}});if(!existing)await prisma.priceRule.create({data:{companyId:company.id,productId:products[productCode],floorPrice,targetPrice,active:true}})}
  const lotDefs=[
    ['POY-2608-0001','RM-POY-0505-096-SD',48200,76.20,'RELEASED'],['POY-2608-0004','RM-POY-0250-096-SD',77100,75.80,'RELEASED'],
    ['POY-2608-0007','RM-POY-0250-048-SD',61300,75.50,'RELEASED'],['POY-2608-0010','RM-POY-0250-144-SD',30900,77.10,'PENDING']
  ] as const;
  for(const [lotNo,matCode,qty,cost,qcStatus] of lotDefs) await prisma.inventoryLot.upsert({where:{lotNo},update:{availableQtyKg:qty,landedCostEgpKg:cost,qcStatus},create:{materialId:materials[matCode],supplierId:supplier.id,warehouseId:rawWh.id,lotNo,receivedQtyKg:qty,availableQtyKg:qty,landedCostEgpKg:cost,qcStatus}});

  const orderDefs=[
    ['PRD-26-000512','FG-DTY-0300-096-NIM-SD','DTY-CN-01',8000,'RELEASED','NORMAL'],
    ['PRD-26-000513','FG-DTY-0300-096-NIM-SD','DTY-CN-02',8000,'RELEASED','HIGH'],
    ['PRD-26-000514','FG-DTY-0150-144-SIM-SD','DTY-DE-01',5000,'RELEASED','NORMAL'],
    ['PRD-26-000515','FG-DTY-0150-096-SIM-SD','DTY-CN-05',6000,'RELEASED','URGENT']
  ] as const;
  for(const [orderNo,productCode,machineCode,plannedQtyKg,status,priority] of orderDefs) await prisma.productionOrder.upsert({where:{orderNo},update:{status,priority},create:{orderNo,productId:products[productCode],machineId:machines[machineCode],plannedQtyKg,plannedStart:new Date('2026-08-09T07:00:00+03:00'),status,priority}});

  for(const productCode of Object.keys(products)){
    const pid=products[productCode];
    const qualityDefs=[['DENIER','الدنير الفعلي',null,null,'D'],['TENACITY','المتانة',3.0,8.0,'cN/dtex'],['ELONGATION','الاستطالة',15,35,'%'],['OIL','نسبة الزيت',1.5,3.5,'%'],['INTERMINGLE','عقد التشابك',40,140,'nodes/m']] as const;
    for(const [testCode,nameAr,minValue,maxValue,unit] of qualityDefs){const exists=await prisma.qualitySpec.findFirst({where:{productId:pid,testCode}});if(!exists)await prisma.qualitySpec.create({data:{productId:pid,testCode,nameAr,minValue:minValue??undefined,maxValue:maxValue??undefined,unit,active:true}})}
  }

  for(const [code,category,nameAr] of [['POY_BREAK','MATERIAL','قطع POY'],['ELECTRICAL','MACHINE','عطل كهربائي'],['MECHANICAL','MACHINE','عطل ميكانيكي'],['HEATER','MACHINE','عطل سخان'],['CHANGEOVER','PROCESS','تغيير صنف'],['NO_MATERIAL','SUPPLY','عدم توفر خامة']] as const) await prisma.downtimeCode.upsert({where:{code},update:{},create:{code,category,nameAr}});



  // Machine capability standards for OEE / capacity planning
  const rateByProduct:Record<string,[number,number]>={
    'FG-DTY-0300-096-NIM-SD':[250,220],
    'FG-DTY-0150-096-SIM-SD':[150,135],
    'FG-DTY-0150-048-NIM-SD':[155,140],
    'FG-DTY-0150-144-SIM-SD':[140,130]
  };
  for(const [mCode,mId] of Object.entries(machines)){
    for(const [pCode,pId] of Object.entries(products)){
      const [cn,de]=rateByProduct[pCode]; const standardKgPerHour=mCode.includes('-DE-')?de:cn;
      await prisma.machineCapability.upsert({where:{machineId_productId:{machineId:mId,productId:pId}},update:{standardKgPerHour,approved:true},create:{machineId:mId,productId:pId,standardKgPerHour,standardEfficiency:0.90,approved:true}});
    }
    const existingRate=await prisma.machineCostRate.findFirst({where:{machineId:mId,active:true}});
    if(!existingRate) await prisma.machineCostRate.create({data:{machineId:mId,maintenanceEgpHour:mCode.includes('-DE-')?180:120,depreciationEgpHour:0,active:true}});
    for(const [taskCode,nameAr,days] of [['PM-30','صيانة وقائية شهرية',30],['PM-90','صيانة وقائية ربع سنوية',90]] as const){
      await prisma.maintenancePlan.upsert({where:{machineId_taskCode:{machineId:mId,taskCode}},update:{nameAr,intervalDays:days},create:{machineId:mId,taskCode,nameAr,intervalDays:days,nextDueAt:new Date(Date.now()+days*86400000)}});
    }
  }
  const currentCost=await prisma.costConfig.findFirst({where:{plantId:plant.id,active:true}});
  if(!currentCost) await prisma.costConfig.create({data:{plantId:plant.id,energyEgpKwh:2.2,laborEgpHour:180,packingEgpKg:0.70,financeAnnualRate:0.25,defaultWcDays:45,active:true}});

  const spareSeed=[
    ['SP-FRICTION-DISC','قرص احتكاك DTY',20,50,850],['SP-BEARING-01','رولمان بلي قياسي',10,30,600],['SP-HEATER-SENSOR','حساس سخان',5,12,1450],['SP-INTERMINGLE-JET','نفاثة Intermingle',8,16,2200]
  ] as const;
  for(const [code,nameAr,minStock,stockQty,unitCostEgp] of spareSeed){
    await prisma.sparePart.upsert({where:{companyId_code:{companyId:company.id,code}},update:{minStock,stockQty,unitCostEgp},create:{companyId:company.id,code,nameAr,minStock,stockQty,unitCostEgp}});
  }

  console.log({ok:true,company:company.code,plant:plant.code,machines:machineSeed.length,spindles:machineSeed.reduce((s,m)=>s+m[4],0),demoUsers:userDefs.map(x=>x[0])});
}
main().finally(()=>prisma.$disconnect());
