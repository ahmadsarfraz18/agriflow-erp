import { db } from '@/db';
import {
  products,
  batches,
  stockTransactions,
  dealers,
  invoices,
  invoiceItems,
  cashRecoveryPayments,
} from '@/db/schema';
import { eq, and, lte, gte, desc, sql, SQLWrapper } from 'drizzle-orm';

// ─── Products ────────────────────────────────────────────────────────────────

export async function findProducts() {
  return db.select().from(products);
}

export async function findProductById(id: string) {
  return db.select().from(products).where(eq(products.id, id)).then(r => r[0] ?? null);
}

export async function insertProduct(data: typeof products.$inferInsert) {
  return db.insert(products).values(data).returning();
}

export async function updateProduct(id: string, data: Partial<typeof products.$inferInsert>) {
  return db.update(products).set(data).where(eq(products.id, id)).returning();
}

export async function deleteProduct(id: string) {
  return db.delete(products).where(eq(products.id, id)).returning();
}

// ─── Batches ─────────────────────────────────────────────────────────────────

export async function findBatches() {
  return db.select().from(batches);
}

export async function findBatchById(id: string) {
  return db.select().from(batches).where(eq(batches.id, id)).then(r => r[0] ?? null);
}

export async function findBatchesByProductId(productId: string) {
  return db.select().from(batches).where(eq(batches.productId, productId));
}

export async function findActiveBatchesByProduct(productId: string) {
  return db.select().from(batches).where(
    and(eq(batches.productId, productId), eq(batches.status, 'ACTIVE'))
  ).orderBy(batches.expiryDate);
}

export async function findExpiringBatches(withinDays: number = 60) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + withinDays);
  return db.select().from(batches).where(
    and(eq(batches.status, 'ACTIVE'), lte(batches.expiryDate, threshold.toISOString().split('T')[0]))
  );
}

export async function insertBatch(data: typeof batches.$inferInsert) {
  return db.insert(batches).values(data).returning();
}

export async function updateBatch(id: string, data: Partial<typeof batches.$inferInsert>) {
  return db.update(batches).set(data).where(eq(batches.id, id)).returning();
}

export async function deleteBatch(id: string) {
  return db.delete(batches).where(eq(batches.id, id)).returning();
}

export async function adjustBatchStock(batchId: string, quantityChange: number) {
  const batch = await findBatchById(batchId);
  if (!batch) throw new Error('Batch not found');
  const newQty = batch.quantityCurrent + quantityChange;
  if (newQty < 0) throw new Error('Insufficient stock');
  return db.update(batches).set({ quantityCurrent: newQty }).where(eq(batches.id, batchId)).returning();
}

export async function fifoDeduct(productId: string, quantityNeeded: number) {
  const activeBatches = await findActiveBatchesByProduct(productId);
  let remaining = quantityNeeded;
  const deductions: { batchId: string; quantity: number }[] = [];

  for (const batch of activeBatches) {
    if (remaining <= 0) break;
    const qty = Math.min(batch.quantityCurrent, remaining);
    deductions.push({ batchId: batch.id, quantity: qty });
    remaining -= qty;
  }
  if (remaining > 0) throw new Error('Insufficient stock across all batches');

  for (const d of deductions) {
    await adjustBatchStock(d.batchId, -d.quantity);
  }
  return deductions;
}

// ─── Stock Transactions ──────────────────────────────────────────────────────

