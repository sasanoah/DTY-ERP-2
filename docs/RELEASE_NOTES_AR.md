# DTY ERP — Release Notes V1.0-RC.3

## الحالة
Release Candidate كامل داخل نطاق تشغيل مصنع DTY. نجحت البوابات التقنية وGitHub CI؛ لم يُعلن Production Final حتى نشر Staging وإكمال الـPilot والتوقيعات التشغيلية.

## نطاق V1
### Procure-to-Pay
MRP → PR → RFQ → Supplier Quotes → PO → Approval → GRN/Landed Cost → Supplier Invoice → Payment.

### Plan-to-Produce
Production Plan → Production Order → POY Lot Issue → Shift Run → Live Downtime → Mass Balance → DTY Lot → QC → Actual Cost/OEE.

### Order-to-Cash
Quotation → Floor Price → Sales Order → Credit → Allocation → Dispatch → Invoice → Collection.

### Inventory & Quality
Lot Inventory → QR → Stock Count → QC Specs/Tests → Hold/Release/Reject → Full Traceability.

## إصلاح تتبع الـLot ومخزون الخامات
- شاشة تتبع عربية واضحة تعرض رصيد POY، حركات المخزون، أوامر التشغيل، Lots الـDTY الناتجة، والتسليمات والعملاء بدل عرض JSON خام.
- روابط مباشرة من كل Lot خام إلى التتبع وتحديث الرصيد.
- التسوية اليدوية تدعم ضبط الرصيد الفعلي إلى صفر وتحمي من الكتابة المتزامنة المتعارضة.
- النقل بين مواقع التخزين يفرض تحديد موقع مصدر ووجهة مختلفين، ولا يغيّر إجمالي رصيد الـLot.
- سجل الحركة يعرض المستخدم والمواقع والمرجع، مع إرجاع أحدث 200 حركة لتفادي تحميل غير محدود.

### Reliability
PM/Breakdown → Spare Parts → Maintenance Cost → Machine economics.

### Governance & Intelligence
RBAC → Approvals → Alerts → Audit → n8n Outbox → Control Tower → Supplier/Customer analytics → Read-only AI Assistant.

## RC.3 Security Hardening
- Plant/company ownership checks على write routes الحساسة.
- Login plant authorization.
- Atomic database-backed login rate limiting مشترك بين instances، مع hashed identifiers و`Retry-After`.
- Password verification timing equalization للحسابات غير الموجودة.
- كل أخطاء API غير المتوقعة تحجب تفاصيل database/upstream، وتعيد `errorId` مطابقًا لسجل آمن بدون رسائل أو أسرار.
- Password reset يزيد database session version، لذلك تصبح كل cookies السابقة غير صالحة فورًا على جميع instances.
- بعد نشر migration الخاصة بالـsession version سيطلب من الجلسات الصادرة من إصدارات أقدم تسجيل الدخول مرة أخرى.
- Same-origin write protection + response security headers.
- Race-safe guards في FG allocation/dispatch.
- Optimistic concurrency في FG allocation وsupplier payments لمنع الحجز أو السداد المزدوج.
- Plant/company isolation على sales-order confirmation مع credit-override approval/audit coverage.
- Live authorization يعيد التحقق من حالة المستخدم والأدوار الحالية في قاعدة البيانات لكل طلب محمي.
- Tenant-scoped quality holds وtraceability وsettings وapproval decisions مع migration لترحيل البيانات السابقة.
- أخطاء التحقق من المدخلات ترجع HTTP 400 بدل تصنيفها كأخطاء خادم.
- Atomic document sequences تمنع تكرار أرقام المستندات عند الإنشاء المتزامن، مع backfill للأرقام القائمة.
- Workflow transitions تستخدم atomic claims لمنع تكرار تحويل الخطط/RFQ/عروض الأسعار أو تكرار الشحن والفوترة عند الطلبات المتزامنة.
- Operational postings تستخدم compare-and-set claims وترتيب locks ثابت لمنع تكرار بدء/إغلاق التشغيل، downtime، الجرد، إغلاق الصيانة، قرارات الجودة، والاعتمادات.
- Integration outbox يستخدم leased atomic claims واسترجاع الـleases المتوقفة ويعزل أحداث المستخدم حسب الشركة/المصنع.
- Customer cost adjustments تتحقق أن أمر البيع يطابق العميل والمصنع.
- BOM/Shift/Plant validation عند بدء Production Run.
- منع إغلاق Run مع downtime مفتوح.
- Inventory Adjustment يحتاج صلاحية Stock Count.
- Inventory reconciliation يستخدم atomic compare-and-set، وحركات النقل تتحقق من مواقع التخزين.
- Master Data updates tenant-scoped.
- Security scanner يفحص 45 write route ويؤكد authentication markers.

## QA الآلي
- 136 TS/TSX files: semantic typecheck وNext production build ناجحان.
- Prisma structure: 73 models / 26 enums / missing targets = 0 / duplicate fields = 0.
- Business Rule assertions = 10 passed.
- API routes = 69; pages = 36.
- Factory seed = 6 machines / 1,414 spindles / Plant 2100.
- PostgreSQL-backed Playwright = 31/31.
- API error-boundary assertions = 4/4.
- Runtime environment = 4/4؛ weak/example secrets مرفوضة.
- PostgreSQL 16 baseline migration وbackup/transactional restore drill ناجحة.
- npm production audit = 0 vulnerabilities.

## البوابة المتبقية قبل Production Final
- Staging خلف HTTPS/WAF مع managed secrets وprivate least-privilege PostgreSQL.
- Encrypted production-like backup/restore مع RPO/RTO مقاسين.
- Actual master/cost data وخمس ورديات Pilot reconciled.
- إغلاق Critical/High UAT issues وتوقيع Production/Warehouse/QC/Finance.
