-- V1.0-RC additive migration on top of V0.6/V0.5 database.
CREATE TYPE "StockCountStatus" AS ENUM ('DRAFT','COUNTING','SUBMITTED','APPROVED','POSTED','CANCELLED');
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT','SUBMITTED','APPROVED','SENT','ACCEPTED','REJECTED','CONVERTED','CLOSED','CANCELLED');

CREATE TABLE "SupplierInvoice" (
 "id" TEXT PRIMARY KEY,"companyId" TEXT NOT NULL,"supplierId" TEXT NOT NULL,"purchaseOrderId" TEXT,
 "invoiceNo" TEXT NOT NULL,"invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"dueDate" TIMESTAMP(3) NOT NULL,
 "totalAmount" DECIMAL(18,2) NOT NULL,"paidAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,"currency" TEXT NOT NULL DEFAULT 'USD',
 "exchangeRate" DECIMAL(12,4) NOT NULL DEFAULT 1,"status" TEXT NOT NULL DEFAULT 'OPEN',"notes" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "SupplierInvoice_companyId_supplierId_invoiceNo_key" ON "SupplierInvoice"("companyId","supplierId","invoiceNo");
CREATE INDEX "SupplierInvoice_companyId_status_dueDate_idx" ON "SupplierInvoice"("companyId","status","dueDate");
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_companyId_fkey" FOREIGN KEY("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_supplierId_fkey" FOREIGN KEY("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_purchaseOrderId_fkey" FOREIGN KEY("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SupplierPayment" (
 "id" TEXT PRIMARY KEY,"supplierInvoiceId" TEXT NOT NULL,"paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"amount" DECIMAL(18,2) NOT NULL,
 "method" TEXT NOT NULL,"reference" TEXT,"userId" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_supplierInvoiceId_fkey" FOREIGN KEY("supplierInvoiceId") REFERENCES "SupplierInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_userId_fkey" FOREIGN KEY("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "StockCount" (
 "id" TEXT PRIMARY KEY,"plantId" TEXT NOT NULL,"countNo" TEXT NOT NULL,"warehouseId" TEXT NOT NULL,"status" "StockCountStatus" NOT NULL DEFAULT 'DRAFT',
 "createdById" TEXT NOT NULL,"approvedById" TEXT,"notes" TEXT,"countedAt" TIMESTAMP(3),"approvedAt" TIMESTAMP(3),"postedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "StockCount_countNo_key" ON "StockCount"("countNo");
CREATE INDEX "StockCount_plantId_warehouseId_status_createdAt_idx" ON "StockCount"("plantId","warehouseId","status","createdAt");
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_plantId_fkey" FOREIGN KEY("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_warehouseId_fkey" FOREIGN KEY("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_createdById_fkey" FOREIGN KEY("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_approvedById_fkey" FOREIGN KEY("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "StockCountLine" (
 "id" TEXT PRIMARY KEY,"stockCountId" TEXT NOT NULL,"inventoryLotId" TEXT NOT NULL,"systemQtyKg" DECIMAL(18,3) NOT NULL,"countedQtyKg" DECIMAL(18,3),"varianceKg" DECIMAL(18,3),"note" TEXT
);
CREATE UNIQUE INDEX "StockCountLine_stockCountId_inventoryLotId_key" ON "StockCountLine"("stockCountId","inventoryLotId");
ALTER TABLE "StockCountLine" ADD CONSTRAINT "StockCountLine_stockCountId_fkey" FOREIGN KEY("stockCountId") REFERENCES "StockCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockCountLine" ADD CONSTRAINT "StockCountLine_inventoryLotId_fkey" FOREIGN KEY("inventoryLotId") REFERENCES "InventoryLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SystemSetting" (
 "id" TEXT PRIMARY KEY,"companyId" TEXT NOT NULL,"plantId" TEXT,"key" TEXT NOT NULL,"valueJson" JSONB NOT NULL,"updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "SystemSetting_companyId_plantId_key_key" ON "SystemSetting"("companyId","plantId","key");
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_companyId_fkey" FOREIGN KEY("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_plantId_fkey" FOREIGN KEY("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ProductionPlan" (
 "id" TEXT PRIMARY KEY,"plantId" TEXT NOT NULL,"planNo" TEXT NOT NULL,"startDate" TIMESTAMP(3) NOT NULL,"endDate" TIMESTAMP(3) NOT NULL,"status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',"notes" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "ProductionPlan_planNo_key" ON "ProductionPlan"("planNo");
CREATE INDEX "ProductionPlan_plantId_status_startDate_idx" ON "ProductionPlan"("plantId","status","startDate");
ALTER TABLE "ProductionPlan" ADD CONSTRAINT "ProductionPlan_plantId_fkey" FOREIGN KEY("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ProductionPlanLine" (
 "id" TEXT PRIMARY KEY,"planId" TEXT NOT NULL,"productId" TEXT NOT NULL,"machineId" TEXT NOT NULL,"plannedQtyKg" DECIMAL(18,3) NOT NULL,"plannedStart" TIMESTAMP(3) NOT NULL,"plannedEnd" TIMESTAMP(3),"priority" "Priority" NOT NULL DEFAULT 'NORMAL'
);
ALTER TABLE "ProductionPlanLine" ADD CONSTRAINT "ProductionPlanLine_planId_fkey" FOREIGN KEY("planId") REFERENCES "ProductionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductionPlanLine" ADD CONSTRAINT "ProductionPlanLine_productId_fkey" FOREIGN KEY("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductionPlanLine" ADD CONSTRAINT "ProductionPlanLine_machineId_fkey" FOREIGN KEY("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductionOrder" ADD COLUMN "planLineId" TEXT;
CREATE UNIQUE INDEX "ProductionOrder_planLineId_key" ON "ProductionOrder"("planLineId");
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_planLineId_fkey" FOREIGN KEY("planLineId") REFERENCES "ProductionPlanLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Rfq" (
 "id" TEXT PRIMARY KEY,"plantId" TEXT NOT NULL,"rfqNo" TEXT NOT NULL,"dueDate" TIMESTAMP(3) NOT NULL,"status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',"notes" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Rfq_rfqNo_key" ON "Rfq"("rfqNo");
CREATE INDEX "Rfq_plantId_status_dueDate_idx" ON "Rfq"("plantId","status","dueDate");
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_plantId_fkey" FOREIGN KEY("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "RfqLine" ("id" TEXT PRIMARY KEY,"rfqId" TEXT NOT NULL,"materialId" TEXT NOT NULL,"qtyKg" DECIMAL(18,3) NOT NULL,"requiredDate" TIMESTAMP(3));
ALTER TABLE "RfqLine" ADD CONSTRAINT "RfqLine_rfqId_fkey" FOREIGN KEY("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RfqLine" ADD CONSTRAINT "RfqLine_materialId_fkey" FOREIGN KEY("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "SupplierQuote" (
 "id" TEXT PRIMARY KEY,"rfqId" TEXT NOT NULL,"supplierId" TEXT NOT NULL,"currency" TEXT NOT NULL DEFAULT 'USD',"exchangeRate" DECIMAL(12,4) NOT NULL DEFAULT 1,"validUntil" TIMESTAMP(3),"paymentTermsDays" INTEGER NOT NULL DEFAULT 0,"status" "DocumentStatus" NOT NULL DEFAULT 'SUBMITTED',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "SupplierQuote_rfqId_supplierId_key" ON "SupplierQuote"("rfqId","supplierId");
ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_rfqId_fkey" FOREIGN KEY("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_supplierId_fkey" FOREIGN KEY("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "SupplierQuoteLine" ("id" TEXT PRIMARY KEY,"supplierQuoteId" TEXT NOT NULL,"rfqLineId" TEXT NOT NULL,"unitPrice" DECIMAL(18,6) NOT NULL,"freightEgpKg" DECIMAL(18,6) NOT NULL DEFAULT 0,"leadTimeDays" INTEGER NOT NULL DEFAULT 0);
ALTER TABLE "SupplierQuoteLine" ADD CONSTRAINT "SupplierQuoteLine_supplierQuoteId_fkey" FOREIGN KEY("supplierQuoteId") REFERENCES "SupplierQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierQuoteLine" ADD CONSTRAINT "SupplierQuoteLine_rfqLineId_fkey" FOREIGN KEY("rfqLineId") REFERENCES "RfqLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SalesQuotation" (
 "id" TEXT PRIMARY KEY,"customerId" TEXT NOT NULL,"quoteNo" TEXT NOT NULL,"currency" TEXT NOT NULL DEFAULT 'EGP',"validUntil" TIMESTAMP(3) NOT NULL,"paymentTermsDays" INTEGER NOT NULL DEFAULT 0,"status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "SalesQuotation_quoteNo_key" ON "SalesQuotation"("quoteNo");
CREATE INDEX "SalesQuotation_customerId_status_validUntil_idx" ON "SalesQuotation"("customerId","status","validUntil");
ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_customerId_fkey" FOREIGN KEY("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "SalesQuotationLine" ("id" TEXT PRIMARY KEY,"quotationId" TEXT NOT NULL,"productId" TEXT NOT NULL,"qtyKg" DECIMAL(18,3) NOT NULL,"unitPrice" DECIMAL(18,4) NOT NULL,"requiredDate" TIMESTAMP(3) NOT NULL);
ALTER TABLE "SalesQuotationLine" ADD CONSTRAINT "SalesQuotationLine_quotationId_fkey" FOREIGN KEY("quotationId") REFERENCES "SalesQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesQuotationLine" ADD CONSTRAINT "SalesQuotationLine_productId_fkey" FOREIGN KEY("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesOrder" ADD COLUMN "quotationId" TEXT;
CREATE UNIQUE INDEX "SalesOrder_quotationId_key" ON "SalesOrder"("quotationId");
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_quotationId_fkey" FOREIGN KEY("quotationId") REFERENCES "SalesQuotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