export async function findStockTransactions(filters?: { productId?: string; batchId?: string }) {
  const conditions: SQLWrapper[] = [];
  if (filters?.productId) conditions.push(eq(stockTransactions.productId, filters.productId));
  if (filters?.batchId) conditions.push(eq(stockTransactions.batchId, filters.batchId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(stockTransactions).where(where).orderBy(desc(stockTransactions.createdAt));
}

export async function findStockTransactionById(id: string) {
  return db.select().from(stockTransactions).where(eq(stockTransactions.id, id)).then(r => r[0] ?? null);
}

export async function insertStockTransaction(data: typeof stockTransactions.$inferInsert) {
  return db.insert(stockTransactions).values(data).returning();
}

export async function deleteStockTransaction(id: string) {
  return db.delete(stockTransactions).where(eq(stockTransactions.id, id)).returning();
}

// ─── Dealers ─────────────────────────────────────────────────────────────────

export async function findDealers() {
  return db.select().from(dealers);
}

export async function findDealerById(id: string) {
  return db.select().from(dealers).where(eq(dealers.id, id)).then(r => r[0] ?? null);
}

export async function findDealersByZone(zone: string) {
  return db.select().from(dealers).where(eq(dealers.areaZone, zone));
}

export async function insertDealer(data: typeof dealers.$inferInsert) {
  return db.insert(dealers).values(data).returning();
}

export async function updateDealer(id: string, data: Partial<typeof dealers.$inferInsert>) {
  return db.update(dealers).set(data).where(eq(dealers.id, id)).returning();
}

export async function deleteDealer(id: string) {
  return db.delete(dealers).where(eq(dealers.id, id)).returning();
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export async function findInvoices(filters?: { dealerId?: string; paymentStatus?: string }) {
  const conditions: SQLWrapper[] = [];
  if (filters?.dealerId) conditions.push(eq(invoices.dealerId, filters.dealerId));
  if (filters?.paymentStatus) conditions.push(eq(invoices.paymentStatus, filters.paymentStatus as 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'OVERDUE'));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(invoices).where(where).orderBy(desc(invoices.createdAt));
}

export async function findInvoiceById(id: string) {
  return db.select().from(invoices).where(eq(invoices.id, id)).then(r => r[0] ?? null);
}

export async function insertInvoice(data: typeof invoices.$inferInsert) {
  return db.insert(invoices).values(data).returning();
}

export async function updateInvoice(id: string, data: Partial<typeof invoices.$inferInsert>) {
  return db.update(invoices).set(data).where(eq(invoices.id, id)).returning();
}

export async function deleteInvoice(id: string) {
  return db.delete(invoices).where(eq(invoices.id, id)).returning();
}

export async function findOverdueInvoices() {
  const today = new Date().toISOString().split('T')[0];
  return db.select().from(invoices).where(
    and(eq(invoices.paymentStatus, 'UNPAID'), lte(invoices.dueDate, today))
  );
}

// ─── Invoice Items ───────────────────────────────────────────────────────────

export async function findInvoiceItems(invoiceId: string) {
  return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
}

export async function findInvoiceItemById(id: string) {
  return db.select().from(invoiceItems).where(eq(invoiceItems.id, id)).then(r => r[0] ?? null);
}

export async function insertInvoiceItem(data: typeof invoiceItems.$inferInsert) {
  return db.insert(invoiceItems).values(data).returning();
}

export async function deleteInvoiceItem(id: string) {
  return db.delete(invoiceItems).where(eq(invoiceItems.id, id)).returning();
}

// ─── Cash Recovery Payments ──────────────────────────────────────────────────

export async function findPayments(filters?: { dealerId?: string }) {
  const where = filters?.dealerId ? eq(cashRecoveryPayments.dealerId, filters.dealerId) : undefined;
  return db.select().from(cashRecoveryPayments).where(where).orderBy(desc(cashRecoveryPayments.createdAt));
}

export async function findPaymentById(id: string) {
  return db.select().from(cashRecoveryPayments).where(eq(cashRecoveryPayments.id, id)).then(r => r[0] ?? null);
}

export async function insertPayment(data: typeof cashRecoveryPayments.$inferInsert) {
  return db.insert(cashRecoveryPayments).values(data).returning();
}

export async function deletePayment(id: string) {
  return db.delete(cashRecoveryPayments).where(eq(cashRecoveryPayments.id, id)).returning();
}

export async function findTodayPayments() {
  const today = new Date().toISOString().split('T')[0];
  return db.select().from(cashRecoveryPayments).where(
    sql`DATE(${cashRecoveryPayments.createdAt}) = ${today}`
  );
}

// ─── Aging Analysis ──────────────────────────────────────────────────────────

export async function getRecoveryAgingBuckets() {
  const today = new Date();
  const buckets = [
    { label: '0-30 days', minDays: 0, maxDays: 30 },
    { label: '31-60 days', minDays: 31, maxDays: 60 },
    { label: '61-90 days', minDays: 61, maxDays: 90 },
    { label: '90+ days', minDays: 91, maxDays: 999 },
  ];

  return Promise.all(
    buckets.map(async (b) => {
      const minDate = new Date(today);
      minDate.setDate(minDate.getDate() - b.maxDays);
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() - b.minDays);

      const rows = await db.select().from(invoices).where(
        and(
          eq(invoices.paymentStatus, 'UNPAID'),
          gte(invoices.dueDate, minDate.toISOString().split('T')[0]),
          lte(invoices.dueDate, maxDate.toISOString().split('T')[0])
        )
      );

      return {
        label: b.label,
        count: rows.length,
        totalAmount: rows.reduce((s, r) => s + parseFloat(r.balanceDue), 0),
      };
    })
  );
}
