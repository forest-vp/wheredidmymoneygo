'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, Star, Flame, ChevronRight, TrendingDown, ArrowRight, ArrowLeft, Sparkles, Loader2, Lock, Zap } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

const plans = [
  {
    name: 'Free',
    price: '€0',
    period: '/month',
    description: 'Start tracking your money',
    cta: 'Get Started',
    ctaHref: '/register',
    popular: false,
    premium: false,
    features: [
      'Unlimited expense tracking',
      'Dashboard with spending overview',
      'Category breakdown charts',
      'Monthly & yearly projections',
      'Up to 3 financial goals',
      'Basic money personality test',
      'Add expenses manually',
      'Export data (CSV)',
    ],
    includesPrevious: false,
    locked: false,
  },
  {
    name: 'Pro',
    price: '€3',
    period: '/month',
    description: 'Understand your habits',
    cta: 'Upgrade to Pro',
    ctaHref: '#',
    popular: true,
    premium: false,
    features: [
      'Everything in Free',
      'AI Financial Coach (basic)',
      'Monthly spending prediction',
      'Yearly spending forecast',
      '\'What could I buy?\' comparisons',
      'Unlimited financial goals',
      'Weekly AI summary report',
      'Basic habit detection',
    ],
    includesPrevious: true,
    locked: true,
  },
  {
    name: 'Premium',
    price: '€6',
    period: '/month',
    description: 'Transform your finances',
    cta: 'Start Premium',
    ctaHref: '#',
    popular: false,
    premium: true,
    features: [
      'Everything in Pro',
      'Advanced AI Financial Coach',
      'Reality Mode (harsh truths)',
      '5-10 year lifetime projections',
      'Deep habit detection',
      'Time-to-earn calculator',
      'Smart goal optimization',
      'Reality Mode',
      'Emotional financial coaching',
    ],
    includesPrevious: true,
    locked: true,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = getSupabase()
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        setIsLoggedIn(!!data?.user)
      }).catch(() => {})
    }
  }, [])

  const handleUpgrade = async (plan: string) => {
    if (plan === 'free') {
      window.location.href = '/register'
      return
    }

    setLoading(plan)
    try {
      const priceId = plan === 'pro'
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          customerEmail: '',
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Payment not set up yet. Connect Stripe to enable real subscriptions.')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Something went wrong. Please try again.')
    }
    setLoading(null)
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
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-text-muted hover:text-text transition-colors px-4 py-2 flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-text-muted hover:text-text transition-colors px-4 py-2">Log in</Link>
                <Link href="/register" className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-primary/25">Start Free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-gradient pt-32 pb-16 px-6 text-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, <span className="gradient-text">transparent</span> pricing
          </h1>
          <p className="text-xl text-text-muted mb-2">Start free. Upgrade when you want more.</p>
          <p className="text-text-dim text-sm">No credit card required for Free plan. Cancel anytime.</p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass-card rounded-2xl p-8 flex flex-col relative ${
                plan.popular ? 'border-primary/30' : plan.premium ? 'border-accent/20' : ''
              }`}
            >
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

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                  {plan.premium && <Flame className="w-5 h-5 text-accent" />}
                  {plan.popular && <Star className="w-5 h-5 text-primary" />}
                  {plan.name}
                </h3>
                <p className="text-text-dim text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-text-dim text-sm">{plan.period}</span>
              </div>

              <button
                onClick={() => handleUpgrade(plan.name.toLowerCase())}
                disabled={loading === plan.name.toLowerCase()}
                className={`w-full text-center py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 mb-8 ${
                  plan.popular
                    ? 'bg-primary hover:bg-primary-hover text-white hover:shadow-lg hover:shadow-primary/25'
                    : plan.premium
                    ? 'bg-accent hover:bg-accent-hover text-bg hover:shadow-lg hover:shadow-accent/25'
                    : 'border border-border hover:bg-border text-text'
                } ${loading === plan.name.toLowerCase() ? 'opacity-60' : ''}`}
              >
                {loading === plan.name.toLowerCase() ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  plan.name === 'Free' ? (
                    'Get Started'
                  ) : (
                    <>
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )
                )}
              </button>

              <ul className="space-y-3 flex-1">
                {plan.includesPrevious && (
                  <li className="flex items-center gap-2 text-sm text-text-muted font-medium">
                    <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                    Everything in {plan.name === 'Pro' ? 'Free' : 'Pro'}
                  </li>
                )}
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-text-muted">
                    <Check className={`w-4 h-4 shrink-0 ${plan.premium ? 'text-accent' : 'text-primary'}`} />
                    <span className="flex items-center gap-1.5">
                      {f}
                      {plan.locked && (
                        <Lock className="w-3 h-3 text-text-dim inline" />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURE COMPARISON */}
      <section className="py-16 px-6 section-gradient">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Compare Plans</h2>
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-text-muted font-medium text-sm">Feature</th>
                  <th className="p-4 text-center text-text-muted font-medium text-sm">Free</th>
                  <th className="p-4 text-center text-primary font-medium text-sm">Pro</th>
                  <th className="p-4 text-center text-accent font-medium text-sm">Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Expense tracking', '✅', '✅', '✅'],
                  ['Dashboard & charts', '✅', '✅', '✅'],
                  ['Yearly projections', '✅', '✅', '✅'],
                  ['Financial goals', '3 goals', '∞', '∞'],
                  ['Money personality', 'Basic', 'Full', 'Full'],
                  ['AI Coach', '❌', 'Basic', 'Advanced'],
                  ['Reality Mode', '❌', '❌', '✅'],
                  ['Habit detection', '❌', 'Basic', 'Deep'],
                  ['Time-to-earn calc', '❌', '❌', '✅'],
                  ['Weekly AI reports', '❌', '✅', '✅'],
                  ['Lifetime projections', '❌', '❌', '✅'],
                ].map(([feature, free, pro, premium], i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-4 text-sm text-text">{feature}</td>
                    <td className="p-4 text-center text-sm">{free}</td>
                    <td className="p-4 text-center text-sm">{pro}</td>
                    <td className="p-4 text-center text-sm">{premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes! You can cancel your subscription at any time. You\'ll keep access until the end of your billing period.' },
              { q: 'Is there a free trial for Premium?', a: 'Premium comes with a 7-day free trial. You won\'t be charged until the trial ends.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards through Stripe.' },
              { q: 'Can I switch plans?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately.' },
            ].map((faq, i) => (
              <div key={i} className="glass-card rounded-xl p-5">
                <h3 className="font-semibold mb-1">{faq.q}</h3>
                <p className="text-text-muted text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">Ready to take control of your money?</h2>
              <p className="text-text-muted mb-6">Start free. Upgrade when you&apos;re ready.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-primary/30">
                  Start Free <ArrowRight className="w-5 h-5" />
                </Link>
                <button onClick={() => handleUpgrade('premium')} disabled={loading === 'premium'}
                  className="inline-flex items-center gap-2 border border-accent/30 text-accent hover:bg-accent/10 px-8 py-4 rounded-2xl font-semibold text-lg transition-all disabled:opacity-50">
                  {loading === 'premium' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                  Try Premium
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto text-center text-sm text-text-dim">
          © 2025 WDMG. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
