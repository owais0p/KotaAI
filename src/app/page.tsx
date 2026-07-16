'use client';

import { useEffect, useState, useSyncExternalStore, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  MessageSquare,
  BookOpen,
  BarChart3,
  Trophy,
  LogOut,
  Menu,
  GraduationCap,
  Home as HomeIcon,
  Sparkles,
  Zap,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence, animate } from 'framer-motion';

import LandingPage, { KotaAILogo } from '@/components/kotaai/LandingPage';
import AuthPage from '@/components/kotaai/AuthPage';
import AIChat from '@/components/kotaai/AIChat';
import PracticePage from '@/components/kotaai/PracticePage';
import ProgressPage from '@/components/kotaai/ProgressPage';
import LeaderboardPage from '@/components/kotaai/LeaderboardPage';
import PaymentModal from '@/components/kotaai/PaymentModal';
import ThemeToggle from '@/components/kotaai/ThemeToggle';

/* ─── Subject Card Component ─── */
function SubjectCard3D({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`${className} transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-md`}
    >
      <div className="flex flex-col items-start gap-2 w-full h-full">
        {children}
      </div>
    </button>
  );
}

/* ─── Animated Streak Flame Component ─── */
function StreakFlame({ streak, streakAtRisk }: { streak: number; streakAtRisk: boolean }) {
  const particles = [0, 1, 2];
  return (
    <Badge
      className={`gap-1 font-normal font-tabular rounded-full px-2.5 py-0.5 border ${
        streakAtRisk
          ? 'bg-[#ea2261]/10 text-[#ea2261] border-[#ea2261]/35'
          : 'bg-[#533afd]/10 text-[#533afd] border-[#533afd]/35 dark:bg-[#533afd]/20 dark:text-[#b9b9f9] dark:border-[#533afd]/45'
      }`}
    >
      <div className="relative flex items-center justify-center mr-1">
        {particles.map((i) => (
          <motion.span
            key={i}
            className={`absolute rounded-full pointer-events-none ${
              streakAtRisk ? 'bg-[#ea2261]' : 'bg-[#533afd]'
            }`}
            style={{ width: 3, height: 3, bottom: 2 }}
            animate={{
              y: [0, -14],
              x: [0, (i % 2 === 0 ? 3 : -3), (i % 2 === 0 ? -1 : 1)],
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.2],
            }}
            transition={{
              duration: 1.0 + i * 0.25,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeOut',
            }}
          />
        ))}
        <motion.div
          animate={{
            scale: [1, 1.15, 0.95, 1.1, 1],
            rotate: [0, -3, 3, -1, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Flame className={`size-3.5 ${streakAtRisk ? 'text-[#ea2261]' : 'text-[#533afd]'} fill-current`} />
        </motion.div>
      </div>
      <span>{streak} day{streak !== 1 ? 's' : ''}</span>
    </Badge>
  );
}

/* ─── Animated Number Counter Component ─── */
function DashboardCounter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const numericMatch = value.match(/^(\d+)/);
  const numericValue = numericMatch ? parseInt(numericMatch[1]) : null;
  const suffix = numericMatch ? value.substring(numericMatch[1].length) : value;

  useEffect(() => {
    if (numericValue === null) {
      if (ref.current) ref.current.textContent = value;
      return;
    }
    const node = ref.current;
    if (!node) return;
    const controls = animate(0, numericValue, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate(latest) {
        node.textContent = Math.round(latest).toLocaleString('en-IN');
      },
    });
    return () => controls.stop();
  }, [value, numericValue]);

  if (numericValue === null) {
    return <span className="font-tabular">{value}</span>;
  }

  return (
    <span className="font-tabular">
      <span ref={ref}>0</span>
      {suffix}
    </span>
  );
}

/* ───────── Navigation Items ───────── */
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'chat', label: 'AI Doubt Solver', icon: MessageSquare },
  { id: 'practice', label: 'Daily Practice', icon: BookOpen },
  { id: 'progress', label: 'Mentoring & Progress', icon: BarChart3 },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

