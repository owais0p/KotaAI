'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  Brain,
  BookOpen,
  BarChart3,
  Trophy,
  GraduationCap,
  Target,
  Check,
  X,
  ArrowRight,
  Zap,
  Users,
  Clock,
  Menu,
  Play,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Brain,
    title: 'AI Doubt Solver',
    description: 'Get step-by-step explanations instantly',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    icon: BookOpen,
    title: 'Daily Practice',
    description: '10 MCQs every day',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Know your strengths and weak areas',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Trophy,
    title: 'Leaderboard',
    description: 'Compete with top students nationwide',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
  },
  {
    icon: GraduationCap,
    title: 'All Subjects',
    description: 'Physics, Chemistry, Maths, Biology',
    color: 'text-sky-500',
    bg: 'bg-sky-50',
  },
  {
    icon: Target,
    title: 'Exam Focused',
    description: 'JEE Main, JEE Advanced, NEET prep',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
];

const stats = [
  { target: 50000, suffix: '+', label: 'Questions', icon: BookOpen },
  { target: 24, suffix: '/7', label: 'AI Tutor', icon: Clock },
  { target: 10000, suffix: '+', label: 'Students', icon: Users },
  { target: 4, suffix: '', label: 'Subjects', icon: GraduationCap },
];

/* ─── Animated Counter Hook ─── */
function useCountUp(target: number, duration = 2800, started: boolean) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!started) return;

    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth ease-out expo — very gentle deceleration
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      // Use floor for sub-1 increments so small targets (like 4) still step 0→1→2→3→4
      const raw = eased * target;
      const next = progress >= 1 ? target : Math.round(raw);

      setCount(next);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, started]);

  return started ? count : 0;
}

/* ─── Animated Stat Card ─── */
function AnimatedStatCard({
  target,
  suffix,
  label,
  icon: Icon,
  started,
}: {
  target: number;
  suffix: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  started: boolean;
}) {
  const count = useCountUp(target, 2000, started);

  const formatNumber = (n: number) => {
    if (n >= 1000) {
      return n.toLocaleString('en-IN');
    }
    return n.toString();
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-orange-100/80 shadow-sm transition-transform duration-300 hover:scale-105">
      <Icon className="size-6 text-orange-500 mb-2" />
      <span className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">
        {formatNumber(count)}{suffix}
      </span>
      <span className="text-sm text-gray-500 mt-1">{label}</span>
    </div>
  );
}

