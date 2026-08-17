# قواعد V0.5 — Costing / OEE / Maintenance

## OEE
- Availability = (Planned Minutes - Downtime Minutes) / Planned Minutes.
- Performance = Actual Saleable kg / Ideal kg خلال وقت التشغيل.
- Ideal kg = MachineCapability.standardKgPerHour × Run Minutes / 60.
- Quality = Grade-A kg / POY Input kg.
- OEE = Availability × min(Performance, 100%) × Quality.
- يسمح بعرض Performance أعلى من 100% للتشخيص، لكن OEE نفسه يستخدم حدًا أقصى 100% للمكوّن.

## Actual Run Cost
- Raw Material = مجموع Material Issues × Landed Cost لكل POY Lot.
- Energy = electricityKwh × energyEgpKwh.
- Labor = elapsed run hours × laborEgpHour.
- Maintenance Allocation = elapsed hours × maintenanceEgpHour للماكينة.
- Depreciation = elapsed hours × depreciationEgpHour (افتراضيًا صفر لحين اعتماد السياسة).
- Packing = Saleable kg × packingEgpKg.
- Finance = pre-finance cost × annual finance rate × WC days / 365.
- Full Cost/kg = Total / (Grade A + Grade B).

> الأسعار الحالية في Seed هي افتراضات تشغيلية مؤقتة وليست تعريفة مالية نهائية. يجب تحديث CostConfig قبل Go-Live.

## Maintenance
- صرف Spare يتم داخل Database Transaction.
- لا يسمح بأن يصبح stockQty سالبًا.
- كل صرف ينشئ SpareMovement مرتبطًا بأمر الصيانة.
- قطع الغيار التي stockQty <= minStock تظهر كتنبيه إداري.

## QR
- Payload POY: `DTYERP:POY:<LOT_NO>`
- Payload DTY: `DTYERP:DTY:<LOT_NO>`
- Scanner يستخرج Lot Number ويفتح Traceability مباشرة.