/* ───────── Dashboard Overview Component ───────── */
function DashboardOverview() {
  const { user, setSelectedSubject, setView } = useAppStore();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'pro' | 'premium'>('pro');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  // Calculate streak warnings
  const streakAtRisk = user?.streak ? (user.streak > 0 && user.lastPracticeDate !== new Date().toISOString().split('T')[0]) : false;

  const quickActions = [
    {
      label: 'Solve Doubts',
      description: 'Ask anything and get instant step-by-step solutions.',
      icon: MessageSquare,
      view: 'chat',
      color: 'bg-brand-indigo',
    },
    {
      label: 'Solve MCQ Questions',
      description: 'Test your understanding with fresh JEE/NEET questions.',
      icon: BookOpen,
      view: 'practice',
      color: 'bg-emerald-500',
    },
    {
      label: 'View Progress',
      description: 'Analyze subject completion rates and weak topics.',
      icon: BarChart3,
      view: 'progress',
      color: 'bg-purple-600',
    },
    {
      label: 'Leaderboard',
      description: 'Check rankings and compare with top rankers.',
      icon: Trophy,
      view: 'leaderboard',
      color: 'bg-amber-500',
    },
  ];

  const subjects = [
    { name: 'Physics', emoji: '⚛️', count: '50 questions available' },
    { name: 'Chemistry', emoji: '🧪', count: '50 questions available' },
    { name: 'Maths', emoji: '📐', count: '50 questions available' },
    { name: 'Biology', emoji: '🧬', count: '50 questions available' },
  ];

  const planBadge =
    user?.plan === 'premium'
      ? { label: 'Premium Scholar', class: 'bg-[#ea2261]/10 text-[#ea2261] border-[#ea2261]/20' }
      : user?.plan === 'pro'
      ? { label: 'Pro Aspirant', class: 'bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20 dark:bg-brand-indigo/20 dark:text-brand-indigo-soft' }
      : { label: 'Free Tier', class: 'bg-canvas-soft text-ink-mute border-hairline dark:bg-[#1c1e54]/20 dark:text-[#a8c3de] dark:border-[#273951]/40' };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 p-4 md:p-6 max-w-4xl mx-auto"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-[#e3e8ee] dark:border-[#273951]/40 pb-6">
        <Avatar className="size-14 ring-2 ring-brand-indigo/40 ring-offset-2 ring-offset-white dark:ring-offset-[#0d253d]">
          <AvatarFallback className="bg-brand-indigo text-white text-xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'S'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-light tracking-tight text-[#0d253d] dark:text-white">Welcome back, {user?.name?.split(' ')[0] || 'Student'}!</h1>
            <Badge variant="outline" className={`text-xs font-semibold px-2 py-0.5 ${planBadge.class}`}>
              {planBadge.label}
            </Badge>
            {/* Streak Badge */}
            {(user?.streak ?? 0) > 0 && (
              <StreakFlame streak={user?.streak ?? 0} streakAtRisk={streakAtRisk} />
            )}
          </div>
          <p className="text-[#4f566b] dark:text-[#a8c3de] text-xs mt-1 font-light">
            Ready to crack JEE &amp; NEET? Let&apos;s continue your preparation.
          </p>
        </div>
      </motion.div>

      {/* Streak at Risk Warning */}
      {streakAtRisk && (user?.streak ?? 0) > 0 && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 rounded-xl border border-[#ea2261]/35 bg-[#ea2261]/5 p-4"
        >
          <div className="flex items-center justify-center size-10 rounded-full bg-[#ea2261]/10 shrink-0">
            <AlertTriangle className="size-5 text-[#ea2261]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#0d253d] dark:text-white">
              🔥 Streak at risk!
            </p>
            <p className="text-xs text-[#4f566b] dark:text-[#a8c3de]">
              You haven&apos;t practiced today. Your {user?.streak}-day streak will reset if you miss today!
            </p>
          </div>
          <Button
            size="sm"
            className="bg-brand-indigo hover:bg-brand-indigo-deep text-white shrink-0 rounded-full text-xs"
            onClick={() => setView('practice')}
          >
            <BookOpen className="size-3.5 mr-1" />
            Practice Now
          </Button>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xs uppercase tracking-wider text-[#4f566b] dark:text-[#a8c3de] font-semibold mb-4 flex items-center gap-2">
          <Zap className="size-4 text-brand-indigo" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => setView(action.view)}
              className="flex flex-col items-start gap-4 rounded-xl border border-[#e3e8ee] dark:border-[#273951]/40 bg-white dark:bg-[#0d253d] hover:border-brand-indigo/60 hover:bg-canvas-soft/20 dark:hover:bg-[#1c1e54]/50 hover:-translate-y-1 hover:shadow-md p-5 transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] text-left group w-full shadow-sm"
            >
              <div className={`flex size-10 items-center justify-center rounded-lg ${action.color} text-white shadow-sm`}>
                <action.icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0d253d] dark:text-white group-hover:text-brand-indigo transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-[#4f566b] dark:text-[#a8c3de] mt-1 font-light leading-snug">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Subjects Grid */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xs uppercase tracking-wider text-[#4f566b] dark:text-[#a8c3de] font-semibold mb-4 flex items-center gap-2">
          <GraduationCap className="size-4 text-brand-indigo" />
          Subjects
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {subjects.map((subject) => (
            <SubjectCard3D
              key={subject.name}
              onClick={() => {
                setSelectedSubject(subject.name as 'Physics' | 'Chemistry' | 'Maths' | 'Biology');
                setView('practice');
              }}
              className="flex flex-col items-start gap-2 rounded-xl border border-[#e3e8ee] dark:border-[#273951]/40 bg-white dark:bg-[#0d253d] hover:border-brand-indigo/60 hover:bg-canvas-soft/20 dark:hover:bg-[#1c1e54]/50 p-5 transition-all text-left w-full h-full shadow-sm"
            >
              <span className="text-3xl mb-1">{subject.emoji}</span>
              <span className="text-sm font-semibold text-[#0d253d] dark:text-white">{subject.name}</span>
              <span className="text-[11px] text-[#4f566b] dark:text-[#a8c3de] font-light mt-auto">{subject.count}</span>
            </SubjectCard3D>
          ))}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#e3e8ee] dark:border-[#273951]/40 bg-white dark:bg-[#0d253d] p-5 flex items-center gap-4 shadow-sm">
          <div className="flex items-center justify-center size-10 rounded-lg bg-[#533afd]/10 border border-[#533afd]/20 shrink-0">
            <MessageSquare className="size-5 text-[#533afd]" />
          </div>
          <div>
            <p className="text-xl font-light text-[#0d253d] dark:text-white"><DashboardCounter value="24/7" /></p>
            <p className="text-[10px] text-[#4f566b] dark:text-[#a8c3de] uppercase tracking-wider font-semibold">AI Tutor</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#e3e8ee] dark:border-[#273951]/40 bg-white dark:bg-[#0d253d] p-5 flex items-center gap-4 shadow-sm">
          <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            <BookOpen className="size-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-light text-[#0d253d] dark:text-white"><DashboardCounter value="200+" /></p>
            <p className="text-[10px] text-[#4f566b] dark:text-[#a8c3de] uppercase tracking-wider font-semibold">MCQ Bank</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#e3e8ee] dark:border-[#273951]/40 bg-white dark:bg-[#0d253d] p-5 flex items-center gap-4 shadow-sm">
          <div className="flex items-center justify-center size-10 rounded-lg bg-purple-500/10 border border-purple-500/20 shrink-0">
            <BarChart3 className="size-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xl font-light text-[#0d253d] dark:text-white"><DashboardCounter value="4" /></p>
            <p className="text-[10px] text-[#4f566b] dark:text-[#a8c3de] uppercase tracking-wider font-semibold">Subjects</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#e3e8ee] dark:border-[#273951]/40 bg-white dark:bg-[#0d253d] p-5 flex items-center gap-4 shadow-sm">
          <div className="flex items-center justify-center size-10 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
            <Sparkles className="size-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-light text-[#0d253d] dark:text-white">AI</p>
            <p className="text-[10px] text-[#4f566b] dark:text-[#a8c3de] uppercase tracking-wider font-semibold">Powered</p>
          </div>
        </div>
      </motion.div>

      {/* CTA Banner - Free users: Upgrade prompt, Paid users: Practice prompt */}
      <motion.div variants={itemVariants}>
        {user?.plan === 'free' ? (
          <div className="rounded-xl bg-gradient-to-r from-brand-indigo to-brand-indigo-soft p-6 text-center text-white shadow-[rgba(83,58,253,0.15)_0_8px_20px] relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(at_0%_0%,_rgba(255,_255,_255,_0.05)_0,_transparent_50%)] pointer-events-none" />
            <h3 className="text-lg font-normal mb-1">
              Unlock Unlimited Practice
            </h3>
            <p className="text-xs text-white/80 mb-4 font-light max-w-lg mx-auto">
              Upgrade your free subscription to unlock unlimited doubt clears and customized adaptive MCQ generators today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => { setUpgradePlan('pro'); setUpgradeModalOpen(true); }}
                className="bg-white text-brand-indigo hover:bg-canvas-soft font-semibold shadow-md rounded-full px-5 py-2"
              >
                <Zap className="size-4 mr-2" />
                Upgrade to Pro — ₹299/mo
              </Button>
              <Button
                onClick={() => { setUpgradePlan('premium'); setUpgradeModalOpen(true); }}
                className="bg-[#f5e9d4] text-[#9b6829] hover:bg-[#f5e9d4]/90 font-semibold shadow-md border border-[#9b6829]/20 rounded-full px-5 py-2"
              >
                <Sparkles className="size-4 mr-2" />
                Premium — ₹699/mo
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-gradient-to-r from-brand-indigo to-brand-indigo-soft p-6 text-center text-white shadow-[rgba(83,58,253,0.15)_0_8px_20px] relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(at_0%_0%,_rgba(255,_255,_255,_0.05)_0,_transparent_50%)] pointer-events-none" />
            <h3 className="text-lg font-normal mb-1">
              Start Today&apos;s Practice Session
            </h3>
            <p className="text-xs text-white/80 mb-4 font-light max-w-lg mx-auto">
              Complete your daily MCQs and climb the leaderboard!
            </p>
            <Button
              onClick={() => setView('practice')}
              className="bg-white text-brand-indigo hover:bg-canvas-soft font-semibold shadow-md rounded-full px-6 py-2"
            >
              <BookOpen className="size-4 mr-2" />
              Start Practicing
            </Button>
          </div>
        )}
      </motion.div>

      {/* Payment Modal */}
      <PaymentModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        plan={upgradePlan}
      />
    </motion.div>
  );
}

