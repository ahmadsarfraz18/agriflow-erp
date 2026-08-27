import { relations } from "drizzle-orm/relations";
import { products, batches, dealers, cashRecoveryPayments, invoices, invoiceItems, stockTransactions } from "./schema";

export const batchesRelations = relations(batches, ({one, many}) => ({
	product: one(products, {
		fields: [batches.productId],
		references: [products.id]
	}),
	invoiceItems: many(invoiceItems),
	stockTransactions: many(stockTransactions),
}));

export const productsRelations = relations(products, ({many}) => ({
	batches: many(batches),
	invoiceItems: many(invoiceItems),
	stockTransactions: many(stockTransactions),
}));

export const cashRecoveryPaymentsRelations = relations(cashRecoveryPayments, ({one}) => ({
	dealer: one(dealers, {
		fields: [cashRecoveryPayments.dealerId],
		references: [dealers.id]
	}),
	invoice: one(invoices, {
		fields: [cashRecoveryPayments.invoiceId],
		references: [invoices.id]
	}),
}));

export const dealersRelations = relations(dealers, ({many}) => ({
	cashRecoveryPayments: many(cashRecoveryPayments),
	invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({one, many}) => ({
	cashRecoveryPayments: many(cashRecoveryPayments),
	dealer: one(dealers, {
		fields: [invoices.dealerId],
		references: [dealers.id]
	}),
	invoiceItems: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({one}) => ({
	batch: one(batches, {
		fields: [invoiceItems.batchId],
		references: [batches.id]
	}),
	invoice: one(invoices, {
		fields: [invoiceItems.invoiceId],
		references: [invoices.id]
	}),
	product: one(products, {
		fields: [invoiceItems.productId],
		references: [products.id]
	}),
}));

export const stockTransactionsRelations = relations(stockTransactions, ({one}) => ({
	batch: one(batches, {
		fields: [stockTransactions.batchId],
		references: [batches.id]
	}),
	product: one(products, {
		fields: [stockTransactions.productId],
		references: [products.id]
	}),
}));