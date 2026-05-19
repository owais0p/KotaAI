import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, password, name, plan } = body;

    if (!action || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action === 'signup') {
      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Name is required for signup' },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email already registered' },
          { status: 409 }
        );
      }

      const hashedPassword = hashPassword(password);

      const validPlans = ['free', 'pro', 'premium'];
      const userPlan = validPlans.includes(plan) ? plan : 'free';

      const user = await db.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          plan: userPlan,
          avatar: '',
        },
      });

      // Create leaderboard entry for the new user
      const currentWeek = getWeekString();
      await db.leaderboardEntry.create({
        data: {
          userId: user.id,
          score: 0,
          week: currentWeek,
          rank: 0,
        },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        },
      });
    }

    if (action === 'login') {
      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const hashedPassword = hashPassword(password);

      if (user.password !== hashedPassword) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "login" or "signup"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Auth error:', error);
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
