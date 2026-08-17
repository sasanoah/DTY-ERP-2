import {randomUUID} from 'node:crypto';
import type {Prisma, PrismaClient} from '@prisma/client';
import {prisma} from './prisma';

type DB = Prisma.TransactionClient | PrismaClient;

function yearPrefix(kind: string) {
  return `${kind}-${String(new Date().getFullYear()).slice(-2)}-`;
}

async function nextNumber(db: DB, kind: string, width: number) {
  const prefix = yearPrefix(kind);
  const sequence = await db.documentSequence.upsert({
    where: {key: prefix},
    update: {value: {increment: 1}},
    create: {key: prefix, value: 1},
  });
  return `${prefix}${String(sequence.value).padStart(width, '0')}`;
}

export function nextProductionOrderNo(db: DB = prisma) { return nextNumber(db, 'PRD', 6); }
export function nextPurchaseRequisitionNo(db: DB = prisma) { return nextNumber(db, 'PR', 6); }
export function nextPurchaseOrderNo(db: DB = prisma) { return nextNumber(db, 'PO', 6); }
export function nextGrnNo(db: DB = prisma) { return nextNumber(db, 'GRN', 6); }
export function nextSalesOrderNo(db: DB = prisma) { return nextNumber(db, 'SO', 6); }
export function nextDeliveryNo(db: DB = prisma) { return nextNumber(db, 'DLV', 6); }
export function nextInvoiceNo(db: DB = prisma) { return nextNumber(db, 'INV', 6); }
export function nextMaintenanceOrderNo(db: DB = prisma) { return nextNumber(db, 'MO', 6); }
export function nextStockCountNo(db: DB = prisma) { return nextNumber(db, 'CNT', 6); }
export function nextProductionPlanNo(db: DB = prisma) { return nextNumber(db, 'PLAN', 5); }
export function nextRfqNo(db: DB = prisma) { return nextNumber(db, 'RFQ', 5); }
export function nextSalesQuotationNo(db: DB = prisma) { return nextNumber(db, 'QT', 5); }

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
