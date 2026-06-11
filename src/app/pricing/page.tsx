// @ts-nocheck
'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Check,
  Star,
  Flame,
  ChevronRight,
  TrendingDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

const plans = [
  {
    name: 'Free',
    price: '€0',
    period: '/month',
    description: 'Awareness tracking',
    cta: 'Get Started',
    ctaHref: '/register',
    popular: false,
    premium: false,
    features: [
      'Unlimited expense tracking',
      'Basic dashboard',
      'Monthly spending total',
      'Category breakdown chart',
      'Yearly projection',
      'Simple UI analytics',
    ],
    includesPrevious: false,
  },
  {
    name: 'Pro',
    price: '€3',
    period: '/month',
    description: 'Understanding habits',
    cta: 'Upgrade to Pro',
    ctaHref: '#',
    popular: true,
    premium: false,
    features: [
      'AI Financial Coach (basic)',
      'Monthly spending prediction',
      'Yearly spending forecast',
      '"What could I buy?" comparisons',
      'Financial goals tracking',
      'Weekly AI summary report',
      'Basic habit detection',
    ],
    includesPrevious: true,
  },
  {
    name: 'Premium',
    price: '€6',
    period: '/month',
    description: 'Behavior change',
    cta: 'Go Premium',
    ctaHref: '#',
    popular: false,
    premium: true,
    features: [
      'Advanced AI Financial Coach',
      'Reality Mode (harsh truths)',
      '5-10 year lifetime projections',
      'Money personality analysis',
      'Deep habit detection',
      'Time-to-earn calculator',
      'Smart goal optimization',
      'Advanced weekly AI reports',
      'Emotional financial coaching',
    ],
    includesPrevious: true,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (plan: string) => {
    try {
      setLoading(plan)

      const {
        data: { user },
      } = await getSupabase().auth.getUser()

      if (!user) {
        window.location.href = '/register'
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      let stripeCustomerId = profile?.stripe_customer_id

      if (!stripeCustomerId) {
        const customerResponse = await fetch('/api/create-stripe-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            userId: user.id,
          }),
        })

        const customerData = await customerResponse.json()
        stripeCustomerId = customerData.customerId

        if (!stripeCustomerId) {
          throw new Error('Failed to create Stripe customer')
        }
      }

      const priceId =
        plan === 'pro'
          ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
          : process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID

      const { sessionId } = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: stripeCustomerId,
          priceId,
          plan,
          userId: user.id,
        }),
      }).then((res) => res.json())

      if (!sessionId) {
        throw new Error('Failed to create checkout session')
      }

      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const { error } = await stripe.redirectToCheckout({ sessionId })
      if (error) {
        throw error
      }
    } catch (err) {
      console.error('Upgrade error:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-bg" />
            </div>
            <span className="text-xl font-bold">WDMG</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-text-muted hover:text-text transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-text-muted hover:text-text transition-colors">
              Pricing
            </Link>
            <Link href="/#ai-coach" className="text-text-muted hover:text-text transition-colors">
              AI Coach
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-text-muted hover:text-text transition-colors px-4 py-2"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-primary/25"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-gradient pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Simple, transparent pricing</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Choose your</span>
            <br />
            <span className="gradient-text">financial plan</span>
          </h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
            Start free. Upgrade when you&apos;re ready. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`glass-card rounded-2xl p-8 flex flex-col relative ${
                  plan.popular
                    ? 'border-primary/30'
                    : plan.premium
                    ? 'border-accent/20'
                    : ''
                }`}
              >
                {/* Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                {plan.premium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg text-xs font-bold px-4 py-1 rounded-full">
                    🔥 PREMIUM
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                    {plan.popular && <Star className="w-5 h-5 text-primary" />}
                    {plan.premium && <Flame className="w-5 h-5 text-accent" />}
                    {plan.name}
                  </h3>
                  <p className="text-text-dim text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-text-dim text-sm">{plan.period}</span>
                </div>

                {/* CTA Button */}
                {plan.name === 'Free' ? (
                  <Link
                    href={plan.ctaHref}
                    className="w-full text-center bg-border hover:bg-border-light text-text py-3 rounded-xl font-medium transition-all mb-8 inline-block"
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.name.toLowerCase())}
                    disabled={loading === plan.name.toLowerCase()}
                    className={`w-full text-center py-3 rounded-xl font-medium transition-all mb-8 ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary-hover text-white hover:shadow-lg hover:shadow-primary/25'
                        : 'bg-accent hover:bg-accent-hover text-bg hover:shadow-lg hover:shadow-accent/25'
                    } ${loading === plan.name.toLowerCase() ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {loading === plan.name.toLowerCase()
                      ? 'Redirecting...'
                      : plan.cta}
                  </button>
                )}

                {/* Features list */}
                <ul className="space-y-3 flex-1">
                  {plan.includesPrevious && (
                    <li className="flex items-center gap-2 text-sm text-text-muted font-medium">
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 ${
                          plan.premium ? 'text-accent' : 'text-primary'
                        }`}
                      />
                      Everything in {plan.name === 'Pro' ? 'Free' : 'Pro'}
                    </li>
                  )}
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-text-muted"
                    >
                      <Check
                        className={`w-4 h-4 shrink-0 ${
                          plan.premium ? 'text-accent' : plan.popular ? 'text-primary' : 'text-accent'
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ / TRUST SECTION */}
      <section className="py-16 px-6 section-gradient">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Common <span className="gradient-text">questions</span>
          </h2>
          <div className="space-y-6 text-left">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. You can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.',
              },
              {
                q: 'Is the Free plan really free?',
                a: 'Absolutely. The Free plan includes unlimited expense tracking and basic analytics — forever. No credit card required.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit and debit cards through Stripe, including Visa, Mastercard, and American Express.',
              },
              {
                q: 'Can I switch plans later?',
                a: 'Of course. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.',
              },
            ].map((faq) => (
              <div key={faq.q} className="glass-card rounded-xl p-6">
                <h3 className="font-semibold text-text mb-2">{faq.q}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Ready to find out{' '}
                <span className="gradient-text">where your money goes?</span>
              </h2>
              <p className="text-xl text-text-muted mb-8 max-w-xl mx-auto">
                Join thousands of people who finally understand their spending habits.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                Start Tracking Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-text-dim text-sm mt-4">
                No credit card required. Free forever plan available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-bg" />
            </div>
            <span className="font-bold">WDMG</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-dim">
            <Link href="/login" className="hover:text-text transition-colors">
              Login
            </Link>
            <Link href="/register" className="hover:text-text transition-colors">
              Register
            </Link>
            <Link href="/pricing" className="hover:text-text transition-colors">
              Pricing
            </Link>
            <Link href="/#features" className="hover:text-text transition-colors">
              Features
            </Link>
          </div>
          <p className="text-sm text-text-dim">© 2025 WDMG. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
