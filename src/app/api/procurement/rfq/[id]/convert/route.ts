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
      const supplier = await tx.supplier.findFirst({where: {id: quote.supplierId, companyId: session.companyId}});
      if (!supplier) throw Object.assign(new Error('المورد لا يخص الشركة'), {status: 400});

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
