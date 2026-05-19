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

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all progress topics for the user
    const progressTopics = await db.progressTopic.findMany({
      where: { userId },
      orderBy: [{ subject: 'asc' }, { topic: 'asc' }],
    });

    // Group by subject
    const grouped: Record<string, typeof progressTopics> = {};
    for (const topic of progressTopics) {
      if (!grouped[topic.subject]) {
        grouped[topic.subject] = [];
      }
      grouped[topic.subject].push(topic);
    }

    // Calculate summary stats
    const totalTopics = progressTopics.length;
    const completedTopics = progressTopics.filter((t) => t.completed).length;
    const weakAreas = progressTopics.filter((t) => t.weakArea);
    const averageScore =
      totalTopics > 0
        ? Math.round(
            progressTopics.reduce((sum, t) => sum + t.score, 0) / totalTopics
          )
        : 0;

    // Subject-wise summary
    const subjectSummary: Record<
      string,
      { total: number; completed: number; weakAreas: number; averageScore: number }
    > = {};

    for (const [subject, topics] of Object.entries(grouped)) {
      subjectSummary[subject] = {
        total: topics.length,
        completed: topics.filter((t) => t.completed).length,
        weakAreas: topics.filter((t) => t.weakArea).length,
        averageScore:
          topics.length > 0
            ? Math.round(topics.reduce((sum, t) => sum + t.score, 0) / topics.length)
            : 0,
      };
    }

    return NextResponse.json({
      success: true,
      progress: grouped,
      weakAreas,
      summary: {
        totalTopics,
        completedTopics,
        weakAreaCount: weakAreas.length,
        averageScore,
        subjectSummary,
      },
    });
  } catch (error) {
    console.error('Progress GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
