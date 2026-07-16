'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { motion, useInView, animate } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Vector Brand Logo Component                                       */
/* ------------------------------------------------------------------ */
export function KotaAILogo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#533afd" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#f96bee" />
        </linearGradient>
        <linearGradient id="star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* Main Squircle Background */}
      <rect width="32" height="32" rx="9" fill="url(#logo-bg-grad)" />
      {/* Overlapping Geometric "K" Monogram */}
      <path d="M8.5 6C8.5 4.9 9.4 4 10.5 4C11.6 4 12.5 4.9 12.5 6V26C12.5 27.1 11.6 28 10.5 28C9.4 28 8.5 27.1 8.5 26V6Z" fill="#ffffff" />
      <path d="M12 17C14 15 17.5 9 23 7C23.8 6.7 24.5 7.3 24.5 8.2C24.5 9.1 23.9 9.7 23.2 10C18.5 12.2 16 16.5 14.5 19.5L12 17Z" fill="#ffffff" />
      <path d="M14.5 13C16.5 16 18.5 21 23.2 23C24 23.3 24.5 24 24.5 24.8C24.5 25.7 23.8 26.3 23 26C17.5 24 14 18 12 16L14.5 13Z" fill="#ffffff" />
      {/* Glow Star (AI Sparkle) */}
      <path d="M24.5 4.5C24.5 6.5 25.5 7.5 27.5 7.5C25.5 7.5 24.5 8.5 24.5 10.5C24.5 8.5 23.5 7.5 21.5 7.5C23.5 7.5 24.5 6.5 24.5 4.5Z" fill="url(#star-grad)" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Brain,
    title: 'AI Doubt Solver',
    description: 'Get step-by-step explanations instantly.',
    color: 'text-brand-indigo',
    bg: 'bg-brand-indigo/10',
  },
  {
    icon: BookOpen,
    title: 'Daily Practice',
    description: 'Solve unlimited curated MCQs tailored for JEE/NEET.',
    color: 'text-brand-indigo',
    bg: 'bg-brand-indigo/10',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Identify your strong chapters and weakness areas at a glance.',
    color: 'text-brand-indigo',
    bg: 'bg-brand-indigo/10',
  },
  {
    icon: Trophy,
    title: 'Leaderboard',
    description: 'Compete with top students nationwide and boost your ranking.',
    color: 'text-brand-indigo',
    bg: 'bg-brand-indigo/10',
  },
  {
    icon: GraduationCap,
    title: 'All Subjects',
    description: 'Full syllabus coverage for Physics, Chemistry, Maths, and Biology.',
    color: 'text-brand-indigo',
    bg: 'bg-brand-indigo/10',
  },
  {
    icon: Target,
    title: 'Exam Focused',
    description: 'Strictly aligned with latest NTA patterns for JEE Main, Advanced, and NEET.',
    color: 'text-brand-indigo',
    bg: 'bg-brand-indigo/10',
  },
];

const stats = [
  { target: 50000, suffix: '+', label: 'Questions Solved', icon: BookOpen },
  { target: 24, suffix: '/7', label: 'AI Availability', icon: Clock },
  { target: 10000, suffix: '+', label: 'JEE & NEET Aspirants', icon: Users },
  { target: 4, suffix: '', label: 'Subjects Covered', icon: GraduationCap },
];

/* ─── Animated Counter Component with Framer Motion ─── */
function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (inView) {
      const node = ref.current;
      if (!node) return;

      const controls = animate(0, value, {
        duration: 2,
        ease: "easeOut",
        onUpdate(latest) {
          node.textContent = Math.round(latest).toLocaleString('en-IN');
        },
      });

      return () => controls.stop();
    }
  }, [inView, value]);

  return <span ref={ref} className="font-tabular">0</span>;
}

