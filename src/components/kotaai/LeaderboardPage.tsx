'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Crown, TrendingUp, TrendingDown } from 'lucide-react';

interface LeaderboardUser {
  name: string;
  avatar: string;
}

interface LeaderboardEntry {
  id: string;
  userId: string;
  score: number;
  rank: number;
  user: LeaderboardUser;
  week?: string;
}

interface LeaderboardData {
  success: boolean;
  leaderboard: LeaderboardEntry[];
  week: string;
}

const PODIUM_MEDALS = ['🥇', '🥈', '🥉'];

const AVATAR_COLORS = [
  'bg-[#533afd]',
  'bg-purple-600',
  'bg-emerald-600',
  'bg-sky-600',
  'bg-[#ea2261]',
  'bg-[#f96bee]',
  'bg-teal-600',
  'bg-[#533afd]/80',
  'bg-pink-600',
  'bg-lime-600',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

// Simulated change indicator for visual richness
function getChangeIndicator(rank: number): {
  icon: React.ReactNode;
  label: string;
  color: string;
} {
  if (rank <= 3) {
    return {
      icon: <TrendingUp className="size-3" />,
      label: 'Rising',
      color: 'text-emerald-600',
    };
  }
  if (rank <= 10) {
    return {
      icon: <TrendingUp className="size-3" />,
      label: 'Up',
      color: 'text-emerald-600/80',
    };
  }
  if (rank <= 15) {
    return {
      icon: <TrendingDown className="size-3" />,
      label: 'Down',
      color: 'text-[#ea2261]',
    };
  }
  return {
    icon: <span className="text-[9px] font-bold">NEW</span>,
    label: 'New',
    color: 'text-brand-indigo-soft',
  };
}

// ── Podium Component ──────────────────────────────────────────────
function Podium({ top3 }: { top3: LeaderboardEntry[] }) {
  // Order for display: 2nd (left), 1st (center, taller), 3rd (right)
  const ordered = [
    top3[1] || null, // 2nd place
    top3[0] || null, // 1st place
    top3[2] || null, // 3rd place
  ];

  const heights = ['h-20 md:h-24', 'h-28 md:h-32', 'h-16 md:h-20'];
  const podiumColors = [
    'from-[#a8c3de]/10 to-[#a8c3de]/20 border border-[#a8c3de]/30 text-[#0d253d] dark:text-white',
    'from-brand-indigo/10 to-brand-indigo-soft/20 border-2 border-brand-indigo/50 text-[#0d253d] dark:text-white shadow-[rgba(83,58,253,0.06)_0_8px_24px]',
    'from-[#9b6829]/10 to-[#9b6829]/20 border border-[#9b6829]/20 text-[#0d253d] dark:text-white',
  ];

  return (
    <div className="flex items-end justify-center gap-2 md:gap-4 pt-6 pb-2">
      {ordered.map((entry, idx) => {
        if (!entry) return <div key={idx} className="flex-1 max-w-[140px]" />;

        const isCenter = idx === 1;
        const rankIdx = idx === 0 ? 1 : idx === 1 ? 0 : 2;
        const avatarSize = isCenter ? 'size-14 md:size-16' : 'size-11 md:size-13';
        const nameSize = isCenter ? 'text-sm font-semibold text-[#0d253d] dark:text-white' : 'text-xs text-[#4f566b] dark:text-[#a8c3de]';
        const scoreSize = isCenter ? 'text-lg font-bold font-tabular text-[#533afd] dark:text-brand-indigo-soft' : 'text-sm font-bold font-tabular text-[#4f566b] dark:text-[#a8c3de]';

        return (
          <div
            key={entry.id}
            className="flex-1 max-w-[140px] flex flex-col items-center animate-fade-in"
          >
            {/* Avatar + medal */}
            <div className="relative mb-2">
              <Avatar className={`${avatarSize} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0d253d] ${isCenter ? 'ring-brand-indigo' : 'ring-[#e3e8ee]'}`}>
                <AvatarFallback
                  className={`${getAvatarColor(entry.user.name)} text-white font-bold ${isCenter ? 'text-lg' : 'text-sm'}`}
                >
                  {getInitial(entry.user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -top-2 -right-1 text-lg md:text-xl">
                {PODIUM_MEDALS[rankIdx]}
              </span>
            </div>

            {/* Name */}
            <p className={`${nameSize} text-center truncate w-full px-1`}>
              {entry.user.name}
            </p>

            {/* Score */}
            <p className={`${scoreSize}`}>
              {entry.score}
            </p>

            {/* Podium block */}
            <div
              className={`w-full mt-2 rounded-t-xl bg-gradient-to-t ${podiumColors[idx]} flex items-start justify-center pt-2.5`}
            >
              <span className="text-[#0d253d] dark:text-white font-bold text-lg">
                {rankIdx + 1}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LeaderboardPage() {
  const user = useAppStore((s) => s.user);

  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/leaderboard');
      const json = await res.json();
      if (json.success) {
        setData(json as LeaderboardData);
      } else {
        setError(json.error || 'Failed to load leaderboard');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // ── Loading State ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 animate-pulse">
          <Skeleton className="size-10 rounded-lg bg-white border border-[#e3e8ee]" />
          <div>
            <Skeleton className="h-5 w-32 mb-2 bg-canvas-soft" />
            <Skeleton className="h-3 w-48 bg-canvas-soft" />
          </div>
        </div>

        {/* Podium skeleton */}
        <Card className="border border-[#e3e8ee] bg-white animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-end justify-center gap-4 h-40">
              <Skeleton className="w-20 h-24 rounded-t-lg bg-canvas-soft" />
              <Skeleton className="w-24 h-32 rounded-t-lg bg-canvas-soft" />
              <Skeleton className="w-20 h-20 rounded-t-lg bg-canvas-soft" />
            </div>
          </CardContent>
        </Card>

        {/* List skeleton */}
        <Card className="border border-[#e3e8ee] bg-white animate-pulse">
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-6 rounded-full bg-canvas-soft" />
                <Skeleton className="h-3 w-6 bg-canvas-soft" />
                <Skeleton className="size-8 rounded-full bg-canvas-soft" />
                <Skeleton className="h-3 flex-1 bg-canvas-soft" />
                <Skeleton className="h-3 w-10 bg-canvas-soft" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh] text-[#0d253d]">
        <Trophy className="size-12 text-[#ea2261] mb-4" />
        <h3 className="text-lg font-light mb-2">Unable to Load Leaderboard</h3>
        <p className="text-xs text-[#4f566b] mb-4">{error}</p>
        <button
          onClick={fetchLeaderboard}
          className="text-xs text-brand-indigo hover:text-brand-indigo-deep font-semibold hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { leaderboard } = data;
  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);
  const currentUserEntry = leaderboard.find((e) => e.userId === user?.id);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto text-[#0d253d] dark:text-white">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-[#e3e8ee] dark:border-[#273951]/40 pb-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-brand-indigo/10 border border-brand-indigo/20">
          <Trophy className="size-5 text-brand-indigo" />
        </div>
        <div>
          <h1 className="text-xl font-light tracking-tight text-[#0d253d] dark:text-white md:text-2xl">Leaderboard</h1>
          <p className="text-xs text-[#4f566b] dark:text-[#a8c3de] font-light mt-0.5">
            Top performers &mdash; compete with students globally.
          </p>
        </div>
      </div>

      {/* ── Podium Section ─────────────────────────────────────── */}
      {top3.length > 0 && (
        <Card className="border border-[#e3e8ee] dark:border-[#273951]/40 bg-white dark:bg-[#0d253d] overflow-hidden shadow-sm">
          <CardHeader className="pb-0 text-center bg-transparent">
            <CardTitle className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-indigo dark:text-brand-indigo-soft">
              <Crown className="size-4" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <Podium top3={top3} />
          </CardContent>
        </Card>
      )}

      {/* ── Current User Rank (if not in top 3) ────────────────── */}
      {currentUserEntry && currentUserEntry.rank > 3 && (
        <Card className="border border-brand-indigo/35 bg-brand-indigo-subdued/10 shadow-sm overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-7 items-center justify-center rounded-full bg-brand-indigo text-white text-xs font-bold font-tabular">
              {currentUserEntry.rank}
            </div>
            <Avatar className="size-8">
              <AvatarFallback
                className={`${getAvatarColor(currentUserEntry.user.name)} text-white text-xs font-bold`}
              >
                {getInitial(currentUserEntry.user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold flex-1 text-[#0d253d] dark:text-white">
              You ({currentUserEntry.user.name})
            </span>
            <span className="text-sm font-bold text-brand-indigo dark:text-brand-indigo-soft font-tabular">
              {currentUserEntry.score} pts
            </span>
            <Badge
              variant="outline"
              className="border-brand-indigo/40 text-brand-indigo text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md"
            >
              Rank #{currentUserEntry.rank}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* ── Remaining Leaderboard List ─────────────────────────── */}
      {remaining.length > 0 && (
        <Card className="border border-[#e3e8ee] dark:border-[#273951]/40 bg-white dark:bg-[#0d253d] shadow-sm overflow-hidden">
          <CardHeader className="pb-3 bg-transparent">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 text-[#4f566b] dark:text-[#a8c3de]">
              <Medal className="size-4 text-brand-indigo" />
              Full Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              {remaining.map((entry) => {
                const isCurrentUser = entry.userId === user?.id;
                const change = getChangeIndicator(entry.rank);

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 rounded-xl p-3 border hover:border-brand-indigo/30 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
                      isCurrentUser
                        ? 'bg-brand-indigo-subdued/10 border-brand-indigo/35'
                        : 'border-[#e3e8ee] dark:border-[#273951]/40 bg-canvas-soft/20 dark:bg-[#1c1e54]/10 hover:bg-canvas-soft/40 dark:hover:bg-[#1c1e54]/30'
                    }`}
                  >
                    {/* Rank */}
                    <div
                      className={`flex size-7 items-center justify-center rounded-full text-xs font-bold font-tabular shrink-0 ${
                        isCurrentUser
                          ? 'bg-brand-indigo text-white shadow-sm'
                          : 'bg-canvas-soft dark:bg-[#1c1e54]/50 text-[#4f566b] dark:text-[#a8c3de]'
                      }`}
                    >
                      {entry.rank}
                    </div>

                    {/* Avatar */}
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback
                        className={`${getAvatarColor(entry.user.name)} text-white text-xs font-bold`}
                      >
                        {getInitial(entry.user.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name */}
                    <span
                      className={`text-sm flex-1 min-w-0 truncate ${
                        isCurrentUser
                          ? 'font-semibold text-brand-indigo dark:text-brand-indigo-soft'
                          : 'font-light text-[#0d253d] dark:text-white'
                      }`}
                    >
                      {entry.user.name}
                      {isCurrentUser && (
                        <span className="text-[10px] text-[#4f566b] dark:text-[#a8c3de]/60 ml-1.5 font-light">
                          (You)
                        </span>
                      )}
                    </span>

                    {/* Score */}
                    <span
                      className={`text-sm font-semibold font-tabular shrink-0 ${
                        isCurrentUser
                          ? 'text-brand-indigo'
                          : 'text-[#4f566b] dark:text-[#a8c3de]'
                      }`}
                    >
                      {entry.score}
                    </span>

                    {/* Change indicator */}
                    <div className={`flex items-center gap-1 shrink-0 ${change.color}`}>
                      {change.icon}
                      <span className="text-[9px] font-semibold uppercase tracking-wider hidden sm:inline">
                        {change.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Empty State ────────────────────────────────────────── */}
      {leaderboard.length === 0 && (
        <Card className="bg-white border border-[#e3e8ee] shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Trophy className="size-12 text-[#7a8c9f] mb-4" />
            <h3 className="text-base font-semibold mb-2">No Rankings Yet</h3>
            <p className="text-xs text-[#4f566b] font-light max-w-xs leading-relaxed">
              Start practicing mock questions to appear on the global leaderboard!
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Not on Leaderboard Message ─────────────────────────── */}
      {leaderboard.length > 0 && !currentUserEntry && user && (
        <Card className="border-dashed border-[#e3e8ee] bg-white/40">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Trophy className="size-7 text-[#7a8c9f] mb-2" />
            <p className="text-xs text-[#4f566b] font-light">
              Practice more mock questions to appear on the leaderboard!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
