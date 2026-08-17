import {z} from 'zod';
import {audit} from '@/lib/audit';
import {enqueueIntegrationEvent} from '@/lib/integrations';
import {prisma} from '@/lib/prisma';
import {apiError, requirePermission} from '@/lib/rbac';

const schema = z.object({decision: z.enum(['APPROVED', 'REJECTED']), note: z.string().optional()});

export async function POST(req: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const session = await requirePermission('approvals.decide');
    const {id} = await params;
    const body = schema.parse(await req.json());
    const approve = body.decision === 'APPROVED';
    const result = await prisma.$transaction(async (tx) => {
      const approval = await tx.approvalRequest.findFirst({
        where: {
          id,
          companyId: session.companyId,
          ...(session.plantId ? {OR: [{plantId: session.plantId}, {plantId: null}]} : {plantId: null}),
        },
      });
      if (!approval) throw Object.assign(new Error('طلب الاعتماد غير موجود'), {status: 404});
      if (approval.status !== 'PENDING') throw Object.assign(new Error('تم اتخاذ قرار على هذا الطلب بالفعل'), {status: 409});

      if (approve && approval.approvalType === 'PURCHASE_ORDER_APPROVAL') {
        const po = await tx.purchaseOrder.findFirst({
          where: {id: approval.entityId, plantId: session.plantId, supplier: {companyId: session.companyId}},
        });
        if (!po || po.status !== 'DRAFT') {
          throw Object.assign(new Error('أمر الشراء ليس في حالة قابلة للاعتماد'), {status: 409});
        }
      } else if (approve && approval.approvalType === 'CREDIT_OVERRIDE') {
        const order = await tx.salesOrder.findFirst({
          where: {id: approval.entityId, plantId: session.plantId, customer: {companyId: session.companyId}},
        });
        if (!order || order.status !== 'DRAFT' || order.creditStatus === 'OVERRIDE') {
          throw Object.assign(new Error('أمر البيع ليس في حالة قابلة للاستثناء'), {status: 409});
        }
      }

      if (approve && approval.approvalType === 'PURCHASE_ORDER_APPROVAL') {
        const updated = await tx.purchaseOrder.updateMany({
          where: {id: approval.entityId, plantId: session.plantId, status: 'DRAFT'},
          data: {status: 'APPROVED'},
        });
        if (updated.count !== 1) throw Object.assign(new Error('تم اعتماد أمر الشراء بالفعل'), {status: 409});
      } else if (approve && approval.approvalType === 'CREDIT_OVERRIDE') {
        const updated = await tx.salesOrder.updateMany({
          where: {id: approval.entityId, plantId: session.plantId, status: 'DRAFT', creditStatus: {not: 'OVERRIDE'}},
          data: {creditStatus: 'OVERRIDE'},
        });
        if (updated.count !== 1) throw Object.assign(new Error('تم اعتماد الاستثناء الائتماني بالفعل'), {status: 409});
      }

      const decidedAt = new Date();
      const claimed = await tx.approvalRequest.updateMany({
        where: {id, status: 'PENDING'},
        data: {
          status: body.decision,
          decidedById: session.userId,
          decisionNote: body.note || null,
          decidedAt,
        },
      });
      if (claimed.count !== 1) throw Object.assign(new Error('تم اتخاذ قرار على هذا الطلب بالفعل'), {status: 409});

      const updated = await tx.approvalRequest.findUniqueOrThrow({where: {id}});
      await audit(tx, {
        userId: session.userId,
        entityType: 'ApprovalRequest',
        entityId: id,
        action: approve ? 'APPROVE' : 'REJECT',
        before: {status: 'PENDING'},
        after: {status: updated.status},
      });
      await enqueueIntegrationEvent(tx, {
        companyId: session.companyId,
        plantId: approval.plantId,
        eventType: 'APPROVAL_DECIDED',
        payload: {
          approvalId: id,
          approvalType: approval.approvalType,
          entityType: approval.entityType,
          entityId: approval.entityId,
          decision: updated.status,
          note: updated.decisionNote,
        },
      });
      return updated;
    });
    return Response.json({ok: true, approval: result});
  } catch (error) {
    return apiError(error);
  }
}
