'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Mail, Lock, User, CreditCard } from 'lucide-react';
import PaymentModal from '@/components/kotaai/PaymentModal';
import { KotaAILogo } from './LandingPage';
import type { User as UserType } from '@/lib/types';

type Plan = 'free' | 'pro' | 'premium';

const plans: { value: Plan; label: string; price: string; description: string }[] = [
  {
    value: 'free',
    label: 'Free',
    price: '₹0',
    description: '10 MCQs/day, 3 AI Qs/day',
  },
  {
    value: 'pro',
    label: 'Pro',
    price: '₹299/mo',
    description: 'Unlimited access',
  },
  {
    value: 'premium',
    label: 'Premium',
    price: '₹699/mo',
    description: 'All features + mentorship',
  },
];

export default function AuthPage() {
  const { setUser, setView } = useAppStore();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupPlan, setSignupPlan] = useState<Plan>('free');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('login');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserType | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please fill in all fields.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setLoginError(data.error || 'Login failed. Please try again.');
        return;
      }

      const user: UserType = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        plan: data.user.plan,
        avatar: data.user.avatar || '',
        streak: data.user.streak ?? 0,
        lastPracticeDate: data.user.lastPracticeDate ?? '',
      };

      setUser(user);
      setView('dashboard');
    } catch {
      setLoginError('Network error. Please check your connection.');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupError('');

    if (
      !signupName.trim() ||
      !signupEmail.trim() ||
      !signupPassword.trim() ||
      !signupConfirmPassword.trim()
    ) {
      setSignupError('Please fill in all fields.');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    setSignupLoading(true);
    try {
      // For paid plans, always create as free first, then upgrade via payment
      const planToCreate = 'free';

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          name: signupName.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
          plan: planToCreate,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setSignupError(data.error || 'Signup failed. Please try again.');
        return;
      }

      const user: UserType = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        plan: data.user.plan,
        avatar: data.user.avatar || '',
        streak: data.user.streak ?? 0,
        lastPracticeDate: data.user.lastPracticeDate ?? '',
      };

      // If paid plan selected, open payment modal instead of going to dashboard
      if (signupPlan !== 'free') {
        setUser(user); // Log them in first
        setPendingUser(user);
        setPaymentModalOpen(true);
      } else {
        setUser(user);
        setView('dashboard');
      }
    } catch {
      setSignupError('Network error. Please check your connection.');
    } finally {
      setSignupLoading(false);
    }
  }

  const handlePaymentSuccess = (updatedUser: UserType) => {
    setPendingUser(null);
    setView('dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-soft dark:bg-[#0d253d] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-ink-mute hover:text-ink hover:bg-white dark:hover:bg-[#1c1e54] -ml-2 rounded-full transition-colors"
          onClick={() => setView('landing')}
        >
          <ArrowLeft className="size-4 mr-1.5 text-brand-indigo" />
          Back
        </Button>

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <KotaAILogo className="size-12 mb-3 shadow-[rgba(83,58,253,0.15)_0_4px_12px]" />
          <h1 className="text-2xl font-normal text-ink dark:text-white tracking-tight">KotaAI</h1>
          <p className="text-xs text-ink-mute mt-1">
            Your 24/7 AI-Powered Study Buddy
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-[rgba(0,55,112,0.06)_0_4px_16px] border border-hairline dark:border-[#273951]/40 bg-white dark:bg-card overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0 px-6 pt-6 bg-transparent border-0">
              <TabsList className="w-full bg-canvas-soft dark:bg-[#0d253d] p-1 rounded-lg">
                <TabsTrigger 
                  value="login" 
                  className="flex-1 text-xs font-semibold py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1c1e54] data-[state=active]:shadow-sm rounded-md transition-all"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="flex-1 text-xs font-semibold py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1c1e54] data-[state=active]:shadow-sm rounded-md transition-all"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-6">
              {/* Login Tab */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-xs font-semibold text-ink-secondary dark:text-white/80">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-mute" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com…"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 h-10 border-hairline-input focus-visible:ring-brand-indigo/30 focus-visible:border-brand-indigo bg-canvas-soft dark:bg-[#0d253d] text-sm"
                        autoComplete="email"
                        spellCheck={false}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-xs font-semibold text-ink-secondary dark:text-white/80">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-mute" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password…"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 h-10 border-hairline-input focus-visible:ring-brand-indigo/30 focus-visible:border-brand-indigo bg-canvas-soft dark:bg-[#0d253d] text-sm"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  {loginError && (
                    <p className="text-xs text-brand-indigo font-medium bg-brand-indigo-subdued/20 rounded-lg px-3.5 py-2.5 border border-brand-indigo-subdued/30">
                      {loginError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-brand-indigo hover:bg-brand-indigo-deep text-white h-10 rounded-full font-medium transition-colors"
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <span className="flex items-center gap-2 text-xs">
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Logging in…
                      </span>
                    ) : (
                      'Login'
                    )}
                  </Button>

                  <p className="text-xs text-center text-ink-mute">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      className="text-brand-indigo hover:text-brand-indigo-deep font-semibold underline-offset-2 hover:underline"
                      onClick={() => setActiveTab('signup')}
                    >
                      Sign Up
                    </button>
                  </p>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-xs font-semibold text-ink-secondary dark:text-white/80">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-mute" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Rahul Sharma…"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-10 h-10 border-hairline-input focus-visible:ring-brand-indigo/30 focus-visible:border-brand-indigo bg-canvas-soft dark:bg-[#0d253d] text-sm"
                        autoComplete="name"
                        spellCheck={false}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-xs font-semibold text-ink-secondary dark:text-white/80">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-mute" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com…"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10 h-10 border-hairline-input focus-visible:ring-brand-indigo/30 focus-visible:border-brand-indigo bg-canvas-soft dark:bg-[#0d253d] text-sm"
                        autoComplete="email"
                        spellCheck={false}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-xs font-semibold text-ink-secondary dark:text-white/80">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-mute" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="At least 6 characters…"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 h-10 border-hairline-input focus-visible:ring-brand-indigo/30 focus-visible:border-brand-indigo bg-canvas-soft dark:bg-[#0d253d] text-sm"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-confirm-password" className="text-xs font-semibold text-ink-secondary dark:text-white/80">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-mute" />
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="Re-enter your password…"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="pl-10 h-10 border-hairline-input focus-visible:ring-brand-indigo/30 focus-visible:border-brand-indigo bg-canvas-soft dark:bg-[#0d253d] text-sm"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {/* Plan Selector */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-ink-secondary dark:text-white/80">Choose your plan</Label>
                    <RadioGroup
                      value={signupPlan}
                      onValueChange={(val) => setSignupPlan(val as Plan)}
                      className="grid grid-cols-3 gap-2"
                    >
                      {plans.map((plan) => {
                        const isSelected = signupPlan === plan.value;
                        return (
                          <label
                            key={plan.value}
                            htmlFor={`plan-${plan.value}`}
                            className={`
                              relative flex flex-col items-center gap-0.5 rounded-lg border p-3 cursor-pointer transition-all
                              ${
                                isSelected
                                  ? 'border-brand-indigo bg-brand-indigo-subdued/20 dark:border-brand-indigo-soft shadow-sm'
                                  : 'border-hairline bg-white dark:bg-[#0d253d] hover:border-[#a8c3de]'
                              }
                            `}
                          >
                            <RadioGroupItem
                              value={plan.value}
                              id={`plan-${plan.value}`}
                              className="sr-only"
                            />
                            <span
                              className={`text-xs font-bold ${
                                isSelected
                                  ? 'text-brand-indigo dark:text-brand-indigo-soft'
                                  : 'text-ink dark:text-foreground'
                              }`}
                            >
                              {plan.label}
                            </span>
                            <span
                              className={`text-[10px] font-semibold ${
                                isSelected
                                  ? 'text-brand-indigo dark:text-brand-indigo-soft'
                                  : 'text-ink-mute dark:text-muted-foreground'
                              }`}
                            >
                              {plan.price}
                            </span>
                            <span className="text-[9px] text-ink-mute/70 dark:text-zinc-400 mt-1 leading-tight text-center">
                              {plan.description}
                            </span>
                            {isSelected && (
                              <div className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-brand-indigo flex items-center justify-center">
                                <svg
                                  className="size-2 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </label>
                        );
                      })}
                    </RadioGroup>
                  </div>

                  {signupError && (
                    <p className="text-xs text-brand-indigo font-medium bg-brand-indigo-subdued/20 rounded-lg px-3.5 py-2.5 border border-brand-indigo-subdued/30">
                      {signupError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-brand-indigo hover:bg-brand-indigo-deep text-white h-10 rounded-full font-medium transition-colors"
                    disabled={signupLoading}
                  >
                    {signupLoading ? (
                      <span className="flex items-center gap-2 text-xs">
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Account…
                      </span>
                    ) : signupPlan !== 'free' ? (
                      <span className="flex items-center gap-2 text-xs font-semibold">
                        <CreditCard className="size-4" />
                        Continue to Payment
                      </span>
                    ) : (
                      'Create Free Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-[10px] text-center text-ink-mute mt-6 leading-relaxed">
          By continuing, you agree to KotaAI&apos;s Terms of Service and Privacy
          Policy.
        </p>
      </div>

      {/* Payment Modal for signup - only render when a paid plan is selected */}
      {signupPlan !== 'free' && (
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={(open) => {
            setPaymentModalOpen(open);
            if (!open && pendingUser) {
              // User closed without paying — still go to dashboard as free user
              setView('dashboard');
              setPendingUser(null);
            }
          }}
          plan={signupPlan as 'pro' | 'premium'}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
