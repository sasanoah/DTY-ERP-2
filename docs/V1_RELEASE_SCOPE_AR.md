# DTY ERP V1.0-RC — نطاق الإصدار

## ما يعنيه “كامل” في هذا الإصدار
كامل داخل نطاق **Factory ERP لمصنع DTY** الذي تم الاتفاق عليه، وليس نظام HR/Payroll أو Consolidation مالي لمجموعة شركات.

### Procure-to-Pay
MRP → PR → RFQ → Supplier Quotes → PO → Approval → Shipment → GRN → Lot → Supplier Invoice → Payment.

### Plan-to-Produce
Production Plan → Machine Loading → Production Order → POY Issue → Run → Downtime → Output A/B → Waste → Cost → QC → FG.

### Order-to-Cash
Quotation → Floor Price → Sales Order → Credit Check → Allocation → Dispatch → Invoice → Collection.

### Asset Reliability
Preventive Maintenance → Breakdown → Spares → Labor/External cost → machine/month maintenance KPI.

### Governance
RBAC → Approval Center → Audit Log → Alerts → n8n outbox.

### Intelligence
Control Tower → Supplier Score → Customer Profitability → Working Capital → AI Factory Assistant read-only.

## خارج نطاق V1.0 الحالي
- Payroll / HR attendance.
- Full statutory General Ledger / Egyptian tax filing.
- Native banking integration.
- Native SAP integration.
- POY polymerization/manufacturing module.
- Knitting module.
هذه يمكن إضافتها بعد ثبات Pilot DTY.
