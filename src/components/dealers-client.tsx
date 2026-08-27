'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createDealer, updateDealer, deleteDealer, updateInvoice, deleteInvoice } from '@/app/actions/dealers';
import { formatPKR } from '@/lib/format';

type Dealer = {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  areaZone: string;
  creditLimit: string;
  currentBalance: string;
  status: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  dealerId: string;
  netAmount: string;
  paidAmount: string;
  balanceDue: string;
  paymentStatus: string;
  dueDate: string;
  createdAt: string;
};

const EMPTY_DEALER_FORM = {
  businessName: '',
  ownerName: '',
  phone: '',
  whatsappNumber: '',
  areaZone: '',
  address: '',
  creditLimit: '',
};

export function DealersClient({
  dealers,
  invoices,
}: {
  dealers: Dealer[];
  invoices: Invoice[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDealerDialogOpen, setIsEditDealerDialogOpen] = useState(false);
  const [isEditInvoiceDialogOpen, setIsEditInvoiceDialogOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [dealerForm, setDealerForm] = useState(EMPTY_DEALER_FORM);
  const [editDealerForm, setEditDealerForm] = useState(EMPTY_DEALER_FORM);
  const [invoiceForm, setInvoiceForm] = useState({ paymentStatus: '', dueDate: '' });
  const [error, setError] = useState('');
  const [editDealerError, setEditDealerError] = useState('');
  const [editInvoiceError, setEditInvoiceError] = useState('');

  const filteredDealers = dealers.filter(d =>
    d.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.areaZone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvoices = invoices.filter(i =>
    i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReceivable = dealers.reduce((s, d) => s + parseFloat(d.currentBalance), 0);
  const activeCount = dealers.filter(d => d.status === 'ACTIVE').length;
  const blockedCount = dealers.filter(d => d.status === 'BLOCKED_CREDIT').length;

  function resetDealerForm() {
    setDealerForm(EMPTY_DEALER_FORM);
    setError('');
  }

  function resetEditDealerForm() {
    setEditDealerForm(EMPTY_DEALER_FORM);
    setEditDealerError('');
  }

  function openEditDealerDialog(dealer: Dealer) {
    setEditingDealer(dealer);
    setEditDealerForm({
      businessName: dealer.businessName,
      ownerName: dealer.ownerName,
      phone: dealer.phone,
      whatsappNumber: '',
      areaZone: dealer.areaZone,
      address: '',
      creditLimit: dealer.creditLimit,
    });
    setEditDealerError('');
    setIsEditDealerDialogOpen(true);
  }

  function openEditInvoiceDialog(invoice: Invoice) {
    setEditingInvoice(invoice);
    setInvoiceForm({
      paymentStatus: invoice.paymentStatus,
      dueDate: invoice.dueDate,
    });
    setEditInvoiceError('');
    setIsEditInvoiceDialogOpen(true);
  }

  async function handleAddDealer() {
    if (!dealerForm.businessName || !dealerForm.ownerName || !dealerForm.phone || !dealerForm.areaZone) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    startTransition(async () => {
      try {
        await createDealer({
          businessName: dealerForm.businessName,
          ownerName: dealerForm.ownerName,
          phone: dealerForm.phone,
          whatsappNumber: dealerForm.whatsappNumber || null,
          areaZone: dealerForm.areaZone,
          address: dealerForm.address || null,
          creditLimit: dealerForm.creditLimit || '0',
          currentBalance: '0',
          status: 'ACTIVE',
        });
        resetDealerForm();
        setIsAddDialogOpen(false);
        router.refresh();
      } catch {
        setError('Failed to create dealer. Please try again.');
      }
    });
  }

  async function handleEditDealer() {
    if (!editingDealer) return;
    if (!editDealerForm.businessName || !editDealerForm.ownerName || !editDealerForm.phone || !editDealerForm.areaZone) {
      setEditDealerError('Please fill in all required fields');
      return;
    }
    setEditDealerError('');
    startTransition(async () => {
      try {
        await updateDealer(editingDealer.id, {
          businessName: editDealerForm.businessName,
          ownerName: editDealerForm.ownerName,
          phone: editDealerForm.phone,
          whatsappNumber: editDealerForm.whatsappNumber || null,
          areaZone: editDealerForm.areaZone,
          address: editDealerForm.address || null,
          creditLimit: editDealerForm.creditLimit,
        });
        resetEditDealerForm();
        setIsEditDealerDialogOpen(false);
        setEditingDealer(null);
        router.refresh();
      } catch {
        setEditDealerError('Failed to update dealer. Please try again.');
      }
    });
  }

  async function handleDeleteDealer(dealer: Dealer) {
    if (!confirm(`Delete dealer "${dealer.businessName}"? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteDealer(dealer.id);
        router.refresh();
      } catch {
        alert('Failed to delete dealer.');
      }
    });
  }

  async function handleEditInvoice() {
    if (!editingInvoice) return;
    if (!invoiceForm.paymentStatus || !invoiceForm.dueDate) {
      setEditInvoiceError('Please fill in all fields');
      return;
    }
    setEditInvoiceError('');
    startTransition(async () => {
      try {
        await updateInvoice(editingInvoice.id, {
          paymentStatus: invoiceForm.paymentStatus as 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'OVERDUE',
          dueDate: invoiceForm.dueDate,
        });
        setIsEditInvoiceDialogOpen(false);
        setEditingInvoice(null);
        router.refresh();
      } catch {
        setEditInvoiceError('Failed to update invoice. Please try again.');
      }
    });
  }

  async function handleDeleteInvoice(invoice: Invoice) {
    if (!confirm(`Delete invoice "${invoice.invoiceNumber}"? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteInvoice(invoice.id);
        router.refresh();
      } catch {
        alert('Failed to delete invoice.');
      }
    });
  }

  function getDealerName(dealerId: string) {
    return dealers.find(d => d.id === dealerId)?.businessName ?? 'Unknown';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dealers (Khata Management)</h1>
          <p className="text-muted-foreground">Manage dealer accounts, credit, and invoices</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetDealerForm(); }}>
          <DialogTrigger render={<Button />}>Add Dealer</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Dealer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Input placeholder="Business Name *" value={dealerForm.businessName} onChange={(e) => setDealerForm(f => ({ ...f, businessName: e.target.value }))} />
              <Input placeholder="Owner Name *" value={dealerForm.ownerName} onChange={(e) => setDealerForm(f => ({ ...f, ownerName: e.target.value }))} />
              <Input placeholder="Phone Number *" value={dealerForm.phone} onChange={(e) => setDealerForm(f => ({ ...f, phone: e.target.value }))} />
              <Input placeholder="WhatsApp Number (optional)" value={dealerForm.whatsappNumber} onChange={(e) => setDealerForm(f => ({ ...f, whatsappNumber: e.target.value }))} />
              <Input placeholder="Area Zone *" value={dealerForm.areaZone} onChange={(e) => setDealerForm(f => ({ ...f, areaZone: e.target.value }))} />
              <Input placeholder="Address" value={dealerForm.address} onChange={(e) => setDealerForm(f => ({ ...f, address: e.target.value }))} />
              <Input placeholder="Credit Limit (PKR)" type="number" value={dealerForm.creditLimit} onChange={(e) => setDealerForm(f => ({ ...f, creditLimit: e.target.value }))} />
              <Button className="w-full" onClick={handleAddDealer} disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Dealer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditDealerDialogOpen} onOpenChange={(open) => { setIsEditDealerDialogOpen(open); if (!open) { resetEditDealerForm(); setEditingDealer(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Dealer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editDealerError && <p className="text-sm text-red-500">{editDealerError}</p>}
            <Input placeholder="Business Name *" value={editDealerForm.businessName} onChange={(e) => setEditDealerForm(f => ({ ...f, businessName: e.target.value }))} />
            <Input placeholder="Owner Name *" value={editDealerForm.ownerName} onChange={(e) => setEditDealerForm(f => ({ ...f, ownerName: e.target.value }))} />
            <Input placeholder="Phone Number *" value={editDealerForm.phone} onChange={(e) => setEditDealerForm(f => ({ ...f, phone: e.target.value }))} />
            <Input placeholder="WhatsApp Number" value={editDealerForm.whatsappNumber} onChange={(e) => setEditDealerForm(f => ({ ...f, whatsappNumber: e.target.value }))} />
            <Input placeholder="Area Zone *" value={editDealerForm.areaZone} onChange={(e) => setEditDealerForm(f => ({ ...f, areaZone: e.target.value }))} />
            <Input placeholder="Address" value={editDealerForm.address} onChange={(e) => setEditDealerForm(f => ({ ...f, address: e.target.value }))} />
            <Input placeholder="Credit Limit (PKR)" type="number" value={editDealerForm.creditLimit} onChange={(e) => setEditDealerForm(f => ({ ...f, creditLimit: e.target.value }))} />
            <Button className="w-full" onClick={handleEditDealer} disabled={isPending}>
              {isPending ? 'Updating...' : 'Update Dealer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditInvoiceDialogOpen} onOpenChange={(open) => { setIsEditInvoiceDialogOpen(open); if (!open) { setInvoiceForm({ paymentStatus: '', dueDate: '' }); setEditingInvoice(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editInvoiceError && <p className="text-sm text-red-500">{editInvoiceError}</p>}
            <div>
              <label className="text-sm font-medium">Payment Status</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={invoiceForm.paymentStatus}
                onChange={(e) => setInvoiceForm(f => ({ ...f, paymentStatus: e.target.value }))}
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={handleEditInvoice} disabled={isPending}>
              {isPending ? 'Updating...' : 'Update Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receivable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPKR(totalReceivable)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Dealers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Credit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Input
        placeholder="Search dealers or invoices..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      <Tabs defaultValue="dealers">
        <TabsList>
          <TabsTrigger value="dealers">Dealers</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="dealers">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDealers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No dealers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDealers.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.businessName}</TableCell>
                        <TableCell>{d.ownerName}</TableCell>
                        <TableCell>{d.areaZone}</TableCell>
                        <TableCell>{formatPKR(d.currentBalance)}</TableCell>
                        <TableCell>{formatPKR(d.creditLimit)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            d.status === 'ACTIVE' ? 'default' :
                            d.status === 'BLOCKED_CREDIT' ? 'destructive' : 'secondary'
                          }>
                            {d.status === 'ACTIVE' ? 'Active' :
                             d.status === 'BLOCKED_CREDIT' ? 'Blocked' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openEditDealerDialog(d)} disabled={isPending}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteDealer(d)} disabled={isPending}>
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Dealer</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                        <TableCell>{getDealerName(inv.dealerId)}</TableCell>
                        <TableCell>{formatPKR(inv.netAmount)}</TableCell>
                        <TableCell>{formatPKR(inv.paidAmount)}</TableCell>
                        <TableCell>{formatPKR(inv.balanceDue)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            inv.paymentStatus === 'PAID' ? 'default' :
                            inv.paymentStatus === 'OVERDUE' ? 'destructive' : 'secondary'
                          }>
                            {inv.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{inv.dueDate}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openEditInvoiceDialog(inv)} disabled={isPending}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteInvoice(inv)} disabled={isPending}>
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
