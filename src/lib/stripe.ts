import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

export const PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID || '',
  premium: process.env.STRIPE_PREMIUM_PRICE_ID || '',
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: {
      userId,
    },
  })
  return session
}

export async function createCustomer(email: string, userId: string) {
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  })
  return customer
}
