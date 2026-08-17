# قواعد المبيعات والائتمان — V0.4

## التسعير
- لكل DTY Product يمكن تعريف Floor Price وTarget Price.
- النظام يرفض سعرًا أقل من Floor Price لمستخدم المبيعات العادي.
- الإدارة العليا فقط تملك صلاحية Price Override.

## الائتمان
يحسب النظام التعرض الائتماني من:
- الفواتير المفتوحة/الجزئية/المتأخرة.
- أوامر البيع المؤكدة أو المخصصة أو المشحونة غير المفوترة.

ثم:
`New Exposure = Current Exposure + New Sales Order Value`

إذا تجاوز New Exposure حد العميل أو كان العميل Blocked:
- يتم إنشاء Sales Order بحالة Credit = BLOCKED.
- لا يمكن Confirm حتى تتم معالجة الائتمان.
- الإدارة العليا يمكنها تسجيل Credit Override، ويتم حفظه في Audit Log.

## التخصيص والشحن
- Allocation يستخدم Finished Lots بحالة QC = RELEASED فقط.
- يتم احتساب Free Qty = Available Qty - Reserved Qty.
- عند Allocation تزداد Reserved Qty.
- عند Dispatch تنخفض Available Qty وReserved Qty معًا.
- لا يمكن Dispatch قبل اكتمال Allocation.

## الفاتورة والتحصيل
- Invoice لا يصدر قبل Dispatch.
- Due Date = Invoice Date + Payment Terms Days.
- Collection لا يمكن أن يتجاوز Outstanding Amount.
- عند السداد الكامل تتحول Invoice إلى PAID؛ وإلا PARTIAL.
