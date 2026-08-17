ALTER TYPE "IntegrationEventStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';

ALTER TABLE "IntegrationEvent"
ADD COLUMN "lockedAt" TIMESTAMP(3);

CREATE INDEX "IntegrationEvent_status_lockedAt_createdAt_idx"
ON "IntegrationEvent"("status", "lockedAt", "createdAt");

CREATE TABLE "DocumentSequence" (
  "key" TEXT NOT NULL,
  "value" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("key")
);

WITH existing_numbers AS (
  SELECT regexp_replace("orderNo", '[0-9]+$', '') AS key, substring("orderNo" FROM '([0-9]+)$')::integer AS value FROM "ProductionOrder"
  UNION ALL SELECT regexp_replace("prNo", '[0-9]+$', ''), substring("prNo" FROM '([0-9]+)$')::integer FROM "PurchaseRequisition"
  UNION ALL SELECT regexp_replace("poNo", '[0-9]+$', ''), substring("poNo" FROM '([0-9]+)$')::integer FROM "PurchaseOrder"
  UNION ALL SELECT regexp_replace("grnNo", '[0-9]+$', ''), substring("grnNo" FROM '([0-9]+)$')::integer FROM "GoodsReceipt"
  UNION ALL SELECT regexp_replace("orderNo", '[0-9]+$', ''), substring("orderNo" FROM '([0-9]+)$')::integer FROM "SalesOrder"
  UNION ALL SELECT regexp_replace("deliveryNo", '[0-9]+$', ''), substring("deliveryNo" FROM '([0-9]+)$')::integer FROM "Delivery"
  UNION ALL SELECT regexp_replace("invoiceNo", '[0-9]+$', ''), substring("invoiceNo" FROM '([0-9]+)$')::integer FROM "Invoice"
  UNION ALL SELECT regexp_replace("moNo", '[0-9]+$', ''), substring("moNo" FROM '([0-9]+)$')::integer FROM "MaintenanceOrder"
  UNION ALL SELECT regexp_replace("countNo", '[0-9]+$', ''), substring("countNo" FROM '([0-9]+)$')::integer FROM "StockCount"
  UNION ALL SELECT regexp_replace("planNo", '[0-9]+$', ''), substring("planNo" FROM '([0-9]+)$')::integer FROM "ProductionPlan"
  UNION ALL SELECT regexp_replace("rfqNo", '[0-9]+$', ''), substring("rfqNo" FROM '([0-9]+)$')::integer FROM "Rfq"
  UNION ALL SELECT regexp_replace("quoteNo", '[0-9]+$', ''), substring("quoteNo" FROM '([0-9]+)$')::integer FROM "SalesQuotation"
)
INSERT INTO "DocumentSequence" ("key", "value", "updatedAt")
SELECT key, MAX(value), CURRENT_TIMESTAMP
FROM existing_numbers
WHERE key IS NOT NULL AND value IS NOT NULL
GROUP BY key;
