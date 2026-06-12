import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = typeof window !== 'undefined'
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
  : null

export { stripePromise as default }
