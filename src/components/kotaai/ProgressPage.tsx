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
  Physics: 'text-[#f96bee] bg-[#f96bee]/10 border-[#f96bee]/20',
  Chemistry: 'text-emerald-600 bg-emerald-50 border border-emerald-200',
  Maths: 'text-[#533afd] bg-brand-indigo-subdued/20 border border-brand-indigo/20',
  Biology: 'text-[#ea2261] bg-[#ea2261]/10 border border-[#ea2261]/20',
};

const SUBJECT_PROGRESS_COLORS: Record<string, string> = {
  Physics: '[&>div]:bg-[#f96bee]',
  Chemistry: '[&>div]:bg-emerald-500',
  Maths: '[&>div]:bg-brand-indigo',
  Biology: '[&>div]:bg-[#ea2261]',
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
      color: 'text-[#ea2261]',
      bgColor: 'bg-[#ea2261]/5 border border-[#ea2261]/15',
    };
  }
  if (topic.completed) {
    return {
      icon: <CheckCircle2 className="size-4" />,
      label: 'Completed',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border border-emerald-100',
    };
  }
  if (topic.score > 0) {
    return {
      icon: <span className="text-xs">⏳</span>,
      label: 'In Progress',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border border-amber-100',
    };
  }
  return {
    icon: <span className="text-xs">🔒</span>,
    label: 'Not Started',
    color: 'text-[#7a8c9f]',
    bgColor: 'bg-canvas-soft border border-[#e3e8ee]',
  };
}

