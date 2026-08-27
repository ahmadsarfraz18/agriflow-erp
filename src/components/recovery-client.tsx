'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPKR, formatDate } from '@/lib/format';

type Dealer = { id: string; businessName: string };
type Invoice = { id: string; invoiceNumber: string; balanceDue: string; dealerId: string };
type Payment = {
  id: string;
  receiptNumber: string;
  amount: string;
  paymentMethod: string;
  createdAt: string;
  dealerName: string;
};
type AgingBucket = { label: string; count: number; totalAmount: number };

export function RecoveryClient({
  dealers,
  unpaidInvoices,
  recentPayments,
  agingBuckets,
}: {
  dealers: Dealer[];
  unpaidInvoices: Invoice[];
  recentPayments: Payment[];
  agingBuckets: AgingBucket[];
}) {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [selectedDealer, setSelectedDealer] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredInvoices = selectedDealer
    ? unpaidInvoices.filter(i => i.dealerId === selectedDealer)
    : unpaidInvoices;

  async function handleSubmit() {
    if (!selectedDealer || !amount) return;
    setSubmitting(true);
    try {
      await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealerId: selectedDealer,
          amount: parseFloat(amount),
          paymentMethod,
          invoiceId: invoiceId || null,
          chequeNumber: chequeNumber || null,
          notes: notes || null,
        }),
      });
      window.location.reload();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recovery</h1>
        <p className="text-muted-foreground">Manage payments and track recovery</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Payment Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedDealer} onValueChange={(v) => { setSelectedDealer(v ?? ''); setInvoiceId(''); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select Dealer" />
              </SelectTrigger>
              <SelectContent>
                {dealers.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.businessName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Amount (PKR)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v ?? 'CASH')}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
                <SelectItem value="ONLINE_PAY">Online Payment</SelectItem>
              </SelectContent>
            </Select>
            {paymentMethod === 'CHEQUE' && (
              <Input
                placeholder="Cheque Number"
                value={chequeNumber}
                onChange={(e) => setChequeNumber(e.target.value)}
              />
            )}
            <Select value={invoiceId} onValueChange={(v) => setInvoiceId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Apply to Invoice (optional)" />
              </SelectTrigger>
              <SelectContent>
                {filteredInvoices.map(inv => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} ({formatPKR(inv.balanceDue)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button className="w-full" onClick={handleSubmit} disabled={submitting || !selectedDealer || !amount}>
              {submitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aging Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agingBuckets.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.count} invoices</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPKR(item.totalAmount)}</p>
                    <Badge variant={item.label.includes('90+') ? 'destructive' : 'secondary'}>
                      {item.label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Dealer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No payments recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                recentPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.receiptNumber}</TableCell>
                    <TableCell>{p.dealerName}</TableCell>
                    <TableCell>{formatPKR(p.amount)}</TableCell>
                    <TableCell><Badge variant="outline">{p.paymentMethod}</Badge></TableCell>
                    <TableCell>{formatDate(p.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
