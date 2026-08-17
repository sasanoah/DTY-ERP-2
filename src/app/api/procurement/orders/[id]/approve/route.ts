import {audit} from '@/lib/audit';
import {prisma} from '@/lib/prisma';
import {apiError, requirePermission} from '@/lib/rbac';

export async function POST(_: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const session = await requirePermission('procurement.approve');
    if (!session.plantId) throw Object.assign(new Error('PLANT_REQUIRED'), {status: 400});
    const {id} = await params;
    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findFirst({
        where: {id, plantId: session.plantId, supplier: {companyId: session.companyId}},
      });
      if (!existing) throw Object.assign(new Error('أمر الشراء غير موجود داخل المصنع'), {status: 404});
      if (existing.status !== 'DRAFT') throw Object.assign(new Error('يمكن اعتماد أمر الشراء المسودة فقط'), {status: 409});

      const claimed = await tx.purchaseOrder.updateMany({
        where: {id, plantId: session.plantId, status: 'DRAFT'},
        data: {status: 'APPROVED'},
      });
      if (claimed.count !== 1) throw Object.assign(new Error('تم اعتماد أمر الشراء بالفعل'), {status: 409});
      await tx.approvalRequest.updateMany({
        where: {
          companyId: session.companyId,
          plantId: session.plantId,
          entityType: 'PurchaseOrder',
          entityId: id,
          approvalType: 'PURCHASE_ORDER_APPROVAL',
          status: 'PENDING',
        },
        data: {
          status: 'APPROVED',
          decidedById: session.userId,
          decidedAt: new Date(),
          decisionNote: 'اعتماد مباشر من شاشة المشتريات',
        },
      });
      const updated = await tx.purchaseOrder.findUniqueOrThrow({where: {id}});
      await audit(tx, {
        userId: session.userId,
        entityType: 'PurchaseOrder',
        entityId: id,
        action: 'APPROVE',
        before: {status: 'DRAFT'},
        after: {status: 'APPROVED'},
      });
      return updated;
    });
    return Response.json({ok: true, order});
  } catch (error) {
    return apiError(error);
  }
}
