import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const currentWeek = getWeekString();

    // Get top 20 entries for the current week, sorted by score
    const entries = await db.leaderboardEntry.findMany({
      where: { week: currentWeek },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { score: 'desc' },
      take: 20,
    });

    // If no entries for current week, get all-time top 20
    const leaderboard = entries.length > 0
      ? entries
      : await db.leaderboardEntry.findMany({
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { score: 'desc' },
          take: 20,
        });

    // Update ranks based on current ordering
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      id: entry.id,
      userId: entry.userId,
      score: entry.score,
      week: entry.week,
      rank: index + 1,
      user: {
        name: entry.user.name,
        avatar: entry.user.avatar,
      },
    }));

    // Update ranks in database (fire and forget)
    for (let i = 0; i < leaderboard.length; i++) {
      if (leaderboard[i].rank !== i + 1) {
        db.leaderboardEntry.update({
          where: { id: leaderboard[i].id },
          data: { rank: i + 1 },
        }).catch(() => {
          // Ignore rank update errors
        });
      }
    }

    return NextResponse.json({
      success: true,
      leaderboard: rankedLeaderboard,
      week: currentWeek,
    });
  } catch (error) {
    console.error('Leaderboard GET error:', error);
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
