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

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if streak should be reset (missed yesterday and hasn't practiced today)
    let currentStreak = user.streak;
    let needsReset = false;

    if (user.lastPracticeDate !== today && user.lastPracticeDate !== yesterday && user.lastPracticeDate !== '') {
      // Missed at least one day → streak should be 0
      needsReset = true;
      currentStreak = 0;
      await db.user.update({
        where: { id: userId },
        data: { streak: 0, lastPracticeDate: '' },
      });
    }

    // Check if streak is at risk (after 8pm and hasn't practiced today)
    const currentHour = new Date().getHours();
    const streakAtRisk = currentHour >= 20 && user.lastPracticeDate !== today;

    // Check if user has practiced today
    const practicedToday = user.lastPracticeDate === today;

    return NextResponse.json({
      success: true,
      streak: currentStreak,
      lastPracticeDate: user.lastPracticeDate,
      practicedToday,
      streakAtRisk,
      needsReset,
    });
  } catch (error) {
    console.error('Streak GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
