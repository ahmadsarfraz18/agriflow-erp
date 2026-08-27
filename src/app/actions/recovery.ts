'use server';

import { db } from '@/db';
import { cashRecoveryPayments, dealers, invoices } from '@/db/schema';
import { eq, and, lte, gte, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getPayments() {
  return db.select().from(cashRecoveryPayments).orderBy(desc(cashRecoveryPayments.createdAt));
}

export async function getPaymentsByDealer(dealerId: string) {
  return db.select().from(cashRecoveryPayments)
    .where(eq(cashRecoveryPayments.dealerId, dealerId))
    .orderBy(desc(cashRecoveryPayments.createdAt));
}

export async function createPayment(data: typeof cashRecoveryPayments.$inferInsert) {
  await db.insert(cashRecoveryPayments).values(data);
  
  await db.update(dealers)
    .set({ currentBalance: sql`${dealers.currentBalance} - ${data.amount}` })
    .where(eq(dealers.id, data.dealerId));
  
  const invoiceId = data.invoiceId;
  if (invoiceId) {
    const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    if (invoice.length > 0) {
      const amountValue = data.amount ?? '0';
      const paidAmountValue = invoice[0].paidAmount ?? '0';
      const totalAmountValue = invoice[0].totalAmount ?? '0';
      const newPaidAmount = parseFloat(paidAmountValue) + parseFloat(amountValue);
      const newBalanceDue = parseFloat(totalAmountValue) - newPaidAmount;
      
      await db.update(invoices)
        .set({
          paidAmount: newPaidAmount.toString(),
          balanceDue: newBalanceDue.toString(),
          paymentStatus: newBalanceDue <= 0 ? 'PAID' : 'PARTIALLY_PAID',
        })
        .where(eq(invoices.id, invoiceId));
    }
  }
  
  revalidatePath('/recovery');
  revalidatePath('/dealers');
}

export async function getOverdueRecoveries(minDaysOverdue: number = 15) {
  const today = new Date();
  const thresholdDate = new Date(today);
  thresholdDate.setDate(thresholdDate.getDate() - minDaysOverdue);
  
  return db.select().from(invoices).where(
    and(
      eq(invoices.paymentStatus, 'UNPAID'),
      lte(invoices.dueDate, thresholdDate.toISOString().split('T')[0])
    )
  ).orderBy(invoices.dueDate);
}

export async function getRecoveryAgingAnalysis() {
  const today = new Date();
  
  const buckets = [
    { label: '0-30 days', minDays: 0, maxDays: 30 },
    { label: '31-60 days', minDays: 31, maxDays: 60 },
    { label: '61-90 days', minDays: 61, maxDays: 90 },
    { label: '90+ days', minDays: 91, maxDays: 999 },
  ];
  
  const results = [];
  
  for (const bucket of buckets) {
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() - bucket.maxDays);
    
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() - bucket.minDays);
    
    const overdueInvoices = await db.select().from(invoices).where(
      and(
        eq(invoices.paymentStatus, 'UNPAID'),
        gte(invoices.dueDate, minDate.toISOString().split('T')[0]),
        lte(invoices.dueDate, maxDate.toISOString().split('T')[0])
      )
    );
    
    const totalAmount = overdueInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.balanceDue),
      0
    );
    
    results.push({
      label: bucket.label,
      count: overdueInvoices.length,
      totalAmount,
    });
  }
  
  return results;
}

export async function getTodayCollections() {
  const today = new Date().toISOString().split('T')[0];
  
  return db.select().from(cashRecoveryPayments).where(
    sql`DATE(${cashRecoveryPayments.createdAt}) = ${today}`
  );
}