import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get today's date string
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Get or create today's usage record
    let usage = await db.dailyUsage.findUnique({
      where: {
        userId_date: { userId, date: today },
      },
    });

    if (!usage) {
      usage = await db.dailyUsage.create({
        data: {
          userId,
          date: today,
          mcqAttempts: 0,
          aiQuestions: 0,
        },
      });
    }

    // Define limits based on plan
    const limits = {
      free: { mcqPerDay: 40, aiQuestionsPerDay: 3 },  // 10 MCQs per subject × 4 subjects
      pro: { mcqPerDay: -1, aiQuestionsPerDay: -1 },  // unlimited
      premium: { mcqPerDay: -1, aiQuestionsPerDay: -1 }, // unlimited
    };

    const planLimits = limits[user.plan as keyof typeof limits] || limits.free;

    return NextResponse.json({
      success: true,
      usage: {
        mcqAttempts: usage.mcqAttempts,
        aiQuestions: usage.aiQuestions,
        mcqLimit: planLimits.mcqPerDay,
        aiLimit: planLimits.aiQuestionsPerDay,
        mcqRemaining: planLimits.mcqPerDay === -1 ? -1 : Math.max(0, planLimits.mcqPerDay - usage.mcqAttempts),
        aiRemaining: planLimits.aiQuestionsPerDay === -1 ? -1 : Math.max(0, planLimits.aiQuestionsPerDay - usage.aiQuestions),
        plan: user.plan,
      },
    });
  } catch (error) {
    console.error('Usage GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Increment usage counters
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type } = body; // type: 'mcq' or 'ai'

    if (!userId || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or type' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Check limits first
    const limits = {
      free: { mcqPerDay: 40, aiQuestionsPerDay: 3 },
      pro: { mcqPerDay: -1, aiQuestionsPerDay: -1 },
      premium: { mcqPerDay: -1, aiQuestionsPerDay: -1 },
    };

    const planLimits = limits[user.plan as keyof typeof limits] || limits.free;

    let usage = await db.dailyUsage.findUnique({
      where: {
        userId_date: { userId, date: today },
      },
    });

    if (!usage) {
      usage = await db.dailyUsage.create({
        data: { userId, date: today, mcqAttempts: 0, aiQuestions: 0 },
      });
    }

    // Check if limit reached
    if (type === 'mcq' && planLimits.mcqPerDay !== -1 && usage.mcqAttempts >= planLimits.mcqPerDay) {
      return NextResponse.json({
        success: false,
        error: 'Daily MCQ limit reached',
        limitReached: true,
        usage: {
          mcqAttempts: usage.mcqAttempts,
          aiQuestions: usage.aiQuestions,
          mcqLimit: planLimits.mcqPerDay,
          aiLimit: planLimits.aiQuestionsPerDay,
          mcqRemaining: 0,
          aiRemaining: planLimits.aiQuestionsPerDay === -1 ? -1 : Math.max(0, planLimits.aiQuestionsPerDay - usage.aiQuestions),
          plan: user.plan,
        },
      });
    }

    if (type === 'ai' && planLimits.aiQuestionsPerDay !== -1 && usage.aiQuestions >= planLimits.aiQuestionsPerDay) {
      return NextResponse.json({
        success: false,
        error: 'Daily AI question limit reached',
        limitReached: true,
        usage: {
          mcqAttempts: usage.mcqAttempts,
          aiQuestions: usage.aiQuestions,
          mcqLimit: planLimits.mcqPerDay,
          aiLimit: planLimits.aiQuestionsPerDay,
          mcqRemaining: planLimits.mcqPerDay === -1 ? -1 : Math.max(0, planLimits.mcqPerDay - usage.mcqAttempts),
          aiRemaining: 0,
          plan: user.plan,
        },
      });
    }

    // Increment counter
    const updateData = type === 'mcq'
      ? { mcqAttempts: { increment: 1 } }
      : { aiQuestions: { increment: 1 } };

    usage = await db.dailyUsage.update({
      where: {
        userId_date: { userId, date: today },
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      usage: {
        mcqAttempts: usage.mcqAttempts,
        aiQuestions: usage.aiQuestions,
        mcqLimit: planLimits.mcqPerDay,
        aiLimit: planLimits.aiQuestionsPerDay,
        mcqRemaining: planLimits.mcqPerDay === -1 ? -1 : Math.max(0, planLimits.mcqPerDay - usage.mcqAttempts),
        aiRemaining: planLimits.aiQuestionsPerDay === -1 ? -1 : Math.max(0, planLimits.aiQuestionsPerDay - usage.aiQuestions),
        plan: user.plan,
      },
    });
  } catch (error) {
    console.error('Usage POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
