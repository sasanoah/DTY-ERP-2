import {audit} from '@/lib/audit';
import {prisma} from '@/lib/prisma';
import {apiError, requirePermission} from '@/lib/rbac';
import {supplierQuoteSchema} from '@/lib/validators';

export async function POST(req: Request) {
  try {
    const session = await requirePermission('procurement.rfq');
    const data = supplierQuoteSchema.parse(await req.json());
    const quote = await prisma.$transaction(async (tx) => {
      const rfq = await tx.rfq.findFirst({
        where: {id: data.rfqId, plantId: session.plantId},
        include: {lines: true},
      });
      if (!rfq) throw Object.assign(new Error('RFQ غير موجود'), {status: 404});
      if (rfq.status !== 'SENT') throw Object.assign(new Error('لا يمكن تعديل عرض بعد تحويل RFQ'), {status: 409});
      const supplier = await tx.supplier.findFirst({
        where: {id: data.supplierId, companyId: session.companyId},
      });
      if (!supplier) throw Object.assign(new Error('المورد غير موجود'), {status: 404});
      const validLines = new Set(rfq.lines.map((line) => line.id));
      if (data.lines.some((line) => !validLines.has(line.rfqLineId))) {
        throw Object.assign(new Error('سطر RFQ غير صحيح'), {status: 400});
      }

      // A no-op conditional update takes the same row lock used by conversion.
      const writable = await tx.rfq.updateMany({
        where: {id: rfq.id, plantId: session.plantId, status: 'SENT'},
        data: {status: 'SENT'},
      });
      if (writable.count !== 1) throw Object.assign(new Error('تم تحويل RFQ أثناء تعديل العرض'), {status: 409});

      const updated = await tx.supplierQuote.upsert({
        where: {rfqId_supplierId: {rfqId: rfq.id, supplierId: supplier.id}},
        update: {
          currency: data.currency,
          exchangeRate: data.exchangeRate,
          validUntil: data.validUntil,
          paymentTermsDays: data.paymentTermsDays,
          status: 'SUBMITTED',
          lines: {deleteMany: {}, create: data.lines},
        },
        create: {
          rfqId: rfq.id,
          supplierId: supplier.id,
          currency: data.currency,
          exchangeRate: data.exchangeRate,
          validUntil: data.validUntil,
          paymentTermsDays: data.paymentTermsDays,
          status: 'SUBMITTED',
          lines: {create: data.lines},
        },
        include: {supplier: true, lines: true},
      });
      await audit(tx, {
        userId: session.userId,
        entityType: 'SupplierQuote',
        entityId: updated.id,
        action: 'UPSERT',
        after: {supplier: supplier.code},
      });
      return updated;
    });
    return Response.json({ok: true, quote});
  } catch (error) {
    return apiError(error);
  }
}
