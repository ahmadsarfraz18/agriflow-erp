import { db } from '@/db';
import { products, batches, stockTransactions, dealers, invoices, cashRecoveryPayments } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
  const today = new Date().toISOString().split('T')[0];
  const in60Days = new Date();
  in60Days.setDate(in60Days.getDate() + 60);
  const in60DaysStr = in60Days.toISOString().split('T')[0];
  const minus15 = new Date();
  minus15.setDate(minus15.getDate() - 15);
  const minus15Str = minus15.toISOString().split('T')[0];

  const [allProducts, allBatches, , unpaidInvoices, recentTxns, recentPayments, todayPayments] =
    await Promise.all([
      db.select().from(products),
      db.select().from(batches),
      db.select().from(dealers),
      db.select().from(invoices).where(eq(invoices.paymentStatus, 'UNPAID')),
      db.select({
        id: stockTransactions.id,
        type: stockTransactions.type,
        quantity: stockTransactions.quantity,
        productName: products.name,
        batchNumber: batches.batchNumber,
        createdAt: stockTransactions.createdAt,
      })
        .from(stockTransactions)
        .innerJoin(products, eq(stockTransactions.productId, products.id))
        .innerJoin(batches, eq(stockTransactions.batchId, batches.id))
        .orderBy(desc(stockTransactions.createdAt))
        .limit(5),
      db.select({
        id: cashRecoveryPayments.id,
        amount: cashRecoveryPayments.amount,
        receiptNumber: cashRecoveryPayments.receiptNumber,
        createdAt: cashRecoveryPayments.createdAt,
        dealerName: dealers.businessName,
      })
        .from(cashRecoveryPayments)
        .innerJoin(dealers, eq(cashRecoveryPayments.dealerId, dealers.id))
        .orderBy(desc(cashRecoveryPayments.createdAt))
        .limit(5),
      db.select().from(cashRecoveryPayments).where(sql`DATE(${cashRecoveryPayments.createdAt}) = ${today}`),
    ]);

  const expiringBatches = allBatches.filter(
    b => b.status === 'ACTIVE' && b.expiryDate <= in60DaysStr
  ).sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)).slice(0, 5);

  const totalInventoryValue = allBatches.reduce((sum, b) => {
    const product = allProducts.find(p => p.id === b.productId);
    return sum + (product ? b.quantityCurrent * parseFloat(product.salePrice) : 0);
  }, 0);

  const totalReceivable = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.balanceDue), 0);

  const overdueInvoices = unpaidInvoices.filter(inv => inv.dueDate <= minus15Str);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.balanceDue), 0);

  const todayCollectionTotal = todayPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const expiringBatchesWithDays = expiringBatches.map(b => {
    const daysLeft = Math.ceil(
      (new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return { ...b, daysLeft };
  });

  const kpis = [
    { title: 'Total Inventory Value', value: `PKR ${totalInventoryValue.toLocaleString()}` },
    { title: 'Critical Expiring Batches', value: String(expiringBatches.length), subtitle: '< 60 Days' },
    { title: 'Total Cash Receivable', value: `PKR ${totalReceivable.toLocaleString()}` },
    { title: 'Overdue Recoveries', value: `PKR ${overdueAmount.toLocaleString()}`, subtitle: '15+ Days' },
    { title: 'Today\'s Collections', value: `PKR ${todayCollectionTotal.toLocaleString()}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to AgriFlow ERP</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {kpi.subtitle && (
                <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTxns.length === 0 && recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentTxns.map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {t.type === 'PURCHASE_IN' || t.type === 'RETURN_IN' ? 'Stock Received' : 'Stock Out'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.productName} — {t.quantity} units
                      </p>
                    </div>
                    <Badge variant="outline">
                      {t.type === 'PURCHASE_IN' || t.type === 'RETURN_IN' ? 'IN' : 'OUT'}
                    </Badge>
                  </div>
                ))}
                {recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Payment Collected</p>
                      <p className="text-xs text-muted-foreground">
                        {p.dealerName} — PKR {parseFloat(p.amount).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline">PKR {parseFloat(p.amount).toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            {expiringBatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No batches expiring within 60 days</p>
            ) : (
              <div className="space-y-4">
                {expiringBatchesWithDays.map((b) => {
                  const product = allProducts.find(p => p.id === b.productId);
                  return (
                    <div key={b.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{product?.name ?? 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">Batch: {b.batchNumber}</p>
                      </div>
                      <Badge variant={b.daysLeft <= 30 ? 'destructive' : 'secondary'}>
                        {b.daysLeft} days
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
