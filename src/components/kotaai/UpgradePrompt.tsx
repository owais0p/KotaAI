'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Check, ArrowRight, Zap } from 'lucide-react';

interface UpgradePromptProps {
  title: string;
  description: string;
  limitType: 'mcq' | 'ai';
  used: number;
  limit: number;
  onUpgrade: (plan: 'pro' | 'premium') => void;
}

export default function UpgradePrompt({
  title,
  description,
  limitType,
  used,
  limit,
  onUpgrade,
}: UpgradePromptProps) {
  return (
    <Card className="border border-[#e3e8ee] dark:border-[#273951]/40 bg-white dark:bg-[#0d253d] text-[#0d253d] dark:text-white shadow-md overflow-hidden w-full">
      <CardContent className="flex flex-col items-center text-center p-6 gap-4">
        {/* Lock icon */}
        <div className="flex items-center justify-center size-14 rounded-full bg-brand-indigo/10 border border-brand-indigo/20">
          <Lock className="size-6 text-brand-indigo" />
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-normal text-[#0d253d] dark:text-white">{title}</h3>
          <p className="text-xs text-[#4f566b] dark:text-[#a8c3de] mt-1 font-light">{description}</p>
        </div>

        {/* Usage bar */}
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-light text-[#4f566b] dark:text-[#a8c3de]">
              <span className="font-tabular font-semibold">{used}</span> / <span className="font-tabular font-semibold">{limit === -1 ? '∞' : limit}</span> {limitType === 'mcq' ? 'MCQs' : 'AI Questions'} today
            </span>
            <Badge variant="outline" className="bg-canvas-soft dark:bg-[#1c1e54]/30 text-[#4f566b] dark:text-[#a8c3de] border border-[#e3e8ee] dark:border-[#273951]/40 text-[10px]">
              Free Plan
            </Badge>
          </div>
          <div className="h-1.5 rounded-full bg-canvas-soft dark:bg-[#1c1e54]/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-indigo transition-all duration-500"
              style={{ width: `${limit === -1 ? 0 : Math.min(100, (used / limit) * 100)}%` }}
            />
          </div>
        </div>

        {/* Plans comparison */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
          {/* Pro plan */}
          <button
            type="button"
            onClick={() => onUpgrade('pro')}
            className="flex flex-col items-center gap-2 rounded-xl border border-[#e3e8ee] dark:border-[#273951]/40 bg-white dark:bg-[#0d253d] p-4 hover:border-brand-indigo/60 hover:-translate-y-1 hover:shadow-md transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] text-center w-full shadow-sm"
          >
            <Badge className="bg-brand-indigo/15 text-brand-indigo border border-brand-indigo/30 rounded-md text-xs font-semibold px-2">Pro</Badge>
            <span className="text-xl font-light text-[#0d253d] dark:text-white font-tabular">₹299<span className="text-xs text-[#4f566b] dark:text-[#a8c3de]">/mo</span></span>
            <ul className="text-[10px] space-y-1 text-left w-full mt-1.5 font-light text-[#4f566b] dark:text-[#a8c3de]">
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-brand-indigo shrink-0" />
                <span>Unlimited MCQs</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-brand-indigo shrink-0" />
                <span>Unlimited doubts</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-brand-indigo shrink-0" />
                <span>All 4 subjects</span>
              </li>
            </ul>
            <Button size="sm" className="w-full bg-brand-indigo hover:bg-brand-indigo-deep text-white mt-3 rounded-full text-xs font-semibold shadow-sm">
              Upgrade
              <ArrowRight className="size-3 ml-1" />
            </Button>
          </button>

          {/* Premium plan */}
          <button
            type="button"
            onClick={() => onUpgrade('premium')}
            className="flex flex-col items-center gap-2 rounded-xl border border-[#9b6829]/20 bg-[#f5e9d4]/5 dark:bg-[#f5e9d4]/10 p-4 hover:border-[#9b6829]/50 hover:-translate-y-1 hover:shadow-md transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] text-center w-full relative shadow-sm"
          >
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <Badge className="bg-[#f5e9d4] text-[#9b6829] border border-[#9b6829]/20 text-[9px] px-2 font-bold uppercase tracking-wider shadow-sm">
                <Zap className="size-2.5 mr-0.5" />
                Best Value
              </Badge>
            </div>
            <Badge className="bg-[#f5e9d4]/10 text-[#9b6829] border border-[#9b6829]/30 rounded-md text-xs font-semibold px-2">Premium</Badge>
            <span className="text-xl font-light text-[#0d253d] dark:text-white font-tabular">₹699<span className="text-xs text-[#4f566b] dark:text-[#a8c3de]">/mo</span></span>
            <ul className="text-[10px] space-y-1 text-left w-full mt-1.5 font-light text-[#4f566b] dark:text-[#a8c3de]">
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-[#9b6829] shrink-0" />
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-[#9b6829] shrink-0" />
                <span>AI Mentorship</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-[#9b6829] shrink-0" />
                <span>Daily study plan</span>
              </li>
            </ul>
            <Button size="sm" className="w-full bg-[#f5e9d4] hover:bg-[#f5e9d4]/90 text-[#9b6829] mt-3 rounded-full text-xs font-semibold border border-[#9b6829]/15 shadow-sm">
              Upgrade
              <ArrowRight className="size-3 ml-1" />
            </Button>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
