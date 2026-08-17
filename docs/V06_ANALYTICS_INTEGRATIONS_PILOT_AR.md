# DTY ERP V0.6 — Analytics, Integrations & Pilot

## 1) Supplier Scorecard
التقييم التشغيلي الحالي من 100 نقطة:
- Cost competitiveness: 30%
- Incoming quality: 20%
- DTY conversion yield: 20%
- OEE on runs consuming supplier POY: 15%
- Delivery reliability: 10%
- Payment terms: 5%

التقييم يعتمد على البيانات المتاحة ويعرض Data Quality بجواره. لا يُستخدم لاتخاذ قرار إلغاء مورد إذا كانت عينات التشغيل أو التسليم قليلة.

## 2) Customer True Profitability
True Contribution = Invoice Revenue - Actual COGS - Credit Finance Cost - Customer Adjustments.
Customer Adjustments تشمل Freight / Claims / Discounts / Returns / Other.
أي كمية تظهر في Cost Missing kg تعني أن الربحية غير مكتملة حتى يتم احتساب Cost Snapshot للتشغيلة المرتبطة.

## 3) Live Downtime
START يسجل وقت التوقف الحقيقي ويغير Machine Status إلى STOP. STOP يحسب المدة ويضيفها إلى ProductionRun.downtimeMin ثم يعيد الحالة RUN.
إذا تجاوز التوقف DOWNTIME_ALERT_MINUTES يتم إنشاء Integration Event.

## 4) Maintenance Actual Cost
كل شهر ولكل ماكينة:
Actual Maintenance Cost = Spare Parts + Maintenance Labor + External Cost.
ويحسب النظام Maintenance EGP/kg وActual EGP/run-hour، ويعرض معدل ساعة مقترح من آخر 90 يوم. التحديث على Costing Rate ليس تلقائيًا في V0.6.

## 5) Approval Center
- كل Purchase Order جديد يولد PURCHASE_ORDER_APPROVAL.
- Credit Block يولد CREDIT_OVERRIDE request.
- القرار يسجل المستخدم والوقت والملاحظة في Audit Trail.

## 6) n8n Outbox
النظام لا يرسل WhatsApp مباشرة. يسجل IntegrationEvent أولًا ثم Dispatcher يرسله إلى N8N_WEBHOOK_URL.
هذا يفصل ERP عن مزود WhatsApp ويمنع فقد التنبيهات عند تعطل الخدمة الخارجية.

المتغيرات المطلوبة:
- N8N_WEBHOOK_URL
- INTEGRATION_WEBHOOK_SECRET
- INTERNAL_JOB_TOKEN
- DOWNTIME_ALERT_MINUTES

## 7) Pilot
الماكينة الافتراضية: DTY-CN-02 ويمكن تغييرها من PILOT_MACHINE_CODE / NEXT_PUBLIC_PILOT_MACHINE_CODE.
ابدأ بورديّة واحدة، Lot POY واحد واضح، وأمر إنتاج واحد Released. قارن ERP مع التسجيل اليدوي في الإنتاج، الهالك، downtime، OEE، التكلفة، وTraceability قبل التوسع لباقي الماكينات.
