import { NextRequest, NextResponse } from 'next/server';
import { insertPayment, findInvoiceById, updateInvoice, updateDealer, findDealerById } from '@/db/queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealerId, amount, paymentMethod, invoiceId, chequeNumber, notes } = body;

    if (!dealerId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const receiptNumber = `REC-${Date.now()}`;

    await insertPayment({
      receiptNumber,
      dealerId,
      invoiceId: invoiceId || null,
      amount: amount.toString(),
      paymentMethod,
      chequeNumber: chequeNumber || null,
      chequeClearingDate: null,
      receiptImageUrl: null,
      collectedBy: 'system',
      notes: notes || null,
    });

    const dealer = await findDealerById(dealerId);
    if (dealer) {
      const newBalance = parseFloat(dealer.currentBalance) - amount;
      await updateDealer(dealerId, { currentBalance: newBalance.toString() });
    }

    if (invoiceId) {
      const invoice = await findInvoiceById(invoiceId);
      if (invoice) {
        const newPaid = parseFloat(invoice.paidAmount ?? '0') + amount;
        const newBalance = parseFloat(invoice.totalAmount) - newPaid;
        await updateInvoice(invoiceId, {
          paidAmount: newPaid.toString(),
          balanceDue: newBalance.toString(),
          paymentStatus: newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID',
        });
      }
    }

    return NextResponse.json({ success: true, receiptNumber });
  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
