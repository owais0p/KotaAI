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
    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 dark:border-orange-800">
      <CardContent className="flex flex-col items-center text-center p-6 gap-4">
        {/* Lock icon */}
        <div className="flex items-center justify-center size-14 rounded-full bg-orange-100 dark:bg-orange-950/50">
          <Lock className="size-7 text-orange-500" />
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        {/* Usage bar */}
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-medium">
              {used}/{limit === -1 ? '∞' : limit} {limitType === 'mcq' ? 'MCQs' : 'AI Questions'} used today
            </span>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
              Free Plan
            </Badge>
          </div>
          <div className="h-2 rounded-full bg-orange-200 dark:bg-orange-900/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-500"
              style={{ width: `${limit === -1 ? 0 : Math.min(100, (used / limit) * 100)}%` }}
            />
          </div>
        </div>

        {/* Plans comparison */}
        <div className="w-full grid grid-cols-2 gap-3 mt-1">
          {/* Pro plan */}
          <button
            onClick={() => onUpgrade('pro')}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-white dark:bg-card p-4 hover:border-orange-400 hover:shadow-md transition-all group"
          >
            <Badge className="bg-orange-500 text-white border-orange-500">Pro</Badge>
            <span className="text-xl font-extrabold text-foreground">₹299</span>
            <span className="text-xs text-muted-foreground">/month</span>
            <ul className="text-xs space-y-1 text-left w-full">
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-orange-500 shrink-0" />
                <span>Unlimited MCQs</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-orange-500 shrink-0" />
                <span>Unlimited AI doubts</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-orange-500 shrink-0" />
                <span>All 4 subjects</span>
              </li>
            </ul>
            <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-1">
              Upgrade
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </button>

          {/* Premium plan */}
          <button
            onClick={() => onUpgrade('premium')}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-white dark:bg-card p-4 hover:border-amber-400 hover:shadow-md transition-all group relative"
          >
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <Badge className="bg-amber-500 text-white border-amber-500 text-[10px] px-2">
                <Zap className="size-2.5 mr-0.5" />
                Best Value
              </Badge>
            </div>
            <Badge className="bg-amber-500 text-white border-amber-500">Premium</Badge>
            <span className="text-xl font-extrabold text-foreground">₹699</span>
            <span className="text-xs text-muted-foreground">/month</span>
            <ul className="text-xs space-y-1 text-left w-full">
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-amber-500 shrink-0" />
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-amber-500 shrink-0" />
                <span>AI Mentorship</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-amber-500 shrink-0" />
                <span>Study plan</span>
              </li>
            </ul>
            <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white mt-1">
              Upgrade
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
