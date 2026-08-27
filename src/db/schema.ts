import { pgTable, uuid, varchar, text, integer, decimal, timestamp, date, pgEnum } from 'drizzle-orm/pg-core';

export const productCategoryEnum = pgEnum('product_category', [
  'INSECTICIDE',
  'HERBICIDE',
  'FUNGICIDE',
  'FERTILIZER',
  'PGR',
]);

export const batchStatusEnum = pgEnum('batch_status', [
  'ACTIVE',
  'NEAR_EXPIRY',
  'EXPIRED',
  'DEPLETED',
]);

export const stockTransactionTypeEnum = pgEnum('stock_transaction_type', [
  'PURCHASE_IN',
  'SALE_OUT',
  'RETURN_IN',
  'DAMAGE_OUT',
  'SAMPLE_OUT',
]);

export const dealerStatusEnum = pgEnum('dealer_status', [
  'ACTIVE',
  'BLOCKED_CREDIT',
  'INACTIVE',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PAID',
  'PARTIALLY_PAID',
  'UNPAID',
  'OVERDUE',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'CASH',
  'BANK_TRANSFER',
  'CHEQUE',
  'ONLINE_PAY',
]);

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  brandName: varchar('brand_name', { length: 255 }).notNull(),
  activeIngredient: varchar('active_ingredient', { length: 255 }).notNull(),
  category: productCategoryEnum('category').notNull(),
  packSize: varchar('pack_size', { length: 100 }).notNull(),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }).notNull(),
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }).notNull(),
  salePrice: decimal('sale_price', { precision: 12, scale: 2 }).notNull(),
  minThreshold: integer('min_threshold').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const batches = pgTable('batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  batchNumber: varchar('batch_number', { length: 100 }).notNull(),
  mfgDate: date('mfg_date').notNull(),
  expiryDate: date('expiry_date').notNull(),
  quantityInitial: integer('quantity_initial').notNull(),
  quantityCurrent: integer('quantity_current').notNull(),
  warehouseLocation: varchar('warehouse_location', { length: 100 }).notNull(),
  status: batchStatusEnum('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stockTransactions = pgTable('stock_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  batchId: uuid('batch_id').references(() => batches.id).notNull(),
  type: stockTransactionTypeEnum('type').notNull(),
  quantity: integer('quantity').notNull(),
  referenceId: varchar('reference_id', { length: 100 }),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dealers = pgTable('dealers', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  ownerName: varchar('owner_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  whatsappNumber: varchar('whatsapp_number', { length: 20 }),
  areaZone: varchar('area_zone', { length: 255 }).notNull(),
  address: text('address'),
  creditLimit: decimal('credit_limit', { precision: 12, scale: 2 }).notNull(),
  currentBalance: decimal('current_balance', { precision: 12, scale: 2 }).notNull(),
  status: dealerStatusEnum('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  dealerId: uuid('dealer_id').references(() => dealers.id).notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).default('0'),
  netAmount: decimal('net_amount', { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).default('0'),
  balanceDue: decimal('balance_due', { precision: 12, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum('payment_status').notNull(),
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').references(() => invoices.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  batchId: uuid('batch_id').references(() => batches.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
});

export const cashRecoveryPayments = pgTable('cash_recovery_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  receiptNumber: varchar('receipt_number', { length: 50 }).notNull(),
  dealerId: uuid('dealer_id').references(() => dealers.id).notNull(),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  chequeNumber: varchar('cheque_number', { length: 100 }),
  chequeClearingDate: date('cheque_clearing_date'),
  receiptImageUrl: varchar('receipt_image_url', { length: 500 }),
  collectedBy: uuid('collected_by').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});