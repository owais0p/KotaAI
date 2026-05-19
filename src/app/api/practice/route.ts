import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

const VALID_SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology'];

interface GeneratedQuestion {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: string;
}

async function generateQuestionsViaAI(subject: string): Promise<GeneratedQuestion[]> {
  const zai = await ZAI.create();

  const prompt = `Generate exactly 10 multiple-choice questions for JEE/NEET exam preparation in ${subject}. Each question must have 4 options (A, B, C, D) and exactly one correct answer.

Return ONLY a valid JSON array with no other text. Each object must have these exact keys:
- "question": the question text
- "optionA": option A text
- "optionB": option B text
- "optionC": option C text
- "optionD": option D text
- "correctAnswer": the letter of the correct option (A, B, C, or D)
- "explanation": detailed explanation of why the answer is correct
- "topic": the specific topic name in ${subject}
- "difficulty": "easy", "medium", or "hard"

Example format:
[{"question":"What is the SI unit of force?","optionA":"Joule","optionB":"Newton","optionC":"Pascal","optionD":"Watt","correctAnswer":"B","explanation":"The SI unit of force is Newton (N), named after Sir Isaac Newton.","topic":"Units and Measurements","difficulty":"easy"}]

Generate 10 questions now:`;

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'assistant',
        content: `You are a JEE/NEET question generator. You only output valid JSON arrays. No markdown, no explanation outside JSON.`,
      },
      { role: 'user', content: prompt },
    ],
    thinking: { type: 'disabled' },
  });

  const content = completion.choices[0]?.message?.content || '[]';

  // Try to parse JSON from the response - handle potential markdown wrapping
  let jsonStr = content;
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 10);
    }
    return [];
  } catch {
    console.error('Failed to parse AI-generated questions:', content);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const userId = searchParams.get('userId');

    if (!subject || !VALID_SUBJECTS.includes(subject)) {
      return NextResponse.json(
        { success: false, error: `Invalid subject. Valid subjects: ${VALID_SUBJECTS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check if questions exist in DB for this subject
    let questions = await db.practiceQuestion.findMany({
      where: { subject },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // If no questions exist, generate them using AI
    if (questions.length === 0) {
      const generatedQuestions = await generateQuestionsViaAI(subject);

      if (generatedQuestions.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Failed to generate questions. Please try again.' },
          { status: 500 }
        );
      }

      // Save generated questions to database
      for (const q of generatedQuestions) {
        await db.practiceQuestion.create({
          data: {
            subject,
            topic: q.topic || 'General',
            question: q.question,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty || 'medium',
          },
        });
      }

      // Fetch the newly created questions
      questions = await db.practiceQuestion.findMany({
        where: { subject },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    }

    // Get user's previous attempts to filter out already answered questions
    const attemptedQuestionIds = await db.practiceAttempt.findMany({
      where: { userId },
      select: { questionId: true },
    });
    const attemptedIds = new Set(attemptedQuestionIds.map((a) => a.questionId));

    // Prefer unattempted questions
    const unattempted = questions.filter((q) => !attemptedIds.has(q.id));

    // If we have enough unattempted questions, use those; otherwise use all
    const selectedQuestions = unattempted.length >= 10 ? unattempted.slice(0, 10) : (unattempted.length > 0 ? unattempted : questions.slice(0, 10));

    // Return questions without correctAnswer
    const safeQuestions = selectedQuestions.map((q) => ({
      id: q.id,
      subject: q.subject,
      topic: q.topic,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      difficulty: q.difficulty,
    }));

    return NextResponse.json({
      success: true,
      questions: safeQuestions,
    });
  } catch (error) {
    console.error('Practice GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, questionId, selectedAnswer } = body;

    if (!userId || !questionId || !selectedAnswer) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, questionId, selectedAnswer' },
        { status: 400 }
      );
    }

    // Get the question
    const question = await db.practiceQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    const isCorrect = selectedAnswer.toUpperCase() === question.correctAnswer.toUpperCase();

    // Save the attempt
    await db.practiceAttempt.create({
      data: {
        userId,
        questionId,
        selectedAnswer: selectedAnswer.toUpperCase(),
        isCorrect,
      },
    });

    // Update or create progress topic
    const existingProgress = await db.progressTopic.findFirst({
      where: {
        userId,
        subject: question.subject,
        topic: question.topic,
      },
    });

    if (existingProgress) {
      const newScore = isCorrect
        ? Math.min(100, existingProgress.score + 10)
        : existingProgress.score;

      const weakArea = newScore < 40;

      await db.progressTopic.update({
        where: { id: existingProgress.id },
        data: {
          score: newScore,
          weakArea,
          completed: newScore >= 80,
        },
      });
    } else {
      await db.progressTopic.create({
        data: {
          userId,
          subject: question.subject,
          topic: question.topic,
          score: isCorrect ? 10 : 0,
          weakArea: !isCorrect,
          completed: false,
        },
      });
    }

    // Update leaderboard score (+10 for correct answer)
    if (isCorrect) {
      const currentWeek = getWeekString();
      const leaderboardEntry = await db.leaderboardEntry.findUnique({
        where: { userId },
      });

      if (leaderboardEntry) {
        await db.leaderboardEntry.update({
          where: { userId },
          data: {
            score: leaderboardEntry.score + 10,
            week: currentWeek,
          },
        });
      } else {
        await db.leaderboardEntry.create({
          data: {
            userId,
            score: 10,
            week: currentWeek,
            rank: 0,
          },
        });
      }
    }

    // Get current leaderboard score for response
    const leaderboard = await db.leaderboardEntry.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      score: leaderboard?.score || 0,
    });
  } catch (error) {
    console.error('Practice POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getWeekString(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}
