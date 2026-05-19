'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
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
import Image from 'next/image';
import {
  MessageSquare,
  BookOpen,
  BarChart3,
  Trophy,
  LogOut,
  Menu,
  GraduationCap,
  Home as HomeIcon,
  ChevronRight,
  Sparkles,
  Zap,
  Flame,
  AlertTriangle,
} from 'lucide-react';

import LandingPage from '@/components/kotaai/LandingPage';
import AuthPage from '@/components/kotaai/AuthPage';
import AIChat from '@/components/kotaai/AIChat';
import PracticePage from '@/components/kotaai/PracticePage';
import ProgressPage from '@/components/kotaai/ProgressPage';
import LeaderboardPage from '@/components/kotaai/LeaderboardPage';
import PaymentModal from '@/components/kotaai/PaymentModal';

/* ───────── Navigation Items ───────── */
const NAV_ITEMS = [
  { id: 'dashboard' as const, label: 'Overview', icon: HomeIcon },
  { id: 'chat' as const, label: 'AI Tutor', icon: MessageSquare },
  { id: 'practice' as const, label: 'Practice', icon: BookOpen },
  { id: 'progress' as const, label: 'Progress', icon: BarChart3 },
  { id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy },
];

/* ───────── Dashboard Overview Component ───────── */
function DashboardOverview() {
  const { user, setView, setSelectedSubject, setUser } = useAppStore();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'pro' | 'premium'>('pro');
  const [streakAtRisk, setStreakAtRisk] = useState(false);

  // Fetch streak status
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/streak?userId=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStreakAtRisk(data.streakAtRisk);
          // Update user in store with latest streak
          if (user.streak !== data.streak) {
            setUser({ ...user, streak: data.streak, lastPracticeDate: data.lastPracticeDate });
          }
        }
      })
      .catch(() => {});
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const quickActions = [
    {
      label: 'Ask a Doubt',
      description: 'Get step-by-step AI explanations',
      icon: MessageSquare,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      view: 'chat' as const,
    },
    {
      label: 'Daily Practice',
      description: '10 MCQs per subject',
      icon: BookOpen,
      color: 'bg-emerald-500',
      hoverColor: 'hover:bg-emerald-600',
      view: 'practice' as const,
    },
    {
      label: 'Track Progress',
      description: 'See your strengths & weak areas',
      icon: BarChart3,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      view: 'progress' as const,
    },
    {
      label: 'Leaderboard',
      description: 'Compete with top students',
      icon: Trophy,
      color: 'bg-amber-500',
      hoverColor: 'hover:bg-amber-600',
      view: 'leaderboard' as const,
    },
  ];

  const subjects = [
    { name: 'Physics', emoji: '⚛️', color: 'border-purple-300 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-800', count: '50 MCQs' },
    { name: 'Chemistry', emoji: '🧪', color: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800', count: '50 MCQs' },
    { name: 'Maths', emoji: '📐', color: 'border-sky-300 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-800', count: '50 MCQs' },
    { name: 'Biology', emoji: '🧬', color: 'border-rose-300 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800', count: '50 MCQs' },
  ];

  const planBadge = user?.plan === 'premium'
    ? { label: 'Premium', class: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' }
    : user?.plan === 'pro'
    ? { label: 'Pro', class: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800' }
    : { label: 'Free', class: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' };

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Avatar className="size-14 ring-2 ring-orange-200 dark:ring-orange-800">
          <AvatarFallback className="bg-orange-500 text-white text-xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'S'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0] || 'Student'}!</h1>
            <Badge variant="outline" className={planBadge.class}>
              {planBadge.label}
            </Badge>
            {/* Streak Badge */}
            {(user?.streak ?? 0) > 0 && (
              <Badge
                className={`gap-1 font-bold ${
                  streakAtRisk
                    ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800 animate-pulse'
                    : 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800'
                }`}
              >
                <Flame className={`size-3.5 ${streakAtRisk ? 'text-red-500' : 'text-orange-500'}`} />
                {user?.streak} day{user?.streak !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Ready to crack JEE & NEET? Let&apos;s continue your preparation.
          </p>
        </div>
      </div>

      {/* Streak at Risk Warning */}
      {streakAtRisk && (user?.streak ?? 0) > 0 && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/20 p-4">
          <div className="flex items-center justify-center size-10 rounded-full bg-red-100 dark:bg-red-950/50 shrink-0">
            <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700 dark:text-red-400">
              🔥 Streak at risk!
            </p>
            <p className="text-xs text-red-600 dark:text-red-400/80">
              You haven&apos;t practiced today. Your {user?.streak}-day streak will reset if you miss today!
            </p>
          </div>
          <Button
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
            onClick={() => setView('practice')}
          >
            <BookOpen className="size-3.5 mr-1" />
            Practice Now
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="size-5 text-orange-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => setView(action.view)}
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-5 hover:border-orange-300 hover:bg-orange-50/50 dark:hover:border-orange-800 dark:hover:bg-orange-950/20 transition-all group"
            >
              <div className={`flex size-12 items-center justify-center rounded-xl ${action.color} ${action.hoverColor} text-white shadow-lg transition-colors`}>
                <action.icon className="size-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Subjects Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <GraduationCap className="size-5 text-orange-500" />
          Subjects
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {subjects.map((subject) => (
            <button
              key={subject.name}
              onClick={() => {
                setSelectedSubject(subject.name as 'Physics' | 'Chemistry' | 'Maths' | 'Biology');
                setView('practice');
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all hover:shadow-md ${subject.color}`}
            >
              <span className="text-3xl">{subject.emoji}</span>
              <span className="text-sm font-semibold">{subject.name}</span>
              <span className="text-xs text-muted-foreground">{subject.count}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="flex items-center justify-center size-10 rounded-lg bg-orange-100 dark:bg-orange-950/50 mx-auto mb-2">
            <MessageSquare className="size-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-bold">24/7</p>
          <p className="text-xs text-muted-foreground">AI Tutor</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 mx-auto mb-2">
            <BookOpen className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold">200+</p>
          <p className="text-xs text-muted-foreground">MCQ Bank</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="flex items-center justify-center size-10 rounded-lg bg-purple-100 dark:bg-purple-950/50 mx-auto mb-2">
            <BarChart3 className="size-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-bold">4</p>
          <p className="text-xs text-muted-foreground">Subjects</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="flex items-center justify-center size-10 rounded-lg bg-amber-100 dark:bg-amber-950/50 mx-auto mb-2">
            <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold">AI</p>
          <p className="text-xs text-muted-foreground">Powered</p>
        </div>
      </div>

      {/* CTA Banner - Free users: Upgrade prompt, Paid users: Practice prompt */}
      {user?.plan === 'free' ? (
        <div className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-center text-white">
          <h3 className="text-lg font-bold mb-1">
            Unlock Unlimited Practice
          </h3>
          <p className="text-sm text-orange-100 mb-4">
            Free plan: 5 MCQs/day & 3 AI questions/day. Upgrade for unlimited access!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => { setUpgradePlan('pro'); setUpgradeModalOpen(true); }}
              className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-lg"
            >
              <Zap className="size-4 mr-2" />
              Upgrade to Pro — ₹299/mo
            </Button>
            <Button
              onClick={() => { setUpgradePlan('premium'); setUpgradeModalOpen(true); }}
              className="bg-amber-100 text-amber-800 hover:bg-amber-200 font-semibold shadow-lg border border-amber-300"
            >
              <Sparkles className="size-4 mr-2" />
              Premium — ₹699/mo
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-center text-white">
          <h3 className="text-lg font-bold mb-1">
            Start Today&apos;s Practice Session
          </h3>
          <p className="text-sm text-orange-100 mb-4">
            Complete your daily MCQs and climb the leaderboard!
          </p>
          <Button
            onClick={() => setView('practice')}
            className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-lg"
          >
            <BookOpen className="size-4 mr-2" />
            Start Practicing
          </Button>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        plan={upgradePlan}
      />
    </div>
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
    ? 'text-amber-600 dark:text-amber-400'
    : user?.plan === 'pro'
    ? 'text-orange-600 dark:text-orange-400'
    : 'text-muted-foreground';

  /* ── Sidebar Content (shared between Sheet and desktop) ── */
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b">
        <Image
          src="/logo.png"
          alt="KotaAI Logo"
          width={36}
          height={36}
          className="rounded-lg"
          priority
        />
        <div>
          <span className="text-lg font-bold">
            Kota<span className="text-orange-500">AI</span>
          </span>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Your 24/7 JEE & NEET Tutor
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${
                  isActive
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <item.icon className={`size-5 ${isActive ? 'text-orange-500' : ''}`} />
              {item.label}
              {isActive && (
                <div className="ml-auto size-1.5 rounded-full bg-orange-500" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t p-3">
        {/* Upgrade banner for free users */}
        {user?.plan === 'free' && (
          <button
            onClick={() => {
              setUpgradePlan('pro');
              setUpgradeModalOpen(true);
            }}
            className="w-full mb-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2 text-sm text-white font-medium hover:from-orange-600 hover:to-amber-600 transition-all flex items-center gap-2"
          >
            <Zap className="size-4" />
            Upgrade to Pro
          </button>
        )}
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-9">
            <AvatarFallback className="bg-orange-500 text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className={`text-xs ${planColor}`}>{planLabel} Plan</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors mt-1"
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
    <div className="flex h-screen bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r bg-card">
        {sidebarContent}
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top Header ── */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background/95 backdrop-blur px-4 py-3">
          {/* Mobile menu trigger */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
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
                <currentNav.icon className="size-5 text-orange-500" />
                <h1 className="text-base font-semibold">{currentNav.label}</h1>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Mobile user avatar */}
            <Avatar className="size-8 lg:hidden">
              <AvatarFallback className="bg-orange-500 text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground hover:text-red-500"
              onClick={logout}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        {/* ── Content ── */}
        <main className={`flex-1 min-h-0 ${currentView === 'chat' ? 'flex flex-col' : 'overflow-y-auto custom-scrollbar'}`}>
          {renderContent()}
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo.png"
            alt="KotaAI Logo"
            width={48}
            height={48}
            className="rounded-xl animate-pulse"
            priority
          />
          <p className="text-sm text-muted-foreground">Loading KotaAI...</p>
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
