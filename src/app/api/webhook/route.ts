import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature') || ''

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
  })

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed':
      break
    case 'customer.subscription.updated':
      break
    case 'customer.subscription.deleted':
      break
    case 'invoice.payment_failed':
      break
  }

  return NextResponse.json({ received: true })
}
