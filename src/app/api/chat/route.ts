import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, message, subject = 'General', history } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId and message' },
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

    // Check free tier limits
    const today = new Date().toISOString().split('T')[0];
    const limits = {
      free: { aiQuestionsPerDay: 3 },
      pro: { aiQuestionsPerDay: -1 },
      premium: { aiQuestionsPerDay: -1 },
    };
    const planLimits = limits[user.plan as keyof typeof limits] || limits.free;

    if (planLimits.aiQuestionsPerDay !== -1) {
      let usage = await db.dailyUsage.findUnique({
        where: { userId_date: { userId, date: today } },
      });

      if (!usage) {
        usage = await db.dailyUsage.create({
          data: { userId, date: today, mcqAttempts: 0, aiQuestions: 0 },
        });
      }

      if (usage.aiQuestions >= planLimits.aiQuestionsPerDay) {
        return NextResponse.json({
          success: false,
          error: 'Daily AI question limit reached',
          limitReached: true,
          usage: {
            aiQuestions: usage.aiQuestions,
            aiLimit: planLimits.aiQuestionsPerDay,
            aiRemaining: 0,
            plan: user.plan,
          },
        });
      }

      // Increment usage
      await db.dailyUsage.update({
        where: { userId_date: { userId, date: today } },
        data: { aiQuestions: { increment: 1 } },
      });
    }

    // Save user message to database
    await db.chatMessage.create({
      data: {
        userId,
        role: 'user',
        content: message,
        subject,
      },
    });

    // Build messages array for AI
    const systemPrompt = 'You are an expert JEE and NEET tutor. Give clear step-by-step explanations. Use simple language suitable for Indian students.';

    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if provided
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call AI using groq-sdk
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';

    // Save AI response to database
    await db.chatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: aiResponse,
        subject,
      },
    });

    return NextResponse.json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    );
  }
}
