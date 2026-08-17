import {audit} from '@/lib/audit';
import {prisma} from '@/lib/prisma';
import {apiError, requirePermission} from '@/lib/rbac';
import {stockCountSubmitSchema} from '@/lib/validators';

export async function POST(req: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const session = await requirePermission('inventory.count');
    const {id} = await params;
    const raw = await req.json();
    const action = String(raw.action || '');

    if (action === 'SUBMIT') {
      const data = stockCountSubmitSchema.parse(raw);
      const count = await prisma.$transaction(async (tx) => {
        const existing = await tx.stockCount.findFirst({
          where: {id, plantId: session.plantId},
          include: {lines: true},
        });
        if (!existing) throw Object.assign(new Error('الجرد غير موجود'), {status: 404});
        if (existing.status !== 'COUNTING') throw Object.assign(new Error('الجرد ليس في مرحلة العد'), {status: 409});
        const allowed = new Set(existing.lines.map((line) => line.id));
        const submitted = new Set(data.lines.map((line) => line.lineId));
        if (
          submitted.size !== data.lines.length ||
          submitted.size !== allowed.size ||
          data.lines.some((line) => !allowed.has(line.lineId))
        ) {
          throw Object.assign(new Error('يجب إدخال كل سطور الجرد مرة واحدة'), {status: 400});
        }
        const claimed = await tx.stockCount.updateMany({
          where: {id, plantId: session.plantId, status: 'COUNTING'},
          data: {status: 'SUBMITTED', countedAt: new Date()},
        });
        if (claimed.count !== 1) throw Object.assign(new Error('تم تقديم الجرد بالفعل'), {status: 409});
        for (const line of data.lines) {
          const original = existing.lines.find((candidate) => candidate.id === line.lineId)!;
          await tx.stockCountLine.update({
            where: {id: line.lineId},
            data: {
              countedQtyKg: line.countedQtyKg,
              varianceKg: {set: line.countedQtyKg - Number(original.systemQtyKg)},
              note: line.note,
            },
          });
        }
        await audit(tx, {userId: session.userId, entityType: 'StockCount', entityId: id, action: 'SUBMIT'});
        return tx.stockCount.findUniqueOrThrow({where: {id}});
      });
      return Response.json({ok: true, count});
    }

    if (action === 'APPROVE') {
      const count = await prisma.$transaction(async (tx) => {
        const existing = await tx.stockCount.findFirst({
          where: {id, plantId: session.plantId},
          include: {lines: true},
        });
        if (!existing) throw Object.assign(new Error('الجرد غير موجود'), {status: 404});
        if (existing.status !== 'SUBMITTED' || existing.lines.some((line) => line.countedQtyKg === null)) {
          throw Object.assign(new Error('الجرد غير مكتمل أو غير مقدم'), {status: 409});
        }
        const claimed = await tx.stockCount.updateMany({
          where: {id, plantId: session.plantId, status: 'SUBMITTED'},
          data: {status: 'APPROVED', approvedById: session.userId, approvedAt: new Date()},
        });
        if (claimed.count !== 1) throw Object.assign(new Error('تم اعتماد الجرد بالفعل'), {status: 409});
        await audit(tx, {userId: session.userId, entityType: 'StockCount', entityId: id, action: 'APPROVE'});
        return tx.stockCount.findUniqueOrThrow({where: {id}});
      });
      return Response.json({ok: true, count});
    }

    if (action === 'POST') {
      const count = await prisma.$transaction(async (tx) => {
        const existing = await tx.stockCount.findFirst({
          where: {id, plantId: session.plantId},
          include: {lines: {include: {inventoryLot: true}}},
        });
        if (!existing) throw Object.assign(new Error('الجرد غير موجود'), {status: 404});
        if (existing.status !== 'APPROVED') throw Object.assign(new Error('يجب اعتماد الجرد قبل الترحيل'), {status: 409});
        for (const line of existing.lines) {
          if (line.countedQtyKg === null) throw Object.assign(new Error('سطر غير معدود'), {status: 409});
        }
        const claimed = await tx.stockCount.updateMany({
          where: {id, plantId: session.plantId, status: 'APPROVED'},
          data: {status: 'POSTED', postedAt: new Date()},
        });
        if (claimed.count !== 1) throw Object.assign(new Error('تم ترحيل الجرد بالفعل'), {status: 409});
        for (const line of existing.lines) {
          const variance = Number(line.countedQtyKg) - Number(line.systemQtyKg);
          const posted = await tx.inventoryLot.updateMany({
            where: {id: line.inventoryLotId, availableQtyKg: line.systemQtyKg},
            data: {availableQtyKg: line.countedQtyKg!},
          });
          if (posted.count !== 1) {
            throw Object.assign(new Error(`تغير رصيد Lot ${line.inventoryLot.lotNo} بعد بدء الجرد — أعد الجرد`), {status: 409});
          }
          if (Math.abs(variance) > 0.001) {
            await tx.inventoryMovement.create({
              data: {
                lotId: line.inventoryLotId,
                movementType: 'ADJUST',
                qtyKg: variance,
                refType: 'STOCK_COUNT',
                refId: existing.id,
                userId: session.userId,
              },
            });
          }
        }
        await audit(tx, {userId: session.userId, entityType: 'StockCount', entityId: id, action: 'POST'});
        return tx.stockCount.findUniqueOrThrow({where: {id}});
      });
      return Response.json({ok: true, count});
    }

    throw Object.assign(new Error('ACTION_NOT_SUPPORTED'), {status: 400});
  } catch (error) {
    return apiError(error);
  }
}
