# حالة البناء — DTY ERP V1.0-RC.3

## Core Platform
- Arabic-first RTL وRole-aware navigation.
- Multi-company / Multi-plant PostgreSQL-Prisma schema.
- Authentication + Scrypt + signed HTTP-only sessions.
- RBAC + Plant scope + Audit Log.
- Same-origin write protection + secure headers + distributed database-backed login rate limiting.
- Central API error redaction + safe correlation IDs لكل أخطاء 5xx.
- Seed مصنع 2100: ست ماكينات وإجمالي 1,414 spindle.

## Full DTY Factory Scope
- Master Data / Planning / MRP / PR / RFQ / Supplier Quotes / PO / GRN / Landed Cost.
- POY Lot Inventory + QR + Stock Count.
- Production Orders / Runs / Mass Balance / Live Downtime / OEE.
- QC Specs / Tests / Hold / Release / Reject.
- Finished DTY Inventory + Allocation + Dispatch.
- Sales Quotations / Floor Price / Credit Control / Invoice / Collection.
- Supplier Invoices / AP / Supplier Payments.
- Actual Costing / Machine Profitability / Customer Profitability / Supplier Scorecard.
- Maintenance / Spare Parts / PM / Breakdown.
- Approval Center / Alerts / Audit / n8n Outbox.
- Management Reports / Control Tower / AI Assistant Read-only / Pilot Readiness.

## RC.3 Release Engineering
- اكتشف compiler scan أخطاء فعلية في GRN/QC/Stock Count/Receipt UI وتم إصلاحها.
- فصل migrations الإضافية القديمة إلى `prisma/legacy-migrations` لمنع تشغيلها على قاعدة فارغة.
- إضافة `npm run db:baseline` لتوليد baseline نظيف من schema الحالية.
- إضافة `npm run pilot:bootstrap` لبيئة Pilot/UAT فقط باستخدام `prisma db push`.
- إضافة `/api/health` و`/api/health/ready` المرتبط بقاعدة البيانات.
- إضافة PostgreSQL backup/transactional-restore scripts وrestore drill مؤتمت.
- CI يستخدم `npm ci`، PostgreSQL 16، baseline migration، runtime configuration tests، وPlaywright E2E.
- إضافة Docker migrator/runtime targets وproduction Compose بـread-only filesystem/cap-drop/readiness.

## QA الآلي
- Structural validation ناجح: 73 Prisma model و69 API route و36 page.
- Security checker ناجح: 45 write routes مفحوصة.
- Semantic TypeScript check وNext.js production build ناجحان.
- PostgreSQL-backed security/operational Playwright suite ناجحة.
- Production container migration، startup secret rejection، readiness، backup، وrestore تم التحقق منها.
- Alias import resolver: 0 missing local imports.
- Factory seed: 6 machines / 1,414 spindles / Plant 2100.

## البوابة المتبقية قبل Go-Live
- Staging خلف HTTPS/WAF مع secrets من secret manager وPostgreSQL private/least-privilege.
- Restore drill على encrypted production-like storage وقياس RPO/RTO.
- UAT لدورة POY → DTY → QC → Sales → Finance، خمس ورديات reconciled، وتوقيع الإدارات.
