# سجل التغييرات

## V0.3
- إضافة MRP فعلي من أوامر الإنتاج وBOM.
- Safety Stock لكل POY material.
- Purchase Requisitions.
- Purchase Orders + Approval.
- تتبع Received Qty لكل PO Line.
- Shipment / GRN / POY receipt.
- Landed Cost per Lot.
- صفحات عربية لـMRP وأوامر الشراء والاستلام.

## V0.2
- Authentication + RBAC + Audit Log.
- Inventory transactions.
- Production run start/complete.
- Mass-balance validation.
- Quality Hold/Release/B-grade/Reject.
- Lot traceability.
- Control Tower من بيانات ERP.

## V0.1
- Project skeleton.
- Prisma core schema.
- Factory seed data.
- Arabic RTL UI prototypes.

## V0.4
- Sales Orders + price floor rules.
- Credit exposure and management override.
- Finished-goods allocation and reserved quantity.
- Dispatch / Delivery.
- Invoice generation.
- Receivables and collections.
- Concurrency-safe raw-material issue improvements.
- Extracted/tested core business rules.

## V0.5.0 — Costing / OEE / Maintenance / QR
- إضافة MachineCapability لكل ماكينة وصنف لاستخدامها في OEE وقياس الأداء.
- إضافة CostConfig وMachineCostRate واحتساب Actual Cost لكل Production Run تلقائيًا عند الإقفال.
- مكونات التكلفة: POY Lot landed cost، الكهرباء، العمالة، الصيانة المخصصة بالساعة، التعبئة، التمويل، والإهلاك الاختياري.
- إضافة شاشة التكلفة وربحية الماكينات وContribution / Machine Hour.
- إضافة OEE: Availability × Performance × Quality مع Downtime Pareto.
- إضافة Downtime Codes وتسجيل أحداث التوقف على التشغيل المفتوح.
- إضافة Maintenance Plans + Maintenance Orders + Spare Parts + صرف قطع الغيار داخل Transaction.
- إضافة شاشة الصيانة العربية ومؤشرات Low Stock لقطع الغيار.
- إضافة QR Label API وشاشة طباعة QR فعلية لـPOY/DTY باستخدام qrcode.
- إضافة Scanner بالكاميرا عبر BarcodeDetector مع fallback لجهاز Handheld/الإدخال اليدوي.
- إضافة OEE / Actual Cost / Maintenance alerts إلى Control Tower.
- تحديث الصلاحيات وإضافة مستخدم Demo للصيانة.

## V0.6.0
- Supplier Performance Scorecard من بيانات POY والتحويل الفعلية.
- Customer True Profitability مع Actual COGS وCredit Cost وتكاليف العميل الإضافية.
- Live Downtime Timer من شاشة العامل مع START/STOP فعلي.
- Actual Maintenance Cost by machine/month + EGP/kg + recommended hourly rate.
- Approval Center لأوامر الشراء وCredit Override.
- Durable n8n Integration Outbox للأحداث والتنبيهات.
- Pilot Readiness Go/No-Go للماكينة التجريبية.

## V1.0-RC.3 — Security & Release Hardening
- إغلاق Cross-tenant ID access في المعاملات الحساسة على مستوى company/plant.
- تحقق Plant/Product عند إنشاء وإفراج Production Orders.
- تحقق Shift + POY Lot + BOM عند Start Run ومنع أكثر من Run مفتوح على نفس الماكينة.
- Inventory ADJUST يحتاج صلاحية Stock Count، مع التحقق من warehouse/bin scope.
- Sales allocation/dispatch أصبح plant-scoped مع race-safe quantity guards.
- Collections وPO approvals وQuality dispositions وMaster Data أصبحت tenant-scoped.
- Login plant selection أصبح permission-aware مع basic rate limiting.
- Same-origin protection وsecure response headers في middleware.
- Prisma structural checker جديد (71 models / 26 enums).
- Security checker موسع لمسح write routes والعزل وAI read-only.
- Docker/CI bootstrap يعمل بـnpm install حتى توليد package-lock في أول بيئة npm متصلة.

## 1.0.0-rc.3
- إصلاح أخطاء TypeScript محتملة في GRN/QC/Stock Count UI التي ظهرت بفحص compiler offline.
- إضافة DB liveness/readiness.
- فصل legacy migrations وإضافة clean baseline generator.
- إضافة Pilot bootstrap، release gate، PostgreSQL backup/restore.
- تحديث CI ليستخدم PostgreSQL 16 ويعمل حتى قبل إنشاء package-lock.
