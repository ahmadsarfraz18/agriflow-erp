'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
}

const TOOL_LABELS: Record<string, string> = {
  check_inventory: 'Inventory Check',
  get_dealer_khata: 'Dealer Lookup',
  get_overdue_recoveries: 'Overdue Report',
  record_payment: 'Payment Recorded',
  get_sales_summary: 'Sales Summary',
};

const TOOL_ICONS: Record<string, string> = {
  check_inventory: '📦',
  get_dealer_khata: '📒',
  get_overdue_recoveries: '⚠️',
  record_payment: '💰',
  get_sales_summary: '📊',
};

const SUGGESTIONS = [
  'What products are low on stock?',
  'Show expiring batches',
  'Look up a dealer',
  'Show overdue payments',
  'Record a payment',
  'Sales summary',
];

/* eslint-disable @typescript-eslint/no-explicit-any */

function parseResult(result: unknown): any {
  if (typeof result === 'string') {
    try { return JSON.parse(result); } catch { return { message: result }; }
  }
  return result;
}

function ToolInventoryResult({ data }: { data: any }) {
  const items = data.items ?? [];
  if (items.length === 0) {
    return <div className="px-2.5 py-2 text-gray-500 italic">No matching inventory found.</div>;
  }
  return (
    <div className="px-2.5 py-2 space-y-1.5">
      <p className="text-[11px] text-gray-500 mb-1.5">{data.message ?? `${items.length} item(s)`}</p>
      {items.slice(0, 5).map((item: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-2 py-1.5">
          <div className="min-w-0">
            <p className="font-medium text-gray-800 truncate">{item.product}</p>
            <p className="text-[10px] text-gray-400">{item.brand} · {item.batch}</p>
          </div>
          <div className="shrink-0 text-right">
            <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              item.low_stock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {item.stock} units
            </span>
            <p className="text-[10px] text-gray-400 mt-0.5">exp: {item.expiry}</p>
          </div>
        </div>
      ))}
      {items.length > 5 && <p className="text-[10px] text-gray-400 text-center">+{items.length - 5} more</p>}
    </div>
  );
}

