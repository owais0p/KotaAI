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

    // Check free tier MCQ limits
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const limits = {
      free: { mcqPerDay: 5 },
      pro: { mcqPerDay: -1 },
      premium: { mcqPerDay: -1 },
    };
    const planLimits = limits[user.plan as keyof typeof limits] || limits.free;

    let usage = await db.dailyUsage.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (!usage) {
      usage = await db.dailyUsage.create({
        data: { userId, date: today, mcqAttempts: 0, aiQuestions: 0 },
      });
    }

    if (planLimits.mcqPerDay !== -1 && usage.mcqAttempts >= planLimits.mcqPerDay) {
      return NextResponse.json({
        success: false,
        error: 'Daily MCQ limit reached',
        limitReached: true,
        usage: {
          mcqAttempts: usage.mcqAttempts,
          mcqLimit: planLimits.mcqPerDay,
          mcqRemaining: 0,
          plan: user.plan,
        },
      });
    }

    // Check if questions exist in DB for this subject
    const questionCount = await db.practiceQuestion.count({
      where: { subject },
    });

    // If we have fewer than 50 questions for this subject, generate more in background
    if (questionCount < 50) {
      // Fire-and-forget background generation — don't block the response
      generateQuestionsViaAI(subject)
        .then(async (generatedQuestions) => {
          if (generatedQuestions.length > 0) {
            for (const q of generatedQuestions) {
              try {
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
              } catch {
                // Skip duplicate or malformed questions
              }
            }
          }
        })
        .catch((genError) => {
          console.error('Background question generation error:', genError);
        });
    }

    // Fetch questions
    const questions = await db.practiceQuestion.findMany({
      where: { subject },
      orderBy: { createdAt: 'desc' },
    });

    // Get user's previous attempts to filter out already answered questions
    const attemptedQuestionIds = await db.practiceAttempt.findMany({
      where: { userId },
      select: { questionId: true },
    });
    const attemptedIds = new Set(attemptedQuestionIds.map((a) => a.questionId));

    // Prefer unattempted questions
    const unattempted = questions.filter((q) => !attemptedIds.has(q.id));

    // Determine how many questions to return based on plan
    const maxQuestions = planLimits.mcqPerDay === -1 ? 10 : Math.min(10, planLimits.mcqPerDay - usage.mcqAttempts);
    const selectedQuestions = unattempted.length >= maxQuestions
      ? unattempted.slice(0, maxQuestions)
      : (unattempted.length > 0 ? unattempted : questions.slice(0, maxQuestions));

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
      usage: {
        mcqAttempts: usage.mcqAttempts,
        mcqLimit: planLimits.mcqPerDay,
        mcqRemaining: planLimits.mcqPerDay === -1 ? -1 : Math.max(0, planLimits.mcqPerDay - usage.mcqAttempts),
      },
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

    // Update daily usage
    const today = new Date().toISOString().split('T')[0];
    await db.dailyUsage.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today, mcqAttempts: 1, aiQuestions: 0 },
      update: { mcqAttempts: { increment: 1 } },
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

    // Update streak: increment if first practice today, check for missed days
    const userRecord = await db.user.findUnique({ where: { id: userId } });
    if (userRecord) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (userRecord.lastPracticeDate !== today) {
        // User hasn't practiced today yet
        if (userRecord.lastPracticeDate === yesterday) {
          // Practiced yesterday → increment streak
          await db.user.update({
            where: { id: userId },
            data: { streak: userRecord.streak + 1, lastPracticeDate: today },
          });
        } else if (userRecord.lastPracticeDate === '') {
          // First ever practice → streak = 1
          await db.user.update({
            where: { id: userId },
            data: { streak: 1, lastPracticeDate: today },
          });
        } else {
          // Missed one or more days → reset streak to 1
          await db.user.update({
            where: { id: userId },
            data: { streak: 1, lastPracticeDate: today },
          });
        }
      }
      // If lastPracticeDate === today, streak was already updated today, no change needed
    }

    // Get updated usage
    const usage = await db.dailyUsage.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    const user = await db.user.findUnique({ where: { id: userId } });
    const limits = {
      free: { mcqPerDay: 5 },
      pro: { mcqPerDay: -1 },
      premium: { mcqPerDay: -1 },
    };
    const planLimits = limits[(user?.plan || 'free') as keyof typeof limits] || limits.free;

    return NextResponse.json({
      success: true,
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      streak: user?.streak || 0,
      usage: {
        mcqAttempts: usage?.mcqAttempts || 0,
        mcqLimit: planLimits.mcqPerDay,
        mcqRemaining: planLimits.mcqPerDay === -1 ? -1 : Math.max(0, planLimits.mcqPerDay - (usage?.mcqAttempts || 0)),
      },
    });
  } catch (error) {
    console.error('Practice POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
