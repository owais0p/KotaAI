'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, UserCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import UpgradePrompt from '@/components/kotaai/UpgradePrompt';
import PaymentModal from '@/components/kotaai/PaymentModal';
import type { ChatMessage, Subject, User } from '@/lib/types';

const SUBJECTS: { label: string; value: Subject; emoji: string }[] = [
  { label: 'Physics', value: 'Physics', emoji: '⚛️' },
  { label: 'Chemistry', value: 'Chemistry', emoji: '🧪' },
  { label: 'Maths', value: 'Maths', emoji: '📐' },
  { label: 'Biology', value: 'Biology', emoji: '🧬' },
];

/* ───────── Typing Indicator ───────── */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-start gap-3 max-w-[85%] sm:max-w-[75%]"
    >
      <div className="flex items-center justify-center size-8 rounded-full bg-brand-indigo/10 shrink-0">
        <Bot className="size-4 text-brand-indigo" />
      </div>
      <div className="bg-white dark:bg-[#0d253d] border border-[#e3e8ee] dark:border-[#273951]/40 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="sr-only">KotaAI is typing…</span>
          <span className="size-2 rounded-full bg-[#533afd]/40 animate-bounce [animation-delay:0ms]" />
          <span className="size-2 rounded-full bg-[#533afd]/40 animate-bounce [animation-delay:150ms]" />
          <span className="size-2 rounded-full bg-[#533afd]/40 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </motion.div>
  );
}

/* ───────── Chat Message Bubble ───────── */
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-start gap-3 max-w-[85%] sm:max-w-[75%]"
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      {isUser ? (
        <div className="flex items-center justify-center size-8 rounded-full bg-brand-indigo shrink-0 shadow-sm">
          <UserCircle className="size-4 text-white" />
        </div>
      ) : (
        <div className="flex items-center justify-center size-8 rounded-full bg-white dark:bg-[#0d253d] border border-[#e3e8ee] dark:border-[#273951]/40 shrink-0 shadow-sm">
          <Bot className="size-4 text-brand-indigo" />
        </div>
      )}

      <div
        className={`rounded-2xl px-4 py-3 shadow-[rgba(0,55,112,0.02)_0_1px_3px] ${
          isUser
            ? 'bg-brand-indigo text-white rounded-tr-sm'
            : 'bg-white dark:bg-[#0d253d] border border-[#e3e8ee] dark:border-[#273951]/40 text-[#0d253d] dark:text-white rounded-tl-sm'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1.5 border-b border-[#e3e8ee] dark:border-[#273951]/40 pb-1.5">
            <span className="text-xs">🎓</span>
            <span className="text-[10px] font-bold text-brand-indigo dark:text-brand-indigo-soft uppercase tracking-wide">
              KotaAI Tutor
            </span>
          </div>
        )}

        <div
          className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser ? 'font-light' : 'prose-sm text-[#0d253d] dark:text-white font-light'
          }`}
          dangerouslySetInnerHTML={
            isUser
              ? undefined
              : { __html: formatAIContent(message.content) }
          }
        >
          {isUser ? message.content : null}
        </div>
      </div>
    </motion.div>
  );
}

/* ───────── AI Content Formatter ───────── */
function formatAIContent(text: string): string {
  let html = text;
  html = html.replace(/\*\*(.*?)\*\?/g, '<strong>$1</strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(
    /^(\d+[\.\)])\s/gm,
    '<span class="text-brand-indigo font-semibold">$1</span> '
  );
  html = html.replace(
    /^[-*]\s/gm,
    '<span class="text-brand-indigo mr-1.5">&#8226;</span> '
  );
  return html;
}

