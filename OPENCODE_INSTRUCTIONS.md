# SPECIFICATION & IMPLEMENTATION PROMPT: AGRI-FLOW ERP (Pesticide Inventory & Cash Recovery Platform)

You are an expert full-stack engineer and AI systems architect. Your goal is to build **AgriFlow ERP**—an enterprise-grade, real-time Inventory, Batch-Expiry Tracking, Cash Recovery (Khata Ledger), and OpenAI Agentic Assistant system designed specifically for pesticide & agrochemical distributors.

Follow this specification step-by-step to scaffold, implement, test, and polish the complete production-ready application.

---

## 1. TECH STACK ARCHITECTURE

- **Framework**: Next.js 15 (App Router, Server Actions, React 19, TypeScript)
- **Styling & UI**: Tailwind CSS, shadcn/ui, Lucide Icons, Recharts (for analytics & recovery aging)
- **Database & Auth**: Supabase (PostgreSQL) + Drizzle ORM (schema-first, type-safe migrations)
- **AI Agent Integration**: OpenAI Agents SDK / official OpenAI SDK with Function Calling & Tools
- **State Management & Validation**: TanStack Query / React Server Components, Zod schemas, React Hook Form
- **Storage**: Supabase Storage (Invoices, payment receipts, pesticide batch lab-reports)

---

## 2. DATABASE SCHEMA DESIGN (`drizzle/schema.ts`)

Implement the following relational tables using Drizzle ORM:

### 2.1 Products & Batches
- **`products`**:
  - `id`: UUID (Primary Key, default gen_random_uuid())
  - `name`: VARCHAR (e.g., "Chlorpyrifos 40% EC")
  - `brand_name`: VARCHAR (e.g., "AgroGuard")
  - `active_ingredient`: VARCHAR (e.g., "Chlorpyrifos")
  - `category`: ENUM ('INSECTICIDE', 'HERBICIDE', 'FUNGICIDE', 'FERTILIZER', 'PGR')
  - `pack_size`: VARCHAR (e.g., "1 Litre", "500ml", "25kg")
  - `unit_of_measure`: VARCHAR (e.g., "Litres", "Bottles", "Bags")
  - `cost_price`: DECIMAL(12, 2)
  - `sale_price`: DECIMAL(12, 2)
  - `min_threshold`: INTEGER (alert when stock goes below this)
  - `created_at`, `updated_at`: TIMESTAMP

- **`batches`**:
  - `id`: UUID (Primary Key)
  - `product_id`: UUID (Foreign Key -> `products.id` on delete cascade)
  - `batch_number`: VARCHAR (Unique per product)
  - `mfg_date`: DATE
  - `expiry_date`: DATE
  - `quantity_initial`: INTEGER
  - `quantity_current`: INTEGER
  - `warehouse_location`: VARCHAR (e.g., "Rack-A2", "Depot 1")
  - `status`: ENUM ('ACTIVE', 'NEAR_EXPIRY', 'EXPIRED', 'DEPLETED')
  - `created_at`: TIMESTAMP

- **`stock_transactions`**:
  - `id`: UUID (Primary Key)
  - `product_id`: UUID (FK)
  - `batch_id`: UUID (FK)
  - `type`: ENUM ('PURCHASE_IN', 'SALE_OUT', 'RETURN_IN', 'DAMAGE_OUT', 'SAMPLE_OUT')
  - `quantity`: INTEGER
  - `reference_id`: VARCHAR (Invoice number or GRN)
  - `notes`: TEXT
  - `created_by`: UUID (FK -> users)
  - `created_at`: TIMESTAMP

### 2.2 Dealers, Ledgers & Invoicing (Cash Recovery)
- **`dealers`**:
  - `id`: UUID (Primary Key)
  - `business_name`: VARCHAR (e.g., "Rehman Kissan Store")
  - `owner_name`: VARCHAR
  - `phone`: VARCHAR
  - `whatsapp_number`: VARCHAR
  - `area_zone`: VARCHAR (e.g., "Multan Sub-Division A", "Gujranwala South")
  - `address`: TEXT
  - `credit_limit`: DECIMAL(12, 2) (e.g., 500,000 PKR)
  - `current_balance`: DECIMAL(12, 2) (Positive = Receivable / Khata Due)
  - `status`: ENUM ('ACTIVE', 'BLOCKED_CREDIT', 'INACTIVE')
  - `created_at`: TIMESTAMP

- **`invoices`**:
  - `id`: UUID (Primary Key)
  - `invoice_number`: VARCHAR (Unique, e.g., "INV-2026-0089")
  - `dealer_id`: UUID (FK -> `dealers.id`)
  - `total_amount`: DECIMAL(12, 2)
  - `discount_amount`: DECIMAL(12, 2) default 0
  - `net_amount`: DECIMAL(12, 2)
  - `paid_amount`: DECIMAL(12, 2) default 0
  - `balance_due`: DECIMAL(12, 2)
  - `payment_status`: ENUM ('PAID', 'PARTIALLY_PAID', 'UNPAID', 'OVERDUE')
  - `issue_date`: DATE
  - `due_date`: DATE
  - `created_at`: TIMESTAMP

- **`invoice_items`**:
  - `id`: UUID (Primary Key)
  - `invoice_id`: UUID (FK -> `invoices.id`)
  - `product_id`: UUID (FK -> `products.id`)
  - `batch_id`: UUID (FK -> `batches.id`)
  - `quantity`: INTEGER
  - `unit_price`: DECIMAL(12, 2)
  - `subtotal`: DECIMAL(12, 2)

