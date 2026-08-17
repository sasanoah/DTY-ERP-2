# خطة اختبار DTY ERP — V0.2

## 1) تسجيل الدخول والصلاحيات
- سجّل بحساب `owner` وتأكد من فتح كل الوحدات.
- سجّل بحساب `warehouse` وتأكد أن API الإنتاج يرفض العمليات غير المصرح بها بـ 403.
- سجّل بحساب `operator_cn2` وتأكد من السماح ببدء/إقفال التشغيل فقط.
- سجّل بحساب `quality` وتأكد من Hold/Release.

> كلمة المرور التجريبية فقط لبيئة التطوير: `DevOnly123!` ويجب تغييرها قبل أي Go-Live.

## 2) المخزون
1. افتح مخزون POY وتأكد من ظهور Lots وحالة QC والتكلفة.
2. حاول صرف Lot بحالة `PENDING` — يجب أن يرفض النظام.
3. حاول صرف كمية أكبر من الرصيد — يجب أن يرفض النظام.
4. نفّذ صرفًا صحيحًا — يجب أن يقل الرصيد ويُسجل InventoryMovement + AuditLog.

## 3) أمر الإنتاج
1. أنشئ أمرًا جديدًا بحالة DRAFT.
2. اضغط إفراج — يتحول إلى RELEASED.
3. لا يجب بدء أمر DRAFT أو CLOSED.

## 4) شاشة العامل
1. اختر أمرًا مفرجًا + وردية + POY Lot مفرجًا.
2. ابدأ التشغيل؛ يجب إنشاء ProductionRun وصرف POY داخل Transaction واحدة.
3. حاول فتح Run ثانٍ لنفس أمر الإنتاج — يجب أن يرفض.
4. عند الإقفال، أدخل Grade A + Grade B + Waste بما يساوي Input ضمن 0.5%.
5. أدخل ميزان كتلة غير متزن — يجب أن يرفض الإقفال.
6. عند الإقفال الصحيح، يجب إنشاء FinishedLot بحالة PENDING QC.

## 5) الجودة
1. ضع FinishedLot على Hold.
2. تأكد أن حالته HOLD.
3. اختر Release — تتحول إلى RELEASED.
4. اختر B-Grade — المنتج يتحول Grade B ويُفرج عنه.
5. اختر Reject — يتحول REJECTED.

## 6) Traceability
- ابحث عن `POY-2608-0001`: يجب رؤية الخامة والمورد وحركات الصرف والتشغيلات والمنتج التام والعملاء إن وُجدت Deliveries.
- ابحث عن DTY Lot: يجب الرجوع إلى الماكينة وأمر الإنتاج وPOY Lot المصدر.

## 7) Control Tower
- بعد إقفال Run، يجب أن تتغير Production Today / Month / Yield / Waste تلقائيًا.
- POY Days Cover يجب أن يعتمد على الرصيد الفعلي.
- Quality Holds يجب أن يطابق الحالات المفتوحة.

## 8) المبيعات والائتمان — V0.4
1. أنشئ Sales Order بسعر أعلى من Floor وتحت حد الائتمان — يجب أن يكون Credit APPROVED.
2. جرّب سعرًا تحت Floor بحساب `sales` — يجب الرفض.
3. أنشئ Order يتجاوز Credit Limit — يجب أن يظهر BLOCKED.
4. بحساب `owner` نفّذ Credit Override ثم Confirm.
5. حاول Allocation بدون Finished Lot مفرج — يجب ظهور عجز واضح.
6. بعد وجود Finished Lot RELEASED نفّذ Allocation — يجب زيادة Reserved Qty.
7. Dispatch يجب أن يخفض Available وReserved.
8. Invoice لا يصدر قبل Dispatch.
9. سجّل Collection جزئي ثم كامل وتأكد من PARTIAL ثم PAID.

## اختبارات V0.5
1. أغلق Production Run متزن وتأكد من إنشاء CostSnapshot تلقائيًا.
2. تحقق أن Raw Cost يساوي كمية POY المصروفة × landed cost الخاص بكل Lot.
3. تحقق أن OEE يعرض Availability / Performance / Quality وأن التوقف يخفض Availability.
4. سجل Downtime Event وتأكد من إضافته إلى downtimeMin وPareto.
5. افتح Maintenance Order ثم أغلقه بقطعة غيار وتأكد من خصم stockQty وإنشاء SpareMovement.
6. حاول صرف Spare أكبر من الرصيد وتأكد من رفض العملية وعدم إقفال أمر الصيانة.
7. اطبع QR لـPOY Lot وDTY Lot ثم امسحه من شاشة Scanner وتأكد من فتح Traceability.
8. تحقق من تنبيه Control Tower عند وجود Maintenance Orders مفتوحة أو Spare Stock تحت Min.
9. تحقق من Machine Profitability: kg، Cost/kg، Estimated Contribution، Contribution/Machine Hour.

## اختبارات V0.6
1. Supplier Scorecard: مورد بلا بيانات يظهر Data Quality منخفض ولا يُفسر كتقييم نهائي.
2. Supplier Scorecard: Lot أعلى من benchmark يخفض Cost Score.
3. Customer Profitability: إضافة Claim/Freight تخفض Contribution مباشرة.
4. Customer Profitability: Cost Missing kg يظهر إذا لا يوجد Cost Snapshot.
5. Live Downtime: START يمنع فتح توقف ثانٍ لنفس Run.
6. Live Downtime: STOP يحسب المدة ويزيد ProductionRun.downtimeMin.
7. Live Downtime: توقف فوق الحد يولد IntegrationEvent.
8. Purchase Order جديد يولد ApprovalRequest PENDING.
9. Credit Block يولد CREDIT_OVERRIDE request.
10. Approval APPROVED على PO يحول PO إلى APPROVED.
11. Approval APPROVED على Credit Override يحول SalesOrder.creditStatus إلى OVERRIDE.
12. Integration Outbox: فشل n8n لا يفقد الحدث؛ ينتقل FAILED ويزيد attempts.
13. Pilot Readiness: يفشل Go إذا لا يوجد Released Order أو Released POY.
14. Maintenance Monthly Cost = Spares + Labor + External ويقسم على إنتاج نفس الماكينة.
