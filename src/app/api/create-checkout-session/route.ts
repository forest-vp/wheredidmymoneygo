import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { priceId, customerId, userId } = await req.json()

    if (!priceId || !customerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      metadata: { userId },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