- **`cash_recovery_payments`**:
  - `id`: UUID (Primary Key)
  - `receipt_number`: VARCHAR (Unique, e.g., "REC-2026-0412")
  - `dealer_id`: UUID (FK -> `dealers.id`)
  - `invoice_id`: UUID (Nullable FK -> `invoices.id` for specific invoice knock-off)
  - `amount`: DECIMAL(12, 2)
  - `payment_method`: ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE_PAY')
  - `cheque_number`: VARCHAR (nullable)
  - `cheque_clearing_date`: DATE (nullable)
  - `receipt_image_url`: VARCHAR (nullable)
  - `collected_by`: UUID (FK -> users / recovery officers)
  - `notes`: TEXT
  - `created_at`: TIMESTAMP

---

## 3. OPENAI AGENTIC ASSISTANT SETUP (`lib/agent/`)

Implement an autonomous, multi-tool AI assistant for managers and field recovery officers.

### 3.1 Agent Tools
1. **`check_inventory_tool`**:
   - Parameters: `product_name` (optional), `category` (optional), `expiring_within_days` (optional).
   - Returns: Current stock counts across batches, expiring stock alerts, warehouse locations.
2. **`get_dealer_khata_tool`**:
   - Parameters: `dealer_name` or `zone`.
   - Returns: Total balance, credit limit, last 5 payments, overdue aging (0-30, 31-60, 90+ days).
3. **`get_overdue_recoveries_tool`**:
   - Parameters: `zone` (optional), `min_days_overdue` (default: 15), `limit` (default: 10).
   - Returns: Prioritized list of defaulting/delayed dealers with phone numbers and overdue amounts.
4. **`log_payment_entry_tool`**:
   - Parameters: `dealer_id`, `amount`, `payment_method`, `notes`.
   - Executes: DB transaction that reduces `dealer.current_balance`, logs `cash_recovery_payments`, and reconciles oldest invoices.

### 3.2 Agent System Prompt
Define a prompt giving the agent full context of pesticide industry workflows (seasonal demand, shelf-life sensitivity, field recovery schedules) and instructing it to respond concisely with actionable insights and Roman Urdu / English bilingual capability.

---

## 4. APPLICATION MODULES & UI PAGES

- **`/dashboard`**: High-level KPIs: Total Inventory Value, Critical Expiring Batches (< 60 Days), Total Cash Receivable, Overdue Recoveries, Today's Collections.
- **`/inventory`**:
  - Product catalog table with filters (Chemical formula, pack size, stock status).
  - Batch detail drawer showing batch numbers, manufacturing/expiry dates, warehouse bins.
  - Stock in/out modal with automatic FIFO (First-In, First-Out) recommendation.
- **`/dealers` (Khata Management)**:
  - Dealer list with live credit limit badges and balance indicators.
  - Detailed Dealer Profile: Ledger history, all past invoices, and payment receipts download.
- **`/recovery`**:
  - Mobile-friendly Quick Payment Entry form for field officers (Cash / Cheque collection).
  - Aging Analysis chart (30/60/90+ days bucketing).
- **`/agent-assistant`**:
  - Full-screen / drawer interactive AI Agent Chat equipped with real-time tool execution badges and instant data tables.

---

## 5. STEP-BY-STEP BUILD & EXECUTION SEQUENCE FOR OPENCODE

When running this task in OpenCode, execute the phases below in sequence:

### Step 1: Project Initialization & Dependency Installation
```bash
npx create-next-app@latest agri-flow-erp --typescript --tailwind --app --src-dir --import-alias "@/*" --use-pnpm
cd agri-flow-erp
pnpm add @supabase/supabase-js drizzle-orm postgres dotenv zod lucide-react clsx tailwind-merge recharts react-hook-form @hookform/resolvers openai
pnpm add -D drizzle-kit tsx @types/node
pnpm dlx shadcn@latest init -d
pnpm dlx shadcn@latest add button card table dialog input select badge tabs dropdown-menu
```

### Step 2: Environment Variables Configuration (`.env.local`)
Create `.env.local` template:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
OPENAI_API_KEY=your_openai_api_key
```

### Step 3: Database & Drizzle ORM Setup
- Create `src/db/schema.ts` with all models defined in Section 2.
- Configure `drizzle.config.ts`.
- Run migrations: `npx drizzle-kit generate` and `npx drizzle-kit push`.

### Step 4: Server Actions & Business Logic
- `src/app/actions/inventory.ts`: Product CRUD, batch registration, FIFO stock deduction.
- `src/app/actions/dealers.ts`: Dealer profile management, credit limit checks.
- `src/app/actions/recovery.ts`: Payment recording, Khata reconciliation transaction.

### Step 5: OpenAI Agent API Route (`src/app/api/agent/route.ts`)
- Implement the OpenAI function-calling loop handling tool calls for inventory queries, dealer khata summaries, and payment entries.

### Step 6: Frontend Pages & Interactive UI
- Build responsive layout with navigation sidebar.
- Implement `/dashboard`, `/inventory`, `/dealers`, `/recovery`, and `/agent-assistant`.

---

## 6. VALIDATION CRITERIA
1. **FIFO Stock Deduction**: Ensure sales deductions pull from the earliest expiring batch first.
2. **Khata Integrity**: Ensure all invoice creations and payment entries update dealer balances inside atomic transactions.
3. **Agent Accuracy**: Test agent queries: *"Konsa pesticide batch jaldi expire ho raha hai?"* and *"Sub se zyada overdue payments kis dealer ki hain?"* to verify tool calling accuracy.
