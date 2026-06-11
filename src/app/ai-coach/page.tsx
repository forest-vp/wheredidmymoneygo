// @ts-nocheck
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Brain,
  Flame,
  Clock,
  ShoppingBag,
  AlertTriangle,
  Sparkles,
  MessageCircle,
  Zap,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Send,
  Loader2,
  ChevronDown,
  Target,
  Lightbulb,
  Heart,
  Shield,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  getYearlyProjection,
  getLifetimeProjection,
  getWhatCouldIBuy,
  getTimeToEarn,
  detectMoneyLeaks,
  getMoneyPersonality,
  getCategoryBreakdown,
  getMonthlyTotal,
} from '@/lib/calculations'

interface Expense {
  id: string
  user_id: string
  name: string
  category: string
  amount: number
  frequency: string
  date: string
  created_at: string
}

interface ChatMessage {
  role: 'user' | 'coach'
  content: string
  timestamp: Date
}

const REALITY_MODE_KEY = 'wdmg-reality-mode'

export default function AICoachPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [realityMode, setRealityMode] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    breakdown: true,
    projection: true,
    whatcouldbuy: true,
    timetoearn: true,
    leaks: true,
    personality: true,
  })
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Load reality mode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(REALITY_MODE_KEY)
    if (stored !== null) {
      setRealityMode(stored === 'true')
    }
  }, [])

  // Save reality mode to localStorage
  const toggleRealityMode = () => {
    const next = !realityMode
    setRealityMode(next)
    localStorage.setItem(REALITY_MODE_KEY, String(next))
  }

  // Fetch expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setExpenses(data)
      setLoading(false)
    }
    fetchExpenses()
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Computed values
  const monthly = getMonthlyTotal(expenses)
  const yearly = getYearlyProjection(expenses)
  const lifetime10 = getLifetimeProjection(expenses, 10)
  const lifetime30 = getLifetimeProjection(expenses, 30)
  const breakdown = getCategoryBreakdown(expenses)
  const personality = getMoneyPersonality(expenses)
  const moneyLeaks = detectMoneyLeaks(expenses)
  const couldBuy = getWhatCouldIBuy(monthly)
  const topCategory = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0]

  // Generate AI coach messages based on data
  const generateCoachResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase()

    if (lower.includes('save') || lower.includes('saving') || lower.includes('budget')) {
      if (realityMode) {
        return `Let's be brutally honest: you're burning €${monthly.toFixed(2)}/month with zero savings plan. At this rate, you'll have NOTHING for emergencies. Cut your top category (${topCategory?.[0] || 'spending'}) by 30% — that's €${(monthly * 0.3).toFixed(2)}/month you could actually keep. Open a savings account TODAY.`
      }
      return `Great question! You're spending €${monthly.toFixed(2)}/month. If you could reduce your ${topCategory?.[0] || 'biggest category'} spending by just 20%, you'd save €${(monthly * 0.2).toFixed(2)}/month — that's €${(monthly * 0.2 * 12).toFixed(0)}/year! Start small and build the habit. 💪`
    }

    if (lower.includes('projection') || lower.includes('future') || lower.includes('year')) {
      if (realityMode) {
        return `Here's the cold hard truth: at your current pace, you'll waste €${yearly.toLocaleString()} this year. In 10 years? €${lifetime10.toLocaleString()}. In 30 years? €${lifetime30.toLocaleString()}. That's a house down payment. That's retirement. That's GONE. Every day you wait, the number gets worse.`
      }
      return `Based on your current spending patterns, you're on track to spend about €${yearly.toLocaleString()} this year. Over 10 years, that adds up to roughly €${lifetime10.toLocaleString()}. The good news? Small changes now can make a huge difference over time! 📈`
    }

    if (lower.includes('leak') || lower.includes('problem') || lower.includes('bad') || lower.includes('stop')) {
      if (moneyLeaks.length > 0) {
        const top3 = moneyLeaks.slice(0, 3)
        if (realityMode) {
          return `Your biggest money drains:\n${top3.map((l, i) => `${i + 1}. ${l.name}: €${l.monthlyTotal}/month (€${(l.monthlyTotal * 12).toFixed(0)}/year)`).join('\n')}\n\nThese are the leaks sinking your financial ship. Cancel or reduce at least ONE this week. No excuses.`
        }
        return `I found some spending patterns worth reviewing:\n${top3.map((l, i) => `${i + 1}. ${l.name}: €${l.monthlyTotal}/month`).join('\n')}\n\nThese might be good places to look for savings. Even small reductions here can add up! 🔍`
      }
      return realityMode
        ? "I don't see major leaks yet — but that might mean you're not tracking everything. Be honest with yourself."
        : "Your spending looks fairly controlled! Keep tracking to make sure nothing slips through. 👍"
    }

    if (lower.includes('personality') || lower.includes('type') || lower.includes('am i')) {
      if (realityMode) {
        return `${personality.emoji} You're a "${personality.type}" — and that's ${personality.type === 'The Conscious Planner' ? 'actually good' : 'a problem'}. ${personality.description}\n\nStop making excuses. Your money personality is costing you real money. Fix it.`
      }
      return `${personality.emoji} Based on your spending, you're a **${personality.type}**!\n\n${personality.description}\n\nUnderstanding your money personality is the first step to improving your financial habits. 🌟`
    }

    if (lower.includes('buy') || lower.includes('instead') || lower.includes('could')) {
      if (couldBuy.length > 0) {
        const items = couldBuy.slice(0, 3)
          .map((i) => `${i.emoji} ${i.item} (€${i.cost})`)
          .join('\n')
        if (realityMode) {
          return `Your monthly spending of €${monthly.toFixed(2)} could instead buy:\n${items}\n\nBut you're not buying any of these. You're buying... what exactly? Think about that.`
        }
        return `Instead of spending €${monthly.toFixed(2)}/month, you could be saving up for:\n${items}\n\nWhat matters most to you? Let's work toward it! 🎯`
      }
      return "Add some expenses first so I can show you what your money could buy instead!"
    }

    if (lower.includes('time') || lower.includes('work') || lower.includes('earn')) {
      const timeForMonthly = getTimeToEarn(monthly)
      const hours = Math.floor(timeForMonthly / 60)
      const mins = timeForMonthly % 60
      if (realityMode) {
        return `You need to work ${hours}h ${mins}m every month just to pay for your current spending. That's ${Math.round(timeForMonthly / 60 / 20 * 100)}% of a full work month. Half your life is spent funding habits you barely remember.`
      }
      return `At €15/hour, you need to work about **${hours}h ${mins}m** each month to cover your current spending. Knowing this can help you decide: is each purchase worth the work? ⏰`
    }

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return realityMode
        ? `Hey. Let's not sugarcoat this — you're spending €${monthly.toFixed(2)}/month. I'm here to help you face the numbers. What do you want to fix?`
        : `Hey there! 👋 I'm your AI Money Coach. I've analyzed your spending and I'm here to help you make smarter financial decisions. What would you like to talk about?`
    }

    // Default response
    if (realityMode) {
      return `Here's what I see: €${monthly.toFixed(2)}/month, €${yearly.toLocaleString()}/year, biggest category: ${topCategory?.[0] || 'N/A'}. You're a ${personality.type}. Ask me about savings, projections, money leaks, or what your spending is really costing you.`
    }
    return `I've analyzed your spending! Here's a quick overview:\n\n📊 Monthly: €${monthly.toFixed(2)}\n📈 Yearly projection: €${yearly.toLocaleString()}\n🏷️ Top category: ${topCategory?.[0] || 'N/A'} (€${topCategory?.[1].toFixed(2) || '0'})\n${personality.emoji} Personality: ${personality.type}\n\nAsk me about savings tips, future projections, money leaks, or what you could buy instead! 💬`
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date(),
    }
    setChatMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)

    // Simulate AI thinking delay
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800))

    const response = generateCoachResponse(userMsg.content)
    const coachMsg: ChatMessage = {
      role: 'coach',
      content: response,
      timestamp: new Date(),
    }
    setChatMessages((prev) => [...prev, coachMsg])
    setChatLoading(false)
  }

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const categoryColors: Record<string, string> = {
    food: 'bg-orange-500/20 text-orange-400',
    transport: 'bg-blue-500/20 text-blue-400',
    entertainment: 'bg-purple-500/20 text-purple-400',
    shopping: 'bg-pink-500/20 text-pink-400',
    health: 'bg-green-500/20 text-green-400',
    bills: 'bg-red-500/20 text-red-400',
    other: 'bg-gray-500/20 text-gray-400',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-text-muted animate-pulse">Analyzing your finances...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="gradient-text">AI Money Coach</span>
          </h1>
          <p className="text-text-muted">
            {realityMode
              ? 'Brutal honesty mode. No sugarcoating.'
              : 'Your personal finance advisor — friendly and supportive.'}
          </p>
        </div>

        {/* Reality Mode Toggle */}
        <button
          onClick={toggleRealityMode}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            realityMode
              ? 'bg-danger/20 text-danger border border-danger/30 hover:bg-danger/30'
              : 'bg-bg-card text-text-muted border border-border hover:border-primary/50 hover:text-primary'
          }`}
        >
          {realityMode ? (
            <>
              <Eye className="w-4 h-4" />
              Reality Mode: ON
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              Reality Mode: OFF
            </>
          )}
        </button>
      </div>

      {/* Quick Stats Bar */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-dim">Monthly</p>
              <p className="text-lg font-bold truncate">€{monthly.toFixed(2)}</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-danger/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-danger" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-dim">Yearly</p>
              <p className="text-lg font-bold text-danger truncate">€{yearly.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-dim">10yr Projection</p>
              <p className="text-lg font-bold text-accent truncate">€{lifetime10.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-dim">Expenses</p>
              <p className="text-lg font-bold">{expenses.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {expenses.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Brain className="w-16 h-16 text-text-dim mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No expenses to analyze yet</h2>
          <p className="text-text-muted mb-6 max-w-md mx-auto">
            Add some expenses first, and I'll provide personalized insights about your spending habits.
          </p>
          <Link
            href="/add-expense"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl text-sm font-medium transition-all"
          >
            Add Your First Expense
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {expenses.length > 0 && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Column: Analysis Sections */}
          <div className="lg:col-span-3 space-y-4">
            {/* Chat Interface */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Chat with your Coach</h2>
                  <p className="text-xs text-text-dim">
                    {realityMode ? 'Brutal truths ahead' : 'Ask me anything about your finances'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <Sparkles className="w-10 h-10 text-text-dim mx-auto mb-3" />
                    <p className="text-text-muted text-sm mb-4">
                      {realityMode
                        ? "I've crunched your numbers. Ask me anything — I won't sugarcoat it."
                        : "Hi! I've analyzed your spending. What would you like to know?"}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['How can I save more?', 'What are my money leaks?', 'Future projections', 'My money personality'].map(
                        (suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => setChatInput(suggestion)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-bg border border-border text-text-muted hover:text-primary hover:border-primary/30 transition-all"
                          >
                            {suggestion}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-bg border border-border text-text rounded-bl-md'
                      }`}
                    >
                      {msg.role === 'coach' && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Brain className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">AI Coach</span>
                          {realityMode && (
                            <span className="text-xs text-danger ml-1">• Reality Mode</span>
                          )}
                        </div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-bg border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-sm text-text-muted">Analyzing...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={
                      realityMode
                        ? 'Ask for the harsh truth...'
                        : 'Ask about savings, projections, habits...'
                    }
                    className="flex-1 bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || chatLoading}
                    className="bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('breakdown')}
                className="w-full p-4 flex items-center justify-between hover:bg-bg-card-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-semibold">Spending Breakdown</h2>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-text-dim transition-transform ${
                    expandedSections.breakdown ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.breakdown && (
                <div className="px-4 pb-4 space-y-3">
                  {Object.entries(breakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, amount]) => {
                      const pct = monthly > 0 ? (amount / monthly) * 100 : 0
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-md capitalize ${
                                  categoryColors[category] || categoryColors.other
                                }`}
                              >
                                {category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-text-muted">{pct.toFixed(0)}%</span>
                              <span className="font-medium">€{amount.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="h-2 bg-bg rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Money Leaks */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('leaks')}
                className="w-full p-4 flex items-center justify-between hover:bg-bg-card-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-danger" />
                  </div>
                  <h2 className="font-semibold">Money Leak Detection</h2>
                  {moneyLeaks.length > 0 && (
                    <span className="text-xs bg-danger/20 text-danger px-2 py-0.5 rounded-md">
                      {moneyLeaks.length} found
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-text-dim transition-transform ${
                    expandedSections.leaks ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.leaks && (
                <div className="px-4 pb-4">
                  {moneyLeaks.length === 0 ? (
                    <p className="text-text-muted text-sm text-center py-4">
                      {realityMode
                        ? "No major leaks detected — but are you tracking everything?"
                        : "No major money leaks detected! Keep up the good work! 🎉"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {moneyLeaks.slice(0, 6).map((leak, i) => (
                        <div
                          key={leak.name}
                          className="flex items-center justify-between bg-bg rounded-xl p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                i < 3
                                  ? 'bg-danger/20 text-danger'
                                  : 'bg-warning/20 text-warning'
                              }`}
                            >
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium">{leak.name}</p>
                              <p className="text-xs text-text-dim capitalize">{leak.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">€{leak.monthlyTotal}</p>
                            <p className="text-xs text-text-dim">/month</p>
                          </div>
                        </div>
                      ))}
                      {realityMode && moneyLeaks.length > 0 && (
                        <div className="mt-3 p-3 bg-danger/10 border border-danger/20 rounded-xl">
                          <p className="text-xs text-danger font-medium">
                            ⚠️ These leaks cost you €
                            {moneyLeaks
                              .reduce((s, l) => s + l.monthlyTotal, 0)
                              .toFixed(2)}
                            /month. That's €
                            {(
                              moneyLeaks.reduce((s, l) => s + l.monthlyTotal, 0) * 12
                            ).toFixed(0)}
                            /year wasted.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Money Personality */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('personality')}
                className="w-full p-4 flex items-center justify-between hover:bg-bg-card-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-accent" />
                  </div>
                  <h2 className="font-semibold">Money Personality</h2>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-text-dim transition-transform ${
                    expandedSections.personality ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.personality && (
                <div className="px-4 pb-4">
                  <div className="text-center py-4">
                    <div className="text-5xl mb-3">{personality.emoji}</div>
                    <h3 className="text-xl font-bold mb-2">{personality.type}</h3>
                    <p className="text-text-muted text-sm leading-relaxed">
                      {realityMode
                        ? personality.description + "\n\nStop making excuses. Your money personality is costing you real money."
                        : personality.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Projections & Comparisons */}
          <div className="lg:col-span-2 space-y-4">
            {/* Yearly Projection */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('projection')}
                className="w-full p-4 flex items-center justify-between hover:bg-bg-card-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-warning" />
                  </div>
                  <h2 className="font-semibold text-sm">Future Projections</h2>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-text-dim transition-transform ${
                    expandedSections.projection ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.projection && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="bg-bg rounded-xl p-4 text-center">
                    <p className="text-xs text-text-dim mb-1">This Year</p>
                    <p className="text-2xl font-bold text-danger">€{yearly.toLocaleString()}</p>
                  </div>
                  <div className="bg-bg rounded-xl p-4 text-center">
                    <p className="text-xs text-text-dim mb-1">In 10 Years</p>
                    <p className="text-2xl font-bold text-warning">€{lifetime10.toLocaleString()}</p>
                  </div>
                  <div className="bg-bg rounded-xl p-4 text-center">
                    <p className="text-xs text-text-dim mb-1">In 30 Years</p>
                    <p className="text-2xl font-bold text-accent">€{lifetime30.toLocaleString()}</p>
                  </div>
                  {realityMode && (
                    <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl">
                      <p className="text-xs text-danger font-medium leading-relaxed">
                        🚨 You will waste €{lifetime10.toLocaleString()} in 10 years at this rate.
                        That's a house down payment. That's retirement. That's GONE.
                      </p>
                    </div>
                  )}
                  {!realityMode && (
                    <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl">
                      <p className="text-xs text-accent font-medium leading-relaxed">
                        💡 Small changes now compound into massive savings over time!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* What Could I Buy */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('whatcouldbuy')}
                className="w-full p-4 flex items-center justify-between hover:bg-bg-card-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-sm">What Could I Buy?</h2>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-text-dim transition-transform ${
                    expandedSections.whatcouldbuy ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.whatcouldbuy && (
                <div className="px-4 pb-4">
                  {couldBuy.length === 0 ? (
                    <p className="text-text-muted text-sm text-center py-4">
                      Add more expenses to see comparisons
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-text-dim mb-3">
                        Your monthly spending (€{monthly.toFixed(2)}) could buy:
                      </p>
                      <div className="space-y-2">
                        {couldBuy.slice(0, 5).map((item) => (
                          <div
                            key={item.item}
                            className="flex items-center justify-between bg-bg rounded-xl p-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{item.emoji}</span>
                              <span className="text-sm font-medium">{item.item}</span>
                            </div>
                            <span className="text-xs text-text-dim">
                              €{item.cost.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      {realityMode && (
                        <p className="text-xs text-danger mt-3 font-medium">
                          But you're not buying any of these. Think about that.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Time to Earn */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('timetoearn')}
                className="w-full p-4 flex items-center justify-between hover:bg-bg-card-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-accent" />
                  </div>
                  <h2 className="font-semibold text-sm">Time to Earn</h2>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-text-dim transition-transform ${
                    expandedSections.timetoearn ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.timetoearn && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-text-dim mb-3">
                    At €15/hour, your spending requires:
                  </p>
                  <div className="bg-bg rounded-xl p-4 text-center mb-3">
                    <p className="text-xs text-text-dim mb-1">Monthly spending</p>
                    <p className="text-xl font-bold">
                      {(() => {
                        const mins = getTimeToEarn(monthly)
                        const h = Math.floor(mins / 60)
                        const m = mins % 60
                        return `${h}h ${m}m`
                      })()}
                    </p>
                    <p className="text-xs text-text-dim">of work</p>
                  </div>
                  <div className="space-y-2">
                    {expenses.slice(0, 4).map((expense) => {
                      const mins = getTimeToEarn(expense.amount)
                      const h = Math.floor(mins / 60)
                      const m = mins % 60
                      return (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-text-muted truncate mr-2">{expense.name}</span>
                          <span className="text-text-dim shrink-0">
                            {h > 0 ? `${h}h ` : ''}{m}m
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {realityMode && (
                    <p className="text-xs text-danger mt-3 font-medium">
                      Half your life is spent funding habits you barely remember.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Emotional Motivation Card */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                {realityMode ? (
                  <Flame className="w-5 h-5 text-danger" />
                ) : (
                  <Heart className="w-5 h-5 text-accent" />
                )}
                <h3 className="font-semibold text-sm">
                  {realityMode ? 'Wake Up Call' : 'Your Motivation'}
                </h3>
              </div>
              {realityMode ? (
                <div className="space-y-2">
                  <p className="text-sm text-danger font-medium">
                    • You'll waste €{lifetime10.toLocaleString()} in 10 years
                  </p>
                  <p className="text-sm text-danger font-medium">
                    • That's {Math.round(lifetime10 / 1200)} iPhone Pros gone forever
                  </p>
                  <p className="text-sm text-danger font-medium">
                    • Every day you wait costs you €{(yearly / 365).toFixed(2)}
                  </p>
                  <p className="text-sm text-text-muted mt-3">
                    The question isn't whether you can afford to change. It's whether you can afford not to.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-text-muted flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    Saving just €5/day = €1,825/year
                  </p>
                  <p className="text-sm text-text-muted flex items-start gap-2">
                    <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    Small consistent changes create big results
                  </p>
                  <p className="text-sm text-text-muted flex items-start gap-2">
                    <Shield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    You're already tracking — that's the hardest part!
                  </p>
                  <p className="text-sm text-accent font-medium mt-3">
                    You've got this! Every euro saved is a step toward freedom. 🚀
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="glass-card rounded-2xl p-4">
              <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/add-expense"
                  className="flex items-center justify-between w-full bg-bg rounded-xl p-3 text-sm hover:bg-bg-card-hover transition-colors group"
                >
                  <span className="text-text-muted group-hover:text-primary transition-colors">
                    Add Expense
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-text-dim group-hover:text-primary transition-colors" />
                </Link>
                <Link
                  href="/analytics"
                  className="flex items-center justify-between w-full bg-bg rounded-xl p-3 text-sm hover:bg-bg-card-hover transition-colors group"
                >
                  <span className="text-text-muted group-hover:text-primary transition-colors">
                    View Analytics
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-text-dim group-hover:text-primary transition-colors" />
                </Link>
                <Link
                  href="/goals"
                  className="flex items-center justify-between w-full bg-bg rounded-xl p-3 text-sm hover:bg-bg-card-hover transition-colors group"
                >
                  <span className="text-text-muted group-hover:text-primary transition-colors">
                    Set a Goal
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-text-dim group-hover:text-primary transition-colors" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
