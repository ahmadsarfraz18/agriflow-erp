import { pgTable, foreignKey, uuid, varchar, date, integer, timestamp, text, numeric, pgEnum } from "drizzle-orm/pg-core"

export const batchStatus = pgEnum("batch_status", ['ACTIVE', 'NEAR_EXPIRY', 'EXPIRED', 'DEPLETED'])
export const dealerStatus = pgEnum("dealer_status", ['ACTIVE', 'BLOCKED_CREDIT', 'INACTIVE'])
export const paymentMethod = pgEnum("payment_method", ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE_PAY'])
export const paymentStatus = pgEnum("payment_status", ['PAID', 'PARTIALLY_PAID', 'UNPAID', 'OVERDUE'])
export const productCategory = pgEnum("product_category", ['INSECTICIDE', 'HERBICIDE', 'FUNGICIDE', 'FERTILIZER', 'PGR'])
export const stockTransactionType = pgEnum("stock_transaction_type", ['PURCHASE_IN', 'SALE_OUT', 'RETURN_IN', 'DAMAGE_OUT', 'SAMPLE_OUT'])


export const batches = pgTable("batches", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	batchNumber: varchar("batch_number", { length: 100 }).notNull(),
	mfgDate: date("mfg_date").notNull(),
	expiryDate: date("expiry_date").notNull(),
	quantityInitial: integer("quantity_initial").notNull(),
	quantityCurrent: integer("quantity_current").notNull(),
	warehouseLocation: varchar("warehouse_location", { length: 100 }).notNull(),
	status: batchStatus().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "batches_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const dealers = pgTable("dealers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	businessName: varchar("business_name", { length: 255 }).notNull(),
	ownerName: varchar("owner_name", { length: 255 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	whatsappNumber: varchar("whatsapp_number", { length: 20 }),
	areaZone: varchar("area_zone", { length: 255 }).notNull(),
	address: text(),
	creditLimit: numeric("credit_limit", { precision: 12, scale:  2 }).notNull(),
	currentBalance: numeric("current_balance", { precision: 12, scale:  2 }).notNull(),
	status: dealerStatus().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	brandName: varchar("brand_name", { length: 255 }).notNull(),
	activeIngredient: varchar("active_ingredient", { length: 255 }).notNull(),
	category: productCategory().notNull(),
	packSize: varchar("pack_size", { length: 100 }).notNull(),
	unitOfMeasure: varchar("unit_of_measure", { length: 50 }).notNull(),
	costPrice: numeric("cost_price", { precision: 12, scale:  2 }).notNull(),
	salePrice: numeric("sale_price", { precision: 12, scale:  2 }).notNull(),
	minThreshold: integer("min_threshold").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const cashRecoveryPayments = pgTable("cash_recovery_payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	receiptNumber: varchar("receipt_number", { length: 50 }).notNull(),
	dealerId: uuid("dealer_id").notNull(),
	invoiceId: uuid("invoice_id"),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	paymentMethod: paymentMethod("payment_method").notNull(),
	chequeNumber: varchar("cheque_number", { length: 100 }),
	chequeClearingDate: date("cheque_clearing_date"),
	receiptImageUrl: varchar("receipt_image_url", { length: 500 }),
	collectedBy: uuid("collected_by").notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.dealerId],
			foreignColumns: [dealers.id],
			name: "cash_recovery_payments_dealer_id_dealers_id_fk"
		}),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "cash_recovery_payments_invoice_id_invoices_id_fk"
		}),
]);

export const invoices = pgTable("invoices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
	dealerId: uuid("dealer_id").notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).notNull(),
	discountAmount: numeric("discount_amount", { precision: 12, scale:  2 }).default('0'),
	netAmount: numeric("net_amount", { precision: 12, scale:  2 }).notNull(),
	paidAmount: numeric("paid_amount", { precision: 12, scale:  2 }).default('0'),
	balanceDue: numeric("balance_due", { precision: 12, scale:  2 }).notNull(),
	paymentStatus: paymentStatus("payment_status").notNull(),
	issueDate: date("issue_date").notNull(),
	dueDate: date("due_date").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.dealerId],
			foreignColumns: [dealers.id],
			name: "invoices_dealer_id_dealers_id_fk"
		}),
]);

export const invoiceItems = pgTable("invoice_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	invoiceId: uuid("invoice_id").notNull(),
	productId: uuid("product_id").notNull(),
	batchId: uuid("batch_id").notNull(),
	quantity: integer().notNull(),
	unitPrice: numeric("unit_price", { precision: 12, scale:  2 }).notNull(),
	subtotal: numeric({ precision: 12, scale:  2 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [batches.id],
			name: "invoice_items_batch_id_batches_id_fk"
		}),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "invoice_items_invoice_id_invoices_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "invoice_items_product_id_products_id_fk"
		}),
]);

export const stockTransactions = pgTable("stock_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	batchId: uuid("batch_id").notNull(),
	type: stockTransactionType().notNull(),
	quantity: integer().notNull(),
	referenceId: varchar("reference_id", { length: 100 }),
	notes: text(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [batches.id],
			name: "stock_transactions_batch_id_batches_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "stock_transactions_product_id_products_id_fk"
		}),
]);
