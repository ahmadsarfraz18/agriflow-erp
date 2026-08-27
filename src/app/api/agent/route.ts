import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';
import { db } from '@/db';
import {
  products,
  batches,
  dealers,
  invoices,
  cashRecoveryPayments,
} from '@/db/schema';
import { eq, and, lte, desc, sql } from 'drizzle-orm';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const toolDeclarations = [
  {
    name: 'check_inventory',
    description: 'Check current inventory status, stock levels, low-stock alerts, and batches approaching expiry. Use this when the user asks about stock, inventory, products, expiry, or what products are available.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        product_name: { type: 'string', description: 'Filter by product name (partial match, optional)' },
        category: {
          type: 'string',
          enum: ['INSECTICIDE', 'HERBICIDE', 'FUNGICIDE', 'FERTILIZER', 'PGR'],
          description: 'Filter by product category (optional)',
        },
        expiring_within_days: { type: 'number', description: 'Show batches expiring within this many days (optional)' },
        low_stock_only: { type: 'boolean', description: 'Only show products where stock is below minimum threshold (optional)' },
      },
    },
  },
  {
    name: 'get_dealer_khata',
    description: 'Get dealer khata (ledger) information including balance, credit limit, status, recent invoices, and payment history. Use this when the user asks about a specific dealer, their balance, credit status, or transaction history.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        dealer_name: { type: 'string', description: 'Dealer business name to search for (partial match, optional)' },
        zone: { type: 'string', description: 'Filter by area zone (optional)' },
        dealer_id: { type: 'string', description: 'Exact dealer UUID (optional, for precise lookups)' },
      },
    },
  },
  {
    name: 'get_overdue_recoveries',
    description: 'Get list of overdue unpaid invoices and defaulting dealers. Use this when the user asks about overdue payments, outstanding dues, or defaulting dealers.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        zone: { type: 'string', description: 'Filter by area zone (optional)' },
        min_days_overdue: { type: 'number', description: 'Minimum days overdue (default: 15)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 10)' },
      },
    },
  },
  {
    name: 'record_payment',
    description: 'Record a payment received from a dealer. This will update the dealer balance and optionally apply to a specific invoice. Use this when the user wants to log or record a payment.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        dealer_name: { type: 'string', description: 'Dealer business name to find the dealer (optional, used if dealer_id not provided)' },
        dealer_id: { type: 'string', description: 'UUID of the dealer (optional, preferred)' },
        amount: { type: 'number', description: 'Payment amount in PKR' },
        payment_method: {
          type: 'string',
          enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE_PAY'],
          description: 'Payment method',
        },
        invoice_id: { type: 'string', description: 'UUID of specific invoice to apply payment to (optional)' },
        notes: { type: 'string', description: 'Additional notes (optional)' },
      },
      required: ['amount', 'payment_method'],
    },
  },
  {
    name: 'get_sales_summary',
    description: 'Get a summary of total inventory value, receivables, and today\'s collections. Use this when the user asks for a summary, overview, or dashboard-like stats.',
    parametersJsonSchema: {
      type: 'object',
      properties: {},
    },
  },
];

