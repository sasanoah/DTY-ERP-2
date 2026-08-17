# DTY ERP — Release Notes V1.0-RC.3

## الحالة
Release Candidate كامل داخل نطاق تشغيل مصنع DTY. لم يُعلن Production Final لأن بيئة الإنشاء لا تسمح بتثبيت Prisma/Next أو تشغيل build النهائي.

## نطاق V1
### Procure-to-Pay
MRP → PR → RFQ → Supplier Quotes → PO → Approval → GRN/Landed Cost → Supplier Invoice → Payment.

### Plan-to-Produce
Production Plan → Production Order → POY Lot Issue → Shift Run → Live Downtime → Mass Balance → DTY Lot → QC → Actual Cost/OEE.

### Order-to-Cash
Quotation → Floor Price → Sales Order → Credit → Allocation → Dispatch → Invoice → Collection.

### Inventory & Quality
Lot Inventory → QR → Stock Count → QC Specs/Tests → Hold/Release/Reject → Full Traceability.

### Reliability
PM/Breakdown → Spare Parts → Maintenance Cost → Machine economics.

### Governance & Intelligence
RBAC → Approvals → Alerts → Audit → n8n Outbox → Control Tower → Supplier/Customer analytics → Read-only AI Assistant.

## RC.3 Security Hardening
- Plant/company ownership checks على write routes الحساسة.
- Login plant authorization.
- Basic login rate limiting.
- Same-origin write protection + response security headers.
- Race-safe guards في FG allocation/dispatch.
- BOM/Shift/Plant validation عند بدء Production Run.
- منع إغلاق Run مع downtime مفتوح.
- Inventory Adjustment يحتاج صلاحية Stock Count.
- Master Data updates tenant-scoped.
- Security scanner يفحص 45 write route ويؤكد authentication markers.

## QA داخل workspace
- 127 TS/TSX files: syntax errors = 0.
- Prisma structure: 71 models / 26 enums / missing targets = 0 / duplicate fields = 0.
- Business Rule assertions = 10 passed.
- API routes = 68; pages = 36.
- Factory seed = 6 machines / 1,414 spindles / Plant 2100.

## Blockers قبل Production Final
- npm/Prisma/Next production build في بيئة متصلة.
- package-lock generation.
- baseline migration clean DB.
- semantic TypeScript build + Playwright E2E.
- Actual master/cost data + real pilot.
