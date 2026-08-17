import {randomUUID} from 'node:crypto';
import {prisma} from './prisma';

function yearPrefix(kind: string) {
  return `${kind}-${String(new Date().getFullYear()).slice(-2)}-`;
}

async function nextNumber(kind: string, width: number) {
  const prefix = yearPrefix(kind);
  const sequence = await prisma.documentSequence.upsert({
    where: {key: prefix},
    update: {value: {increment: 1}},
    create: {key: prefix, value: 1},
  });
  return `${prefix}${String(sequence.value).padStart(width, '0')}`;
}

export function nextProductionOrderNo() { return nextNumber('PRD', 6); }
export function nextPurchaseRequisitionNo() { return nextNumber('PR', 6); }
export function nextPurchaseOrderNo() { return nextNumber('PO', 6); }
export function nextGrnNo() { return nextNumber('GRN', 6); }
export function nextSalesOrderNo() { return nextNumber('SO', 6); }
export function nextDeliveryNo() { return nextNumber('DLV', 6); }
export function nextInvoiceNo() { return nextNumber('INV', 6); }
export function nextMaintenanceOrderNo() { return nextNumber('MO', 6); }
export function nextStockCountNo() { return nextNumber('CNT', 6); }
export function nextProductionPlanNo() { return nextNumber('PLAN', 5); }
export function nextRfqNo() { return nextNumber('RFQ', 5); }
export function nextSalesQuotationNo() { return nextNumber('QT', 5); }

export function finishedLotNo(productCode: string, machineCode: string) {
  const date = new Date();
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sku = productCode.match(/DTY-(\d+)-(\d+)/)?.slice(1).join('') || 'DTY';
  const machine = machineCode.replace(/\D/g, '').slice(-2) || '01';
  const unique = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
  return `${sku}-${year}${month}${day}-${machine}-${unique}`;
}
