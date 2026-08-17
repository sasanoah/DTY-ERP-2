-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."MachineStatus" AS ENUM ('RUN', 'STOP', 'MAINT', 'TRIAL');

-- CreateEnum
CREATE TYPE "public"."QCStatus" AS ENUM ('PENDING', 'RELEASED', 'HOLD', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ProductionOrderStatus" AS ENUM ('DRAFT', 'RELEASED', 'RUNNING', 'COMPLETED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ProductionRunStatus" AS ENUM ('OPEN', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."MaterialType" AS ENUM ('POY', 'PACKAGING', 'SPARE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."Intermingle" AS ENUM ('NIM', 'SIM', 'HIM', 'NONE');

-- CreateEnum
CREATE TYPE "public"."Lustre" AS ENUM ('SD', 'BRIGHT', 'FULL_DULL', 'TRILOBAL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."MovementType" AS ENUM ('RECEIVE', 'MOVE', 'ISSUE', 'RETURN', 'ADJUST', 'PICK', 'DISPATCH');

-- CreateEnum
CREATE TYPE "public"."Grade" AS ENUM ('A', 'B', 'OFF_GRADE');

-- CreateEnum
CREATE TYPE "public"."CreditStatus" AS ENUM ('APPROVED', 'BLOCKED', 'OVERRIDE');

-- CreateEnum
CREATE TYPE "public"."SalesOrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'ALLOCATED', 'DELIVERED', 'INVOICED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."DeliveryStatus" AS ENUM ('DRAFT', 'DISPATCHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('OPEN', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PurchaseOrderStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'PARTIAL_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PurchaseRequisitionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'CONVERTED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."HoldStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RELEASED', 'REWORK', 'B_GRADE', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."Severity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."MaintenanceOrderStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'TESTING', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."SpareMovementType" AS ENUM ('RECEIVE', 'ISSUE', 'RETURN', 'ADJUST');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."IntegrationEventStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."CustomerCostType" AS ENUM ('FREIGHT', 'CLAIM', 'DISCOUNT', 'RETURN', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."StockCountStatus" AS ENUM ('DRAFT', 'COUNTING', 'SUBMITTED', 'APPROVED', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED', 'CLOSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Plant" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Cairo',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "fullNameAr" TEXT NOT NULL,
    "mobile" TEXT,
    "passwordHash" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ar',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "plantId" TEXT,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Warehouse" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bin" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Bin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Supplier" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "country" TEXT,
    "currencyDefault" TEXT NOT NULL DEFAULT 'USD',
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 0,
    "qualityStatus" TEXT NOT NULL DEFAULT 'APPROVED',

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "city" TEXT,
    "customerType" TEXT,
    "creditLimit" DECIMAL(18,2) NOT NULL,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 0,
    "blocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Material" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "type" "public"."MaterialType" NOT NULL,
    "denier" DECIMAL(10,2),
    "filaments" INTEGER,
    "lustre" "public"."Lustre",
    "uom" TEXT NOT NULL DEFAULT 'kg',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "safetyStockKg" DECIMAL(18,3) NOT NULL DEFAULT 0,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "denier" DECIMAL(10,2) NOT NULL,
    "filaments" INTEGER NOT NULL,
    "intermingle" "public"."Intermingle" NOT NULL,
    "lustre" "public"."Lustre" NOT NULL,
    "standardYield" DECIMAL(6,4) NOT NULL DEFAULT 0.98,
    "standardPackKg" DECIMAL(10,2),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bom" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Bom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BomItem" (
    "id" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "qtyPerKg" DECIMAL(12,6) NOT NULL,

    CONSTRAINT "BomItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Machine" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "spindles" INTEGER NOT NULL,
    "status" "public"."MachineStatus" NOT NULL DEFAULT 'RUN',

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Shift" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductionPlan" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "planNo" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductionPlanLine" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "plannedQtyKg" DECIMAL(18,3) NOT NULL,
    "plannedStart" TIMESTAMP(3) NOT NULL,
    "plannedEnd" TIMESTAMP(3),
    "priority" "public"."Priority" NOT NULL DEFAULT 'NORMAL',

    CONSTRAINT "ProductionPlanLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Rfq" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "rfqNo" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RfqLine" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "qtyKg" DECIMAL(18,3) NOT NULL,
    "requiredDate" TIMESTAMP(3),

    CONSTRAINT "RfqLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplierQuote" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "validUntil" TIMESTAMP(3),
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplierQuoteLine" (
    "id" TEXT NOT NULL,
    "supplierQuoteId" TEXT NOT NULL,
    "rfqLineId" TEXT NOT NULL,
    "unitPrice" DECIMAL(18,6) NOT NULL,
    "freightEgpKg" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SupplierQuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseRequisition" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "prNo" TEXT NOT NULL,
    "status" "public"."PurchaseRequisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedById" TEXT NOT NULL,
    "requiredDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseRequisitionLine" (
    "id" TEXT NOT NULL,
    "prId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "qtyKg" DECIMAL(18,3) NOT NULL,
    "suggestedSupplierId" TEXT,
    "source" TEXT,

    CONSTRAINT "PurchaseRequisitionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseOrder" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "poNo" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "status" "public"."PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseOrderLine" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "qtyKg" DECIMAL(18,3) NOT NULL,
    "unitPrice" DECIMAL(18,6) NOT NULL,
    "receivedQtyKg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "sourcePrLineId" TEXT,

    CONSTRAINT "PurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Shipment" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "containerNo" TEXT,
    "blNo" TEXT,
    "etd" TIMESTAMP(3),
    "eta" TIMESTAMP(3),
    "freight" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "insurance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "bankCharges" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "customsCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "inlandCost" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GoodsReceipt" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "grnNo" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehouseId" TEXT NOT NULL,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryLot" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "supplierId" TEXT,
    "warehouseId" TEXT NOT NULL,
    "grnId" TEXT,
    "lotNo" TEXT NOT NULL,
    "receivedQtyKg" DECIMAL(18,3) NOT NULL,
    "availableQtyKg" DECIMAL(18,3) NOT NULL,
    "landedCostEgpKg" DECIMAL(18,6) NOT NULL,
    "qcStatus" "public"."QCStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryMovement" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "movementType" "public"."MovementType" NOT NULL,
    "qtyKg" DECIMAL(18,3) NOT NULL,
    "fromBinCode" TEXT,
    "toBinCode" TEXT,
    "refType" TEXT,
    "refId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductionOrder" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "plannedQtyKg" DECIMAL(18,3) NOT NULL,
    "plannedStart" TIMESTAMP(3) NOT NULL,
    "plannedEnd" TIMESTAMP(3),
    "priority" "public"."Priority" NOT NULL DEFAULT 'NORMAL',
    "status" "public"."ProductionOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "planLineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductionRun" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "inputKg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "gradeAKg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "gradeBKg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "wasteKg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "electricityKwh" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "downtimeMin" INTEGER NOT NULL DEFAULT 0,
    "plannedMinutes" INTEGER NOT NULL DEFAULT 480,
    "notes" TEXT,
    "status" "public"."ProductionRunStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "ProductionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MaterialIssue" (
    "id" TEXT NOT NULL,
    "productionRunId" TEXT NOT NULL,
    "inventoryLotId" TEXT NOT NULL,
    "qtyKg" DECIMAL(18,3) NOT NULL,

    CONSTRAINT "MaterialIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FinishedLot" (
    "id" TEXT NOT NULL,
    "productionRunId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotNo" TEXT NOT NULL,
    "grade" "public"."Grade" NOT NULL DEFAULT 'A',
    "qtyKg" DECIMAL(18,3) NOT NULL,
    "availableQtyKg" DECIMAL(18,3) NOT NULL,
    "reservedQtyKg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "qcStatus" "public"."QCStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinishedLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DowntimeCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,

    CONSTRAINT "DowntimeCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DowntimeEvent" (
    "id" TEXT NOT NULL,
    "productionRunId" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMin" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "DowntimeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QualitySpec" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "materialId" TEXT,
    "testCode" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "minValue" DECIMAL(18,6),
    "maxValue" DECIMAL(18,6),
    "unit" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "QualitySpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QualitySample" (
    "id" TEXT NOT NULL,
    "finishedLotId" TEXT NOT NULL,
    "sampleNo" TEXT NOT NULL,
    "sampleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualitySample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QualityTest" (
    "id" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "specId" TEXT NOT NULL,
    "resultValue" DECIMAL(18,6) NOT NULL,
    "passFlag" BOOLEAN NOT NULL,
    "testedBy" TEXT NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QualityHold" (
    "id" TEXT NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "public"."HoldStatus" NOT NULL DEFAULT 'OPEN',
    "openedBy" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedBy" TEXT,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "QualityHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SalesQuotation" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quoteNo" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "validUntil" TIMESTAMP(3) NOT NULL,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SalesQuotationLine" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qtyKg" DECIMAL(18,3) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "requiredDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesQuotationLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SalesOrder" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 0,
    "creditStatus" "public"."CreditStatus" NOT NULL DEFAULT 'APPROVED',
    "status" "public"."SalesOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "quotationId" TEXT,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SalesOrderLine" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qtyKg" DECIMAL(18,3) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "requiredDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Allocation" (
    "id" TEXT NOT NULL,
    "salesOrderLineId" TEXT NOT NULL,
    "finishedLotId" TEXT NOT NULL,
    "qtyKg" DECIMAL(18,3) NOT NULL,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Delivery" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "deliveryNo" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."DeliveryStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeliveryLine" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "finishedLotId" TEXT NOT NULL,
    "qtyKg" DECIMAL(18,3) NOT NULL,

    CONSTRAINT "DeliveryLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriceRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT,
    "floorPrice" DECIMAL(18,4) NOT NULL,
    "targetPrice" DECIMAL(18,4) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PriceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesOrderId" TEXT,
    "invoiceNo" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "paidAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "salesOrderLineId" TEXT NOT NULL,
    "qtyKg" DECIMAL(18,3) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Collection" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "collectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(18,2) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MachineCapability" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "standardKgPerHour" DECIMAL(18,3) NOT NULL,
    "standardEfficiency" DECIMAL(6,4) NOT NULL DEFAULT 0.90,
    "approved" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MachineCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CostConfig" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "energyEgpKwh" DECIMAL(18,4) NOT NULL,
    "laborEgpHour" DECIMAL(18,4) NOT NULL,
    "packingEgpKg" DECIMAL(18,4) NOT NULL,
    "financeAnnualRate" DECIMAL(8,6) NOT NULL,
    "defaultWcDays" INTEGER NOT NULL DEFAULT 45,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CostConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MachineCostRate" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maintenanceEgpHour" DECIMAL(18,4) NOT NULL,
    "depreciationEgpHour" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MachineCostRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MaintenancePlan" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "intervalHours" INTEGER,
    "intervalDays" INTEGER,
    "lastDoneAt" TIMESTAMP(3),
    "nextDueAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MaintenancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MaintenanceOrder" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "moNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" "public"."Priority" NOT NULL DEFAULT 'NORMAL',
    "status" "public"."MaintenanceOrderStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rootCause" TEXT,
    "notes" TEXT,
    "laborHours" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "externalCost" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "MaintenanceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SparePart" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'pcs',
    "minStock" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "stockQty" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "unitCostEgp" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SparePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SpareMovement" (
    "id" TEXT NOT NULL,
    "sparePartId" TEXT NOT NULL,
    "type" "public"."SpareMovementType" NOT NULL,
    "qty" DECIMAL(18,3) NOT NULL,
    "userId" TEXT NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpareMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MaintenanceSpare" (
    "id" TEXT NOT NULL,
    "maintenanceOrderId" TEXT NOT NULL,
    "sparePartId" TEXT NOT NULL,
    "qty" DECIMAL(18,3) NOT NULL,
    "costEgp" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "MaintenanceSpare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CostSnapshot" (
    "id" TEXT NOT NULL,
    "productionRunId" TEXT NOT NULL,
    "rawCost" DECIMAL(18,2) NOT NULL,
    "energyCost" DECIMAL(18,2) NOT NULL,
    "laborCost" DECIMAL(18,2) NOT NULL,
    "maintenanceCost" DECIMAL(18,2) NOT NULL,
    "packingCost" DECIMAL(18,2) NOT NULL,
    "financeCost" DECIMAL(18,2) NOT NULL,
    "depreciationCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "saleableKg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "fullCostEgpKg" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplierInvoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "invoiceNo" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "paidAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplierPayment" (
    "id" TEXT NOT NULL,
    "supplierInvoiceId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(18,2) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockCount" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "countNo" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" "public"."StockCountStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "notes" TEXT,
    "countedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockCountLine" (
    "id" TEXT NOT NULL,
    "stockCountId" TEXT NOT NULL,
    "inventoryLotId" TEXT NOT NULL,
    "systemQtyKg" DECIMAL(18,3) NOT NULL,
    "countedQtyKg" DECIMAL(18,3),
    "varianceKg" DECIMAL(18,3),
    "note" TEXT,

    CONSTRAINT "StockCountLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSetting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "plantId" TEXT,
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Alert" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" "public"."Severity" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "messageAr" TEXT NOT NULL,
    "status" "public"."AlertStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerCostAdjustment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesOrderId" TEXT,
    "type" "public"."CustomerCostType" NOT NULL,
    "amountEgp" DECIMAL(18,2) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerCostAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApprovalRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "plantId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "approvalType" TEXT NOT NULL,
    "status" "public"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "requestedById" TEXT NOT NULL,
    "decidedById" TEXT,
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IntegrationEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "plantId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "public"."IntegrationEventStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON "public"."Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Plant_companyId_code_key" ON "public"."Plant"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Role_companyId_code_key" ON "public"."Role"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "public"."Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "public"."RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_plantId_key" ON "public"."UserRole"("userId", "roleId", "plantId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_plantId_code_key" ON "public"."Warehouse"("plantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Bin_warehouseId_code_key" ON "public"."Bin"("warehouseId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_companyId_code_key" ON "public"."Supplier"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_companyId_code_key" ON "public"."Customer"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Material_companyId_code_key" ON "public"."Material"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_companyId_code_key" ON "public"."Product"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Bom_productId_version_key" ON "public"."Bom"("productId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_plantId_code_key" ON "public"."Machine"("plantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_plantId_code_key" ON "public"."Shift"("plantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionPlan_planNo_key" ON "public"."ProductionPlan"("planNo");

-- CreateIndex
CREATE INDEX "ProductionPlan_plantId_status_startDate_idx" ON "public"."ProductionPlan"("plantId", "status", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Rfq_rfqNo_key" ON "public"."Rfq"("rfqNo");

-- CreateIndex
CREATE INDEX "Rfq_plantId_status_dueDate_idx" ON "public"."Rfq"("plantId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierQuote_rfqId_supplierId_key" ON "public"."SupplierQuote"("rfqId", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequisition_prNo_key" ON "public"."PurchaseRequisition"("prNo");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNo_key" ON "public"."PurchaseOrder"("poNo");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_grnNo_key" ON "public"."GoodsReceipt"("grnNo");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLot_lotNo_key" ON "public"."InventoryLot"("lotNo");

-- CreateIndex
CREATE INDEX "InventoryMovement_lotId_createdAt_idx" ON "public"."InventoryMovement"("lotId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_orderNo_key" ON "public"."ProductionOrder"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_planLineId_key" ON "public"."ProductionOrder"("planLineId");

-- CreateIndex
CREATE INDEX "ProductionOrder_machineId_status_idx" ON "public"."ProductionOrder"("machineId", "status");

-- CreateIndex
CREATE INDEX "ProductionRun_productionOrderId_shiftId_startTime_idx" ON "public"."ProductionRun"("productionOrderId", "shiftId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "FinishedLot_lotNo_key" ON "public"."FinishedLot"("lotNo");

-- CreateIndex
CREATE INDEX "FinishedLot_productId_qcStatus_availableQtyKg_idx" ON "public"."FinishedLot"("productId", "qcStatus", "availableQtyKg");

-- CreateIndex
CREATE UNIQUE INDEX "DowntimeCode_code_key" ON "public"."DowntimeCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "QualitySample_sampleNo_key" ON "public"."QualitySample"("sampleNo");

-- CreateIndex
CREATE UNIQUE INDEX "SalesQuotation_quoteNo_key" ON "public"."SalesQuotation"("quoteNo");

-- CreateIndex
CREATE INDEX "SalesQuotation_customerId_status_validUntil_idx" ON "public"."SalesQuotation"("customerId", "status", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_orderNo_key" ON "public"."SalesOrder"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_quotationId_key" ON "public"."SalesOrder"("quotationId");

-- CreateIndex
CREATE INDEX "SalesOrder_customerId_status_orderDate_idx" ON "public"."SalesOrder"("customerId", "status", "orderDate");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_deliveryNo_key" ON "public"."Delivery"("deliveryNo");

-- CreateIndex
CREATE INDEX "PriceRule_companyId_productId_customerId_active_idx" ON "public"."PriceRule"("companyId", "productId", "customerId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "public"."Invoice"("invoiceNo");

-- CreateIndex
CREATE INDEX "Invoice_customerId_status_dueDate_idx" ON "public"."Invoice"("customerId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "MachineCapability_machineId_productId_key" ON "public"."MachineCapability"("machineId", "productId");

-- CreateIndex
CREATE INDEX "CostConfig_plantId_active_effectiveFrom_idx" ON "public"."CostConfig"("plantId", "active", "effectiveFrom");

-- CreateIndex
CREATE INDEX "MachineCostRate_machineId_active_effectiveFrom_idx" ON "public"."MachineCostRate"("machineId", "active", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenancePlan_machineId_taskCode_key" ON "public"."MaintenancePlan"("machineId", "taskCode");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceOrder_moNo_key" ON "public"."MaintenanceOrder"("moNo");

-- CreateIndex
CREATE INDEX "MaintenanceOrder_machineId_status_openedAt_idx" ON "public"."MaintenanceOrder"("machineId", "status", "openedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SparePart_companyId_code_key" ON "public"."SparePart"("companyId", "code");

-- CreateIndex
CREATE INDEX "SpareMovement_sparePartId_createdAt_idx" ON "public"."SpareMovement"("sparePartId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CostSnapshot_productionRunId_key" ON "public"."CostSnapshot"("productionRunId");

-- CreateIndex
CREATE INDEX "SupplierInvoice_companyId_status_dueDate_idx" ON "public"."SupplierInvoice"("companyId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInvoice_companyId_supplierId_invoiceNo_key" ON "public"."SupplierInvoice"("companyId", "supplierId", "invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "StockCount_countNo_key" ON "public"."StockCount"("countNo");

-- CreateIndex
CREATE INDEX "StockCount_plantId_warehouseId_status_createdAt_idx" ON "public"."StockCount"("plantId", "warehouseId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockCountLine_stockCountId_inventoryLotId_key" ON "public"."StockCountLine"("stockCountId", "inventoryLotId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_companyId_plantId_key_key" ON "public"."SystemSetting"("companyId", "plantId", "key");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "public"."AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "Alert_plantId_status_severity_createdAt_idx" ON "public"."Alert"("plantId", "status", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerCostAdjustment_customerId_occurredAt_idx" ON "public"."CustomerCostAdjustment"("customerId", "occurredAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_companyId_plantId_status_createdAt_idx" ON "public"."ApprovalRequest"("companyId", "plantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_entityType_entityId_approvalType_status_idx" ON "public"."ApprovalRequest"("entityType", "entityId", "approvalType", "status");

-- CreateIndex
CREATE INDEX "IntegrationEvent_status_createdAt_idx" ON "public"."IntegrationEvent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "IntegrationEvent_companyId_eventType_createdAt_idx" ON "public"."IntegrationEvent"("companyId", "eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Plant" ADD CONSTRAINT "Plant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Role" ADD CONSTRAINT "Role_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Warehouse" ADD CONSTRAINT "Warehouse_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bin" ADD CONSTRAINT "Bin_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bom" ADD CONSTRAINT "Bom_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BomItem" ADD CONSTRAINT "BomItem_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "public"."Bom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BomItem" ADD CONSTRAINT "BomItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Machine" ADD CONSTRAINT "Machine_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shift" ADD CONSTRAINT "Shift_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionPlan" ADD CONSTRAINT "ProductionPlan_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionPlanLine" ADD CONSTRAINT "ProductionPlanLine_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."ProductionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionPlanLine" ADD CONSTRAINT "ProductionPlanLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionPlanLine" ADD CONSTRAINT "ProductionPlanLine_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rfq" ADD CONSTRAINT "Rfq_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RfqLine" ADD CONSTRAINT "RfqLine_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "public"."Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RfqLine" ADD CONSTRAINT "RfqLine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierQuote" ADD CONSTRAINT "SupplierQuote_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "public"."Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierQuote" ADD CONSTRAINT "SupplierQuote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierQuoteLine" ADD CONSTRAINT "SupplierQuoteLine_supplierQuoteId_fkey" FOREIGN KEY ("supplierQuoteId") REFERENCES "public"."SupplierQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierQuoteLine" ADD CONSTRAINT "SupplierQuoteLine_rfqLineId_fkey" FOREIGN KEY ("rfqLineId") REFERENCES "public"."RfqLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseRequisitionLine" ADD CONSTRAINT "PurchaseRequisitionLine_prId_fkey" FOREIGN KEY ("prId") REFERENCES "public"."PurchaseRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseRequisitionLine" ADD CONSTRAINT "PurchaseRequisitionLine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseRequisitionLine" ADD CONSTRAINT "PurchaseRequisitionLine_suggestedSupplierId_fkey" FOREIGN KEY ("suggestedSupplierId") REFERENCES "public"."Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_poId_fkey" FOREIGN KEY ("poId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_sourcePrLineId_fkey" FOREIGN KEY ("sourcePrLineId") REFERENCES "public"."PurchaseRequisitionLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_poId_fkey" FOREIGN KEY ("poId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "public"."Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryLot" ADD CONSTRAINT "InventoryLot_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryLot" ADD CONSTRAINT "InventoryLot_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryLot" ADD CONSTRAINT "InventoryLot_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryLot" ADD CONSTRAINT "InventoryLot_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "public"."GoodsReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "public"."InventoryLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionOrder" ADD CONSTRAINT "ProductionOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionOrder" ADD CONSTRAINT "ProductionOrder_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionOrder" ADD CONSTRAINT "ProductionOrder_planLineId_fkey" FOREIGN KEY ("planLineId") REFERENCES "public"."ProductionPlanLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionRun" ADD CONSTRAINT "ProductionRun_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "public"."ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionRun" ADD CONSTRAINT "ProductionRun_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionRun" ADD CONSTRAINT "ProductionRun_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaterialIssue" ADD CONSTRAINT "MaterialIssue_productionRunId_fkey" FOREIGN KEY ("productionRunId") REFERENCES "public"."ProductionRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaterialIssue" ADD CONSTRAINT "MaterialIssue_inventoryLotId_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "public"."InventoryLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinishedLot" ADD CONSTRAINT "FinishedLot_productionRunId_fkey" FOREIGN KEY ("productionRunId") REFERENCES "public"."ProductionRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinishedLot" ADD CONSTRAINT "FinishedLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DowntimeEvent" ADD CONSTRAINT "DowntimeEvent_productionRunId_fkey" FOREIGN KEY ("productionRunId") REFERENCES "public"."ProductionRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DowntimeEvent" ADD CONSTRAINT "DowntimeEvent_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "public"."DowntimeCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QualitySpec" ADD CONSTRAINT "QualitySpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QualitySpec" ADD CONSTRAINT "QualitySpec_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QualitySample" ADD CONSTRAINT "QualitySample_finishedLotId_fkey" FOREIGN KEY ("finishedLotId") REFERENCES "public"."FinishedLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QualityTest" ADD CONSTRAINT "QualityTest_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "public"."QualitySample"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QualityTest" ADD CONSTRAINT "QualityTest_specId_fkey" FOREIGN KEY ("specId") REFERENCES "public"."QualitySpec"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalesQuotation" ADD CONSTRAINT "SalesQuotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalesQuotationLine" ADD CONSTRAINT "SalesQuotationLine_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "public"."SalesQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalesQuotationLine" ADD CONSTRAINT "SalesQuotationLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalesOrder" ADD CONSTRAINT "SalesOrder_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalesOrder" ADD CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalesOrder" ADD CONSTRAINT "SalesOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "public"."SalesQuotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalesOrderLine" ADD CONSTRAINT "SalesOrderLine_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "public"."SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalesOrderLine" ADD CONSTRAINT "SalesOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Allocation" ADD CONSTRAINT "Allocation_salesOrderLineId_fkey" FOREIGN KEY ("salesOrderLineId") REFERENCES "public"."SalesOrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Allocation" ADD CONSTRAINT "Allocation_finishedLotId_fkey" FOREIGN KEY ("finishedLotId") REFERENCES "public"."FinishedLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Delivery" ADD CONSTRAINT "Delivery_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "public"."SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryLine" ADD CONSTRAINT "DeliveryLine_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "public"."Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryLine" ADD CONSTRAINT "DeliveryLine_finishedLotId_fkey" FOREIGN KEY ("finishedLotId") REFERENCES "public"."FinishedLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceRule" ADD CONSTRAINT "PriceRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceRule" ADD CONSTRAINT "PriceRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceRule" ADD CONSTRAINT "PriceRule_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "public"."SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceLine" ADD CONSTRAINT "InvoiceLine_salesOrderLineId_fkey" FOREIGN KEY ("salesOrderLineId") REFERENCES "public"."SalesOrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Collection" ADD CONSTRAINT "Collection_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MachineCapability" ADD CONSTRAINT "MachineCapability_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MachineCapability" ADD CONSTRAINT "MachineCapability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CostConfig" ADD CONSTRAINT "CostConfig_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MachineCostRate" ADD CONSTRAINT "MachineCostRate_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaintenanceOrder" ADD CONSTRAINT "MaintenanceOrder_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SparePart" ADD CONSTRAINT "SparePart_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpareMovement" ADD CONSTRAINT "SpareMovement_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "public"."SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpareMovement" ADD CONSTRAINT "SpareMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaintenanceSpare" ADD CONSTRAINT "MaintenanceSpare_maintenanceOrderId_fkey" FOREIGN KEY ("maintenanceOrderId") REFERENCES "public"."MaintenanceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaintenanceSpare" ADD CONSTRAINT "MaintenanceSpare_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "public"."SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CostSnapshot" ADD CONSTRAINT "CostSnapshot_productionRunId_fkey" FOREIGN KEY ("productionRunId") REFERENCES "public"."ProductionRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierPayment" ADD CONSTRAINT "SupplierPayment_supplierInvoiceId_fkey" FOREIGN KEY ("supplierInvoiceId") REFERENCES "public"."SupplierInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierPayment" ADD CONSTRAINT "SupplierPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockCount" ADD CONSTRAINT "StockCount_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockCount" ADD CONSTRAINT "StockCount_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockCount" ADD CONSTRAINT "StockCount_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockCount" ADD CONSTRAINT "StockCount_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockCountLine" ADD CONSTRAINT "StockCountLine_stockCountId_fkey" FOREIGN KEY ("stockCountId") REFERENCES "public"."StockCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockCountLine" ADD CONSTRAINT "StockCountLine_inventoryLotId_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "public"."InventoryLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SystemSetting" ADD CONSTRAINT "SystemSetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SystemSetting" ADD CONSTRAINT "SystemSetting_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerCostAdjustment" ADD CONSTRAINT "CustomerCostAdjustment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerCostAdjustment" ADD CONSTRAINT "CustomerCostAdjustment_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "public"."SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerCostAdjustment" ADD CONSTRAINT "CustomerCostAdjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IntegrationEvent" ADD CONSTRAINT "IntegrationEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IntegrationEvent" ADD CONSTRAINT "IntegrationEvent_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
