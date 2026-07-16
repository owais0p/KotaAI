'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Shield, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import type { User } from '@/lib/types';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

const PLAN_DETAILS = {
  pro: {
    name: 'Pro',
    price: '₹299',
    priceNote: '/month',
    amount: 29900,
    features: [
      'Unlimited AI doubt questions',
      'All 4 subjects access',
      'Advanced progress tracking',
      'Daily practice MCQs',
      'Leaderboard access',
    ],
    color: 'border-brand-indigo/30',
    badgeClass: 'bg-brand-indigo/15 text-brand-indigo border border-brand-indigo/30',
    buttonClass: 'bg-brand-indigo hover:bg-brand-indigo-deep text-white rounded-full',
  },
  premium: {
    name: 'Premium',
    price: '₹699',
    priceNote: '/month',
    amount: 69900,
    features: [
      'Everything in Pro',
      '1-on-1 AI mentorship',
      'Personalized study plan',
      'Priority doubt resolution',
      'Performance analytics',
      'Custom practice sets',
    ],
    color: 'border-[#9b6829]/20',
    badgeClass: 'bg-[#f5e9d4] text-[#9b6829] border border-[#9b6829]/20',
    buttonClass: 'bg-[#f5e9d4] hover:bg-[#f5e9d4]/90 text-[#9b6829] border border-[#9b6829]/15 rounded-full',
  },
};

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: 'pro' | 'premium';
  onSuccess?: (user: User) => void;
}