/* ─── Animated Stats Row ─── */
function AnimatedStatsRow() {
  return (
    <div className="mt-16 sm:mt-20 border-t border-hairline pt-10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4, delay: idx * 0.1 }}
          className="text-center p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-hairline/50"
        >
          <div className="flex justify-center mb-2">
            <stat.icon className="size-5 text-brand-indigo" />
          </div>
          <div className="text-2xl sm:text-3xl font-light text-ink tracking-tight">
            <Counter value={stat.target} />
            {stat.suffix}
          </div>
          <div className="text-[10px] uppercase font-bold text-ink-mute tracking-wider mt-1.5">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Interactive Live Dashboard Mockup ─── */
function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      className="mt-12 sm:mt-16 mx-auto max-w-4xl rounded-2xl border border-hairline bg-white shadow-[rgba(0,55,112,0.06)_0_8px_24px,rgba(0,55,112,0.03)_0_2px_6px] overflow-hidden"
    >
      {/* Chrome Window Header */}
      <div className="bg-canvas-soft border-b border-hairline px-4 py-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
          <span className="size-2.5 rounded-full bg-[#ffbd2e] border border-[#dfa224]" />
          <span className="size-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]" />
        </div>
        <div className="rounded-md bg-white border border-hairline px-6 py-0.5 text-[10px] text-ink-mute font-tabular">
          dashboard.kotaai.com
        </div>
        <div className="flex gap-2 text-ink-mute text-xs">
          <span>🎓</span>
        </div>
      </div>

      {/* Grid of UI panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 md:p-6 bg-canvas-soft/40">
        {/* Left Side: Code Explanation Panel */}
        <div className="bg-[#0d253d] rounded-lg p-4 border border-[#273951]/40 flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center gap-2 text-xs text-brand-indigo-soft font-bold uppercase tracking-wider mb-3">
              <span className="size-2 rounded-full bg-brand-indigo animate-pulse" />
              AI Step-by-Step Solver
            </div>
            <p className="text-sm font-light text-white leading-relaxed">
              Find the work done in moving a charge <span className="font-semibold text-brand-indigo-soft">q</span> around a circular path of radius <span className="font-semibold text-brand-indigo-soft">r</span> centered at charge <span className="font-semibold text-brand-indigo-soft">Q</span>.
            </p>
            <div className="mt-3 p-2.5 rounded bg-[#1c1e54]/50 border border-[#273951]/20 font-mono text-[11px] text-slate-200 leading-relaxed space-y-1">
              <div>Work Done (W) = ∮ F · dr</div>
              <div>Since electrostatic force is conservative, ∮ E · dr = 0.</div>
              <div>Hence, W = 0.</div>
            </div>
          </div>
          <div className="text-[10px] text-ink-mute mt-4 flex items-center justify-between border-t border-[#273951]/40 pt-2">
            <span>Question solved in 0.4s</span>
            <span className="text-[#533afd] font-semibold">100% Correct</span>
          </div>
        </div>

        {/* Center: Weekly Analysis Graph Mockup */}
        <div className="bg-white rounded-lg p-4 border border-hairline flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold text-ink-mute tracking-wider block mb-1">Weekly Reports</span>
            <span className="text-lg font-light text-ink">Mastery Track</span>
            
            {/* Visual Bars represent progress */}
            <div className="space-y-3 mt-4">
              <div>
                <div className="flex justify-between text-xs text-ink-secondary mb-1">
                  <span>Physics</span>
                  <span className="font-tabular font-semibold">82%</span>
                </div>
                <div className="h-2 rounded-full bg-canvas-soft overflow-hidden">
                  <div className="h-full bg-brand-indigo rounded-full" style={{ width: '82%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-ink-secondary mb-1">
                  <span>Chemistry</span>
                  <span className="font-tabular font-semibold">68%</span>
                </div>
                <div className="h-2 rounded-full bg-canvas-soft overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '68%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-ink-secondary mb-1">
                  <span>Maths</span>
                  <span className="font-tabular font-semibold">94%</span>
                </div>
                <div className="h-2 rounded-full bg-canvas-soft overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: '94%' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-ink-mute border-t border-hairline pt-2 mt-4">
            Updated today &middot; 3 subjects mastered
          </div>
        </div>

        {/* Right Side: MCQ Practice Board */}
        <div className="bg-white rounded-lg p-4 border border-hairline flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-start mb-2">
              <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider px-2 py-0 bg-canvas-soft text-[#4f566b] border-hairline rounded-md">
                Practice MCQ
              </Badge>
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Active</span>
            </div>
            <p className="text-xs font-semibold text-ink leading-relaxed">
              Q: Which element has the highest first ionization enthalpy?
            </p>
            
            {/* Options */}
            <div className="mt-3 space-y-2">
              <div className="border border-hairline rounded-lg p-2 text-[10px] flex items-center gap-2 bg-canvas-soft/30">
                <span className="bg-canvas-soft font-bold rounded px-1.5 py-0.5">A</span>
                <span>Nitrogen (N)</span>
              </div>
              <div className="border border-emerald-500 bg-emerald-50 rounded-lg p-2 text-[10px] flex items-center justify-between text-emerald-800 font-medium">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-white font-bold rounded px-1.5 py-0.5">B</span>
                  <span>Fluorine (F)</span>
                </div>
                <span>✅</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-ink-mute border-t border-hairline pt-2 mt-4 flex justify-between">
            <span>Difficulty: Hard</span>
            <span className="font-semibold text-emerald-600 font-tabular">+10 pts</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ───────── Main Landing Page Component ───────── */
export default function LandingPage() {
  const setView = useAppStore((s) => s.setView);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = () => {
    setView('auth');
  };

  const handleGetStarted = () => {
    setView('auth');
  };

  const plans = [
    {
      name: 'Free Trial',
      description: 'Test features with daily limitations.',
      price: '₹0',
      period: '/forever',
      features: [
        { text: '3 AI doubt questions per day', included: true },
        { text: '10 Practice MCQs per day', included: true },
        { text: 'Access to 4 major subjects', included: true },
        { text: 'Detailed solution explanations', included: true },
        { text: 'AI mentoring reports', included: false },
        { text: 'Customized practice sets', included: false },
      ],
      cta: 'Start Free',
      highlighted: false,
    },
    {
      name: 'Pro Pack',
      description: 'Ideal package for serious aspirants.',
      price: '₹299',
      period: '/month',
      features: [
        { text: 'Unlimited AI doubt questions', included: true },
        { text: 'Unlimited Practice MCQs', included: true },
        { text: 'Access to 4 major subjects', included: true },
        { text: 'Detailed solution explanations', included: true },
        { text: 'AI mentoring reports', included: false },
        { text: 'Customized practice sets', included: false },
      ],
      cta: 'Get Pro now',
      highlighted: true,
    },
    {
      name: 'Premium',
      description: 'Advanced study plan with direct mentorship.',
      price: '₹699',
      period: '/month',
      features: [
        { text: 'Everything in Pro Pack', included: true },
        { text: 'Personalized AI Study Plan', included: true },
        { text: 'Customized adaptive MCQ generator', included: true },
        { text: '1-on-1 AI academic mentorship', included: true },
        { text: 'Detailed mock analytical reports', included: true },
        { text: 'Priority server availability', included: true },
      ],
      cta: 'Go Premium',
      highlighted: false,
    },
  ];

  const footerLinks = {
    product: [
      { label: 'AI Solver', href: '#' },
      { label: 'Mock Tests', href: '#' },
      { label: 'Analytics', href: '#' },
      { label: 'Leaderboard', href: '#' },
    ],
    company: [
      { label: 'About Us', href: '#' },
      { label: 'Kota Faculty', href: '#' },
      { label: 'JEE Results', href: '#' },
      { label: 'NEET Results', href: '#' },
    ],
    legal: [
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Refund Policy', href: '#' },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      {/* ============================== NAVIGATION ============================== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-hairline py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <KotaAILogo className="size-8" />
              <span className="text-xl font-bold text-ink tracking-tight">
                Kota<span className="text-brand-indigo">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-3 text-xs text-brand-indigo bg-brand-indigo-subdued/30 px-2.5 py-1 rounded-full font-medium">
                Your 24/7 JEE &amp; NEET Tutor
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <a
                href="#features"
                className="px-3.5 py-2 text-sm font-medium text-ink-mute hover:text-brand-indigo transition-colors rounded-md"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="px-3.5 py-2 text-sm font-medium text-ink-mute hover:text-brand-indigo transition-colors rounded-md"
              >
                Pricing
              </a>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
                <Button
                  variant="ghost"
                  className="ml-2 text-brand-indigo hover:bg-canvas-soft font-medium rounded-full"
                  onClick={handleLogin}
                >
                  Login
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
                <Button
                  className="ml-2 bg-brand-indigo hover:bg-brand-indigo-deep text-white shadow-[rgba(83,58,253,0.12)_0_4px_12px] rounded-full px-5 h-9 font-medium"
                  onClick={handleGetStarted}
                >
                  Sign Up
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </motion.div>
            </nav>

            {/* Mobile menu controls */}
            <div className="flex items-center gap-2 md:hidden">
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-md text-ink-mute hover:bg-canvas-soft hover:text-brand-indigo"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <Menu className="size-6" />
              </motion.button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-hairline py-4 space-y-2">
              <a
                href="#features"
                className="block px-3 py-2 text-sm font-medium text-ink-mute hover:text-brand-indigo rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="block px-3 py-2 text-sm font-medium text-ink-mute hover:text-brand-indigo rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <div className="flex gap-2 pt-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-hairline text-brand-indigo hover:bg-canvas-soft rounded-full"
                    onClick={handleLogin}
                  >
                    Login
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Button
                    className="w-full bg-brand-indigo hover:bg-brand-indigo-deep text-white rounded-full"
                    onClick={handleGetStarted}
                  >
                    Sign Up
                  </Button>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* ============================== HERO ============================== */}
        <section className="relative overflow-hidden gradient-mesh-bg py-16 sm:py-24 lg:py-32 border-b border-hairline">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Eyebrow badge */}
              <div
                className="inline-flex items-center gap-2 bg-brand-indigo-subdued/30 text-brand-indigo px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-brand-indigo-subdued/40"
              >
                <Sparkles className="size-3.5" />
                <span>Next-Gen Artificial Intelligence for Exams</span>
              </div>

              {/* Heading */}
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-[-0.035em] text-ink leading-[1.05]"
              >
                Crack JEE &amp; NEET with{' '}
                <span className="text-[#533afd] font-normal">
                  AI-Powered Tutoring
                </span>
              </h1>

              {/* Subheading */}
              <p
                className="mt-6 text-lg sm:text-xl text-ink-secondary max-w-2xl mx-auto leading-relaxed font-light"
              >
                KotaAI is your 24/7 offline-coach experience. Get step-by-step academic doubt resolutions, adaptive MCQ practices, and comprehensive progress analytics.
              </p>

              {/* CTAs */}
              <div
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-brand-indigo hover:bg-brand-indigo-deep text-white shadow-[rgba(83,58,253,0.15)_0_8px_20px] px-8 h-12 text-base rounded-full"
                    onClick={handleGetStarted}
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-hairline bg-white text-ink hover:bg-canvas-soft px-8 h-12 text-base rounded-full"
                  >
                    <Play className="mr-2 size-4 text-brand-indigo" />
                    Watch Demo
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Interactive Live Dashboard Mockup */}
            <DashboardMockup />

            {/* Stats Row */}
            <AnimatedStatsRow />
          </div>
        </section>

        {/* ============================== FEATURES ============================== */}
        <section id="features" className="py-20 sm:py-28 bg-canvas-soft border-b border-hairline">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge
                variant="secondary"
                className="bg-brand-indigo-subdued/20 text-brand-indigo border-0 mb-4"
              >
                <Zap className="size-3 mr-1" />
                Comprehensive Features
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-ink">
                Everything You Need to Ace JEE &amp; NEET
              </h2>
              <p className="mt-4 text-ink-mute text-base font-light">
                Our educational tools are engineered to provide the rigour of Kota classrooms on your screen.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-hairline bg-white p-6 shadow-[rgba(0,55,112,0.02)_0_1px_3px] hover:border-brand-indigo/35 hover:-translate-y-1 hover:shadow-md transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
                >
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${feature.bg} ${feature.color} mb-4`}
                  >
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-normal text-ink mb-2">{feature.title}</h3>
                  <p className="text-sm font-light text-ink-mute leading-relaxed">{feature.description}</p>
                </motion.div>
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
                className="bg-brand-indigo-subdued/20 text-brand-indigo border-0 mb-4"
              >
                <Sparkles className="size-3 mr-1" />
                Transparent Pricing
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-ink">
                Simple, Transparent Subscriptions
              </h2>
              <p className="mt-4 text-ink-mute text-base font-light">
                Choose the best tier for your academic objectives. Upgrade or cancel anytime.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto w-full">
              {plans.map((plan, idx) => {
                // Style cards differently to avoid templates
                // Highlighted Pro -> Inverted Navy
                // Premium -> Warm Cream
                // Free -> Standard White
                const isPro = plan.highlighted;
                const isPremium = plan.name === 'Premium';

                let cardClasses = "relative flex flex-col p-8 rounded-xl border hover:-translate-y-1 hover:shadow-md transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ";
                let checkBg = "";
                let checkColor = "";
                let buttonVariant: "default" | "outline" = "default";
                let buttonClass = "";
                let priceTextClass = "";

                if (isPro) {
                  // Pro is high-polarity dark navy
                  cardClasses += "bg-[#1c1e54] border-transparent text-white shadow-[rgba(83,58,253,0.1)_0_8px_24px]";
                  checkBg = "bg-brand-indigo/35";
                  checkColor = "text-white";
                  buttonClass = "w-full bg-[#533afd] hover:bg-brand-indigo-deep text-white rounded-full h-10 font-medium";
                  priceTextClass = "text-white";
                } else if (isPremium) {
                  // Premium has warm Cream band
                  cardClasses += "bg-canvas-cream border-[#e3e8ee] text-[#0d253d]";
                  checkBg = "bg-white/70";
                  checkColor = "text-brand-indigo";
                  buttonClass = "w-full bg-[#533afd] hover:bg-[#4434d4] text-white rounded-full h-10 font-medium";
                  priceTextClass = "text-[#0d253d]";
                } else {
                  // Free is minimalist white
                  cardClasses += "bg-white border-hairline text-[#0d253d] shadow-[rgba(0,55,112,0.02)_0_1px_3px]";
                  checkBg = "bg-canvas-soft";
                  checkColor = "text-brand-indigo";
                  buttonVariant = "outline";
                  buttonClass = "w-full border-hairline hover:bg-canvas-soft rounded-full h-10 font-medium text-ink";
                  priceTextClass = "text-ink";
                }

                return (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    whileHover={{ y: -4 }}
                    className={cardClasses}
                  >
                    {/* Highlighted Badge */}
                    {isPro && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <Badge className="bg-brand-indigo text-white border-brand-indigo px-3 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full shadow-[rgba(83,58,253,0.3)_0_4px_10px]">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    {isPremium && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <Badge className="bg-[#ea2261] text-white border-[#ea2261] px-3 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full">
                          Best Value
                        </Badge>
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className="text-xl font-normal tracking-tight">{plan.name}</h3>
                      <p className={`text-xs mt-1 leading-normal ${isPro ? 'text-white/60' : 'text-ink-mute'}`}>
                        {plan.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-6 flex items-baseline">
                      <span className={`text-4xl font-light tracking-tight ${priceTextClass}`}>
                        {plan.price}
                      </span>
                      <span className={`text-xs ml-1 ${isPro ? 'text-white/60' : 'text-ink-mute'}`}>
                        {plan.period}
                      </span>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3.5 flex-1 mb-8">
                      {plan.features.map((feature) => (
                        <li
                          key={feature.text}
                          className="flex items-start gap-3"
                        >
                          {feature.included ? (
                            <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full ${checkBg} flex items-center justify-center`}>
                              <Check className={`size-2.5 ${checkColor}`} />
                            </div>
                          ) : (
                            <div className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center">
                              <X className={`size-2.5 ${isPro ? 'text-white/40' : 'text-ink-mute'}`} />
                            </div>
                          )}
                          <span
                            className={`text-xs font-light leading-snug ${
                              feature.included
                                ? isPro ? 'text-white/80' : 'text-ink-secondary'
                                : isPro ? 'text-white/40' : 'text-ink-mute/60'
                            }`}
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div>
                      <Button
                        variant={buttonVariant}
                        className={buttonClass}
                        onClick={handleGetStarted}
                      >
                        {plan.cta}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================== CTA BANNER ============================== */}
        <section className="relative overflow-hidden py-16 sm:py-24 bg-[#1c1e54] border-t border-[#273951]/40">
          {/* Subtle grid mesh */}
          <div className="absolute inset-0 bg-[radial-gradient(at_0%_0%,_rgba(83,_58,_253,_0.1)_0,_transparent_50%)] pointer-events-none" />
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white">
              Ready to Start Your JEE &amp; NEET Journey?
            </h2>
            <p className="mt-4 text-white/70 text-base max-w-2xl mx-auto font-light">
              Join 10,000+ serious aspirants using KotaAI to optimize study times, clear doubts, and master chapters.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="bg-[#533afd] hover:bg-[#4434d4] text-white shadow-[rgba(83,58,253,_0.15)] px-8 h-12 text-sm font-semibold rounded-full"
                  onClick={handleGetStarted}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* ============================== FOOTER ============================== */}
      <footer className="bg-white border-t border-hairline">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand Column */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <KotaAILogo className="size-7" />
                <span className="text-lg font-bold text-ink tracking-tight">
                  Kota<span className="text-[#533afd]">AI</span>
                </span>
              </div>
              <p className="text-sm font-light text-ink-mute leading-relaxed max-w-[260px]">
                Rigorous JEE &amp; NEET coaching infrastructure, powered by advanced artificial intelligence. Available 24/7.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-ink font-semibold text-xs uppercase tracking-wider mb-4">Product</h3>
              <ul className="space-y-2.5">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-xs font-light text-ink-mute hover:text-brand-indigo transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-ink font-semibold text-xs uppercase tracking-wider mb-4">Company</h3>
              <ul className="space-y-2.5">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-xs font-light text-ink-mute hover:text-brand-indigo transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-ink font-semibold text-xs uppercase tracking-wider mb-4">Legal</h3>
              <ul className="space-y-2.5">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-xs font-light text-ink-mute hover:text-brand-indigo transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-ink-mute font-light">
              &copy; {new Date().getFullYear()} KotaAI. All rights reserved.
            </p>
            <p className="text-xs text-ink-mute font-light flex items-center gap-1">
              Engineered with <span className="text-[#ea2261]" aria-label="love">&#9829;</span> for JEE &amp; NEET aspirants.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
