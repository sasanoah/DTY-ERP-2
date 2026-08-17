type QualityDb = {
  inventoryLot: {
    findFirst(args: unknown): Promise<{id: string} | null>;
  };
  finishedLot: {
    findFirst(args: unknown): Promise<{id: string} | null>;
  };
};

function requirePlant(plantId?: string) {
  if (!plantId) throw Object.assign(new Error('PLANT_REQUIRED'), {status: 400});
  return plantId;
}

export function scopedQualityHoldWhere(companyId: string, sessionPlantId?: string) {
  const plantId = requirePlant(sessionPlantId);
  return {companyId, plantId};
}

export async function requireScopedQualityReference(
  db: QualityDb,
  refType: 'INVENTORY_LOT' | 'FINISHED_LOT',
  refId: string,
  companyId: string,
  sessionPlantId?: string,
) {
  const plantId = requirePlant(sessionPlantId);
  const found = refType === 'INVENTORY_LOT'
    ? await db.inventoryLot.findFirst({
        where: {id: refId, warehouse: {plantId}, material: {companyId}},
        select: {id: true},
      })
    : await db.finishedLot.findFirst({
        where: {
          id: refId,
          product: {companyId},
          productionRun: {productionOrder: {machine: {plantId}}},
        },
        select: {id: true},
      });
  if (!found) throw Object.assign(new Error('Lot الجودة غير موجود داخل المصنع'), {status: 404});
}