/* ───────── Dashboard Shell (Sidebar + Content) ───────── */
function DashboardShell() {
  const { currentView, setView, user, logout } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'pro' | 'premium'>('pro');

  // Seed database on first load
  useEffect(() => {
    if (!seeded) {
      fetch('/api/seed', { method: 'POST' })
        .then(() => setSeeded(true))
        .catch(() => setSeeded(true));
    }
  }, [seeded]);

  const handleNavClick = (view: string) => {
    setView(view as 'dashboard' | 'chat' | 'practice' | 'progress' | 'leaderboard');
    setSidebarOpen(false);
  };

  const planLabel = user?.plan === 'premium' ? 'Premium' : user?.plan === 'pro' ? 'Pro' : 'Free';
  const planColor = user?.plan === 'premium'
    ? 'text-[#9b6829]'
    : user?.plan === 'pro'
    ? 'text-[#533afd] dark:text-brand-indigo-soft'
    : 'text-[#4f566b] dark:text-[#a8c3de]';

  /* ── Sidebar Content (shared between Sheet and desktop) ── */
  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d253d] text-[#0d253d] dark:text-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#e3e8ee] dark:border-[#273951]/40">
        <KotaAILogo className="size-8 text-brand-indigo" />
        <div>
          <span className="text-lg font-bold tracking-tight">
            Kota<span className="text-[#533afd]">AI</span>
          </span>
          <p className="text-[10px] text-[#4f566b] dark:text-[#a8c3de] font-light leading-tight">
            Your 24/7 JEE &amp; NEET Tutor
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all text-left
                ${
                  isActive
                    ? 'bg-[#533afd]/10 text-[#533afd] dark:bg-[#533afd]/20 dark:text-white'
                    : 'text-[#4f566b] dark:text-[#a8c3de] hover:bg-canvas-soft/80 dark:hover:bg-[#1c1e54]/50 hover:text-[#0d253d] dark:hover:text-white'
                }
              `}
            >
              <item.icon className={`size-4.5 ${isActive ? 'text-[#533afd] dark:text-white' : 'text-[#4f566b] dark:text-[#a8c3de]'}`} />
              {item.label}
              {isActive && (
                <div className="ml-auto size-1.5 rounded-full bg-[#533afd] dark:bg-white animate-pulse" />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-[#e3e8ee] dark:border-[#273951]/40 p-3 bg-canvas-soft/20 dark:bg-[#1c1e54]/10">
        {/* Upgrade banner for free users */}
        {user?.plan === 'free' && (
          <button
            onClick={() => {
              setUpgradePlan('pro');
              setUpgradeModalOpen(true);
            }}
            className="w-full mb-3.5 rounded-full bg-gradient-to-r from-brand-indigo to-brand-indigo-soft px-4 py-2 text-xs text-white font-semibold hover:opacity-90 shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Zap className="size-3.5" />
            Upgrade to Pro
          </button>
        )}
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-9 ring-2 ring-[#533afd]/20">
            <AvatarFallback className="bg-brand-indigo text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-[#0d253d] dark:text-white">{user?.name}</p>
            <p className={`text-[10px] uppercase font-bold tracking-wider ${planColor}`}>{planLabel} Plan</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs text-[#4f566b] dark:text-[#a8c3de] hover:bg-[#ea2261]/10 dark:hover:bg-[#ea2261]/20 hover:text-[#ea2261] transition-colors mt-1 font-semibold"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </div>
  );

  /* ── Render content based on current view ── */
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'chat':
        return <AIChat />;
      case 'practice':
        return <PracticePage />;
      case 'progress':
        return <ProgressPage />;
      case 'leaderboard':
        return <LeaderboardPage />;
      default:
        return <DashboardOverview />;
    }
  };

  const currentNav = NAV_ITEMS.find((item) => item.id === currentView);

  return (
    <div className="flex h-screen bg-canvas-soft dark:bg-[#1c1e54]/20 text-[#0d253d] dark:text-white">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r border-[#e3e8ee] dark:border-[#273951]/40 bg-white">
        {sidebarContent}
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top Header ── */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-[#e3e8ee] dark:border-[#273951]/40 bg-white/90 dark:bg-[#0d253d]/90 backdrop-blur-md px-4 py-3.5">
          {/* Mobile menu trigger */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-[#4f566b] dark:text-[#a8c3de] hover:bg-canvas-soft/80 dark:hover:bg-[#1c1e54]/50 hover:text-[#0d253d] dark:hover:text-white">
                <Menu className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 border-[#e3e8ee] dark:border-[#273951]/40 bg-white dark:bg-[#0d253d]">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              {sidebarContent}
            </SheetContent>
          </Sheet>

          {/* Current page title */}
          <div className="flex items-center gap-2">
            {currentNav && (
              <>
                <currentNav.icon className="size-4 text-brand-indigo dark:text-brand-indigo-soft" />
                <h1 className="text-sm font-semibold text-[#0d253d] dark:text-white tracking-wide">{currentNav.label}</h1>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <ThemeToggle />
            
            {/* Mobile user avatar */}
            <Avatar className="size-8 lg:hidden">
              <AvatarFallback className="bg-brand-indigo text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-[#4f566b] dark:text-[#a8c3de] hover:text-[#ea2261] hover:bg-[#ea2261]/10 rounded-full"
              onClick={logout}
              aria-label="Logout"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        {/* ── Content ── */}
        <main className={`flex-1 min-h-0 ${currentView === 'chat' ? 'flex flex-col bg-canvas-soft dark:bg-[#1c1e54]/20' : 'overflow-y-auto custom-scrollbar bg-canvas-soft dark:bg-[#1c1e54]/20'} relative`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className={currentView === 'chat' ? 'flex flex-col flex-1 h-full' : 'w-full h-full'}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Payment Modal (shared by sidebar upgrade button) */}
      <PaymentModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        plan={upgradePlan}
      />
    </div>
  );
}

/* ───────── Main Page Component ───────── */
export default function Home() {
  const { currentView, user, setView } = useAppStore();

  // Hydration-safe mount detection using useSyncExternalStore
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // If user is logged in and on landing/auth, redirect to dashboard
  useEffect(() => {
    if (user && (currentView === 'landing' || currentView === 'auth')) {
      setView('dashboard');
    }
  }, [user, currentView, setView]);

  // If user logs out and on dashboard views, redirect to landing
  useEffect(() => {
    if (!user && currentView !== 'landing' && currentView !== 'auth') {
      setView('landing');
    }
  }, [user, currentView, setView]);

  // Prevent flash of wrong content during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-soft">
        <div className="flex flex-col items-center gap-3">
          <KotaAILogo className="size-12 animate-pulse text-brand-indigo" />
          <p className="text-xs text-[#4f566b]">Loading KotaAI…</p>
        </div>
      </div>
    );
  }

  // Not logged in views
  if (!user) {
    if (currentView === 'auth') {
      return <AuthPage />;
    }
    return <LandingPage />;
  }

  // Logged in: show dashboard
  return <DashboardShell />;
}
