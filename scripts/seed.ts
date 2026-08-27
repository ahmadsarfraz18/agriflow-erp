import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  products,
  batches,
  stockTransactions,
  dealers,
  invoices,
  invoiceItems,
  cashRecoveryPayments,
} from '../src/db/schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

const BATCH_STATUS = ['ACTIVE', 'NEAR_EXPIRY', 'EXPIRED', 'DEPLETED'] as const;
const TXN_TYPE = ['PURCHASE_IN', 'SALE_OUT', 'RETURN_IN', 'DAMAGE_OUT', 'SAMPLE_OUT'] as const;
const PAYMENT_METHOD = ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE_PAY'] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number, daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * (daysAhead + daysAgo)) - daysAgo);
  return d.toISOString().split('T')[0];
}

async function seed() {
  console.log('Seeding database...');

  // ── Products ─────────────────────────────────────────────────────────────
  const productData = [
    { name: 'Chlorpyrifos 40% EC', brandName: 'AgroGuard', activeIngredient: 'Chlorpyrifos', category: 'INSECTICIDE' as const, packSize: '1 Litre', unitOfMeasure: 'Litres', costPrice: '850.00', salePrice: '1100.00', minThreshold: 50 },
    { name: 'Imidacloprid 25% WG', brandName: 'CropShield', activeIngredient: 'Imidacloprid', category: 'INSECTICIDE' as const, packSize: '500g', unitOfMeasure: 'Bags', costPrice: '1200.00', salePrice: '1550.00', minThreshold: 30 },
    { name: 'Mancozeb 75% WP', brandName: 'FungiGuard', activeIngredient: 'Mancozeb', category: 'FUNGICIDE' as const, packSize: '25kg', unitOfMeasure: 'Bags', costPrice: '4500.00', salePrice: '5800.00', minThreshold: 20 },
    { name: '2,4-D Amine Salt', brandName: 'WeedKiller', activeIngredient: '2,4-D', category: 'HERBICIDE' as const, packSize: '1 Litre', unitOfMeasure: 'Litres', costPrice: '320.00', salePrice: '450.00', minThreshold: 40 },
    { name: 'Urea 46% N', brandName: 'GreenGrow', activeIngredient: 'Urea', category: 'FERTILIZER' as const, packSize: '50kg', unitOfMeasure: 'Bags', costPrice: '2800.00', salePrice: '3400.00', minThreshold: 100 },
    { name: 'Cypermethrin 10% EC', brandName: 'AgroGuard', activeIngredient: 'Cypermethrin', category: 'INSECTICIDE' as const, packSize: '500ml', unitOfMeasure: 'Bottles', costPrice: '420.00', salePrice: '580.00', minThreshold: 60 },
    { name: 'Glyphosate 41% SL', brandName: 'WeedKiller', activeIngredient: 'Glyphosate', category: 'HERBICIDE' as const, packSize: '5 Litre', unitOfMeasure: 'Jugs', costPrice: '1800.00', salePrice: '2400.00', minThreshold: 25 },
    { name: 'Metalaxyl 8% WP', brandName: 'FungiGuard', activeIngredient: 'Metalaxyl', category: 'FUNGICIDE' as const, packSize: '1kg', unitOfMeasure: 'Bags', costPrice: '950.00', salePrice: '1300.00', minThreshold: 35 },
    { name: 'NPK 17:17:17', brandName: 'GreenGrow', activeIngredient: 'NPK Complex', category: 'FERTILIZER' as const, packSize: '50kg', unitOfMeasure: 'Bags', costPrice: '3200.00', salePrice: '4100.00', minThreshold: 80 },
    { name: 'Mepiquat Chloride 5% SL', brandName: 'CropShield', activeIngredient: 'Mepiquat Chloride', category: 'PGR' as const, packSize: '250ml', unitOfMeasure: 'Bottles', costPrice: '280.00', salePrice: '400.00', minThreshold: 45 },
  ];

  const insertedProducts = await db.insert(products).values(productData).returning();
  console.log(`  Inserted ${insertedProducts.length} products`);

  // ── Batches ──────────────────────────────────────────────────────────────
  const batchData: typeof batches.$inferInsert[] = [];
  for (const p of insertedProducts) {
    const numBatches = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numBatches; i++) {
      const qtyInit = 50 + Math.floor(Math.random() * 450);
      batchData.push({
        productId: p.id,
        batchNumber: `B-${p.name.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
        mfgDate: randomDate(180, 0),
        expiryDate: randomDate(0, 365),
        quantityInitial: qtyInit,
        quantityCurrent: Math.floor(qtyInit * (0.2 + Math.random() * 0.8)),
        warehouseLocation: `Rack-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 10) + 1}`,
        status: pick(BATCH_STATUS),
      });
    }
  }
  const insertedBatches = await db.insert(batches).values(batchData).returning();
  console.log(`  Inserted ${insertedBatches.length} batches`);

  // ── Dealers ──────────────────────────────────────────────────────────────
  const dealerData = [
    { businessName: 'Rehman Kissan Store', ownerName: 'Abdul Rehman', phone: '+92-300-1234567', whatsappNumber: '+92-300-1234567', areaZone: 'Multan Sub-Division A', address: 'Main Bazaar, Multan', creditLimit: '500000.00', currentBalance: '450000.00', status: 'ACTIVE' as const },
    { businessName: 'Green Agriculture Center', ownerName: 'Muhammad Ali', phone: '+92-321-7654321', whatsappNumber: '+92-321-7654321', areaZone: 'Gujranwala South', address: 'Sialkot Road, Gujranwala', creditLimit: '400000.00', currentBalance: '320000.00', status: 'ACTIVE' as const },
    { businessName: 'Khan Farm Supplies', ownerName: 'Ahmed Khan', phone: '+92-333-9876543', areaZone: 'Faisalabad East', address: 'Clock Tower, Faisalabad', creditLimit: '250000.00', currentBalance: '180000.00', status: 'ACTIVE' as const },
    { businessName: 'Pest Control Hub', ownerName: 'Saeed Ahmed', phone: '+92-345-5432109', whatsappNumber: '+92-345-5432109', areaZone: 'Lahore North', address: 'GT Road, Lahore', creditLimit: '150000.00', currentBalance: '95000.00', status: 'BLOCKED_CREDIT' as const },
    { businessName: 'Agro Solutions', ownerName: 'Usman Ghani', phone: '+92-300-1122334', areaZone: 'Rawalpindi', address: 'Satellite Town, Rawalpindi', creditLimit: '200000.00', currentBalance: '0.00', status: 'INACTIVE' as const },
  ];
  const insertedDealers = await db.insert(dealers).values(dealerData).returning();
  console.log(`  Inserted ${insertedDealers.length} dealers`);

  // ── Invoices + Invoice Items ─────────────────────────────────────────────
  const invoiceData: typeof invoices.$inferInsert[] = [];
  const allInvoiceItems: typeof invoiceItems.$inferInsert[] = [];

  for (const d of insertedDealers) {
    if (d.status === 'INACTIVE') continue;
    const numInvoices = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numInvoices; i++) {
      const itemsCount = 1 + Math.floor(Math.random() * 4);
      let total = 0;
      const items: typeof invoiceItems.$inferInsert[] = [];

      for (let j = 0; j < itemsCount; j++) {
        const product = pick(insertedProducts);
        const productBatches = insertedBatches.filter(b => b.productId === product.id);
        if (productBatches.length === 0) continue;
        const batch = pick(productBatches);
        const qty = 5 + Math.floor(Math.random() * 50);
        const unitPrice = parseFloat(product.salePrice);
        const subtotal = qty * unitPrice;
        total += subtotal;
        items.push({
          invoiceId: '', // filled after insert
          productId: product.id,
          batchId: batch.id,
          quantity: qty,
          unitPrice: unitPrice.toString(),
          subtotal: subtotal.toFixed(2),
        });
      }

      const discount = Math.random() > 0.7 ? total * (0.02 + Math.random() * 0.08) : 0;
      const net = total - discount;
      const paidRatio = pick([0, 0.5, 1]);
      const paid = net * paidRatio;

      const inv: typeof invoices.$inferInsert = {
        invoiceNumber: `INV-2026-${String(i + 1).padStart(4, '0')}`,
        dealerId: d.id,
        totalAmount: total.toFixed(2),
        discountAmount: discount.toFixed(2),
        netAmount: net.toFixed(2),
        paidAmount: paid.toFixed(2),
        balanceDue: (net - paid).toFixed(2),
        paymentStatus: paid >= net ? 'PAID' as const : paid > 0 ? 'PARTIALLY_PAID' as const : 'UNPAID' as const,
        issueDate: randomDate(60, 0),
        dueDate: randomDate(0, 45),
      };
      invoiceData.push(inv);
    }
  }

  const insertedInvoices = await db.insert(invoices).values(invoiceData).returning();
  console.log(`  Inserted ${insertedInvoices.length} invoices`);

  // fill in invoiceId on items and insert
  for (const inv of insertedInvoices) {
    const matchingItems = allInvoiceItems.filter(i => i.invoiceId === '');
    const count = Math.min(1 + Math.floor(Math.random() * 3), matchingItems.length);
    for (let k = 0; k < count; k++) {
      matchingItems[k].invoiceId = inv.id;
    }
  }
  // generate items properly now
  const finalItems: typeof invoiceItems.$inferInsert[] = [];
  for (const inv of insertedInvoices) {
    const itemCount = 1 + Math.floor(Math.random() * 3);
    for (let k = 0; k < itemCount; k++) {
      const product = pick(insertedProducts);
      const productBatches = insertedBatches.filter(b => b.productId === product.id);
      if (productBatches.length === 0) continue;
      const batch = pick(productBatches);
      const qty = 5 + Math.floor(Math.random() * 50);
      const unitPrice = parseFloat(product.salePrice);
      finalItems.push({
        invoiceId: inv.id,
        productId: product.id,
        batchId: batch.id,
        quantity: qty,
        unitPrice: unitPrice.toString(),
        subtotal: (qty * unitPrice).toFixed(2),
      });
    }
  }
  if (finalItems.length > 0) {
    await db.insert(invoiceItems).values(finalItems);
    console.log(`  Inserted ${finalItems.length} invoice items`);
  }

  // ── Stock Transactions ───────────────────────────────────────────────────
  const txnData: typeof stockTransactions.$inferInsert[] = [];
  for (const batch of insertedBatches.slice(0, 20)) {
    const numTxns = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numTxns; i++) {
      txnData.push({
        productId: batch.productId,
        batchId: batch.id,
        type: pick(TXN_TYPE),
        quantity: 10 + Math.floor(Math.random() * 100),
        referenceId: Math.random() > 0.5 ? `REF-${Date.now()}-${i}` : null,
        notes: Math.random() > 0.5 ? 'Seeded transaction' : null,
        createdBy: insertedDealers[0].id,
      });
    }
  }
  const insertedTxns = await db.insert(stockTransactions).values(txnData).returning();
  console.log(`  Inserted ${insertedTxns.length} stock transactions`);

  // ── Cash Recovery Payments ───────────────────────────────────────────────
  const paymentData: typeof cashRecoveryPayments.$inferInsert[] = [];
  const unpaidInvoices = insertedInvoices.filter(i => i.paymentStatus !== 'PAID');
  for (const inv of unpaidInvoices.slice(0, 10)) {
    const amt = parseFloat(inv.balanceDue) * (0.3 + Math.random() * 0.7);
    paymentData.push({
      receiptNumber: `REC-2026-${String(paymentData.length + 1).padStart(4, '0')}`,
      dealerId: inv.dealerId,
      invoiceId: inv.id,
      amount: amt.toFixed(2),
      paymentMethod: pick(PAYMENT_METHOD),
      chequeNumber: null,
      chequeClearingDate: null,
      receiptImageUrl: null,
      collectedBy: insertedDealers[0].id,
      notes: 'Seeded payment',
    });
  }
  if (paymentData.length > 0) {
    await db.insert(cashRecoveryPayments).values(paymentData);
    console.log(`  Inserted ${paymentData.length} payments`);
  }

  console.log('Seeding complete.');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
