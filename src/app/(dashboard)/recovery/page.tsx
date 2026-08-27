import { findDealers, findInvoices, findPayments, getRecoveryAgingBuckets } from '@/db/queries';
import { RecoveryClient } from '@/components/recovery-client';

export default async function RecoveryPage() {
  const [dealers, unpaidInvoices, recentPayments, agingBuckets] = await Promise.all([
    findDealers(),
    findInvoices({ paymentStatus: 'UNPAID' }),
    findPayments(),
    getRecoveryAgingBuckets(),
  ]);

  return (
    <RecoveryClient
      dealers={dealers.map(d => ({ id: d.id, businessName: d.businessName }))}
      unpaidInvoices={unpaidInvoices.map(i => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        balanceDue: i.balanceDue,
        dealerId: i.dealerId,
      }))}
      recentPayments={recentPayments.slice(0, 10).map(p => ({
        id: p.id,
        receiptNumber: p.receiptNumber,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        createdAt: p.createdAt?.toISOString?.() ?? String(p.createdAt),
        dealerName: dealers.find(d => d.id === p.dealerId)?.businessName ?? 'Unknown',
      }))}
      agingBuckets={agingBuckets}
    />
  );
}