function getMiniProgressBarColor(topic: ProgressTopic): string {
  if (topic.weakArea) return '[&>div]:bg-[#ea2261]';
  if (topic.completed) return '[&>div]:bg-emerald-500';
  if (topic.score > 0) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-[#a8c3de]';
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
      <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-white border border-[#e3e8ee]">
              <CardContent className="p-4 md:p-6">
                <div className="h-3 w-16 rounded bg-canvas-soft mb-3" />
                <div className="h-6 w-12 rounded bg-canvas-soft" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Subject skeleton */}
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse bg-white border border-[#e3e8ee]">
            <CardHeader className="p-4 md:p-6">
              <div className="h-5 w-40 rounded bg-canvas-soft" />
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="h-2 w-full rounded bg-canvas-soft mb-3" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-8 w-full rounded bg-canvas-soft" />
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
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh] text-[#0d253d]">
        <AlertTriangle className="size-12 text-[#ea2261] mb-4" />
        <h3 className="text-lg font-light mb-2">Unable to Load Progress</h3>
        <p className="text-xs text-[#4f566b] mb-4">{error}</p>
        <Button onClick={fetchProgress} variant="outline" className="rounded-full border-[#e3e8ee] text-xs hover:bg-canvas-soft">
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
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto text-[#0d253d] dark:text-white">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-[#e3e8ee] dark:border-[#273951]/40 pb-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-brand-indigo/10 border border-brand-indigo/20">
          <BarChart3 className="size-5 text-brand-indigo" />
        </div>
        <div>
          <h1 className="text-xl font-light tracking-tight text-[#0d253d] dark:text-white md:text-2xl">Your Progress</h1>
          <p className="text-xs text-[#4f566b] dark:text-[#a8c3de] font-light mt-0.5">
            Track your mastery and accuracy metrics across subjects.
          </p>
        </div>
      </div>

      {/* ── Overall Stats Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card className="border-0 border-l-4 border-l-[#533afd] bg-white dark:bg-[#0d253d] border-y border-r border-[#e3e8ee] dark:border-[#273951]/40 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="size-4 text-brand-indigo" />
              <span className="text-[10px] uppercase tracking-wider text-[#4f566b] dark:text-[#a8c3de] font-bold">
                Attempted
              </span>
            </div>
            <p className="text-2xl font-light text-[#0d253d] dark:text-white font-tabular">{attemptedTopics}</p>
            <p className="text-[10px] text-[#4f566b]/60 dark:text-[#a8c3de]/60 font-light mt-0.5">topics practiced</p>
          </CardContent>
        </Card>

        <Card className="border-0 border-l-4 border-l-emerald-500 bg-white dark:bg-[#0d253d] border-y border-r border-[#e3e8ee] dark:border-[#273951]/40 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span className="text-[10px] uppercase tracking-wider text-[#4f566b] dark:text-[#a8c3de] font-bold">
                Correct
              </span>
            </div>
            <p className="text-2xl font-light text-[#0d253d] dark:text-white font-tabular">{correctAnswers}</p>
            <p className="text-[10px] text-[#4f566b]/60 dark:text-[#a8c3de]/60 font-light mt-0.5">answers solved</p>
          </CardContent>
        </Card>

        <Card className="border-0 border-l-4 border-l-[#ea2261] bg-white dark:bg-[#0d253d] border-y border-r border-[#e3e8ee] dark:border-[#273951]/40 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="size-4 text-[#ea2261]" />
              <span className="text-[10px] uppercase tracking-wider text-[#4f566b] dark:text-[#a8c3de] font-bold">
                Accuracy
              </span>
            </div>
            <p className="text-2xl font-light text-[#0d253d] dark:text-white font-tabular">{accuracy}%</p>
            <p className="text-[10px] text-[#4f566b]/60 dark:text-[#a8c3de]/60 font-light mt-0.5">overall success rate</p>
          </CardContent>
        </Card>

        <Card className="border-0 border-l-4 border-l-[#f96bee] bg-white dark:bg-[#0d253d] border-y border-r border-[#e3e8ee] dark:border-[#273951]/40 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 text-[#f96bee]" />
              <span className="text-[10px] uppercase tracking-wider text-[#4f566b] dark:text-[#a8c3de] font-bold">
                Completed
              </span>
            </div>
            <p className="text-2xl font-light text-[#0d253d] dark:text-white font-tabular">{summary.completedTopics}</p>
            <p className="text-[10px] text-[#4f566b]/60 dark:text-[#a8c3de]/60 font-light mt-0.5">
              of {summary.totalTopics} total topics
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Weak Areas Panel ───────────────────────────────────── */}
      {weakAreas.length > 0 && (
        <Card className="border border-[#ea2261]/20 bg-[#ea2261]/5 shadow-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#ea2261]">
              <AlertTriangle className="size-4" />
              Weak Areas — Need Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weakAreas.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 border border-[#e3e8ee] shadow-sm hover:border-brand-indigo/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge
                        variant="outline"
                        className="border-[#ea2261]/30 text-[#ea2261] bg-[#ea2261]/10 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md"
                      >
                        {topic.subject}
                      </Badge>
                      <span className="text-sm font-semibold text-[#0d253d] truncate">
                        {topic.topic}
                      </span>
                    </div>
                    <p className="text-xs text-[#4f566b] font-light leading-normal">
                      Practice more mock exams on <strong>{topic.topic}</strong> to improve your scores.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-base font-semibold text-[#ea2261] font-tabular">
                      {topic.score}%
                    </span>
                    <Button
                      size="sm"
                      className="bg-brand-indigo hover:bg-brand-indigo-deep text-white text-xs font-semibold h-9 rounded-full px-4"
                      onClick={() => handlePracticeWeak(topic.subject)}
                    >
                      <Zap className="size-3.5 mr-1" />
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
        <h2 className="text-sm uppercase tracking-wider text-[#4f566b] font-semibold flex items-center gap-2 mb-4">
          <BarChart3 className="size-4.5 text-brand-indigo" />
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
              <Card className="border border-[#e3e8ee] bg-white shadow-sm overflow-hidden">
                {/* Subject Header */}
                <CollapsibleTrigger asChild>
                  <button className="w-full text-left focus:outline-none">
                    <CardHeader className="pb-3 cursor-pointer hover:bg-canvas-soft/40 hover:text-brand-indigo transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-10 items-center justify-center rounded-lg border ${SUBJECT_COLORS[subject] || 'text-[#4f566b] bg-white border-[#e3e8ee]'}`}
                          >
                            {SUBJECT_ICONS[subject] || (
                              <BookOpen className="size-5" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-base font-normal tracking-tight text-[#0d253d]">
                              {subject}
                            </CardTitle>
                            <p className="text-[11px] text-[#4f566b] font-light mt-0.5">
                              {subjectInfo.completed}/{subjectInfo.total} topics completed &middot; Avg <span className="font-tabular">{subjectInfo.averageScore}%</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="secondary"
                            className="text-xs font-semibold px-2 py-0.5 bg-canvas-soft text-[#4f566b] border border-[#e3e8ee] rounded-md hidden sm:flex"
                          >
                            {completedPct}% done
                          </Badge>
                          <ChevronDown
                            className={`size-5 text-[#4f566b]/60 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3">
                        <Progress
                          value={completedPct}
                          className={`h-1.5 bg-canvas-soft ${SUBJECT_PROGRESS_COLORS[subject] || ''}`}
                        />
                      </div>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>

                {/* Topics List */}
                <CollapsibleContent>
                  <CardContent className="pt-0 px-4 pb-4">
                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                      {topics.map((topic) => {
                        const status = getTopicStatus(topic);
                        return (
                          <div
                            key={topic.id}
                            className="flex items-center gap-3 rounded-lg p-3 border border-[#e3e8ee] bg-white hover:border-brand-indigo/35 hover:bg-canvas-soft/10 hover:-translate-y-0.5 transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
                          >
                            {/* Status icon */}
                            <div className={`shrink-0 ${status.color}`}>
                              {status.icon}
                            </div>

                            {/* Topic name & progress */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-sm font-semibold text-[#0d253d] truncate">
                                  {topic.topic}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1.5 py-0 rounded-md font-bold uppercase tracking-wider shrink-0 border ${
                                    topic.weakArea
                                      ? 'border-[#ea2261]/35 text-[#ea2261] bg-[#ea2261]/10'
                                      : topic.completed
                                        ? 'border-emerald-500/35 text-emerald-600 bg-emerald-50'
                                        : topic.score > 0
                                          ? 'border-amber-500/35 text-amber-600 bg-amber-50'
                                          : 'border-[#e3e8ee] text-[#7a8c9f] bg-canvas-soft'
                                  }`}
                                >
                                  {status.label}
                                </Badge>
                              </div>
                              <Progress
                                value={topic.score}
                                className={`h-1 bg-canvas-soft ${getMiniProgressBarColor(topic)}`}
                              />
                            </div>

                            {/* Score */}
                            <span
                              className={`text-sm font-semibold shrink-0 font-tabular ${
                                topic.weakArea
                                  ? 'text-[#ea2261]'
                                  : topic.completed
                                    ? 'text-emerald-600'
                                    : topic.score > 0
                                      ? 'text-amber-600'
                                      : 'text-[#7a8c9f]/60'
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
        <Card className="bg-white border border-[#e3e8ee] shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <BookOpen className="size-12 text-[#7a8c9f] mb-4" />
            <h3 className="text-base font-semibold mb-2">No Progress Yet</h3>
            <p className="text-xs text-[#4f566b] mb-4 font-light max-w-xs leading-relaxed">
              Start practicing mock questions to populate your mastery reports.
            </p>
            <Button onClick={() => setView('practice')} className="bg-brand-indigo hover:bg-brand-indigo-deep text-white rounded-full font-semibold px-5">
              <Zap className="size-4 mr-1.5" />
              Start Practicing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
