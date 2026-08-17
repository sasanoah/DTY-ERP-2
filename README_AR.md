# DTY ERP — Arabic First — V1.0-RC.3 Release Candidate

ERP تشغيلي عربي RTL لمصنع DTY، مبني حول Lot Traceability والتكلفة والرقابة التشغيلية، ومهيأ لعدة شركات ومصانع.

## الدورة الكاملة داخل النطاق
`Sales Quotation / Forecast → Production Plan → MRP → PR → RFQ → Supplier Quotes → PO → Shipment/GRN → POY Lot/QC → Production Order → Production Run → DTY Lot/QC → FG Inventory → Sales Order/Credit → Allocation → Dispatch → Invoice → Collection`

وبالتوازي:
`Supplier Invoice → AP → Supplier Payment`
`Machine → Downtime → Maintenance Order → Spare Parts → Actual Maintenance Cost`
`Inventory → Stock Count → Approval → Adjustment`

## الموديولات المبنية
- Authentication + Arabic role-aware RBAC + Logout.
- Multi-company / Multi-plant data model.
- Master Data: POY/DTY، BOM، الموردون، العملاء، الماكينات، الورديات، المخازن.
- Production Planning وتحويل الخطة إلى Production Orders.
- MRP + PR + RFQ + Supplier Quotes + PO Approval + GRN + Landed Cost.
- Raw Material Inventory by Lot + QR + movements + Stock Count.
- Production execution + Mass Balance + Live Downtime Timer.
- OEE + machine-hour economics.
- Quality Hold/Release + DTY QC test sheet مقابل specs.
- Finished Goods inventory + reserved/free quantity.
- Sales Quotations + Floor Price + Sales Orders + Credit Control.
- Allocation + Dispatch + Invoicing + AR + Collections.
- Supplier Invoices + AP + Supplier Payments.
- Actual Costing + Machine Profitability + Customer True Profitability.
- Preventive/Corrective Maintenance + Spare Parts + maintenance EGP/kg.
- Supplier Scorecard.
- Approval Center + Alerts + Audit Log.
- n8n durable integration outbox.
- Management Reports + Working Capital view.
- Control Tower من معاملات ERP.
- AI Factory Assistant read-only: local fallback أو OpenAI Responses API عند إضافة المفتاح.
- Pilot Readiness Go/No-Go.

## التقنية
- Next.js 15 / React 19 / TypeScript
- PostgreSQL / Prisma
- Zod validation
- Signed HTTP-only sessions + Scrypt password hashing
- Docker + GitHub Actions CI
- n8n integration outbox

## تشغيل محلي
```bash
cp .env.example .env
npm install
docker compose up -d
npm run db:generate
npm run pilot:bootstrap
npm run test:domain
npm run test:structure
npm run typecheck
npm run dev
```

## حسابات التطوير
في التطوير فقط، إذا لم تحدد `SEED_DEMO_PASSWORD` يستخدم الـseed كلمة تجريبية مؤقتة. في `NODE_ENV=production` لن يعمل الـseed بدون `SEED_DEMO_PASSWORD`. شاشة الدخول لا تعرض أي كلمة مرور افتراضية.

- owner — الإدارة العليا
- warehouse — المخزن
- prod_mgr — مدير الإنتاج
- operator_cn2 — عامل تشغيل
- quality — الجودة
- procurement — المشتريات
- sales — المبيعات
- finance — المالية
- maintenance — الصيانة

## ملفات مهمة
- `docs/V1_RELEASE_SCOPE_AR.md`
- `docs/DEPLOYMENT_RUNBOOK_AR.md`
- `docs/DATA_MIGRATION_CHECKLIST_AR.md`
- `docs/TEST_PLAN_AR.md`
- `docs/RELEASE_NOTES_AR.md`
- `docs/SECURITY_GO_LIVE_CHECKLIST_AR.md`
- `docs/VALIDATION_REPORT.json`
- `docs/CODEX_HANDOFF.md`
- `docs/API_CATALOG_AR.md`
- `docs/SCREEN_CATALOG_AR.md`
- `docs/VALIDATION_REPORT.json`
- `docs/PILOT_RUNBOOK_AR.md`
- `prisma/legacy-migrations/20260809_v10_rc_full_scope/migration.sql`

## ملاحظة البناء
تمت محاولة استخدام Codex من الوصلات المتاحة؛ الظاهر في هذه الجلسة ليس Coding Agent قابلًا للاستدعاء، و`codex` CLI غير مثبت، كما أن GitHub connector لا يعرض repository للمشروع. لذلك بُني RC.3 داخل workspace مع Security Hardening. الـnpm الداخلي لا يوفر Prisma، والاتصال المباشر بـnpmjs محجوب، لذا يلزم أول تشغيل في Codex/GitHub workspace متصل لتنفيذ Prisma/Next build وتوليد `package-lock.json`.

**مهم:** قيم الطاقة والعمالة والتعبئة والتمويل في Seed افتراضية ويجب استبدالها بأرقام المصنع الفعلية قبل الاعتماد المالي.
