'use server';

import { db } from '@/db';
import { dealers, invoices, invoiceItems } from '@/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getDealers() {
  return db.select().from(dealers);
}

export async function getDealerById(id: string) {
  return db.select().from(dealers).where(eq(dealers.id, id));
}

export async function getDealersByZone(zone: string) {
  return db.select().from(dealers).where(eq(dealers.areaZone, zone));
}

export async function createDealer(data: typeof dealers.$inferInsert) {
  await db.insert(dealers).values(data);
  revalidatePath('/dealers');
}

export async function updateDealer(id: string, data: Partial<typeof dealers.$inferInsert>) {
  await db.update(dealers).set(data).where(eq(dealers.id, id));
  revalidatePath('/dealers');
}

export async function deleteDealer(id: string) {
  await db.delete(dealers).where(eq(dealers.id, id));
  revalidatePath('/dealers');
}

export async function checkCreditLimit(dealerId: string, amount: number) {
  const dealer = await db.select().from(dealers).where(eq(dealers.id, dealerId));
  if (dealer.length === 0) throw new Error('Dealer not found');
  
  const newBalance = parseFloat(dealer[0].currentBalance) + amount;
  return newBalance <= parseFloat(dealer[0].creditLimit);
}

export async function getDealerInvoices(dealerId: string) {
  return db.select().from(invoices).where(eq(invoices.dealerId, dealerId));
}

export async function getInvoiceItems(invoiceId: string) {
  return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
}

export async function createInvoice(data: typeof invoices.$inferInsert, items: typeof invoiceItems.$inferInsert[]) {
  await db.insert(invoices).values(data);
  
  for (const item of items) {
    await db.insert(invoiceItems).values(item);
  }
  
  await db.update(dealers)
    .set({ currentBalance: sql`${dealers.currentBalance} + ${data.netAmount}` })
    .where(eq(dealers.id, data.dealerId));
  
  revalidatePath('/dealers');
  revalidatePath('/inventory');
}

export async function getOverdueInvoices() {
  const today = new Date().toISOString().split('T')[0];
  return db.select().from(invoices).where(
    and(
      eq(invoices.paymentStatus, 'UNPAID'),
      lte(invoices.dueDate, today)
    )
  );
}

export async function updateInvoice(id: string, data: Partial<typeof invoices.$inferInsert>) {
  await db.update(invoices).set(data).where(eq(invoices.id, id));
  revalidatePath('/dealers');
  revalidatePath('/recovery');
}

export async function deleteInvoice(id: string) {
  await db.delete(invoices).where(eq(invoices.id, id));
  revalidatePath('/dealers');
  revalidatePath('/recovery');
}