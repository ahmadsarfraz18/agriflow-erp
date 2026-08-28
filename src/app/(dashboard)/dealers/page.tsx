import { findDealers, findInvoices } from '@/db/queries';
import { DealersClient } from '@/components/dealers-client';

export const dynamic = 'force-dynamic';

export default async function DealersPage() {
  const [dealers, invoices] = await Promise.all([findDealers(), findInvoices()]);

  return (
    <DealersClient
      dealers={dealers.map(d => ({
        id: d.id,
        businessName: d.businessName,
        ownerName: d.ownerName,
        phone: d.phone,
        areaZone: d.areaZone,
        creditLimit: d.creditLimit,
        currentBalance: d.currentBalance,
        status: d.status,
      }))}
      invoices={invoices.map(i => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        dealerId: i.dealerId,
        netAmount: i.netAmount,
        paidAmount: i.paidAmount ?? '0',
        balanceDue: i.balanceDue,
        paymentStatus: i.paymentStatus,
        dueDate: i.dueDate,
        createdAt: i.createdAt?.toISOString?.() ?? String(i.createdAt),
      }))}
    />
  );
}
