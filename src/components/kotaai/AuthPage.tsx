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
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Mail, Lock, User, GraduationCap } from 'lucide-react';
import type { User as UserType } from '@/lib/types';

type Plan = 'free' | 'pro' | 'premium';

const plans: { value: Plan; label: string; price: string; description: string }[] = [
  {
    value: 'free',
    label: 'Free',
    price: '₹0',
    description: 'Basic access',
  },
  {
    value: 'pro',
    label: 'Pro',
    price: '₹299/mo',
    description: 'More features',
  },
  {
    value: 'premium',
    label: 'Premium',
    price: '₹699/mo',
    description: 'All features',
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
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          name: signupName.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
          plan: signupPlan,
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
      };

      setUser(user);
      setView('dashboard');
    } catch {
      setSignupError('Network error. Please check your connection.');
    } finally {
      setSignupLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => setView('landing')}
        >
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="size-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25 mb-3">
            <GraduationCap className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">KotaAI</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your AI-Powered Tutor
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-lg border-0 bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0 px-6 pt-6">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-6">
              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  {loginError && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                      {loginError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Logging in...
                      </span>
                    ) : (
                      'Login'
                    )}
                  </Button>

                  <p className="text-sm text-center text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      className="text-orange-600 hover:text-orange-700 font-medium underline-offset-2 hover:underline"
                      onClick={() => setActiveTab('signup')}
                    >
                      Sign Up
                    </button>
                  </p>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Rahul Sharma"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-10"
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="At least 6 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="Re-enter your password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="pl-10"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {/* Plan Selector */}
                  <div className="space-y-2">
                    <Label>Choose your plan</Label>
                    <RadioGroup
                      value={signupPlan}
                      onValueChange={(val) => setSignupPlan(val as Plan)}
                      className="grid grid-cols-3 gap-2"
                    >
                      {plans.map((plan) => (
                        <label
                          key={plan.value}
                          htmlFor={`plan-${plan.value}`}
                          className={`
                            relative flex flex-col items-center gap-0.5 rounded-lg border-2 p-3 cursor-pointer transition-all
                            ${
                              signupPlan === plan.value
                                ? 'border-orange-500 bg-orange-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }
                          `}
                        >
                          <RadioGroupItem
                            value={plan.value}
                            id={`plan-${plan.value}`}
                            className="sr-only"
                          />
                          <span
                            className={`text-sm font-semibold ${
                              signupPlan === plan.value
                                ? 'text-orange-700'
                                : 'text-gray-900'
                            }`}
                          >
                            {plan.label}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              signupPlan === plan.value
                                ? 'text-orange-600'
                                : 'text-gray-500'
                            }`}
                          >
                            {plan.price}
                          </span>
                          <span className="text-[10px] text-muted-foreground leading-tight text-center">
                            {plan.description}
                          </span>
                          {signupPlan === plan.value && (
                            <div className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-orange-500 flex items-center justify-center">
                              <svg
                                className="size-2.5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
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
                      ))}
                    </RadioGroup>
                  </div>

                  {signupError && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                      {signupError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={signupLoading}
                  >
                    {signupLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Account...
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-6">
          By continuing, you agree to KotaAI&apos;s Terms of Service and Privacy
          Policy.
        </p>
      </div>
    </div>
  );
}
