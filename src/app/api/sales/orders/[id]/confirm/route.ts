import {audit} from '@/lib/audit';
import {requestApproval} from '@/lib/approvals';
import {prisma} from '@/lib/prisma';
import {apiError, requirePermission} from '@/lib/rbac';
import {customerExposure} from '@/lib/sales';

export async function POST(_: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const session = await requirePermission('sales.confirm');
    if (!session.plantId) throw Object.assign(new Error('PLANT_REQUIRED'), {status: 400});
    const {id} = await params;
    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.salesOrder.updateMany({
        where: {id, plantId: session.plantId, status: 'DRAFT', customer: {companyId: session.companyId}},
        data: {status: 'DRAFT'},
      });
      if (locked.count !== 1) {
        const exists = await tx.salesOrder.findFirst({
          where: {id, plantId: session.plantId, customer: {companyId: session.companyId}},
        });
        if (!exists) throw Object.assign(new Error('أمر البيع غير موجود داخل المصنع'), {status: 404});
        throw Object.assign(new Error('يمكن تأكيد المسودة فقط'), {status: 409});
      }
      const order = await tx.salesOrder.findUniqueOrThrow({
        where: {id},
        include: {customer: true, lines: true},
      });
      const exposure = await customerExposure(order.customerId, order.id);
      const value = order.lines.reduce(
        (total, line) => total + Number(line.qtyKg) * Number(line.unitPrice), 0,
      );
      if (
        order.creditStatus !== 'OVERRIDE' &&
        (order.customer.blocked || exposure.total + value > Number(order.customer.creditLimit))
      ) {
        await tx.salesOrder.update({where: {id}, data: {creditStatus: 'BLOCKED'}});
        const approval = await requestApproval(tx, {
          companyId: session.companyId,
          plantId: session.plantId,
          entityType: 'SalesOrder',
          entityId: id,
          approvalType: 'CREDIT_OVERRIDE',
          requestedById: session.userId,
          reason: `${order.orderNo} — Exposure ${(exposure.total + value).toLocaleString('en-US')} / Limit ${Number(order.customer.creditLimit).toLocaleString('en-US')}`,
        });
        return {
          blocked: true as const,
          approvalId: approval.id,
          credit: {limit: Number(order.customer.creditLimit), exposure: exposure.total + value},
        };
      }
      const updated = await tx.salesOrder.update({
        where: {id},
        data: {creditStatus: order.creditStatus === 'OVERRIDE' ? 'OVERRIDE' : 'APPROVED', status: 'CONFIRMED'},
      });
      await audit(tx, {
        userId: session.userId,
        entityType: 'SalesOrder',
        entityId: id,
        action: 'CONFIRM',
        before: {status: order.status},
        after: {status: updated.status},
      });
      return {blocked: false as const, order: updated};
    });
    if (result.blocked) {
      return Response.json({
        ok: false,
        error: 'Credit Block — تم إرسال طلب اعتماد للإدارة',
        credit: result.credit,
        approvalId: result.approvalId,
      }, {status: 409});
    }
    return Response.json({ok: true, order: result.order});
  } catch (error) {
    return apiError(error);
  }
}
