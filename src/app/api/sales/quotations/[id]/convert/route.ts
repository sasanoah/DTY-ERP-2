import {creditDecision} from '@/domain/business-rules';
import {audit} from '@/lib/audit';
import {nextSalesOrderNo} from '@/lib/document-number';
import {prisma} from '@/lib/prisma';
import {apiError, requirePermission} from '@/lib/rbac';
import {customerExposure} from '@/lib/sales';

export async function POST(_: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const session = await requirePermission('sales.order');
    if (!session.plantId) throw Object.assign(new Error('PLANT_REQUIRED'), {status: 400});
    const plantId = session.plantId;
    const {id} = await params;
    const salesOrder = await prisma.$transaction(async (tx) => {
      const quotation = await tx.salesQuotation.findUnique({
        where: {id},
        include: {customer: true, lines: true, salesOrder: true},
      });
      if (!quotation || quotation.customer.companyId !== session.companyId) {
        throw Object.assign(new Error('عرض السعر غير موجود'), {status: 404});
      }
      if (quotation.salesOrder || quotation.status !== 'SENT') {
        throw Object.assign(new Error('تم تحويل العرض أو أنه غير قابل للتحويل'), {status: 409});
      }
      if (quotation.validUntil < new Date()) throw Object.assign(new Error('عرض السعر منتهي الصلاحية'), {status: 409});

      const claimed = await tx.salesQuotation.updateMany({
        where: {id, status: 'SENT'},
        data: {status: 'CONVERTED'},
      });
      if (claimed.count !== 1) throw Object.assign(new Error('تم تحويل العرض سابقًا'), {status: 409});

      const value = quotation.lines.reduce((total, line) => total + Number(line.qtyKg) * Number(line.unitPrice), 0);
      const exposure = await customerExposure(quotation.customerId);
      const decision = creditDecision(
        Number(quotation.customer.creditLimit), exposure.total, value, quotation.customer.blocked,
      );
      const orderNo = await nextSalesOrderNo(tx);
      const order = await tx.salesOrder.create({
        data: {
          plantId,
          customerId: quotation.customerId,
          orderNo,
          currency: quotation.currency,
          paymentTermsDays: quotation.paymentTermsDays,
          creditStatus: decision.allowed ? 'APPROVED' : 'BLOCKED',
          status: 'DRAFT',
          quotationId: quotation.id,
          lines: {create: quotation.lines.map((line) => ({
            productId: line.productId,
            qtyKg: line.qtyKg,
            unitPrice: line.unitPrice,
            requiredDate: line.requiredDate,
          }))},
        },
      });
      await audit(tx, {
        userId: session.userId,
        entityType: 'SalesQuotation',
        entityId: quotation.id,
        action: 'CONVERT_TO_SO',
        after: {orderNo, creditStatus: order.creditStatus},
      });
      return order;
    });
    return Response.json({ok: true, salesOrder}, {status: 201});
  } catch (error) {
    return apiError(error);
  }
}
