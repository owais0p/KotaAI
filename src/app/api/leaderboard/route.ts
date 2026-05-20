import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Step 1: Get correct answer counts per user using groupBy
    const correctCounts = await db.practiceAttempt.groupBy({
      by: ['userId'],
      where: { isCorrect: true },
      _count: { isCorrect: true },
      orderBy: { _count: { isCorrect: 'desc' } },
    });

    // Step 2: Get user details for those users
    const userIds = correctCounts.map((c) => c.userId);
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Step 3: Build leaderboard with rank
    const leaderboard = correctCounts.map((entry, index) => ({
      id: entry.userId,
      userId: entry.userId,
      score: entry._count.isCorrect,
      rank: index + 1,
      user: {
        name: userMap.get(entry.userId)?.name || 'Unknown',
        avatar: userMap.get(entry.userId)?.avatar || '',
      },
    }));

    return NextResponse.json({
      success: true,
      leaderboard,
      week: 'all-time',
    });
  } catch (error) {
    console.error('Leaderboard GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
