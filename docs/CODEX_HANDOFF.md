# Codex Handoff — DTY ERP V1.0-RC.3

هذه الحزمة هي نقطة البداية الوحيدة. لا تعيد تصميم الـdomain model بدون سبب موثق.

## الحالة الحالية
تم إنجاز bootstrap وpackage lock وPrisma baseline/migrate، typecheck/build، PostgreSQL E2E، Docker hardening، runtime secret validation، database-backed distributed login throttling، backup/restore drill، واختبارات concurrent FG allocation وdocument numbering وworkflow/operational posting claims (plan/RFQ/quotation/dispatch/invoice/run/downtime/stock count/maintenance/quality/approvals) وintegration outbox وcredit override audit وsupplier overpayment وlive user revocation وquality/settings isolation، وDraft PR. لا تعد هذه الخطوات.

## المهمة التالية
1. نشر immutable app/migrator images على Staging خلف HTTPS/WAF.
2. ضبط managed secrets وprivate least-privilege PostgreSQL.
3. تنفيذ encrypted backup/restore drill وتسجيل RPO/RTO.
4. تنفيذ خمس ورديات Pilot reconciled وجمع التوقيعات.

## Critical E2E flows
- Login + RBAC + اختيار Plant مصرح.
- PR/RFQ/Quote/PO/Approval/GRN → POY Lot → QC release.
- Production Plan → Order → POY Issue → Run → downtime → Mass Balance → DTY Lot.
- QC tests → release/hold/reject.
- Quotation → SO → Credit → Allocation → Dispatch → Invoice → Collection.
- Supplier Invoice → Payment.
- Stock Count → submit → approve → post مع conflict check.
- Maintenance order → spare issue → maintenance cost.
- Traceability POY ↔ DTY ↔ customer.

## Security review المطلوبة من Codex
- تحقق company/plant isolation على كل GET/WRITE، وليس فقط critical routes.
- CSRF/same-origin strategy الحالية + reverse proxy configuration.
- Central session-version revocation مطبق: تغيير كلمة المرور يلغي كل الجلسات السابقة، وتعطيل المستخدم أو تغيير أدواره يطبق فورًا أيضًا.
- WAF/edge rate limit أمام database-backed login throttle الموجود، ومراقبة محاولات الدخول الفاشلة.
- Security headers/CSP مناسب لـNext.
- Central log aggregation/alerting وربط safe `errorId` الموجود بمنصة الرصد.
- SQL/Prisma concurrency tests للمخزون والحجز.

## Non-negotiable business rules
- Arabic-first RTL.
- Lot traceability لا ينكسر.
- لا negative inventory.
- HOLD/REJECTED لا يصرف أو يباع.
- Mass Balance قبل إغلاق Production Run.
- Below-floor يحتاج approval.
- Credit Block يحتاج management override.
- AI Assistant Read-only.
