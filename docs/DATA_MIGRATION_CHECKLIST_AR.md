# Checklist تحميل البيانات الفعلية

## Master Data
- Company / Plant code.
- Warehouses / bins.
- 6 DTY machines: serial/model/year/spindles.
- Shifts and operators.
- POY materials and safety stock.
- DTY products and BOM/yield.
- Quality specs لكل SKU.
- Suppliers + terms + currencies.
- Customers + credit limits + terms.
- Spare parts + min stock + cost.

## Opening Balances
- كل POY Lot: supplier, material, kg, landed cost, QC status.
- كل DTY FG Lot: SKU, grade, kg, reserved kg, QC status.
- Open PO / shipments.
- Open Sales Orders.
- AR invoices and collections-to-date.
- AP supplier invoices and payments-to-date.
- Open maintenance orders.

## Reconciliation
إجمالي الرصيد الافتتاحي في ERP يجب أن يساوي كشف المخزن الموقّع قبل فتح الحركات.