export default function PaymentModal({ open, onOpenChange, plan, onSuccess }: PaymentModalProps) {
  const { user, setUser } = useAppStore();
  const [step, setStep] = useState<'checkout' | 'processing' | 'success' | 'error'>('checkout');
  const [error, setError] = useState('');

  const planDetail = PLAN_DETAILS[plan] ?? PLAN_DETAILS.pro;

  const isPaymentAvailable = !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID !== 'rzp_test_placeholder';

  const handlePayment = async () => {
    if (!user?.id) return;
    setStep('checkout');
    setError('');

    try {
      // Step 1: Create order on server
      const orderRes = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Step 2: Load Razorpay script
      await loadRazorpayScript();

      // Step 3: Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'KotaAI',
        description: `Upgrade to ${planDetail.name}`,
        order_id: orderData.orderId,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#533afd', // brand-indigo
        },
        handler: async function (response: any) {
          // Payment successful - verify on server
          try {
            setStep('processing');
            const verifyRes = await fetch('/api/payment', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId: orderData.paymentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                plan,
              }),
            });
            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            const updatedUser: User = {
              id: verifyData.user.id,
              email: verifyData.user.email,
              name: verifyData.user.name,
              plan: verifyData.user.plan,
              avatar: verifyData.user.avatar,
              streak: verifyData.user.streak ?? 0,
              lastPracticeDate: verifyData.user.lastPracticeDate ?? '',
            };
            setUser(updatedUser);
            setStep('success');
            if (onSuccess) onSuccess(updatedUser);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed');
            setStep('error');
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError(response.error.description || 'Payment failed');
        setStep('error');
      });
      rzp.open();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      setError(msg);
      setStep('error');
    }
  };

  const handleClose = () => {
    if (step !== 'processing') {
      setStep('checkout');
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#0d253d] border-[#e3e8ee] dark:border-[#273951]/40 text-[#0d253d] dark:text-white rounded-2xl overflow-hidden shadow-lg">
        {step === 'checkout' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#0d253d] dark:text-white font-normal">
                <CreditCard className="size-5 text-brand-indigo" />
                Upgrade to {planDetail.name}
              </DialogTitle>
              <DialogDescription className="text-[#4f566b] dark:text-[#a8c3de] text-xs font-light">
                Complete your payment to unlock all {planDetail.name} features
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Price */}
              <div className="flex items-baseline gap-1 p-4 rounded-xl bg-canvas-soft dark:bg-[#1c1e54]/30 border border-[#e3e8ee] dark:border-[#273951]/40">
                <span className="text-3xl font-light text-[#0d253d] dark:text-white font-tabular">{planDetail.price}</span>
                <span className="text-[#4f566b] dark:text-[#a8c3de] text-sm font-light">{planDetail.priceNote}</span>
                <Badge className={`ml-auto text-[10px] font-semibold px-2 py-0.5 ${planDetail.badgeClass}`}>
                  {planDetail.name}
                </Badge>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 my-2">
                {planDetail.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0 size-5 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-center">
                      <Check className="size-3 text-brand-indigo" />
                    </div>
                    <span className="text-sm text-[#4f566b] dark:text-[#a8c3de] font-light">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Razorpay redirect note */}
              <div className="space-y-2 p-4 rounded-xl border border-[#e3e8ee] dark:border-[#273951]/40 bg-canvas-soft/50 dark:bg-[#1c1e54]/20">
                <div className="flex items-center gap-2 text-xs text-[#4f566b] dark:text-[#a8c3de] font-light">
                  <CreditCard className="size-4 text-[#7a8c9f] flex-shrink-0" />
                  <span>You&apos;ll be redirected to Razorpay&apos;s secure payment gateway.</span>
                </div>
              </div>

              {/* Security note */}
              <div className="flex items-center gap-2 text-[10px] text-[#7a8c9f] dark:text-[#7a8c9f]/60 font-light">
                <Shield className="size-3.5" />
                <span>Secured by Razorpay. 256-bit SSL encryption.</span>
              </div>

              {/* Pay button */}
              {isPaymentAvailable ? (
                <Button
                  className={`w-full h-11 text-sm font-semibold ${planDetail.buttonClass}`}
                  onClick={handlePayment}
                >
                  Pay {planDetail.price} {planDetail.priceNote}
                </Button>
              ) : (
                <div className="w-full text-center p-3 bg-[#ea2261]/10 border border-[#ea2261]/20 rounded-full text-[#ea2261] text-xs font-semibold shadow-sm">
                  Payment coming soon
                </div>
              )}
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <Loader2 className="size-16 text-brand-indigo animate-spin" />
              <CreditCard className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-6 text-[#533afd] animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#0d253d] dark:text-white">Verifying Payment…</p>
              <p className="text-xs text-[#4f566b] dark:text-[#a8c3de] mt-1 font-light">
                Please wait while we confirm your transaction
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="flex items-center justify-center size-16 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Sparkles className="size-8 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-normal text-emerald-600">Payment Successful! 🎉</p>
              <p className="text-xs text-[#4f566b] dark:text-[#a8c3de] mt-1 font-light">
                Welcome to KotaAI {planDetail.name}! All features are now unlocked.
              </p>
            </div>
            <Button
              className="bg-brand-indigo hover:bg-brand-indigo-deep text-white mt-2 rounded-full px-6 text-xs font-semibold shadow-sm"
              onClick={handleClose}
            >
              Start Learning
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="flex items-center justify-center size-16 rounded-full bg-[#ea2261]/10 border border-[#ea2261]/20">
              <AlertTriangle className="size-8 text-[#ea2261]" />
            </div>
            <div className="text-center">
              <p className="text-lg font-normal text-[#ea2261]">Payment Failed</p>
              <p className="text-xs text-[#4f566b] dark:text-[#a8c3de] mt-1 font-light">
                {error || 'Something went wrong. Please try again.'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full border-[#e3e8ee] dark:border-[#273951]/40 text-xs text-[#4f566b] dark:text-[#a8c3de] hover:bg-canvas-soft dark:hover:bg-[#1c1e54]/50" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="bg-[#ea2261] hover:bg-[#ea2261]/80 text-white rounded-full text-xs font-semibold shadow-sm"
                onClick={() => { setStep('checkout'); setError(''); }}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
