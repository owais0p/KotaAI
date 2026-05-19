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
import { Check, CreditCard, Shield, Sparkles } from 'lucide-react';
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
    color: 'border-orange-300',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
    buttonClass: 'bg-orange-500 hover:bg-orange-600 text-white',
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
    color: 'border-amber-300',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white',
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

  const planDetail = PLAN_DETAILS[plan];

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
          color: '#f97316', // orange-500
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
      <DialogContent className="sm:max-w-md">
        {step === 'checkout' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="size-5 text-orange-500" />
                Upgrade to {planDetail.name}
              </DialogTitle>
              <DialogDescription>
                Complete your payment to unlock all {planDetail.name} features
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Price */}
              <div className="flex items-baseline gap-1 p-4 rounded-xl bg-orange-50 border border-orange-100">
                <span className="text-3xl font-extrabold text-gray-900">{planDetail.price}</span>
                <span className="text-gray-500 text-sm">{planDetail.priceNote}</span>
                <Badge className={`ml-auto ${planDetail.badgeClass}`}>
                  {planDetail.name}
                </Badge>
              </div>

              {/* Features */}
              <ul className="space-y-2.5">
                {planDetail.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0 size-5 rounded-full bg-orange-100 flex items-center justify-center">
                      <Check className="size-3 text-orange-600" />
                    </div>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Razorpay redirect note */}
              <div className="space-y-2 p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="size-4 text-muted-foreground flex-shrink-0" />
                  <span>You&apos;ll be redirected to Razorpay&apos;s secure payment gateway</span>
                </div>
              </div>

              {/* Security note */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="size-3.5" />
                <span>Secured by Razorpay. 256-bit SSL encryption.</span>
              </div>

              {/* Pay button */}
              <Button
                className={`w-full h-12 text-base font-semibold ${planDetail.buttonClass}`}
                onClick={handlePayment}
              >
                Pay {planDetail.price} {planDetail.priceNote}
              </Button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <div className="size-16 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
              <CreditCard className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-6 text-orange-500" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold">Verifying Payment...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please wait while we confirm your payment
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="flex items-center justify-center size-16 rounded-full bg-emerald-100">
              <Sparkles className="size-8 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-700">Payment Successful! 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome to KotaAI {planDetail.name}! All features are now unlocked.
              </p>
            </div>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white mt-2"
              onClick={handleClose}
            >
              Start Learning
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="flex items-center justify-center size-16 rounded-full bg-red-100">
              <span className="text-2xl">❌</span>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-700">Payment Failed</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error || 'Something went wrong. Please try again.'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
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
