'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
  check_inventory: 'Check Inventory',
  get_dealer_khata: 'Dealer Khata',
  get_overdue_recoveries: 'Overdue Recoveries',
  record_payment: 'Record Payment',
  get_sales_summary: 'Sales Summary',
};

const TOOL_ICONS: Record<string, string> = {
  check_inventory: '📦',
  get_dealer_khata: '📒',
  get_overdue_recoveries: '⚠️',
  record_payment: '💰',
  get_sales_summary: '📊',
};

function ToolCallCard({ tool }: { tool: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[tool.name] ?? tool.name;
  const icon = TOOL_ICONS[tool.name] ?? '🔧';

  const argsList = Object.entries(tool.arguments).filter(([, v]) => v != null && v !== '');

  const resultStr = typeof tool.result === 'string'
    ? tool.result
    : JSON.stringify(tool.result, null, 2);

  return (
    <div className="mt-2 rounded-md border border-border bg-background/50 text-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <span>{icon}</span>
        <Badge variant="secondary" className="text-xs">{label}</Badge>
        {argsList.length > 0 && (
          <span className="truncate text-xs text-muted-foreground">
            {argsList.map(([k, v]) => `${k}=${String(v)}`).join(', ')}
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {expanded ? '▾' : '▸'}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-border px-3 py-2">
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
            {resultStr}
          </pre>
        </div>
      )}
    </div>
  );
}

function UserMessage({ msg }: { msg: Message }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] rounded-lg bg-primary px-4 py-2.5 text-primary-foreground">
        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
      </div>
    </div>
  );
}

function AssistantMessage({ msg }: { msg: Message }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%] space-y-1">
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="space-y-1">
            {msg.toolCalls.map((tc, i) => (
              <ToolCallCard key={i} tool={tc} />
            ))}
          </div>
        )}
        {msg.content && (
          <div className="rounded-lg bg-muted px-4 py-2.5">
            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'What products are low on stock?',
  'Show me expiring batches within 30 days',
  'Look up dealer "Green Valley Traders"',
  'Show overdue payments in zone Multan',
  'Record a cash payment of 50,000 from Ahmed Enterprises',
  'Give me a sales summary',
];

export default function AgentAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your AgriFlow AI Assistant. I can help you with:

- Checking inventory status and expiring batches
- Looking up dealer khata (ledger) information
- Finding overdue recoveries
- Recording payments
- Getting a sales summary

What would you like to know?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          { role: 'assistant', content: `Error: ${data.error}` },
        ]);
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message?.content ?? '',
        toolCalls: data.toolCalls,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error connecting to the server. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground">Ask questions about inventory, dealers, and recovery</p>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardHeader className="border-b py-3">
          <CardTitle className="text-base">AgriFlow AI</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <div className="flex-1 overflow-y-auto space-y-4 p-4">
            {messages.map((message, index) =>
              message.role === 'user' ? (
                <UserMessage key={index} msg={message} />
              ) : (
                <AssistantMessage key={index} msg={message} />
              )
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-muted px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40 [animation-delay:0.2s]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40 [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 px-4 pb-3">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSend(s)}
                  disabled={isLoading}
                >
                  {s}
                </Button>
              ))}
            </div>
          )}

          <div className="flex gap-2 border-t p-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about inventory, dealers, or recovery..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isLoading}
            />
            <Button onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
              {isLoading ? 'Thinking...' : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
