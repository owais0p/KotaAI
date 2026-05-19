'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import type { Subject, PracticeQuestion } from '@/lib/types';

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
  { name: 'Physics', icon: '⚛️', questions: 10 },
  { name: 'Chemistry', icon: '🧪', questions: 10 },
  { name: 'Maths', icon: '📐', questions: 10 },
  { name: 'Biology', icon: '🧬', questions: 10 },
];

const DIFFICULTY_CONFIG: Record<string, { label: string; className: string }> = {
  easy: { label: 'Easy', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  hard: { label: 'Hard', className: 'bg-red-100 text-red-800 border-red-200' },
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

export default function PracticePage() {
  const { selectedSubject, setSelectedSubject, user } = useAppStore();
  const { toast } = useToast();

  // ── Local state ──
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
    fetchQuestions();
  }, [fetchQuestions]);

  // ── Submit individual answer ──
  const submitAnswer = useCallback(
    async (questionId: string, selectedAnswer: string) => {
      if (!user?.id || results[questionId]) return; // already submitted
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
    if (!question || results[question.id]) return; // already answered

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
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-3xl mx-auto">
      {/* ── Header ── */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Daily Practice
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Test your knowledge with MCQs
        </p>
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
                flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all
                min-h-[88px] cursor-pointer
                ${
                  isActive
                    ? 'border-orange-500 bg-orange-50 shadow-md dark:bg-orange-950/30'
                    : 'border-border bg-card hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/10'
                }
                ${isLoadingQuestions ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              aria-label={`Select ${subject.name}`}
              aria-pressed={isActive}
            >
              <span className="text-2xl" role="img" aria-hidden>
                {subject.icon}
              </span>
              <span
                className={`text-sm font-semibold ${
                  isActive ? 'text-orange-700 dark:text-orange-400' : 'text-foreground'
                }`}
              >
                {subject.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {subject.questions} Qs
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Loading State ── */}
      {isLoadingQuestions && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Loading {selectedSubject} questions…
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── No Questions ── */}
      {!isLoadingQuestions && questions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-muted-foreground">No questions available.</p>
            <Button onClick={fetchQuestions} variant="outline" size="sm">
              <RotateCcw className="size-4 mr-1" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Summary View ── */}
      {showSummary && !reviewingAnswers && (
        <Card className="border-2 border-orange-200 dark:border-orange-800">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl md:text-2xl">
              Practice Complete! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 pt-2">
            {/* Score circle */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex items-center justify-center size-28 rounded-full border-4 border-orange-500 bg-orange-50 dark:bg-orange-950/30">
                <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {correctCount}
                </span>
                <span className="text-lg text-muted-foreground">/10</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Score
              </p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <div className="flex flex-col items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  {correctCount}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  Correct
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-red-50 dark:bg-red-950/30 p-3">
                <XCircle className="size-5 text-red-600" />
                <span className="text-lg font-bold text-red-700 dark:text-red-400">
                  {wrongCount}
                </span>
                <span className="text-xs text-red-600 dark:text-red-400">
                  Wrong
                </span>
              </div>
            </div>

            {/* Time taken */}
            {timeTakenSeconds > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>⏱️</span>
                <span>Time taken: {timeTakenDisplay}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <Button
                onClick={() => {
                  setCurrentIndex(0);
                  setReviewingAnswers(true);
                }}
                variant="outline"
                className="flex-1"
              >
                <ArrowRight className="size-4 mr-1" />
                Review Answers
              </Button>
              <Button
                onClick={fetchQuestions}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <RotateCcw className="size-4 mr-1" />
                Practice Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Question Display (normal or review mode) ── */}
      {!isLoadingQuestions && questions.length > 0 && (!showSummary || reviewingAnswers) && currentQuestion && (
        <>
          {/* Progress */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-muted-foreground">
                {answeredCount}/{questions.length} answered
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Question Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {currentQuestion.topic}
                </Badge>
                <Badge
                  className={`text-xs ${
                    DIFFICULTY_CONFIG[currentQuestion.difficulty?.toLowerCase()]
                      ?.className || DIFFICULTY_CONFIG.medium.className
                  }`}
                >
                  {DIFFICULTY_CONFIG[currentQuestion.difficulty?.toLowerCase()]
                    ?.label || 'Medium'}
                </Badge>
                {reviewingAnswers && (
                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                    Review Mode
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {/* Question text */}
              <p className="text-base md:text-lg font-medium leading-relaxed text-foreground">
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
                    'border-2 rounded-xl p-4 transition-all cursor-pointer text-left min-h-[52px] flex items-start gap-3';

                  if (!isSubmitted) {
                    optionClass += isSelected
                      ? ' border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                      : ' border-border bg-card hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/10';
                  } else if (isCorrectOption) {
                    optionClass +=
                      ' border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 cursor-default';
                  } else if (isWrongSelection) {
                    optionClass +=
                      ' border-red-500 bg-red-50 dark:bg-red-950/30 cursor-default';
                  } else {
                    optionClass +=
                      ' border-border bg-card opacity-60 cursor-default';
                  }

                  return (
                    <button
                      key={label}
                      onClick={() => handleOptionSelect(label)}
                      disabled={isSubmitted || isSubmittingAnswer}
                      className={optionClass}
                      aria-label={`Option ${label}: ${optionText}`}
                    >
                      {/* Letter badge */}
                      <span
                        className={`
                          flex items-center justify-center size-8 shrink-0 rounded-lg text-sm font-bold
                          ${
                            !isSubmitted
                              ? isSelected
                                ? 'bg-orange-500 text-white'
                                : 'bg-muted text-muted-foreground'
                              : isCorrectOption
                              ? 'bg-emerald-500 text-white'
                              : isWrongSelection
                              ? 'bg-red-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }
                        `}
                      >
                        {label}
                      </span>

                      {/* Option text */}
                      <span className="text-sm md:text-base pt-0.5 flex-1 text-foreground">
                        {optionText}
                      </span>

                      {/* Result icon */}
                      {isSubmitted && isCorrectOption && (
                        <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      {isSubmitted && isWrongSelection && (
                        <XCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation (after answering) */}
              {currentResult && currentResult.explanation && (
                <div
                  className={`
                    rounded-xl p-4 text-sm leading-relaxed
                    ${
                      currentResult.correct
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'
                    }
                  `}
                >
                  <p className="font-semibold mb-1">
                    {currentResult.correct ? '✅ Correct!' : '💡 Explanation'}
                  </p>
                  <p>{currentResult.explanation}</p>
                </div>
              )}

              {/* Submitting spinner */}
              {isSubmittingAnswer && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="size-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  Submitting answer…
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="min-w-[100px]"
            >
              <ChevronLeft className="size-4 mr-1" />
              Previous
            </Button>

            {/* Dot indicators */}
            <div className="hidden sm:flex items-center gap-1.5">
              {questions.map((q, i) => {
                const hasResult = !!results[q.id];
                const isCorrect = results[q.id]?.correct;
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={`
                      size-2.5 rounded-full transition-all
                      ${
                        isCurrent
                          ? 'bg-orange-500 scale-125'
                          : hasResult && isCorrect
                          ? 'bg-emerald-500'
                          : hasResult && !isCorrect
                          ? 'bg-red-500'
                          : 'bg-muted-foreground/30'
                      }
                    `}
                    aria-label={`Go to question ${i + 1}`}
                  />
                );
              })}
            </div>

            {reviewingAnswers ? (
              <Button
                variant="outline"
                onClick={() => setReviewingAnswers(false)}
                className="min-w-[100px]"
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
                className="min-w-[100px]"
              >
                Next
                <ChevronRight className="size-4 ml-1" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
