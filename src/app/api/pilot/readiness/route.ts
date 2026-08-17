import {prisma} from '@/lib/prisma';import {requirePermission,apiError} from '@/lib/rbac';
export async function GET(){try{const s=await requirePermission('pilot.read');const machineCode=process.env.PILOT_MACHINE_CODE||'DTY-CN-02';const machine=await prisma.machine.findFirst({where:{plantId:s.plantId,code:machineCode}});if(!machine)return Response.json({ok:true,ready:false,machineCode,checks:[{key:'machine',label:'الماكينة التجريبية موجودة',ok:false,critical:true,detail:machineCode}]});const [orders,poyKg,costCfg,caps,codes,shifts,operators,rawWh,openRun]=await Promise.all([
 prisma.productionOrder.count({where:{machineId:machine.id,status:{in:['RELEASED','RUNNING']}}}),
 prisma.inventoryLot.aggregate({_sum:{availableQtyKg:true},where:{warehouse:{plantId:s.plantId,type:'RAW'},material:{type:'POY'},qcStatus:'RELEASED'}}),
 prisma.costConfig.findFirst({where:{plantId:s.plantId,active:true}}),prisma.machineCapability.count({where:{machineId:machine.id,approved:true}}),prisma.downtimeCode.count(),prisma.shift.count({where:{plantId:s.plantId}}),
 prisma.userRole.count({where:{plantId:s.plantId,role:{code:'OPERATOR'},user:{active:true}}}),prisma.warehouse.findFirst({where:{plantId:s.plantId,type:'RAW'}}),prisma.productionRun.findFirst({where:{status:'OPEN',productionOrder:{machineId:machine.id}}})
 ]);const checks=[
 {key:'machine',label:'الماكينة التجريبية معرفة في ERP',ok:true,critical:true,detail:`${machine.nameAr} • ${machine.spindles} spindle`},
 {key:'orders',label:'يوجد أمر إنتاج Released/Running',ok:orders>0,critical:true,detail:`${orders} أوامر`},
 {key:'poy',label:'POY مفرج عنه متاح للتشغيل',ok:Number(poyKg._sum.availableQtyKg||0)>1000,critical:true,detail:`${Number(poyKg._sum.availableQtyKg||0).toLocaleString()} kg`},
 {key:'cost',label:'إعدادات التكلفة فعالة',ok:!!costCfg,critical:true,detail:costCfg?'موجودة':'غير موجودة'},
 {key:'capability',label:'Machine Capability معرفة',ok:caps>0,critical:true,detail:`${caps} SKU`},
 {key:'downtime',label:'أكواد أسباب التوقف جاهزة',ok:codes>=5,critical:true,detail:`${codes} أسباب`},
 {key:'shift',label:'الورديات معرفة',ok:shifts>0,critical:true,detail:`${shifts} ورديات`},
 {key:'operator',label:'عامل تشغيل بصلاحية OPERATOR',ok:operators>0,critical:true,detail:`${operators} مستخدم`},
 {key:'warehouse',label:'مخزن POY معرف',ok:!!rawWh,critical:true,detail:rawWh?.nameAr||'—'},
 {key:'integration',label:'n8n Webhook مضبوط',ok:!!process.env.N8N_WEBHOOK_URL,critical:false,detail:process.env.N8N_WEBHOOK_URL?'Configured':'اختياري للـPilot الأول'},
 {key:'openRun',label:'لا يوجد تشغيل قديم مفتوح قبل بدء الـPilot',ok:!openRun,critical:true,detail:openRun?'يوجد Run مفتوح ويجب مراجعته':'سليم'}
 ];const critical=checks.filter(x=>x.critical);return Response.json({ok:true,machineCode,machine:{id:machine.id,code:machine.code,nameAr:machine.nameAr},ready:critical.every(x=>x.ok),score:checks.filter(x=>x.ok).length/checks.length,checks});}catch(e){return apiError(e)}}
