'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingDown,
  Brain,
  Target,
  Shield,
  Zap,
  BarChart3,
  Sparkles,
  ChevronRight,
  Check,
  X,
  Coffee,
  Cigarette,
  ShoppingBag,
  CreditCard,
  ArrowRight,
  Star,
  Flame,
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text overflow-x-hidden">
      {/* NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 50 ? 'bg-bg/90 backdrop-blur-xl border-b border-border' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-bg" />
            </div>
            <span className="text-xl font-bold">WDMG</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-text-muted hover:text-text transition-colors">Features</a>
            <a href="#pricing" className="text-text-muted hover:text-text transition-colors">Pricing</a>
            <a href="#ai-coach" className="text-text-muted hover:text-text transition-colors">AI Coach</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-text-muted hover:text-text transition-colors px-4 py-2">
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

      {/* HERO SECTION */}
      <section className="hero-gradient min-h-screen flex items-center justify-center relative pt-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">AI-Powered Financial Awareness</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Where Did My</span>
            <br />
            <span className="gradient-text">Money Go?</span>
          </h1>
          <p className="text-xl md:text-2xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Track your spending. Discover your habits. Get AI insights that make you
            <span className="text-danger font-semibold"> feel</span> the impact of every euro.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-primary/30 flex items-center gap-2"
            >
              Start Tracking Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="text-text-muted hover:text-text px-8 py-4 rounded-2xl font-medium text-lg transition-all border border-border hover:border-border-light"
            >
              See How It Works
            </a>
          </div>
          <div className="mt-16 flex items-center justify-center gap-8 text-text-dim text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              Free forever plan
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              AI insights included
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              The <span className="text-danger">€3 coffee</span> problem
            </h2>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              Small daily purchases feel harmless. But they add up to thousands every year.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Coffee,
                title: 'Daily Coffee',
                amount: '€3/day',
                yearly: '€1,095/year',
                lifetime: '€10,950 in 10 years',
                color: 'text-amber-400',
                bg: 'bg-amber-400/10',
              },
              {
                icon: Cigarette,
                title: 'Smoking',
                amount: '€8/day',
                yearly: '€2,920/year',
                lifetime: '€29,200 in 10 years',
                color: 'text-red-400',
                bg: 'bg-red-400/10',
              },
              {
                icon: ShoppingBag,
                title: 'Impulse Shopping',
                amount: '€15/day',
                yearly: '€5,475/year',
                lifetime: '€54,750 in 10 years',
                color: 'text-purple-400',
                bg: 'bg-purple-400/10',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="glass-card rounded-2xl p-8 hover:border-border-light transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-3xl font-bold text-text mb-1">{item.amount}</p>
                <p className="text-danger font-semibold text-lg">{item.yearly}</p>
                <p className="text-text-dim text-sm mt-2">{item.lifetime}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 px-6 section-gradient">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need to <span className="gradient-text">take control</span>
            </h2>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              From basic tracking to AI-powered behavior change — we've got you covered.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart3,
                title: 'Smart Dashboard',
                desc: 'See your spending at a glance with beautiful charts and real-time analytics.',
                color: 'text-primary',
                bg: 'bg-primary/10',
              },
              {
                icon: Brain,
                title: 'AI Financial Coach',
                desc: 'Get personalized insights about your spending habits and actionable advice.',
                color: 'text-accent',
                bg: 'bg-accent/10',
              },
              {
                icon: Target,
                title: 'Goal Tracking',
                desc: 'Set financial goals and track your progress with smart projections.',
                color: 'text-purple-400',
                bg: 'bg-purple-400/10',
              },
              {
                icon: Flame,
                title: 'Reality Mode',
                desc: 'Harsh truth mode that shows you the real cost of your habits. Premium only.',
                color: 'text-danger',
                bg: 'bg-danger/10',
              },
              {
                icon: Shield,
                title: 'Habit Detection',
                desc: 'Automatically detect money leaks like subscriptions and daily habits.',
                color: 'text-warning',
                bg: 'bg-warning/10',
              },
              {
                icon: Zap,
                title: 'Time-to-Earn Calculator',
                desc: 'See how many minutes of work each purchase costs you.',
                color: 'text-blue-400',
                bg: 'bg-blue-400/10',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-card rounded-2xl p-6 hover:border-border-light transition-all group hover:-translate-y-1"
              >
                <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI COACH SECTION */}
      <section id="ai-coach" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 mb-6">
                <Brain className="w-4 h-4 text-accent" />
                <span className="text-sm text-accent font-medium">AI Coach</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Your personal <span className="gradient-text">financial therapist</span>
              </h2>
              <p className="text-lg text-text-muted mb-8 leading-relaxed">
                Our AI analyzes your spending patterns and delivers insights that hit hard.
                Not just numbers — <span className="text-text font-medium">emotional impact</span>.
              </p>
              <div className="space-y-4">
                {[
                  'Yearly & lifetime spending projections',
                  '"What could I have bought?" comparisons',
                  'Money personality analysis',
                  'Habit detection & warnings',
                  'Time-to-earn calculations',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                    <span className="text-text-muted">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">WDMG AI Coach</p>
                  <p className="text-xs text-text-dim">Analyzing your spending...</p>
                </div>
              </div>
              <div className="bg-bg rounded-xl p-4 text-sm leading-relaxed">
                <p className="text-text-muted">
                  👋 I analyzed your spending this month. Here&apos;s what I found:
                </p>
                <br />
                <p className="text-text">
                  You spent <span className="text-danger font-bold">€847</span> this month.
                  At this rate, you&apos;ll waste <span className="text-danger font-bold">€10,164 this year</span>.
                </p>
                <br />
                <p className="text-text-muted">
                  💡 That&apos;s enough for a <span className="text-accent font-semibold">round-trip flight to Tokyo</span> with
                  money left over for a week of expenses.
                </p>
                <br />
                <p className="text-text-muted">
                  ⚡ Your biggest money leak? <span className="text-warning font-semibold">Daily coffee runs</span> —
                  €90/month that could be going toward your goals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REALITY MODE TEASER */}
      <section className="py-24 px-6 section-gradient">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-full px-4 py-2 mb-6">
            <Flame className="w-4 h-4 text-danger" />
            <span className="text-sm text-danger font-medium">Premium Feature</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-danger">Reality Mode</span>
          </h2>
          <p className="text-xl text-text-muted max-w-2xl mx-auto mb-8">
            Toggle on for harsh financial truths. No sugarcoating. Just the raw reality
            of where your money is going.
          </p>
          <div className="glass-card rounded-2xl p-8 max-w-lg mx-auto border-danger/20">
            <div className="flex items-center justify-between mb-6">
              <span className="font-semibold">Reality Mode</span>
              <div className="w-12 h-6 bg-danger rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
              </div>
            </div>
            <div className="bg-bg rounded-xl p-4 text-left">
              <p className="text-danger font-bold text-lg mb-2">🔥 Reality Check</p>
              <p className="text-text-muted text-sm leading-relaxed">
                You&apos;ve spent <span className="text-danger font-bold">€2,847</span> on coffee, snacks, and impulse purchases this year.
                In 10 years, that&apos;s <span className="text-danger font-bold">€28,470</span> — enough for a
                <span className="text-accent font-semibold"> house deposit</span>.
              </p>
              <p className="text-text-dim text-xs mt-3">
                Every €3 coffee costs you 30 minutes of work. That&apos;s 15 hours this month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, <span className="gradient-text">transparent</span> pricing
            </h2>
            <p className="text-xl text-text-muted">Start free. Upgrade when you&apos;re ready.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* FREE */}
            <div className="glass-card rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Free</h3>
                <p className="text-text-dim text-sm">Awareness tracking</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">€0</span>
                <span className="text-text-dim text-sm">/month</span>
              </div>
              <Link
                href="/register"
                className="w-full text-center bg-border hover:bg-border-light text-text py-3 rounded-xl font-medium transition-all mb-8"
              >
                Get Started
              </Link>
              <ul className="space-y-3 flex-1">
                {[
                  'Unlimited expense tracking',
                  'Basic dashboard',
                  'Monthly spending total',
                  'Category breakdown chart',
                  'Yearly projection',
                  'Simple UI analytics',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* PRO */}
            <div className="glass-card rounded-2xl p-8 border-primary/30 relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" /> Pro
                </h3>
                <p className="text-text-dim text-sm">Understanding habits</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">€3</span>
                <span className="text-text-dim text-sm">/month</span>
              </div>
              <Link
                href="/register"
                className="w-full text-center bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-medium transition-all mb-8 hover:shadow-lg hover:shadow-primary/25"
              >
                Start Pro Trial
              </Link>
              <ul className="space-y-3 flex-1">
                <li className="flex items-center gap-2 text-sm text-text-muted font-medium">
                  <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                  Everything in Free
                </li>
                {[
                  'AI Financial Coach (basic)',
                  'Monthly spending prediction',
                  'Yearly spending forecast',
                  '"What could I buy?" comparisons',
                  'Financial goals tracking',
                  'Weekly AI summary report',
                  'Basic habit detection',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* PREMIUM */}
            <div className="glass-card rounded-2xl p-8 border-accent/20 relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg text-xs font-bold px-4 py-1 rounded-full">
                🔥 PREMIUM
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-accent" /> Premium
                </h3>
                <p className="text-text-dim text-sm">Behavior change</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">€6</span>
                <span className="text-text-dim text-sm">/month</span>
              </div>
              <Link
                href="/register"
                className="w-full text-center bg-accent hover:bg-accent-hover text-bg py-3 rounded-xl font-medium transition-all mb-8 hover:shadow-lg hover:shadow-accent/25"
              >
                Go Premium
              </Link>
              <ul className="space-y-3 flex-1">
                <li className="flex items-center gap-2 text-sm text-text-muted font-medium">
                  <ChevronRight className="w-4 h-4 text-accent shrink-0" />
                  Everything in Pro
                </li>
                {[
                  'Advanced AI Financial Coach',
                  'Reality Mode (harsh truths)',
                  '5-10 year lifetime projections',
                  'Money personality analysis',
                  'Deep habit detection',
                  'Time-to-earn calculator',
                  'Smart goal optimization',
                  'Advanced weekly AI reports',
                  'Emotional financial coaching',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
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
                Ready to find out <span className="gradient-text">where your money goes?</span>
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
              <p className="text-text-dim text-sm mt-4">No credit card required. Free forever plan available.</p>
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
            <Link href="/login" className="hover:text-text transition-colors">Login</Link>
            <Link href="/register" className="hover:text-text transition-colors">Register</Link>
            <a href="#pricing" className="hover:text-text transition-colors">Pricing</a>
            <a href="#features" className="hover:text-text transition-colors">Features</a>
          </div>
          <p className="text-sm text-text-dim">© 2025 WDMG. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
