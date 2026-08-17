import {audit} from '@/lib/audit';
import {prisma} from '@/lib/prisma';
import {apiError, requirePermission} from '@/lib/rbac';

export async function POST(_: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const session = await requirePermission('sales.credit.override');
    if (!session.plantId) throw Object.assign(new Error('PLANT_REQUIRED'), {status: 400});
    const {id} = await params;
    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.salesOrder.findFirst({
        where: {id, plantId: session.plantId, customer: {companyId: session.companyId}},
      });
      if (!existing) throw Object.assign(new Error('أمر البيع غير موجود داخل المصنع'), {status: 404});
      if (existing.status !== 'DRAFT' || existing.creditStatus === 'OVERRIDE') {
        throw Object.assign(new Error('الاستثناء الائتماني متاح للمسودة غير المعتمدة فقط'), {status: 409});
      }

      const claimed = await tx.salesOrder.updateMany({
        where: {id, plantId: session.plantId, status: 'DRAFT', creditStatus: {not: 'OVERRIDE'}},
        data: {creditStatus: 'OVERRIDE'},
      });
      if (claimed.count !== 1) {
        throw Object.assign(new Error('تم اعتماد الاستثناء الائتماني بالفعل'), {status: 409});
      }
      await tx.approvalRequest.updateMany({
        where: {
          companyId: session.companyId,
          plantId: session.plantId,
          entityType: 'SalesOrder',
          entityId: id,
          approvalType: 'CREDIT_OVERRIDE',
          status: 'PENDING',
        },
        data: {
          status: 'APPROVED',
          decidedById: session.userId,
          decidedAt: new Date(),
          decisionNote: 'استثناء مباشر من الإدارة',
        },
      });
      const updated = await tx.salesOrder.findUniqueOrThrow({where: {id}});
      await audit(tx, {
        userId: session.userId,
        entityType: 'SalesOrder',
        entityId: id,
        action: 'CREDIT_OVERRIDE',
        before: {creditStatus: existing.creditStatus},
        after: {creditStatus: 'OVERRIDE'},
      });
      return updated;
    });
    return Response.json({ok: true, order});
  } catch (error) {
    return apiError(error);
  }
}