/* ─── Scroll-triggered Stats Row ─── */
function AnimatedStatsRow() {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const onIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting) {
      setStarted(true);
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(onIntersect, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [onIntersect]);

  return (
    <div
      ref={ref}
      className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-3xl mx-auto"
    >
      {stats.map((stat) => (
        <AnimatedStatCard
          key={stat.label}
          target={stat.target}
          suffix={stat.suffix}
          label={stat.label}
          icon={stat.icon}
          started={started}
        />
      ))}
    </div>
  );
}

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: '/month',
    description: 'Get started with basic features',
    features: [
      { text: '3 AI questions per day', included: true },
      { text: '10 MCQs per day', included: true },
      { text: 'All 4 subjects access', included: true },
      { text: 'Basic progress tracking', included: true },
      { text: 'Unlimited practice', included: false },
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '₹299',
    period: '/month',
    description: 'Most popular for serious aspirants',
    features: [
      { text: 'Unlimited AI questions', included: true },
      { text: 'Unlimited daily MCQs', included: true },
      { text: 'All 4 subjects', included: true },
      { text: 'Advanced progress tracking', included: true },
      { text: '1-on-1 AI mentorship', included: false },
    ],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '₹699',
    period: '/month',
    description: 'For those who want the best',
    features: [
      { text: 'Unlimited AI questions', included: true },
      { text: 'Unlimited daily MCQs', included: true },
      { text: 'All 4 subjects', included: true },
      { text: 'Advanced progress tracking', included: true },
      { text: '1-on-1 AI mentorship', included: true },
      { text: 'Personalized study plan', included: true },
      { text: 'Priority doubt resolution', included: true },
      { text: 'Performance analytics', included: true },
    ],
    cta: 'Start Premium',
    highlighted: false,
  },
];

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'AI Tutor', href: '#' },
    { label: 'Practice', href: '#' },
  ],
  company: [
    { label: 'About', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Blog', href: '#' },
  ],
  legal: [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'Refund Policy', href: '#' },
  ],
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const setView = useAppStore((s) => s.setView);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGetStarted = () => setView('auth');
  const handleLogin = () => setView('auth');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ============================== NAVBAR ============================== */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-orange-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="KotaAI Logo"
                width={36}
                height={36}
                className="rounded-lg"
                priority
              />
              <span className="text-xl font-bold text-gray-900">
                Kota<span className="text-orange-500">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-muted-foreground bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                Your 24/7 JEE &amp; NEET Tutor
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <a
                href="#features"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors rounded-md hover:bg-orange-50"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors rounded-md hover:bg-orange-50"
              >
                Pricing
              </a>
              <Button
                variant="outline"
                className="ml-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                onClick={handleLogin}
              >
                Login
              </Button>
              <Button
                className="ml-2 bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200"
                onClick={handleGetStarted}
              >
                Sign Up
                <ArrowRight className="ml-1 size-4" />
              </Button>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-orange-50 hover:text-orange-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <Menu className="size-6" />
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-orange-100 py-4 space-y-2">
              <a
                href="#features"
                className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-500 rounded-md hover:bg-orange-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-500 rounded-md hover:bg-orange-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                  onClick={handleLogin}
                >
                  Login
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handleGetStarted}
                >
                  Sign Up
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* ============================== HERO ============================== */}
        <section className="relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-40 h-40 bg-orange-100/40 rounded-full blur-2xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-orange-100/80 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-orange-200/60">
                <Sparkles className="size-4" />
                AI-Powered Learning for JEE &amp; NEET
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
                Crack JEE &amp; NEET with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                  AI-Powered Learning
                </span>
              </h1>

              {/* Subheading */}
              <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                KotaAI — Your 24/7 JEE &amp; NEET Tutor. Get instant doubt
                resolution, daily practice, and personalized progress tracking.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200/50 px-8 text-base h-12"
                  onClick={handleGetStarted}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 size-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 px-8 text-base h-12"
                >
                  <Play className="mr-2 size-5" />
                  Watch Demo
                </Button>
              </div>
            </div>

            {/* Stats Row */}
            <AnimatedStatsRow />
          </div>
        </section>

        {/* ============================== FEATURES ============================== */}
        <section id="features" className="py-20 sm:py-28 bg-gray-50/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-700 border-orange-200 mb-4"
              >
                <Zap className="size-3 mr-1" />
                Features
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Everything You Need to Ace JEE &amp; NEET
              </h2>
              <p className="mt-4 text-gray-600 text-lg">
                Our comprehensive toolkit is designed to help you study smarter,
                not harder.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="group bg-white border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300 py-6"
                >
                  <CardHeader>
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bg} ${feature.color} mb-2 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="size-6" />
                    </div>
                    <CardTitle className="text-lg text-gray-900">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-500 text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ============================== PRICING ============================== */}
        <section id="pricing" className="py-20 sm:py-28 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-700 border-orange-200 mb-4"
              >
                <Sparkles className="size-3 mr-1" />
                Pricing
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 text-gray-600 text-lg">
                No hidden fees. Pick the plan that works for you and start
                learning today.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col py-6 ${
                    plan.highlighted
                      ? 'border-orange-300 border-2 shadow-xl shadow-orange-100/50 scale-[1.02] md:scale-105'
                      : 'border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all duration-300'
                  }`}
                >
                  {/* Most Popular Badge */}
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-orange-500 text-white border-orange-500 px-4 py-1 text-sm shadow-md shadow-orange-200">
                        <Trophy className="size-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl text-gray-900">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    {/* Price */}
                    <div className="mb-6">
                      <span className="text-4xl font-extrabold text-gray-900">
                        {plan.price}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {plan.period}
                      </span>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li
                          key={feature.text}
                          className="flex items-start gap-3"
                        >
                          {feature.included ? (
                            <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                              <Check className="size-3 text-orange-600" />
                            </div>
                          ) : (
                            <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                              <X className="size-3 text-gray-400" />
                            </div>
                          )}
                          <span
                            className={`text-sm ${
                              feature.included
                                ? 'text-gray-700'
                                : 'text-gray-400'
                            }`}
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    {plan.highlighted ? (
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 h-11"
                        size="lg"
                        onClick={handleGetStarted}
                      >
                        {plan.cta}
                        <ChevronRight className="ml-1 size-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 h-11"
                        size="lg"
                        onClick={handleGetStarted}
                      >
                        {plan.cta}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ============================== CTA BANNER ============================== */}
        <section className="py-16 sm:py-20 bg-gradient-to-r from-orange-500 to-amber-500">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Start Your JEE &amp; NEET Journey?
            </h2>
            <p className="mt-4 text-orange-100 text-lg max-w-2xl mx-auto">
              Join 10,000+ students already using KotaAI to ace their exams.
              Start your free trial today — no credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-orange-50 shadow-lg px-8 h-12 text-base font-semibold"
                onClick={handleGetStarted}
              >
                Start Free Trial
                <ArrowRight className="ml-2 size-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ============================== FOOTER ============================== */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/logo.png"
                  alt="KotaAI Logo"
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold text-white">
                  Kota<span className="text-orange-500">AI</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                Your 24/7 AI-powered tutor for JEE &amp; NEET exam preparation.
              </p>
              {/* Social Icons */}
              <div className="flex gap-3 mt-5">
                {['X', 'In', 'YT', 'IG'].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-800 text-gray-400 hover:bg-orange-500 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Product</h3>
              <ul className="space-y-2.5">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm hover:text-orange-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Company</h3>
              <ul className="space-y-2.5">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm hover:text-orange-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Legal</h3>
              <ul className="space-y-2.5">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm hover:text-orange-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} KotaAI. All rights reserved.
            </p>
            <p className="text-xs text-gray-500">
              Made with <span className="text-orange-500">&#9829;</span> for JEE
              &amp; NEET aspirants
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
