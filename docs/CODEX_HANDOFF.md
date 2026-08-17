# Codex Handoff — DTY ERP V1.0-RC.3

هذه الحزمة هي نقطة البداية الوحيدة. لا تعيد تصميم الـdomain model بدون سبب موثق.

## المهمة الأولى داخل Codex Coding Workspace
1. افتح المشروع root.
2. `npm install --no-audit --no-fund` لأن package-lock غير موجود نتيجة حجب npm في workspace الإنشاء.
3. Commit `package-lock.json` ثم غيّر CI/Docker إلى `npm ci`.
4. `npx prisma format && npx prisma validate && npx prisma generate`.
5. شغّل PostgreSQL 16 ثم نفّذ `npm run db:baseline` وراجع SQL الناتج قبل `prisma migrate deploy`.
6. `npm run test:domain && npm run test:structure && npm run security:check`.
7. `npm run typecheck && npm run build` وأصلح أي compile/runtime defects دون تغيير business meaning.
8. أضف Playwright E2E للـcritical flows.
9. افتح Draft PR بعد نجاح الاختبارات فقط.

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
