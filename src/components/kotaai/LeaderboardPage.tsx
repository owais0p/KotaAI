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
  'bg-orange-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-lime-500',
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
      color: 'text-green-600 dark:text-green-400',
    };
  }
  if (rank <= 10) {
    return {
      icon: <TrendingUp className="size-3" />,
      label: 'Up',
      color: 'text-green-500 dark:text-green-400',
    };
  }
  if (rank <= 15) {
    return {
      icon: <TrendingDown className="size-3" />,
      label: 'Down',
      color: 'text-orange-500 dark:text-orange-400',
    };
  }
  return {
    icon: <span className="text-[10px] font-bold">NEW</span>,
    label: 'New',
    color: 'text-sky-500 dark:text-sky-400',
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
    'from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700',
    'from-orange-400 to-orange-500 dark:from-orange-500 dark:to-orange-600',
    'from-amber-600 to-amber-700 dark:from-amber-700 dark:to-amber-800',
  ];

  return (
    <div className="flex items-end justify-center gap-2 md:gap-4 pt-6 pb-2">
      {ordered.map((entry, idx) => {
        if (!entry) return <div key={idx} className="flex-1 max-w-[140px]" />;

        const isCenter = idx === 1;
        const rankIdx = idx === 0 ? 1 : idx === 1 ? 0 : 2;
        const avatarSize = isCenter ? 'size-14 md:size-16' : 'size-11 md:size-13';
        const nameSize = isCenter ? 'text-sm font-bold' : 'text-xs font-semibold';
        const scoreSize = isCenter ? 'text-lg font-bold' : 'text-sm font-bold';

        return (
          <div
            key={entry.id}
            className="flex-1 max-w-[140px] flex flex-col items-center"
          >
            {/* Avatar + medal */}
            <div className="relative mb-2">
              <Avatar className={`${avatarSize} ring-2 ${isCenter ? 'ring-orange-400 ring-offset-2' : 'ring-muted'}`}>
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
            <p className={`${scoreSize} text-orange-600 dark:text-orange-400`}>
              {entry.score}
            </p>

            {/* Podium block */}
            <div
              className={`w-full mt-2 rounded-t-lg bg-gradient-to-t ${podiumColors[idx]} ${heights[idx]} flex items-start justify-center pt-2`}
            >
              <span className="text-white/90 font-bold text-lg">
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
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-40 mb-1" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>

        {/* Podium skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-end justify-center gap-4 h-40">
              <Skeleton className="w-20 h-24 rounded-t-lg" />
              <Skeleton className="w-24 h-32 rounded-t-lg" />
              <Skeleton className="w-20 h-20 rounded-t-lg" />
            </div>
          </CardContent>
        </Card>

        {/* List skeleton */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
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
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
        <Trophy className="size-12 text-orange-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to Load Leaderboard</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={fetchLeaderboard}
          className="text-sm text-orange-600 dark:text-orange-400 hover:underline"
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
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/50">
          <Trophy className="size-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            Top performers — all time
          </p>
        </div>
      </div>

      {/* ── Podium Section ─────────────────────────────────────── */}
      {top3.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-0 text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-orange-700 dark:text-orange-400">
              <Crown className="size-5" />
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
        <Card className="border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-orange-500 text-white text-sm font-bold">
              {currentUserEntry.rank}
            </div>
            <Avatar className="size-8">
              <AvatarFallback
                className={`${getAvatarColor(currentUserEntry.user.name)} text-white text-xs font-bold`}
              >
                {getInitial(currentUserEntry.user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold flex-1">
              You ({currentUserEntry.user.name})
            </span>
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
              {currentUserEntry.score} pts
            </span>
            <Badge
              variant="outline"
              className="border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400 text-[10px]"
            >
              Rank #{currentUserEntry.rank}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* ── Remaining Leaderboard List ─────────────────────────── */}
      {remaining.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Medal className="size-4 text-primary" />
              Full Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              {remaining.map((entry) => {
                const isCurrentUser = entry.userId === user?.id;
                const change = getChangeIndicator(entry.rank);

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 rounded-lg p-2.5 transition-colors ${
                      isCurrentUser
                        ? 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    {/* Rank */}
                    <div
                      className={`flex size-8 items-center justify-center rounded-full text-sm font-bold shrink-0 ${
                        isCurrentUser
                          ? 'bg-orange-500 text-white'
                          : 'bg-muted text-muted-foreground'
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
                          ? 'font-bold text-orange-700 dark:text-orange-400'
                          : 'font-medium'
                      }`}
                    >
                      {entry.user.name}
                      {isCurrentUser && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (You)
                        </span>
                      )}
                    </span>

                    {/* Score */}
                    <span
                      className={`text-sm font-bold shrink-0 ${
                        isCurrentUser
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-foreground'
                      }`}
                    >
                      {entry.score}
                    </span>

                    {/* Change indicator */}
                    <div className={`flex items-center gap-1 shrink-0 ${change.color}`}>
                      {change.icon}
                      <span className="text-[10px] font-medium hidden sm:inline">
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Trophy className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Rankings Yet</h3>
            <p className="text-muted-foreground text-sm">
              Start practicing to appear on the leaderboard!
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Not on Leaderboard Message ─────────────────────────── */}
      {leaderboard.length > 0 && !currentUserEntry && user && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Trophy className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Practice more to appear on the leaderboard!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
