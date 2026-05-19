import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

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
    const systemPrompt = `You are KotaAI, an expert AI tutor specializing in JEE and NEET exam preparation for ${subject}. Provide step-by-step explanations. Use clear formatting with steps numbered. Include relevant formulas and concepts. Be encouraging and thorough. Format your responses with markdown for clarity. Use **bold** for key terms and formulas. Use bullet points for lists. If solving a numerical problem, clearly show each step with units.`;

    const messages: Array<{ role: string; content: string }> = [
      { role: 'assistant', content: systemPrompt },
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

    // Call AI using z-ai-web-dev-sdk
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
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
