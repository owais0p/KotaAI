import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { join } from 'path';

function getWeekString(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

const SAMPLE_USERS = [
  { name: 'Aarav Sharma', email: 'aarav@kotaai.com', password: 'password123', plan: 'pro' as const, score: 450 },
  { name: 'Priya Patel', email: 'priya@kotaai.com', password: 'password123', plan: 'premium' as const, score: 380 },
  { name: 'Rohit Kumar', email: 'rohit@kotaai.com', password: 'password123', plan: 'free' as const, score: 320 },
  { name: 'Ananya Iyer', email: 'ananya@kotaai.com', password: 'password123', plan: 'pro' as const, score: 290 },
  { name: 'Vikram Singh', email: 'vikram@kotaai.com', password: 'password123', plan: 'free' as const, score: 250 },
  { name: 'Neha Gupta', email: 'neha@kotaai.com', password: 'password123', plan: 'free' as const, score: 210 },
];

const TOPICS_BY_SUBJECT: Record<string, string[]> = {
  Physics: ['Mechanics', 'Electrostatics', 'Optics', 'Thermodynamics', 'Modern Physics', 'Waves', 'Electromagnetism', 'Gravitation', 'Rotational Motion'],
  Chemistry: ['Organic Chemistry', 'Chemical Bonding', 'Thermodynamics', 'Electrochemistry', 'Chemical Kinetics', 'Periodic Table', 'Solutions', 'Coordination Chemistry', 'Equilibrium', 'Redox Reactions'],
  Maths: ['Calculus', 'Algebra', 'Coordinate Geometry', 'Probability', 'Matrices', 'Vectors', 'Integration', 'Differential Equations', 'Sequences and Series', 'Trigonometry'],
  Biology: ['Cell Biology', 'Genetics', 'Human Physiology', 'Ecology', 'Molecular Biology', 'Plant Physiology', 'Evolution', 'Reproduction', 'Biotechnology', 'Immune System'],
};

export async function POST() {
  try {
    // Check if data already exists
    const existingQuestions = await db.practiceQuestion.count();
    if (existingQuestions > 0) {
      return NextResponse.json({
        success: true,
        message: 'Database already seeded. Skipping to prevent duplicates.',
        stats: {
          questions: existingQuestions,
          users: await db.user.count(),
        },
      });
    }

    const currentWeek = getWeekString();

    // Load questions from JSON file
    const questionsPath = join(process.cwd(), 'src/lib/questions.json');
    const PRACTICE_QUESTIONS = JSON.parse(readFileSync(questionsPath, 'utf-8'));

    // 1. Create practice questions
    for (const q of PRACTICE_QUESTIONS) {
      await db.practiceQuestion.create({
        data: q,
      });
    }

    // 2. Create sample users with leaderboard entries
    const createdUsers: Array<{ id: string; name: string; email: string; plan: string }> = [];
    for (const u of SAMPLE_USERS) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      const user = await db.user.create({
        data: {
          name: u.name,
          email: u.email,
          password: hashedPassword,
          plan: u.plan,
          avatar: '',
        },
      });

      await db.leaderboardEntry.create({
        data: {
          userId: user.id,
          score: u.score,
          week: currentWeek,
          rank: 0,
        },
      });

      createdUsers.push({ id: user.id, name: user.name, email: user.email, plan: user.plan });
    }

    // 3. Create progress topics for the first user (demo purposes)
    if (createdUsers.length > 0) {
      const demoUser = createdUsers[0]; // Aarav - the "pro" user
      for (const [subject, topics] of Object.entries(TOPICS_BY_SUBJECT)) {
        for (const topic of topics.slice(0, 5)) {
          const score = Math.floor(Math.random() * 80) + 10;
          await db.progressTopic.create({
            data: {
              userId: demoUser.id,
              subject,
              topic,
              score,
              weakArea: score < 40,
              completed: score >= 80,
            },
          });
        }
      }
    }

    // 4. Create some chat messages for demo
    if (createdUsers.length > 0) {
      const demoUser = createdUsers[0];
      await db.chatMessage.createMany({
        data: [
          {
            userId: demoUser.id,
            role: 'user',
            content: 'Explain Newton\'s second law of motion',
            subject: 'Physics',
          },
          {
            userId: demoUser.id,
            role: 'assistant',
            content: '**Newton\'s Second Law of Motion** states that the rate of change of momentum of a body is directly proportional to the applied force and takes place in the direction of the force.\n\n**Mathematical Form:** F = ma\n\nWhere:\n- F = Force (in Newtons, N)\n- m = Mass (in kg)\n- a = Acceleration (in m/s²)\n\n**Key Points:**\n1. Force is a vector quantity\n2. The direction of acceleration is the same as the direction of force\n3. If F = 0, then a = 0 (object moves with constant velocity or remains at rest)',
            subject: 'Physics',
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      stats: {
        questions: PRACTICE_QUESTIONS.length,
        users: SAMPLE_USERS.length,
        leaderboardEntries: SAMPLE_USERS.length,
        progressTopics: Object.values(TOPICS_BY_SUBJECT).reduce((sum, t) => sum + Math.min(t.length, 5), 0),
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
