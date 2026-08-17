import {audit} from '@/lib/audit';
import {nextPurchaseOrderNo} from '@/lib/document-number';
import {prisma} from '@/lib/prisma';
import {apiError, requirePermission} from '@/lib/rbac';

export async function POST(req: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const session = await requirePermission('procurement.po');
    const {id} = await params;
    const {supplierQuoteId} = await req.json();
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      const rfq = await tx.rfq.findFirst({where: {id, plantId: session.plantId}, include: {lines: true}});
      if (!rfq) throw Object.assign(new Error('RFQ غير موجود'), {status: 404});
      if (rfq.status !== 'SENT') throw Object.assign(new Error('تم تحويل RFQ أو أنه غير قابل للتحويل'), {status: 409});

      const quote = await tx.supplierQuote.findUnique({
        where: {id: String(supplierQuoteId)},
        include: {lines: {include: {rfqLine: true}}},
      });
      if (!quote || quote.rfqId !== rfq.id) throw Object.assign(new Error('عرض المورد غير صحيح'), {status: 400});
      if (quote.status !== 'SUBMITTED') throw Object.assign(new Error('عرض المورد غير قابل للاختيار'), {status: 409});
      const today = new Date(); today.setUTCHours(0, 0, 0, 0);
      if (quote.validUntil && quote.validUntil.getTime() < today.getTime()) throw Object.assign(new Error('انتهت صلاحية عرض المورد'), {status: 409});
      const quotedLineIds = new Set(quote.lines.map((line) => line.rfqLineId));
      if (quotedLineIds.size !== quote.lines.length || quotedLineIds.size !== rfq.lines.length || rfq.lines.some((line) => !quotedLineIds.has(line.id))) {
        throw Object.assign(new Error('عرض المورد لا يغطي كل سطور RFQ'), {status: 409});
      }
      const supplier = await tx.supplier.findFirst({where: {id: quote.supplierId, companyId: session.companyId, qualityStatus: 'APPROVED'}});
      if (!supplier) throw Object.assign(new Error('المورد لا يخص الشركة أو لم يعد معتمدًا'), {status: 400});

      const claimed = await tx.rfq.updateMany({
        where: {id: rfq.id, plantId: session.plantId, status: 'SENT'},
        data: {status: 'CONVERTED'},
      });
      if (claimed.count !== 1) throw Object.assign(new Error('تم تحويل RFQ بالفعل'), {status: 409});

      const poNo = await nextPurchaseOrderNo(tx);
      const order = await tx.purchaseOrder.create({
        data: {
          plantId: rfq.plantId,
          supplierId: quote.supplierId,
          poNo,
          currency: quote.currency,
          exchangeRate: quote.exchangeRate,
          paymentTermsDays: quote.paymentTermsDays,
          status: 'DRAFT',
          lines: {create: quote.lines.map((line) => ({
            materialId: line.rfqLine.materialId,
            qtyKg: line.rfqLine.qtyKg,
            unitPrice: line.unitPrice,
          }))},
        },
      });
      await tx.supplierQuote.updateMany({where: {rfqId: rfq.id, id: {not: quote.id}, status: 'SUBMITTED'}, data: {status: 'REJECTED'}});
      await tx.supplierQuote.update({where: {id: quote.id}, data: {status: 'ACCEPTED'}});
      await audit(tx, {
        userId: session.userId,
        entityType: 'RFQ',
        entityId: rfq.id,
        action: 'CONVERT_TO_PO',
        after: {poNo, supplierQuoteId: quote.id},
      });
      return order;
    });
    return Response.json({ok: true, purchaseOrder}, {status: 201});
  } catch (error) {
    return apiError(error);
  }
}
