-- V0.6 additive migration assuming the V0.5 schema already exists.
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING','APPROVED','REJECTED','CANCELLED');
CREATE TYPE "IntegrationEventStatus" AS ENUM ('PENDING','SENT','FAILED');
CREATE TYPE "CustomerCostType" AS ENUM ('FREIGHT','CLAIM','DISCOUNT','RETURN','OTHER');

CREATE TABLE "CustomerCostAdjustment" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "salesOrderId" TEXT,
  "type" "CustomerCostType" NOT NULL,
  "amountEgp" DECIMAL(18,2) NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerCostAdjustment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CustomerCostAdjustment_customerId_occurredAt_idx" ON "CustomerCostAdjustment"("customerId","occurredAt");
ALTER TABLE "CustomerCostAdjustment" ADD CONSTRAINT "CustomerCostAdjustment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerCostAdjustment" ADD CONSTRAINT "CustomerCostAdjustment_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerCostAdjustment" ADD CONSTRAINT "CustomerCostAdjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ApprovalRequest" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "plantId" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "approvalType" TEXT NOT NULL,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "reason" TEXT,
  "requestedById" TEXT NOT NULL,
  "decidedById" TEXT,
  "decisionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ApprovalRequest_companyId_plantId_status_createdAt_idx" ON "ApprovalRequest"("companyId","plantId","status","createdAt");
CREATE INDEX "ApprovalRequest_entityType_entityId_approvalType_status_idx" ON "ApprovalRequest"("entityType","entityId","approvalType","status");
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "IntegrationEvent" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "plantId" TEXT,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "IntegrationEventStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "IntegrationEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "IntegrationEvent_status_createdAt_idx" ON "IntegrationEvent"("status","createdAt");
CREATE INDEX "IntegrationEvent_companyId_eventType_createdAt_idx" ON "IntegrationEvent"("companyId","eventType","createdAt");
ALTER TABLE "IntegrationEvent" ADD CONSTRAINT "IntegrationEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IntegrationEvent" ADD CONSTRAINT "IntegrationEvent_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
