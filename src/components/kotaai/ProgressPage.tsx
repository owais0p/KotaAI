'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  BarChart3,
  ChevronDown,
  Zap,
  Atom,
  FlaskConical,
  Calculator,
  Leaf,
} from 'lucide-react';
import type { ProgressTopic, Subject } from '@/lib/types';

interface SubjectSummary {
  total: number;
  completed: number;
  weakAreas: number;
  averageScore: number;
}

interface ProgressData {
  progress: Record<string, ProgressTopic[]>;
  weakAreas: ProgressTopic[];
  summary: {
    totalTopics: number;
    completedTopics: number;
    weakAreaCount: number;
    averageScore: number;
    subjectSummary: Record<string, SubjectSummary>;
  };
}

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  Physics: <Atom className="size-5" />,
  Chemistry: <FlaskConical className="size-5" />,
  Maths: <Calculator className="size-5" />,
  Biology: <Leaf className="size-5" />,
};

const SUBJECT_COLORS: Record<string, string> = {
  Physics: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400',
  Chemistry: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
  Maths: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400',
  Biology: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
};

const SUBJECT_PROGRESS_COLORS: Record<string, string> = {
  Physics: '[&>div]:bg-purple-500',
  Chemistry: '[&>div]:bg-emerald-500',
  Maths: '[&>div]:bg-sky-500',
  Biology: '[&>div]:bg-rose-500',
};

function getTopicStatus(topic: ProgressTopic): {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
} {
  if (topic.weakArea) {
    return {
      icon: <AlertTriangle className="size-4" />,
      label: 'Weak Area',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    };
  }
  if (topic.completed) {
    return {
      icon: <CheckCircle2 className="size-4" />,
      label: 'Completed',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    };
  }
  if (topic.score > 0) {
    return {
      icon: <span className="text-sm">⏳</span>,
      label: 'In Progress',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    };
  }
  return {
    icon: <span className="text-sm">🔒</span>,
    label: 'Not Started',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
  };
}

function getMiniProgressBarColor(topic: ProgressTopic): string {
  if (topic.weakArea) return '[&>div]:bg-orange-500';
  if (topic.completed) return '[&>div]:bg-green-500';
  if (topic.score > 0) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-muted-foreground/40';
}

