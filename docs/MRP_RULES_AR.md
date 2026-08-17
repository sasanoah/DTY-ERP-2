# قواعد MRP في DTY ERP — V0.3

## المعادلة الحالية
لكل خامة POY مرتبطة بـ BOM:

`Gross Requirement = Remaining DTY Planned Qty × BOM QtyPerKg`

ثم:

`Net Shortage = Gross Requirement + Safety Stock - Released Stock - Open PO`

حيث:
- **Remaining DTY Planned Qty** = الكمية المخططة − Grade A/B المنتج فعليًا على أوامر الإنتاج المفتوحة.
- **Released Stock** = Lots بحالة QC = RELEASED فقط.
- **Open PO** = Qty أمر الشراء − Received Qty للأوامر APPROVED / SENT / PARTIAL_RECEIVED.
- **Safety Stock** = قيمة على Material Master ويمكن تعديلها لكل POY grade.

## سلوك النظام
- MRP لا ينشئ Purchase Order تلقائيًا.
- يمكن إنشاء Purchase Requisition للعجز الظاهر.
- PR الناتج من MRP يحمل Source = `MRP`.
- أمر الشراء يبدأ DRAFT ويحتاج Approval.
- الاستلام لا يسمح بكمية أعلى من المتبقي في PO Line.
- كل Lot جديد يدخل Pending QC ولا يمكن صرفه للإنتاج قبل Release.

## Landed Cost في V0.3
عند الاستلام يحسب النظام تكلفة Lot كالتالي:

`Base EGP/kg = FOB Unit Price × Exchange Rate`

وتضاف مصروفات الشحنة:
- Freight
- Insurance
- Bank Charges
- Customs / Clearance
- Inland Transport

وتوزع مصروفات الشحنة حاليًا حسب **وزن الكمية المستلمة** بين Lots المستلمة في نفس GRN.

> لاحقًا يمكن دعم طرق Allocation مختلفة: weight / value / container / manual allocation.
