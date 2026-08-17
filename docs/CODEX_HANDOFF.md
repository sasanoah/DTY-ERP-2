# Codex Handoff — DTY ERP V1.0-RC.3

هذه الحزمة هي نقطة البداية الوحيدة. لا تعيد تصميم الـdomain model بدون سبب موثق.

## الحالة الحالية
تم إنجاز bootstrap وpackage lock وPrisma baseline/migrate، typecheck/build، PostgreSQL E2E، Docker hardening، runtime secret validation، backup/restore drill، وDraft PR. لا تعد هذه الخطوات.

## المهمة التالية
1. نشر immutable app/migrator images على Staging خلف HTTPS/WAF.
2. ضبط managed secrets وprivate least-privilege PostgreSQL.
3. تنفيذ encrypted backup/restore drill وتسجيل RPO/RTO.
4. إكمال E2E لـconcurrent FG allocation، credit override audit، وsupplier overpayment.
5. تنفيذ خمس ورديات Pilot reconciled وجمع التوقيعات.

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
- Session rotation / logout invalidation strategy.
- Distributed login rate-limit إذا كان deployment متعدد instances.
- Security headers/CSP مناسب لـNext.
- Secrets/log redaction.
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