export default function ProgressPage() {
  const user = useAppStore((s) => s.user);
  const setView = useAppStore((s) => s.setView);
  const setSelectedSubject = useAppStore((s) => s.setSelectedSubject);

  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  const fetchProgress = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/progress?userId=${user.id}`);
      const json = await res.json();
      if (json.success) {
        setData(json as ProgressData);
        // Expand all subjects by default
        const expanded: Record<string, boolean> = {};
        Object.keys(json.progress || {}).forEach((s) => {
          expanded[s] = true;
        });
        setExpandedSubjects(expanded);
      } else {
        setError(json.error || 'Failed to load progress');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const toggleSubject = (subject: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [subject]: !prev[subject] }));
  };

  const handlePracticeWeak = (subject: string) => {
    setSelectedSubject(subject as Subject);
    setView('practice');
  };

  // ── Loading State ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 md:p-6">
                <div className="h-4 w-20 rounded bg-muted mb-3" />
                <div className="h-8 w-16 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Subject skeleton */}
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="p-4 md:p-6">
              <div className="h-6 w-48 rounded bg-muted" />
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="h-3 w-full rounded bg-muted mb-3" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-10 w-full rounded bg-muted" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
        <AlertTriangle className="size-12 text-orange-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to Load Progress</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchProgress} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, progress, weakAreas } = data;

  // Calculate additional stats
  const attemptedTopics = Object.values(progress).flat().filter((t) => t.score > 0).length;
  const correctAnswers = Object.values(progress)
    .flat()
    .reduce((sum, t) => sum + Math.round((t.score / 100) * 10), 0);
  const accuracy =
    attemptedTopics > 0
      ? Math.round(
          (Object.values(progress).flat().filter((t) => t.completed).length /
            attemptedTopics) *
            100
        )
      : 0;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/50">
          <BarChart3 className="size-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Your Progress</h1>
          <p className="text-sm text-muted-foreground">
            Track your learning journey across all subjects
          </p>
        </div>
      </div>

      {/* ── Overall Stats Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="size-4 text-purple-500" />
              <span className="text-xs text-muted-foreground font-medium">
                Attempted
              </span>
            </div>
            <p className="text-2xl font-bold">{attemptedTopics}</p>
            <p className="text-xs text-muted-foreground">topics</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="size-4 text-green-500" />
              <span className="text-xs text-muted-foreground font-medium">
                Correct
              </span>
            </div>
            <p className="text-2xl font-bold">{correctAnswers}</p>
            <p className="text-xs text-muted-foreground">answers</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="size-4 text-orange-500" />
              <span className="text-xs text-muted-foreground font-medium">
                Accuracy
              </span>
            </div>
            <p className="text-2xl font-bold">{accuracy}%</p>
            <p className="text-xs text-muted-foreground">overall</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground font-medium">
                Completed
              </span>
            </div>
            <p className="text-2xl font-bold">{summary.completedTopics}</p>
            <p className="text-xs text-muted-foreground">
              of {summary.totalTopics} topics
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Weak Areas Panel ───────────────────────────────────── */}
      {weakAreas.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="size-5" />
              Weak Areas — Need Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weakAreas.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-card p-3 border border-orange-100 dark:border-orange-900/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className="border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400 text-[10px] px-1.5"
                      >
                        {topic.subject}
                      </Badge>
                      <span className="text-sm font-medium truncate">
                        {topic.topic}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Practice more <strong>{topic.topic}</strong> to improve
                      your score
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {topic.score}%
                    </span>
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8"
                      onClick={() => handlePracticeWeak(topic.subject)}
                    >
                      <Zap className="size-3 mr-1" />
                      Practice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Subject-wise Progress ──────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" />
          Subject Progress
        </h2>

        {Object.entries(progress).map(([subject, topics]) => {
          const subjectInfo = summary.subjectSummary[subject];
          if (!subjectInfo) return null;

          const completedPct =
            subjectInfo.total > 0
              ? Math.round((subjectInfo.completed / subjectInfo.total) * 100)
              : 0;
          const isExpanded = expandedSubjects[subject];

          return (
            <Collapsible
              key={subject}
              open={isExpanded}
              onOpenChange={() => toggleSubject(subject)}
            >
              <Card>
                {/* Subject Header */}
                <CollapsibleTrigger asChild>
                  <button className="w-full text-left">
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-10 items-center justify-center rounded-lg ${SUBJECT_COLORS[subject] || 'text-muted-foreground bg-muted'}`}
                          >
                            {SUBJECT_ICONS[subject] || (
                              <BookOpen className="size-5" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {subject}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {subjectInfo.completed}/{subjectInfo.total} topics
                              completed · Avg {subjectInfo.averageScore}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="secondary"
                            className="text-xs hidden sm:flex"
                          >
                            {completedPct}% done
                          </Badge>
                          <ChevronDown
                            className={`size-5 text-muted-foreground transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3">
                        <Progress
                          value={completedPct}
                          className={`h-2 ${SUBJECT_PROGRESS_COLORS[subject] || ''}`}
                        />
                      </div>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>

                {/* Topics List */}
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                      {topics.map((topic) => {
                        const status = getTopicStatus(topic);
                        return (
                          <div
                            key={topic.id}
                            className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${status.bgColor}`}
                          >
                            {/* Status icon */}
                            <div className={`shrink-0 ${status.color}`}>
                              {status.icon}
                            </div>

                            {/* Topic name & progress */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium truncate">
                                  {topic.topic}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 shrink-0 ${
                                    topic.weakArea
                                      ? 'border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400'
                                      : topic.completed
                                        ? 'border-green-300 text-green-600 dark:border-green-700 dark:text-green-400'
                                        : topic.score > 0
                                          ? 'border-yellow-300 text-yellow-600 dark:border-yellow-700 dark:text-yellow-400'
                                          : 'border-muted-foreground/30 text-muted-foreground'
                                  }`}
                                >
                                  {status.label}
                                </Badge>
                              </div>
                              <Progress
                                value={topic.score}
                                className={`h-1.5 ${getMiniProgressBarColor(topic)}`}
                              />
                            </div>

                            {/* Score */}
                            <span
                              className={`text-sm font-semibold shrink-0 ${
                                topic.weakArea
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : topic.completed
                                    ? 'text-green-600 dark:text-green-400'
                                    : topic.score > 0
                                      ? 'text-yellow-600 dark:text-yellow-400'
                                      : 'text-muted-foreground'
                              }`}
                            >
                              {topic.score > 0 ? `${topic.score}%` : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {/* ── Empty State ────────────────────────────────────────── */}
      {Object.keys(progress).length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <BookOpen className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Progress Yet</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Start practicing to see your progress here!
            </p>
            <Button onClick={() => setView('practice')} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Zap className="size-4 mr-2" />
              Start Practicing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
