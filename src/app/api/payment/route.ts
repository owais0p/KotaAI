import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHmac } from 'crypto';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Razorpay order creation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, plan } = body;

    if (!userId || !plan) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or plan' },
        { status: 400 }
      );
    }

    if (!['pro', 'premium'].includes(plan)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan. Must be pro or premium.' },
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

    const amount = plan === 'pro' ? 29900 : 69900; // in paise
    const currency = 'INR';

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: { userId, plan },
    });

    const payment = await db.payment.create({
      data: {
        userId,
        plan,
        amount,
        currency,
        razorpayOrderId: order.id,
        status: 'created',
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentId: payment.id,
      amount,
      currency,
      plan,
      key: process.env.RAZORPAY_KEY_ID!,
    });
  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}

// Verify and complete payment
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature, plan } = body;

    if (!paymentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !plan) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify signature
    const sigBody = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(sigBody)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Payment already processed' },
        { status: 400 }
      );
    }

    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'paid',
        razorpayPaymentId,
      },
    });

    const updatedUser = await db.user.update({
      where: { id: payment.userId },
      data: { plan },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        plan: updatedUser.plan,
        avatar: updatedUser.avatar,
        streak: updatedUser.streak,
        lastPracticeDate: updatedUser.lastPracticeDate,
      },
    });
  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
