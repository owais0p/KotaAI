'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import UpgradePrompt from '@/components/kotaai/UpgradePrompt';
import PaymentModal from '@/components/kotaai/PaymentModal';
import type { Subject, PracticeQuestion, User } from '@/lib/types';

interface QuestionResult {
  correct: boolean;
  correctAnswer: string;
  explanation?: string;
}

interface SubjectCard {
  name: Subject;
  icon: string;
  questions: number;
}

const SUBJECTS: SubjectCard[] = [
  { name: 'Physics', icon: '⚛️', questions: 50 },
  { name: 'Chemistry', icon: '🧪', questions: 50 },
  { name: 'Maths', icon: '📐', questions: 50 },
  { name: 'Biology', icon: '🧬', questions: 50 },
];

const DIFFICULTY_CONFIG: Record<string, { label: string; className: string }> = {
  easy: { label: 'Easy', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  hard: { label: 'Hard', className: 'bg-[#ea2261]/10 text-[#ea2261] border-[#ea2261]/20' },
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

export default function PracticePage() {
  const { selectedSubject, setSelectedSubject, user } = useAppStore();
  const { toast } = useToast();

  // ── Local state ──
  // ── Helper for paginating indicators ──
  const getVisibleDotIndices = () => {
    const total = questions.length;
    const current = currentIndex;

    if (total <= 6) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const indices: Set<number> = new Set();
    indices.add(0);
    indices.add(total - 1);

    const windowStart = Math.max(1, current - 1);
    const windowEnd = Math.min(total - 2, current + 1);

    for (let i = windowStart; i <= windowEnd; i++) {
      indices.add(i);
    }

    return Array.from(indices).sort((a, b) => a - b);
  };
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, QuestionResult>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [reviewingAnswers, setReviewingAnswers] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  // ── Limit state ──
  const [limitReached, setLimitReached] = useState(false);
  const [mcqUsage, setMcqUsage] = useState({ used: 0, limit: 10 });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<'pro' | 'premium'>('pro');
  const [showCorrectBurst, setShowCorrectBurst] = useState(false);

  // ── Fetch usage on mount ──
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/usage?userId=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setMcqUsage({
            used: data.usage.mcqAttempts,
            limit: data.usage.mcqLimit === -1 ? Infinity : data.usage.mcqLimit,
          });
          setLimitReached(data.usage.mcqRemaining === 0);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  // ── Handle upgrade ──
  const handleUpgrade = (plan: 'pro' | 'premium') => {
    setPaymentPlan(plan);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (updatedUser: User) => {
    setLimitReached(false);
    setMcqUsage({ used: mcqUsage.used, limit: Infinity });
    // Re-fetch questions after upgrade
    fetchQuestions();
  };

  // ── Fetch questions on subject change ──
  const fetchQuestions = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingQuestions(true);
    setShowSummary(false);
    setReviewingAnswers(false);
    setAnswers({});
    setResults({});
    setCurrentIndex(0);
    setStartTime(Date.now());

    try {
      const res = await fetch(
        `/api/practice?subject=${encodeURIComponent(selectedSubject)}&userId=${encodeURIComponent(user.id)}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        // Update usage info
        if (data.usage) {
          setMcqUsage({
            used: data.usage.mcqAttempts,
            limit: data.usage.mcqLimit === -1 ? Infinity : data.usage.mcqLimit,
          });
        }
      } else if (data.limitReached) {
        setLimitReached(true);
        setMcqUsage({
          used: data.usage.mcqAttempts,
          limit: data.usage.mcqLimit === -1 ? Infinity : data.usage.mcqLimit,
        });
        setQuestions([]);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load questions',
          variant: 'destructive',
        });
        setQuestions([]);
      }
    } catch {
      toast({
        title: 'Network Error',
        description: 'Could not connect to the server',
        variant: 'destructive',
      });
      setQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [selectedSubject, user?.id, toast]);

  useEffect(() => {
    if (!limitReached) {
      fetchQuestions();
    }
  }, [fetchQuestions, limitReached]);

  // ── Submit individual answer ──
  const submitAnswer = useCallback(
    async (questionId: string, selectedAnswer: string) => {
      if (!user?.id || results[questionId]) return;
      setIsSubmittingAnswer(true);

      try {
        const res = await fetch('/api/practice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            questionId,
            selectedAnswer,
          }),
        });
        const data = await res.json();

        if (data.success) {
          setResults((prev) => ({
            ...prev,
            [questionId]: {
              correct: data.correct,
              correctAnswer: data.correctAnswer,
              explanation: data.explanation,
            },
          }));

          if (data.correct) {
            setShowCorrectBurst(true);
            setTimeout(() => setShowCorrectBurst(false), 1000);
          }

          // Update usage info from response
          if (data.usage) {
            setMcqUsage({
              used: data.usage.mcqAttempts,
              limit: data.usage.mcqLimit === -1 ? Infinity : data.usage.mcqLimit,
            });
            if (data.usage.mcqRemaining === 0 && data.usage.mcqLimit !== -1) {
              setLimitReached(true);
            }
          }
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Failed to submit answer',
            variant: 'destructive',
          });
        }
      } catch {
        toast({
          title: 'Network Error',
          description: 'Could not submit your answer',
          variant: 'destructive',
        });
      } finally {
        setIsSubmittingAnswer(false);
      }
    },
    [user?.id, results, toast]
  );

  // ── Handle option selection ──
  const handleOptionSelect = (optionLetter: string) => {
    const question = questions[currentIndex];
    if (!question || results[question.id]) return;

    setAnswers((prev) => ({ ...prev, [question.id]: optionLetter }));
    submitAnswer(question.id, optionLetter);
  };

  // ── Check if all questions answered ──
  const allAnswered =
    questions.length > 0 && questions.every((q) => results[q.id]);

  // ── Show summary when all answered ──
  useEffect(() => {
    if (allAnswered && !showSummary) {
      setEndTime(Date.now());
      setShowSummary(true);
    }
  }, [allAnswered, showSummary]);

  // ── Score calculation ──
  const correctCount = questions.filter(
    (q) => results[q.id]?.correct
  ).length;
  const wrongCount = questions.filter(
    (q) => results[q.id] && !results[q.id].correct
  ).length;

  // ── Time calculation ──
  const timeTakenSeconds =
    endTime && startTime ? Math.round((endTime - startTime) / 1000) : 0;
  const timeTakenMinutes = Math.floor(timeTakenSeconds / 60);
  const timeTakenRemainder = timeTakenSeconds % 60;
  const timeTakenDisplay =
    timeTakenMinutes > 0
      ? `${timeTakenMinutes}m ${timeTakenRemainder}s`
      : `${timeTakenSeconds}s`;

  // ── Current question ──
  const currentQuestion = questions[currentIndex];
  const currentResult = currentQuestion ? results[currentQuestion.id] : null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const answeredCount = questions.filter((q) => results[q.id]).length;

  // ── Progress ──
  const progressPercent =
    questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-3xl mx-auto text-[#0d253d] dark:text-white">
      {/* ── Header ── */}
      <div className="text-center border-b border-[#e3e8ee] dark:border-[#273951]/40 pb-4">
        <h1 className="text-2xl font-light tracking-tight text-[#0d253d] dark:text-white">
          Daily Practice
        </h1>
        <p className="text-xs text-[#4f566b] dark:text-[#a8c3de] mt-1 font-light">
          Test your preparation with adaptive multiple choice questions.
        </p>
        {/* Usage badge for free users */}
        {user?.plan === 'free' && (
          <Badge
            variant="outline"
            className={`mt-3 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
              mcqUsage.used >= mcqUsage.limit
                ? 'border-[#ea2261]/40 text-[#ea2261] bg-[#ea2261]/10'
                : 'border-[#e3e8ee] dark:border-[#273951]/40 text-[#4f566b] dark:text-[#a8c3de] bg-white dark:bg-[#0d253d]'
            }`}
          >
            {mcqUsage.used}/{mcqUsage.limit === Infinity ? '∞' : mcqUsage.limit} MCQs used today
          </Badge>
        )}
      </div>

      {/* ── Subject Selector ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SUBJECTS.map((subject) => {
          const isActive = selectedSubject === subject.name;
          return (
            <button
              key={subject.name}
              onClick={() => setSelectedSubject(subject.name)}
              disabled={isLoadingQuestions}
              className={`
                flex flex-col items-start gap-1 rounded-xl border p-4 transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-md
                min-h-[84px] cursor-pointer w-full text-left
                ${
                  isActive
                    ? 'border-brand-indigo bg-brand-indigo-subdued/20 text-[#533afd] dark:text-brand-indigo-soft shadow-sm'
                    : 'border-[#e3e8ee] dark:border-[#273951]/40 bg-white dark:bg-[#0d253d] hover:border-brand-indigo/60 hover:bg-canvas-soft/50 dark:hover:bg-[#1c1e54]/50 shadow-sm'
                }
                ${isLoadingQuestions ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              aria-label={`Select ${subject.name}`}
              aria-pressed={isActive}
            >
              <span className="text-2xl mb-1" role="img" aria-hidden>
                {subject.icon}
              </span>
              <span className="text-sm font-semibold text-[#0d253d] dark:text-white">
                {subject.name}
              </span>
              <span className="text-[10px] text-[#4f566b] dark:text-[#a8c3de] font-light">
                {subject.questions} Qs
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Limit Reached ── */}
      {limitReached && !isLoadingQuestions && (
        <UpgradePrompt
          title="Daily MCQ Limit Reached"
          description="You've used all your free MCQ attempts for today. Upgrade for unlimited practice!"
          limitType="mcq"
          used={mcqUsage.used}
          limit={mcqUsage.limit}
          onUpgrade={handleUpgrade}
        />
      )}

      {/* ── Loading State ── */}
      {isLoadingQuestions && !limitReached && (
        <div className="space-y-6">
          <div className="space-y-2 animate-pulse">
            <div className="flex justify-between">
              <div className="h-3 w-28 bg-white rounded border border-[#e3e8ee]" />
              <div className="h-3 w-20 bg-white rounded border border-[#e3e8ee]" />
            </div>
            <div className="h-2 w-full bg-white rounded-full border border-[#e3e8ee]" />
          </div>
          <Card className="border border-[#e3e8ee] bg-white animate-pulse">
            <CardContent className="flex flex-col gap-5 p-6">
              <div className="space-y-2">
                <div className="h-4 w-full bg-canvas-soft rounded" />
                <div className="h-4 w-5/6 bg-canvas-soft rounded" />
              </div>
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 w-full border border-[#e3e8ee] rounded-xl bg-canvas-soft flex items-center px-4 gap-3"
                  >
                    <div className="size-6 rounded-md bg-white shrink-0" />
                    <div className="h-3 w-1/2 bg-white rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── No Questions ── */}
      {!isLoadingQuestions && questions.length === 0 && !limitReached && (
        <Card className="bg-white border border-[#e3e8ee] shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-[#4f566b] text-sm font-light">No questions available.</p>
            <Button onClick={fetchQuestions} variant="outline" size="sm" className="rounded-full border-[#e3e8ee] hover:bg-canvas-soft">
              <RotateCcw className="size-4 mr-1.5" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Summary View ── */}
      {showSummary && !reviewingAnswers && (
        <Card className="border border-[#e3e8ee] bg-white overflow-hidden shadow-md">
          <CardHeader className="text-center pb-2 bg-transparent">
            <CardTitle className="text-xl md:text-2xl font-light tracking-tight text-[#0d253d]">
              Practice Complete! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 pt-2">
            {/* Score circle */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex flex-col items-center justify-center size-28 rounded-full border border-brand-indigo/35 bg-brand-indigo-subdued/10">
                <span className="text-3xl font-light text-[#533afd]">
                  {correctCount}
                </span>
                <span className="text-xs text-[#4f566b]">/ {questions.length} correct</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <div className="flex flex-col items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span className="text-base font-bold font-tabular text-emerald-700">
                  {correctCount}
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                  Correct
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-[#ea2261]/5 border border-[#ea2261]/25 p-3">
                <XCircle className="size-4 text-[#ea2261]" />
                <span className="text-base font-bold font-tabular text-[#ea2261]">
                  {wrongCount}
                </span>
                <span className="text-[10px] uppercase font-bold text-[#ea2261]/80 tracking-wider">
                  Wrong
                </span>
              </div>
            </div>

            {/* Time taken */}
            {timeTakenSeconds > 0 && (
              <div className="flex items-center gap-2 text-xs text-[#4f566b] font-light">
                <span>⏱️</span>
                <span>Time taken: <span className="font-tabular">{timeTakenDisplay}</span></span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
              <Button
                onClick={() => {
                  setCurrentIndex(0);
                  setReviewingAnswers(true);
                }}
                variant="outline"
                className="flex-1 rounded-full border-[#e3e8ee] text-xs font-semibold hover:bg-canvas-soft"
              >
                <ArrowRight className="size-3.5 mr-1" />
                Review Answers
              </Button>
              <Button
                onClick={fetchQuestions}
                className="flex-1 bg-brand-indigo hover:bg-brand-indigo-deep text-white rounded-full text-xs font-semibold shadow-md"
                disabled={limitReached}
              >
                <RotateCcw className="size-3.5 mr-1" />
                Practice Again
              </Button>
            </div>

            {/* Upgrade CTA if limit reached */}
            {limitReached && (
              <div className="w-full rounded-xl bg-gradient-to-r from-brand-indigo to-brand-indigo-soft p-5 text-center text-white mt-2 shadow-md">
                <p className="text-sm font-semibold mb-1">Want more practice?</p>
                <p className="text-xs text-white/80 mb-4 font-light">
                  Upgrade for unlimited daily MCQs
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    className="bg-white text-brand-indigo hover:bg-canvas-soft font-semibold rounded-full text-xs px-4"
                    onClick={() => handleUpgrade('pro')}
                  >
                    Pro ₹299/mo
                  </Button>
                  <Button
                    size="sm"
                    className="bg-transparent border-2 border-white text-white hover:bg-white/20 font-semibold rounded-full text-xs px-4"
                    onClick={() => handleUpgrade('premium')}
                  >
                    Premium ₹699/mo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Question Display ── */}
      {!isLoadingQuestions && questions.length > 0 && (!showSummary || reviewingAnswers) && currentQuestion && (
        <>
          {/* Progress */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[#4f566b]">
              <span className="font-semibold text-[#0d253d]">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="font-tabular font-light">
                {answeredCount}/{questions.length} answered
              </span>
            </div>
            <div className="w-full h-1.5 bg-white border border-[#e3e8ee] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-brand-indigo rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="relative overflow-visible">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <Card className="border border-[#e3e8ee] dark:border-[#273951]/40 bg-white dark:bg-[#0d253d] text-[#0d253d] dark:text-white shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 bg-transparent">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-canvas-soft dark:bg-[#1c1e54]/30 border-[#e3e8ee] dark:border-[#273951]/40 text-brand-indigo dark:text-brand-indigo-soft px-2 py-0.5 rounded-md">
                        {currentQuestion.topic}
                      </Badge>
                      <Badge
                        className={`text-xs border px-2 py-0.5 rounded-md font-semibold ${
                          DIFFICULTY_CONFIG[currentQuestion.difficulty?.toLowerCase()]
                            ?.className || DIFFICULTY_CONFIG.medium.className
                        }`}
                      >
                        {DIFFICULTY_CONFIG[currentQuestion.difficulty?.toLowerCase()]
                          ?.label || 'Medium'}
                      </Badge>
                      {reviewingAnswers && (
                        <Badge variant="outline" className="text-xs text-[#ea2261] border-[#ea2261]/30 bg-[#ea2261]/5 rounded-md">
                          Review Mode
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    {/* Question text */}
                    <p className="text-base md:text-lg font-light leading-relaxed text-[#0d253d] dark:text-white">
                      {currentQuestion.question}
                    </p>

                    {/* Options */}
                    <div className="flex flex-col gap-3">
                      {OPTION_LABELS.map((label) => {
                        const optionText =
                          currentQuestion[
                            `option${label}` as keyof PracticeQuestion
                          ];
                        if (typeof optionText !== 'string') return null;

                        const isSelected = currentAnswer === label;
                        const isSubmitted = !!currentResult;
                        const isCorrectOption =
                          isSubmitted && currentResult.correctAnswer === label;
                        const isWrongSelection =
                          isSubmitted && isSelected && !currentResult.correct;

                        let optionClass =
                          'border rounded-xl p-4 transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] cursor-pointer text-left min-h-[52px] flex items-start gap-3 w-full font-light ';

                        if (!isSubmitted) {
                          optionClass += isSelected
                            ? 'border-brand-indigo bg-brand-indigo-subdued/15'
                            : 'border-[#e3e8ee] dark:border-[#273951]/40 bg-white dark:bg-[#0d253d] text-[#0d253d] dark:text-white hover:border-brand-indigo-soft/60 hover:bg-canvas-soft/50 dark:hover:bg-[#1c1e54]/50';
                        } else if (isCorrectOption) {
                          optionClass +=
                            'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 cursor-default';
                        } else if (isWrongSelection) {
                          optionClass +=
                            'border-[#ea2261] bg-[#ea2261]/10 text-[#ea2261] cursor-default';
                        } else {
                          optionClass +=
                            'border-[#e3e8ee] dark:border-[#273951]/40 bg-canvas-soft/40 dark:bg-[#1c1e54]/10 opacity-40 cursor-default';
                        }

                        return (
                          <motion.button
                            key={label}
                            onClick={() => handleOptionSelect(label)}
                            disabled={isSubmitted || isSubmittingAnswer}
                            className={optionClass}
                            aria-label={`Option ${label}: ${optionText}`}
                            animate={isWrongSelection ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                            transition={{ duration: 0.4 }}
                            whileHover={!isSubmitted ? { scale: 1.005 } : {}}
                            whileTap={!isSubmitted ? { scale: 0.995 } : {}}
                          >
                            <span
                              className={`
                                flex items-center justify-center size-8 shrink-0 rounded-lg text-sm font-bold
                                ${
                                  !isSubmitted
                                    ? isSelected
                                      ? 'bg-brand-indigo text-white shadow-sm'
                                      : 'bg-canvas-soft dark:bg-[#1c1e54]/50 text-[#4f566b] dark:text-[#a8c3de]'
                                    : isCorrectOption
                                    ? 'bg-emerald-500 text-white'
                                    : isWrongSelection
                                    ? 'bg-[#ea2261] text-white'
                                    : 'bg-canvas-soft dark:bg-[#1c1e54]/50 text-[#7a8c9f]/60'
                                }
                              `}
                            >
                              {label}
                            </span>

                            <span className="text-sm md:text-base pt-1 flex-1 text-[#0d253d] dark:text-white leading-normal">
                              {optionText}
                            </span>

                            {isSubmitted && isCorrectOption && (
                              <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-1" />
                            )}
                            {isSubmitted && isWrongSelection && (
                              <XCircle className="size-5 text-[#ea2261] shrink-0 mt-1" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {currentResult && currentResult.explanation && (
                      <div
                        className={`
                          rounded-xl p-4 text-xs leading-relaxed border font-light
                          ${
                            currentResult.correct
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }
                        `}
                      >
                        <p className="font-semibold text-sm mb-1.5">
                          {currentResult.correct ? '✅ Correct!' : '💡 Explanation'}
                        </p>
                        <p className="leading-normal">{currentResult.explanation}</p>
                      </div>
                    )}

                    {/* Submitting spinner */}
                    {isSubmittingAnswer && (
                      <div className="flex items-center justify-center gap-2 text-xs text-[#4f566b] mt-1">
                        <div className="size-4 animate-spin rounded-full border-2 border-brand-indigo border-t-transparent" />
                        Submitting answer…
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Confetti Correct Burst Effect */}
            {showCorrectBurst && (
              <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center z-50">
                {[...Array(20)].map((_, i) => {
                  const angle = (i * 360) / 20;
                  const radius = 80 + Math.random() * 80;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  return (
                    <motion.div
                      key={i}
                      className={`absolute w-2.5 h-2.5 rounded-full ${
                        i % 3 === 0 ? 'bg-emerald-500' : i % 3 === 1 ? 'bg-green-400' : 'bg-amber-400'
                      }`}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                      animate={{
                        x,
                        y,
                        scale: [0, 1.5, 0.5, 0],
                        opacity: [1, 1, 0.8, 0],
                      }}
                      transition={{
                        duration: 0.85,
                        ease: 'easeOut',
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-[#e3e8ee] pt-4 mt-2">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="min-w-[100px] rounded-full border-[#e3e8ee] text-xs font-semibold hover:bg-canvas-soft text-[#4f566b]"
            >
              <ChevronLeft className="size-4 mr-1.5" />
              Previous
            </Button>

            <div className="flex items-center gap-1.5 max-w-[50%] overflow-x-auto py-1 no-scrollbar">
              {getVisibleDotIndices().map((i, idx, arr) => {
                const q = questions[i];
                const hasResult = !!results[q.id];
                const isCorrect = results[q.id]?.correct;
                const isCurrent = i === currentIndex;

                const showEllipsisBefore = idx > 0 && i - arr[idx - 1] > 1;

                return (
                  <div key={q.id} className="flex items-center gap-1.5">
                    {showEllipsisBefore && (
                      <span className="text-[10px] text-[#7a8c9f]/60 select-none">...</span>
                    )}
                    <button
                      onClick={() => setCurrentIndex(i)}
                      className={`
                        size-6 rounded-full text-[10px] font-bold transition-all flex items-center justify-center border
                        ${
                          isCurrent
                            ? 'bg-brand-indigo border-brand-indigo text-white scale-110 shadow-sm'
                            : hasResult
                            ? isCorrect
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-[#ea2261] border-[#ea2261] text-white'
                            : 'bg-white border-[#e3e8ee] text-[#4f566b] hover:border-brand-indigo/40'
                        }
                      `}
                      aria-label={`Go to question ${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  </div>
                );
              })}
            </div>

            {reviewingAnswers ? (
              <Button
                variant="outline"
                onClick={() => setReviewingAnswers(false)}
                className="min-w-[100px] rounded-full border-[#e3e8ee] text-xs font-semibold hover:bg-canvas-soft text-[#4f566b]"
              >
                Back to Summary
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentIndex((i) =>
                    Math.min(questions.length - 1, i + 1)
                  )
                }
                disabled={currentIndex === questions.length - 1}
                className="min-w-[100px] rounded-full border-[#e3e8ee] text-xs font-semibold hover:bg-canvas-soft text-[#4f566b]"
              >
                Next
                <ChevronRight className="size-4 ml-1.5" />
              </Button>
            )}
          </div>
        </>
      )}

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        plan={paymentPlan}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
