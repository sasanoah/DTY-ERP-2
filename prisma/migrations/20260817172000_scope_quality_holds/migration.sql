ALTER TABLE "QualityHold"
ADD COLUMN "companyId" TEXT,
ADD COLUMN "plantId" TEXT;

UPDATE "QualityHold" AS hold
SET
  "companyId" = plant."companyId",
  "plantId" = warehouse."plantId"
FROM "InventoryLot" AS lot
JOIN "Warehouse" AS warehouse ON warehouse."id" = lot."warehouseId"
JOIN "Plant" AS plant ON plant."id" = warehouse."plantId"
WHERE hold."refType" = 'INVENTORY_LOT'
  AND hold."refId" = lot."id";

UPDATE "QualityHold" AS hold
SET
  "companyId" = plant."companyId",
  "plantId" = machine."plantId"
FROM "FinishedLot" AS lot
JOIN "ProductionRun" AS run ON run."id" = lot."productionRunId"
JOIN "ProductionOrder" AS production_order ON production_order."id" = run."productionOrderId"
JOIN "Machine" AS machine ON machine."id" = production_order."machineId"
JOIN "Plant" AS plant ON plant."id" = machine."plantId"
WHERE hold."refType" = 'FINISHED_LOT'
  AND hold."refId" = lot."id";

CREATE INDEX "QualityHold_companyId_plantId_status_idx"
ON "QualityHold"("companyId", "plantId", "status");