function ToolDealerResult({ data }: { data: any }) {
  const dealers = data.dealers ?? [];
  if (dealers.length === 0) {
    return <div className="px-2.5 py-2 text-gray-500 italic">{data.message ?? 'No dealers found.'}</div>;
  }
  return (
    <div className="px-2.5 py-2 space-y-1.5">
      <p className="text-[11px] text-gray-500 mb-1.5">{data.message ?? `${dealers.length} dealer(s)`}</p>
      {dealers.slice(0, 4).map((d: any, i: number) => (
        <div key={i} className="rounded-md bg-gray-50 px-2 py-1.5">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-800">{d.business_name}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              d.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>{d.status === 'ACTIVE' ? 'Active' : 'Blocked'}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-400">
            <span>Balance: PKR {Number(d.current_balance).toLocaleString()}</span>
            <span>·</span>
            <span>{d.area_zone}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ToolOverdueResult({ data }: { data: any }) {
  const invoices = data.invoices ?? [];
  if (invoices.length === 0) {
    return <div className="px-2.5 py-2 text-gray-500 italic">{data.message ?? 'No overdue invoices.'}</div>;
  }
  return (
    <div className="px-2.5 py-2 space-y-1.5">
      <p className="text-[11px] text-gray-500 mb-1.5">{data.message ?? `${invoices.length} overdue`}</p>
      {invoices.slice(0, 4).map((inv: any, i: number) => (
        <div key={i} className="flex items-center justify-between rounded-md bg-red-50 px-2 py-1.5">
          <div>
            <p className="font-medium text-gray-800">{inv.dealer}</p>
            <p className="text-[10px] text-gray-400">{inv.invoice_number} · {inv.days_overdue}d overdue</p>
          </div>
          <p className="text-[11px] font-semibold text-red-600">PKR {Number(inv.balance_due).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

function ToolPaymentResult({ data }: { data: any }) {
  if (data.success === false) {
    return <div className="px-2.5 py-2 text-red-600 text-[11px]">{data.error ?? 'Payment failed.'}</div>;
  }
  return (
    <div className="px-2.5 py-2">
      <div className="rounded-md bg-green-50 px-2.5 py-2 text-center">
        <p className="text-lg font-bold text-green-700">PKR {Number(data.amount).toLocaleString()}</p>
        <p className="text-[10px] text-green-600 mt-0.5">Payment recorded for {data.dealer}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Receipt: {data.receipt_number}</p>
        <p className="text-[10px] text-gray-400">New balance: PKR {Number(data.new_balance).toLocaleString()}</p>
      </div>
    </div>
  );
}

function ToolSummaryResult({ data }: { data: any }) {
  if (data.error) {
    return <div className="px-2.5 py-2 text-gray-500 italic">{data.error}</div>;
  }
  return (
    <div className="px-2.5 py-2">
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: 'Products', value: data.total_products, color: 'text-indigo-600' },
          { label: 'Batches', value: data.total_batches, color: 'text-indigo-600' },
          { label: 'Inventory Value', value: `PKR ${Number(data.inventory_value ?? 0).toLocaleString()}`, color: 'text-green-600' },
          { label: 'Receivable', value: `PKR ${Number(data.total_receivable ?? 0).toLocaleString()}`, color: 'text-orange-600' },
          { label: "Today's Collections", value: `PKR ${Number(data.today_collections ?? 0).toLocaleString()}`, color: 'text-green-600' },
          { label: 'Active Dealers', value: data.active_dealers, color: 'text-indigo-600' },
        ].map((item) => (
          <div key={item.label} className="rounded-md bg-gray-50 px-2 py-1.5 text-center">
            <p className={`text-sm font-bold ${item.color}`}>{item.value ?? 0}</p>
            <p className="text-[9px] text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolResult({ name, result }: { name: string; result: unknown }) {
  const data = parseResult(result);
  switch (name) {
    case 'check_inventory': return <ToolInventoryResult data={data} />;
    case 'get_dealer_khata': return <ToolDealerResult data={data} />;
    case 'get_overdue_recoveries': return <ToolOverdueResult data={data} />;
    case 'record_payment': return <ToolPaymentResult data={data} />;
    case 'get_sales_summary': return <ToolSummaryResult data={data} />;
    default:
      return (
        <div className="px-2.5 py-2">
          <pre className="max-h-32 overflow-auto whitespace-pre-wrap text-[11px] text-gray-500">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
  }
}

function ToolCallBadge({ tool }: { tool: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[tool.name] ?? tool.name;
  const icon = TOOL_ICONS[tool.name] ?? '🔧';

  return (
    <div className="mt-1.5 rounded-lg border border-gray-200 bg-white text-xs overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm">{icon}</span>
        <span className="font-medium text-gray-700">{label}</span>
        <span className="ml-auto text-gray-400">{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && (
        <div className="border-t border-gray-100">
          <ToolResult name={tool.name} result={tool.result} />
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
        AI
      </div>
      <div className="rounded-2xl rounded-tl-md bg-gray-100 px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function UserBubble({ msg }: { msg: Message }) {
  return (
    <div className="flex items-start justify-end gap-2.5">
      <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-indigo-600 px-4 py-2.5 text-white">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
        U
      </div>
    </div>
  );
}

function AssistantBubble({ msg }: { msg: Message }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
        AI
      </div>
      <div className="max-w-[80%] space-y-1">
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="space-y-1">
            {msg.toolCalls.map((tc, i) => (
              <ToolCallBadge key={i} tool={tc} />
            ))}
          </div>
        )}
        {msg.content && (
          <div className="rounded-2xl rounded-tl-md bg-gray-100 px-4 py-2.5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{msg.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m AgriFlow AI. I can help you check inventory, look up dealer info, or track payments. What would you like to know?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;

    const userMessage: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Sorry, something went wrong. Please try again.` },
        ]);
        return;
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.message?.content ?? '',
          toolCalls: data.toolCalls,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out ${
          isOpen
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-4 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex h-[520px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-indigo-600 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                AI
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
                <p className="text-xs text-indigo-100">Ask about crops, pesticides, dealers</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((message, index) =>
              message.role === 'user' ? (
                <UserBubble key={index} msg={message} />
              ) : (
                <AssistantBubble key={index} msg={message} />
              )
            )}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={isLoading}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                autoComplete="off"
                autoFocus={isOpen}
                className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
          isOpen
            ? 'bg-gray-800 rotate-0 hover:bg-gray-900'
            : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-110'
        }`}
      >
        {isOpen ? (
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </>
  );
}