/* ───────── Main AIChat Component ───────── */
export default function AIChat() {
  const {
    user,
    chatMessages,
    selectedSubject,
    isLoading,
    setSelectedSubject,
    addChatMessage,
    setIsLoading,
  } = useAppStore();

  const { toast } = useToast();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [aiUsage, setAiUsage] = useState({ used: 0, limit: 3 });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<'pro' | 'premium'>('pro');

  /* ── Fetch usage on mount ── */
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/usage?userId=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAiUsage({
            used: data.usage.aiQuestions,
            limit: data.usage.aiLimit === -1 ? Infinity : data.usage.aiLimit,
          });
          setLimitReached(data.usage.aiRemaining === 0);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  /* ── Auto-scroll ── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoading, scrollToBottom]);

  /* ── Auto-resize textarea ── */
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 24;
    const maxHeight = lineHeight * 3 + 16;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  /* ── Handle upgrade ── */
  const handleUpgrade = (plan: 'pro' | 'premium') => {
    setPaymentPlan(plan);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (updatedUser: User) => {
    setLimitReached(false);
    setAiUsage({ used: aiUsage.used, limit: Infinity });
  };

  /* ── Send Message ── */
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !user) return;

    if (limitReached) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: trimmed,
      subject: selectedSubject,
      createdAt: new Date().toISOString(),
    };

    addChatMessage(userMessage);
    setInput('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          message: trimmed,
          subject: selectedSubject,
          history: chatMessages,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.limitReached) {
          setLimitReached(true);
          setAiUsage({
            used: data.usage.aiQuestions,
            limit: data.usage.aiLimit === -1 ? Infinity : data.usage.aiLimit,
          });
          toast({
            title: 'Daily Limit Reached',
            description: `Free plan allows only ${data.usage.aiLimit} AI questions per day. Upgrade for unlimited!`,
            variant: 'destructive',
          });
          return;
        }
        throw new Error(data.error || 'Failed to get response');
      }

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: data.response,
        subject: selectedSubject,
        createdAt: new Date().toISOString(),
      };

      addChatMessage(aiMessage);

      // Update local usage count
      setAiUsage((prev) => ({ ...prev, used: prev.used + 1 }));
      if (user.plan === 'free' && aiUsage.used + 1 >= aiUsage.limit) {
        setLimitReached(true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Something went wrong';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, isLoading, user, selectedSubject, chatMessages, addChatMessage, setIsLoading, toast, limitReached, aiUsage]);

  /* ── Keyboard handler ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <div className="flex flex-col h-full bg-canvas-soft dark:bg-[#1c1e54]/20">
      {/* ── Subject Selector ── */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#0d253d] border-b border-[#e3e8ee] dark:border-[#273951]/40 shadow-sm">
        <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none">
          {SUBJECTS.map((s) => {
            const isActive = selectedSubject === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setSelectedSubject(s.value)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold
                  transition-all duration-200 whitespace-nowrap min-h-[36px]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/30
                  ${
                    isActive
                      ? 'bg-brand-indigo text-white shadow-sm'
                      : 'bg-white dark:bg-[#0d253d] text-[#4f566b] dark:text-[#a8c3de] hover:bg-canvas-soft/50 dark:hover:bg-[#1c1e54]/50 hover:text-[#0d253d] dark:hover:text-white border border-[#e3e8ee] dark:border-[#273951]/40'
                  }
                `}
                aria-pressed={isActive}
                aria-label={`Select ${s.label}`}
              >
                <span className="text-sm" role="img" aria-hidden>
                  {s.emoji}
                </span>
                <span>{s.label}</span>
              </button>
            );
          })}

          {/* Usage indicator for free users */}
          {user?.plan === 'free' && (
            <Badge
              variant="outline"
              className={`ml-auto text-xs whitespace-nowrap px-3 py-1 rounded-full ${
                aiUsage.used >= aiUsage.limit
                  ? 'border-[#ea2261]/40 text-[#ea2261] bg-[#ea2261]/10'
                  : 'border-[#e3e8ee] dark:border-[#273951]/40 text-[#4f566b] dark:text-[#a8c3de] bg-white dark:bg-[#0d253d]'
              }`}
            >
              {aiUsage.used}/{aiUsage.limit === Infinity ? '∞' : aiUsage.limit} AI questions today
            </Badge>
          )}
        </div>
      </div>

      {/* ── Chat Messages ── */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4 min-h-full">
          {/* Empty state */}
          {chatMessages.length === 0 && !isLoading && !limitReached && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="flex items-center justify-center size-14 rounded-full bg-white dark:bg-[#0d253d] border border-[#e3e8ee] dark:border-[#273951]/40 mb-4 shadow-sm">
                <Bot className="size-6 text-brand-indigo" />
              </div>
              <h3 className="text-base font-semibold text-[#0d253d] dark:text-white mb-1">
                Ask any doubt!
              </h3>
              <p className="text-xs text-[#4f566b] dark:text-[#a8c3de] max-w-[280px] leading-relaxed font-light">
                Type your {selectedSubject.toLowerCase()} question below and
                I&apos;ll explain it step-by-step
              </p>
            </motion.div>
          )}

          {/* Limit reached upgrade prompt */}
          {limitReached && (
            <UpgradePrompt
              title="Daily AI Question Limit Reached"
              description="You've used all your free AI questions for today. Upgrade to ask unlimited questions!"
              limitType="ai"
              used={aiUsage.used}
              limit={aiUsage.limit}
              onUpgrade={handleUpgrade}
            />
          )}

          {/* Messages */}
          <div className="flex flex-col gap-4">
            {chatMessages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
          </div>

          {/* Typing indicator */}
          <AnimatePresence>
            {isLoading && <TypingIndicator />}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* ── Input Area ── */}
      <div className="sticky bottom-0 bg-white dark:bg-[#0d253d] border-t border-[#e3e8ee] dark:border-[#273951]/40 p-4 shadow-[rgba(0,0,0,0.03)_0_-4px_16px]">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                limitReached
                  ? 'Upgrade to ask more questions…'
                  : `Ask any doubt from ${selectedSubject}…`
              }
              disabled={isLoading || limitReached}
              rows={1}
              className="resize-none min-h-[44px] max-h-[104px] pr-3 py-3 text-sm rounded-xl border border-[#a8c3de] dark:border-[#273951]/40 focus-visible:border-brand-indigo focus-visible:ring-brand-indigo/20 bg-canvas-soft dark:bg-[#1c1e54]/30 text-[#0d253d] dark:text-white placeholder:text-[#7a8c9f] disabled:opacity-60"
              spellCheck={false}
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim() || limitReached}
            size="icon"
            className="size-11 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white shrink-0 shadow-sm transition-all"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-[#7a8c9f] dark:text-[#7a8c9f]/60 text-center mt-2">
          {limitReached ? (
            <span className="text-[#ea2261] font-semibold">Daily limit reached &middot; Upgrade to continue</span>
          ) : (
            <>Press Enter to send &middot; Shift+Enter for new line</>
          )}
        </p>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        plan={paymentPlan}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
