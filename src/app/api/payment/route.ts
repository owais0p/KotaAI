import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

// Simulated Razorpay order creation
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
    const razorpayOrderId = `order_${randomBytes(12).toString('hex')}`;

    const payment = await db.payment.create({
      data: {
        userId,
        plan,
        amount,
        currency,
        razorpayOrderId,
        status: 'created',
      },
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrderId,
      paymentId: payment.id,
      amount,
      currency,
      plan,
      key: 'rzp_test_simulated',
      prefill: {
        name: user.name,
        email: user.email,
      },
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
    const { paymentId, razorpayPaymentId, plan } = body;

    if (!paymentId || !plan) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    const simulatedPaymentId = razorpayPaymentId || `pay_${randomBytes(12).toString('hex')}`;

    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'paid',
        razorpayPaymentId: simulatedPaymentId,
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
