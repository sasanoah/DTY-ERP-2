import {audit} from '@/lib/audit';
import {prisma} from '@/lib/prisma';
import {apiError, requirePermission} from '@/lib/rbac';
import {maintenanceCompleteSchema} from '@/lib/validators';

export async function POST(req: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const session = await requirePermission('maintenance.close');
    const {id} = await params;
    const data = maintenanceCompleteSchema.parse(await req.json());
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.maintenanceOrder.findUnique({where: {id}, include: {machine: true}});
      if (!order || order.machine.plantId !== session.plantId) {
        throw Object.assign(new Error('أمر الصيانة غير موجود'), {status: 404});
      }
      const completedAt = new Date();
      const claimed = await tx.maintenanceOrder.updateMany({
        where: {id, status: {in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'TESTING']}},
        data: {
          status: 'CLOSED',
          startedAt: order.startedAt || order.openedAt,
          completedAt,
          rootCause: data.rootCause,
          laborHours: data.laborHours,
          externalCost: data.externalCost,
        },
      });
      if (claimed.count !== 1) throw Object.assign(new Error('أمر الصيانة مغلق أو ملغي بالفعل'), {status: 409});

      for (const item of data.spares) {
        const spare = await tx.sparePart.findFirst({where: {id: item.sparePartId, companyId: session.companyId}});
        if (!spare) throw Object.assign(new Error('قطعة الغيار غير موجودة'), {status: 404});
        const reserved = await tx.sparePart.updateMany({
          where: {id: spare.id, stockQty: {gte: item.qty}},
          data: {stockQty: {decrement: item.qty}},
        });
        if (reserved.count !== 1) {
          throw Object.assign(new Error(`رصيد قطعة الغيار ${spare.nameAr} غير كافٍ`), {status: 409});
        }
        await tx.maintenanceSpare.create({
          data: {
            maintenanceOrderId: id,
            sparePartId: spare.id,
            qty: item.qty,
            costEgp: Number(spare.unitCostEgp) * item.qty,
          },
        });
        await tx.spareMovement.create({
          data: {
            sparePartId: spare.id,
            type: 'ISSUE',
            qty: item.qty,
            userId: session.userId,
            refType: 'MAINTENANCE_ORDER',
            refId: id,
          },
        });
      }
      await tx.machine.update({where: {id: order.machineId}, data: {status: 'RUN'}});
      const closed = await tx.maintenanceOrder.findUniqueOrThrow({where: {id}});
      await audit(tx, {
        userId: session.userId,
        entityType: 'MaintenanceOrder',
        entityId: id,
        action: 'CLOSE',
        after: {...data, status: 'CLOSED'},
      });
      return closed;
    });
    return Response.json({ok: true, order: result});
  } catch (error) {
    return apiError(error);
  }
}
