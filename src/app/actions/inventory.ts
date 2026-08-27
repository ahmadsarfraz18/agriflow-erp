'use server';

import { db } from '@/db';
import { products, batches, stockTransactions } from '@/db/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getProducts() {
  return db.select().from(products);
}

export async function getProductById(id: string) {
  return db.select().from(products).where(eq(products.id, id));
}

export async function createProduct(data: typeof products.$inferInsert) {
  await db.insert(products).values(data);
  revalidatePath('/inventory');
}

export async function updateProduct(id: string, data: Partial<typeof products.$inferInsert>) {
  await db.update(products).set(data).where(eq(products.id, id));
  revalidatePath('/inventory');
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath('/inventory');
}

export async function getBatchesByProductId(productId: string) {
  return db.select().from(batches).where(eq(batches.productId, productId));
}

export async function getExpiringBatches(daysThreshold: number = 60) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  return db.select().from(batches).where(
    and(
      eq(batches.status, 'ACTIVE'),
      lte(batches.expiryDate, thresholdDate.toISOString().split('T')[0])
    )
  );
}

export async function createBatch(data: typeof batches.$inferInsert) {
  await db.insert(batches).values(data);
  revalidatePath('/inventory');
}

export async function updateBatchStock(batchId: string, quantityChange: number) {
  const batch = await db.select().from(batches).where(eq(batches.id, batchId));
  if (batch.length === 0) throw new Error('Batch not found');
  
  const newQuantity = batch[0].quantityCurrent + quantityChange;
  if (newQuantity < 0) throw new Error('Insufficient stock');
  
  await db.update(batches)
    .set({ quantityCurrent: newQuantity })
    .where(eq(batches.id, batchId));
}

export async function createStockTransaction(data: typeof stockTransactions.$inferInsert) {
  await db.insert(stockTransactions).values(data);
  await updateStockAfterTransaction(data.batchId, data.type, data.quantity);
  revalidatePath('/inventory');
}

async function updateStockAfterTransaction(
  batchId: string,
  type: string,
  quantity: number
) {
  const quantityChange = type === 'PURCHASE_IN' || type === 'RETURN_IN' 
    ? quantity 
    : -quantity;
  await updateBatchStock(batchId, quantityChange);
}

export async function fifoDeduction(productId: string, quantityNeeded: number) {
  const activeBatches = await db.select().from(batches).where(
    and(
      eq(batches.productId, productId),
      eq(batches.status, 'ACTIVE'),
      gte(batches.quantityCurrent, 1)
    )
  ).orderBy(batches.expiryDate);

  let remaining = quantityNeeded;
  const deductions: { batchId: string; quantity: number }[] = [];

  for (const batch of activeBatches) {
    if (remaining <= 0) break;
    const deductFromBatch = Math.min(batch.quantityCurrent, remaining);
    deductions.push({ batchId: batch.id, quantity: deductFromBatch });
    remaining -= deductFromBatch;
  }

  if (remaining > 0) {
    throw new Error('Insufficient stock across all batches');
  }

  for (const deduction of deductions) {
    await updateBatchStock(deduction.batchId, -deduction.quantity);
  }

  return deductions;
}