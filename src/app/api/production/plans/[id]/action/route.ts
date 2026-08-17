import {audit} from '@/lib/audit';
import {nextProductionOrderNo} from '@/lib/document-number';
import {prisma} from '@/lib/prisma';
import {apiError, requirePermission} from '@/lib/rbac';

export async function POST(req: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const session = await requirePermission('production.plan');
    const {id} = await params;
    const {action} = await req.json();

    if (action === 'APPROVE') {
      const plan = await prisma.$transaction(async (tx) => {
        const claimed = await tx.productionPlan.updateMany({
          where: {id, plantId: session.plantId, status: 'SUBMITTED'},
          data: {status: 'APPROVED'},
        });
        if (claimed.count !== 1) {
          const exists = await tx.productionPlan.findFirst({where: {id, plantId: session.plantId}});
          if (!exists) throw Object.assign(new Error('الخطة غير موجودة'), {status: 404});
          throw Object.assign(new Error('الخطة ليست مقدمة للاعتماد'), {status: 409});
        }
        const updated = await tx.productionPlan.findUniqueOrThrow({where: {id}});
        await audit(tx, {userId: session.userId, entityType: 'ProductionPlan', entityId: id, action: 'APPROVE'});
        return updated;
      });
      return Response.json({ok: true, plan});
    }

    if (action === 'CONVERT') {
      const orders = await prisma.$transaction(async (tx) => {
        const claimed = await tx.productionPlan.updateMany({
          where: {id, plantId: session.plantId, status: 'APPROVED'},
          data: {status: 'CONVERTED'},
        });
        if (claimed.count !== 1) {
          const exists = await tx.productionPlan.findFirst({where: {id, plantId: session.plantId}});
          if (!exists) throw Object.assign(new Error('الخطة غير موجودة'), {status: 404});
          throw Object.assign(new Error('تم تحويل الخطة أو أنها غير معتمدة'), {status: 409});
        }

        const plan = await tx.productionPlan.findUniqueOrThrow({
          where: {id},
          include: {lines: {include: {productionOrder: true}}},
        });
        const created = [];
        for (const line of plan.lines) {
          if (line.productionOrder) continue;
          const orderNo = await nextProductionOrderNo(tx);
          const order = await tx.productionOrder.create({
            data: {
              orderNo,
              productId: line.productId,
              machineId: line.machineId,
              plannedQtyKg: line.plannedQtyKg,
              plannedStart: line.plannedStart,
              plannedEnd: line.plannedEnd,
              priority: line.priority,
              status: 'DRAFT',
              planLineId: line.id,
            },
          });
          created.push(order);
        }
        await audit(tx, {
          userId: session.userId,
          entityType: 'ProductionPlan',
          entityId: id,
          action: 'CONVERT',
          after: {orders: created.map((order) => order.orderNo)},
        });
        return created;
      });
      return Response.json({ok: true, orders});
    }

    throw Object.assign(new Error('ACTION_NOT_SUPPORTED'), {status: 400});
  } catch (error) {
    return apiError(error);
  }
}