async function executeToolCall(toolName: string, args: Record<string, unknown>) {
  switch (toolName) {
    // ─── check_inventory ─────────────────────────────────────────────────────
    case 'check_inventory': {
      const conditions: ReturnType<typeof eq>[] = [];

      if (args.product_name) {
        const name = args.product_name as string;
        conditions.push(sql`${products.name} ILIKE ${'%' + name + '%'}`);
      }
      if (args.category) {
        conditions.push(eq(products.category, args.category as 'INSECTICIDE' | 'HERBICIDE' | 'FUNGICIDE' | 'FERTILIZER' | 'PGR'));
      }
      if (args.expiring_within_days) {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() + (args.expiring_within_days as number));
        conditions.push(lte(batches.expiryDate, threshold.toISOString().split('T')[0]));
      }
      if (args.low_stock_only) {
        conditions.push(sql`${batches.quantityCurrent} < ${products.minThreshold}`);
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const results = await db
        .select({
          product_name: products.name,
          brand_name: products.brandName,
          category: products.category,
          pack_size: products.packSize,
          min_threshold: products.minThreshold,
          batch_number: batches.batchNumber,
          quantity_current: batches.quantityCurrent,
          expiry_date: batches.expiryDate,
          warehouse_location: batches.warehouseLocation,
          batch_status: batches.status,
        })
        .from(products)
        .innerJoin(batches, eq(products.id, batches.productId))
        .where(where)
        .orderBy(products.name, batches.expiryDate);

      if (results.length === 0) {
        return { message: 'No matching inventory found.', items: [] };
      }

      const items = results.map(r => ({
        product: r.product_name,
        brand: r.brand_name,
        category: r.category,
        batch: r.batch_number,
        stock: r.quantity_current,
        min_threshold: r.min_threshold,
        low_stock: r.quantity_current < r.min_threshold,
        expiry: r.expiry_date,
        location: r.warehouse_location,
        status: r.batch_status,
      }));

      return {
        message: `Found ${items.length} batch(es) matching your query.`,
        items,
      };
    }

    // ─── get_dealer_khata ────────────────────────────────────────────────────
    case 'get_dealer_khata': {
      const conditions: ReturnType<typeof eq>[] = [];

      if (args.dealer_id) {
        conditions.push(eq(dealers.id, args.dealer_id as string));
      } else if (args.dealer_name) {
        conditions.push(sql`${dealers.businessName} ILIKE ${'%' + (args.dealer_name as string) + '%'}`);
      }
      if (args.zone) {
        conditions.push(eq(dealers.areaZone, args.zone as string));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const dealerResults = await db.select().from(dealers).where(where).orderBy(dealers.businessName);

      if (dealerResults.length === 0) {
        return { message: 'No dealers found matching your query.', dealers: [] };
      }

      const dealersWithInvoices = await Promise.all(
        dealerResults.map(async (d) => {
          const recentInvoices = await db
            .select()
            .from(invoices)
            .where(eq(invoices.dealerId, d.id))
            .orderBy(desc(invoices.createdAt))
            .limit(5);

          const totalOutstanding = await db
            .select({ total: sql<string>`COALESCE(SUM(CAST(${invoices.balanceDue} AS NUMERIC)), 0)` })
            .from(invoices)
            .where(and(eq(invoices.dealerId, d.id), sql`CAST(${invoices.balanceDue} AS NUMERIC) > 0`));

          return {
            id: d.id,
            business_name: d.businessName,
            owner_name: d.ownerName,
            phone: d.phone,
            area_zone: d.areaZone,
            current_balance: d.currentBalance,
            credit_limit: d.creditLimit,
            status: d.status,
            total_outstanding: totalOutstanding[0]?.total ?? '0',
            recent_invoices: recentInvoices.map(i => ({
              invoice_number: i.invoiceNumber,
              net_amount: i.netAmount,
              paid_amount: i.paidAmount,
              balance_due: i.balanceDue,
              status: i.paymentStatus,
              due_date: i.dueDate,
            })),
          };
        })
      );

      return {
        message: `Found ${dealersWithInvoices.length} dealer(s).`,
        dealers: dealersWithInvoices,
      };
    }

    // ─── get_overdue_recoveries ──────────────────────────────────────────────
    case 'get_overdue_recoveries': {
      const minDays = (args.min_days_overdue as number) || 15;
      const limit = (args.limit as number) || 10;

      const threshold = new Date();
      threshold.setDate(threshold.getDate() - minDays);

      const conditions = [
        eq(invoices.paymentStatus, 'UNPAID'),
        lte(invoices.dueDate, threshold.toISOString().split('T')[0]),
      ];

      if (args.zone) {
        const zoneDealers = await db
          .select({ id: dealers.id })
          .from(dealers)
          .where(eq(dealers.areaZone, args.zone as string));
        const zoneIds = zoneDealers.map(d => d.id);
        if (zoneIds.length > 0) {
          conditions.push(sql`${invoices.dealerId} IN ${zoneIds}`);
        } else {
          return { message: 'No dealers in that zone.', invoices: [] };
        }
      }

      const results = await db
        .select({
          invoice_id: invoices.id,
          invoice_number: invoices.invoiceNumber,
          net_amount: invoices.netAmount,
          paid_amount: invoices.paidAmount,
          balance_due: invoices.balanceDue,
          due_date: invoices.dueDate,
          created_at: invoices.createdAt,
          dealer_id: dealers.id,
          dealer_name: dealers.businessName,
          owner_name: dealers.ownerName,
          phone: dealers.phone,
          zone: dealers.areaZone,
        })
        .from(invoices)
        .innerJoin(dealers, eq(invoices.dealerId, dealers.id))
        .where(and(...conditions))
        .orderBy(invoices.dueDate)
        .limit(limit);

      if (results.length === 0) {
        return { message: 'No overdue invoices found.', invoices: [] };
      }

      const items = results.map(r => {
        const daysOverdue = Math.floor(
          (new Date().getTime() - new Date(r.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          invoice_number: r.invoice_number,
          balance_due: r.balance_due,
          due_date: r.due_date,
          days_overdue: daysOverdue,
          dealer: r.dealer_name,
          owner: r.owner_name,
          phone: r.phone,
          zone: r.zone,
        };
      });

      return {
        message: `Found ${items.length} overdue invoice(s).`,
        invoices: items,
      };
    }

    // ─── record_payment ──────────────────────────────────────────────────────
    case 'record_payment': {
      let dealerId = args.dealer_id as string | undefined;

      if (!dealerId && args.dealer_name) {
        const matched = await db
          .select()
          .from(dealers)
          .where(sql`${dealers.businessName} ILIKE ${'%' + (args.dealer_name as string) + '%'}`)
          .limit(1);
        if (matched.length === 0) {
          return { success: false, error: `No dealer found with name "${args.dealer_name}".` };
        }
        dealerId = matched[0].id;
      }

      if (!dealerId) {
        return { success: false, error: 'Please provide a dealer_id or dealer_name.' };
      }

      const amount = args.amount as number;
      if (!amount || amount <= 0) {
        return { success: false, error: 'Payment amount must be a positive number.' };
      }

      const receiptNumber = `REC-${Date.now()}`;

      await db.insert(cashRecoveryPayments).values({
        receiptNumber,
        dealerId,
        invoiceId: (args.invoice_id as string) || null,
        amount: amount.toString(),
        paymentMethod: args.payment_method as 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE_PAY',
        notes: (args.notes as string) || null,
        collectedBy: 'ai_assistant',
      });

      await db
        .update(dealers)
        .set({ currentBalance: sql`${dealers.currentBalance} - ${amount}` })
        .where(eq(dealers.id, dealerId));

      if (args.invoice_id) {
        const invoice = await db.select().from(invoices).where(eq(invoices.id, args.invoice_id as string));
        if (invoice.length > 0) {
          const paid = parseFloat(invoice[0].paidAmount ?? '0') + amount;
          const newBalance = parseFloat(invoice[0].totalAmount) - paid;
          await db
            .update(invoices)
            .set({
              paidAmount: paid.toString(),
              balanceDue: newBalance.toString(),
              paymentStatus: newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID',
            })
            .where(eq(invoices.id, args.invoice_id as string));
        }
      }

      const updatedDealer = await db.select().from(dealers).where(eq(dealers.id, dealerId)).then(r => r[0]);

      return {
        success: true,
        receipt_number: receiptNumber,
        amount,
        dealer: updatedDealer?.businessName,
        new_balance: updatedDealer?.currentBalance,
      };
    }

    // ─── get_sales_summary ───────────────────────────────────────────────────
    case 'get_sales_summary': {
      const [allProducts, allBatches, unpaidInvoices, todayPayments, allDealers] = await Promise.all([
        db.select().from(products),
        db.select().from(batches),
        db.select().from(invoices).where(eq(invoices.paymentStatus, 'UNPAID')),
        db.select().from(cashRecoveryPayments).where(
          sql`DATE(${cashRecoveryPayments.createdAt}) = CURRENT_DATE`
        ),
        db.select().from(dealers),
      ]);

      const inventoryValue = allBatches.reduce((sum, b) => {
        const product = allProducts.find(p => p.id === b.productId);
        return sum + (product ? b.quantityCurrent * parseFloat(product.salePrice) : 0);
      }, 0);

      const totalReceivable = unpaidInvoices.reduce((sum, i) => sum + parseFloat(i.balanceDue), 0);
      const todayCollection = todayPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const expiringBatches = allBatches.filter(b => {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() + 60);
        return b.status === 'ACTIVE' && b.expiryDate <= threshold.toISOString().split('T')[0];
      });

      return {
        total_products: allProducts.length,
        total_batches: allBatches.length,
        inventory_value: inventoryValue,
        total_receivable: totalReceivable,
        today_collections: todayCollection,
        active_dealers: allDealers.filter(d => d.status === 'ACTIVE').length,
        expiring_soon: expiringBatches.length,
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

const systemInstruction = `You are AgriFlow AI Assistant, an expert in agriculture, pesticides, crop management, and agrochemical distribution in Pakistan.

Your expertise covers:
- Pesticide types, usage, dosage, and crop-specific recommendations
- Disease and pest identification and treatment
- Crop management for wheat, cotton, rice, vegetables, fruits, and sugarcane
- Seasonal farming patterns (Rabi/Kharif seasons) in Pakistan
- Fertilizer recommendations and soil health
- Plant growth regulators and their applications
- Pesticide inventory management and batch tracking
- Dealer khata (ledger) management and credit systems
- Field recovery operations and payment collection
- Product categories: INSECTICIDE, HERBICIDE, FUNGICIDE, FERTILIZER, PGR

When responding:
- Be concise and actionable
- Use tables or bullet points when presenting data
- Provide practical advice for Pakistani farming conditions
- Recommend specific products when relevant
- Currency is PKR (Pakistani Rupees)
- You can communicate in English and Roman Urdu when requested
- For general agriculture questions, provide helpful knowledge even without tool access

Available tools:
1. check_inventory - Check stock levels, expiring batches, low-stock alerts
2. get_dealer_khata - Get dealer balance, credit status, and transaction history
3. get_overdue_recoveries - Find defaulting dealers with overdue invoices
4. record_payment - Record a payment from a dealer
5. get_sales_summary - Get overview stats (inventory value, receivables, today's collections)`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const contents = [
      { role: 'user' as const, parts: [{ text: systemInstruction }] },
      { role: 'model' as const, parts: [{ text: 'Understood. I am the AgriFlow AI Assistant, ready to help with inventory, dealer khata, and recovery operations. How can I assist you today?' }] },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.content }],
      })),
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        tools: [{ functionDeclarations: toolDeclarations }],
        toolConfig: {
          functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO },
        },
      },
    });

    const functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const toolResults: Array<{ name: string; args: Record<string, unknown>; result: unknown }> = [];
      const functionResponseParts = [];

      for (const fc of functionCalls) {
        const result = await executeToolCall(fc.name!, fc.args as Record<string, unknown>);
        toolResults.push({ name: fc.name!, args: fc.args as Record<string, unknown>, result });
        functionResponseParts.push({
          functionResponse: {
            name: fc.name,
            response: result,
          },
        });
      }

      const secondContents = [
        ...contents,
        { role: 'model' as const, parts: functionCalls.map(fc => ({ functionCall: { name: fc.name, args: fc.args } })) },
        { role: 'user' as const, parts: functionResponseParts },
      ];

      const secondResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: secondContents,
        config: {
          tools: [{ functionDeclarations: toolDeclarations }],
        },
      });

      return NextResponse.json({
        message: { content: secondResponse.text },
        toolCalls: toolResults.map(t => ({
          name: t.name,
          arguments: t.args,
          result: t.result,
        })),
      });
    }

    return NextResponse.json({
      message: { content: response.text },
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
