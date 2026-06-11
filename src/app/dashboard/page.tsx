// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingDown,
  TrendingUp,
  Calendar,
  Brain,
  ArrowUpRight,
  Flame,
  Coffee,
  Target,
} from 'lucide-react'
import {
  getMonthlyTotal,
  getYearlyProjection,
  getCategoryBreakdown,
  getDailyAverage,
  getWhatCouldIBuy,
  getMoneyPersonality,
} from '@/lib/calculations'
import { MOCK_EXPENSES, MOCK_USER } from '@/lib/mock-data'

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

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadExpenses = () => {
      const stored = localStorage.getItem('wdmg_expenses')
      if (stored) {
        setExpenses(MOCK_EXPENSES.concat(JSON.parse(stored)))
      } else {
        setExpenses(MOCK_EXPENSES)
      }
      setLoading(false)
    }
    loadExpenses()
    // Refresh when returning from add-expense
    const handleFocus = () => loadExpenses()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const monthly = getMonthlyTotal(expenses)
  const yearly = getYearlyProjection(expenses)
  const daily = getDailyAverage(expenses)
  const breakdown = getCategoryBreakdown(expenses)
  const topCategory = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0]
  const personality = getMoneyPersonality(expenses)
  const couldBuy = getWhatCouldIBuy(monthly)

  const aiInsights = [
    `You spend €${daily.toFixed(2)} per day on average. That's €${yearly.toLocaleString()} per year.`,
    topCategory && `${topCategory[0]} is your biggest category at €${topCategory[1].toFixed(2)} this month.`,
    couldBuy[0] && `Your monthly spending could buy ${couldBuy[0].emoji} ${couldBuy[0].item} (${couldBuy[0].cost}€).`,
    personality && `${personality.emoji} You're a ${personality.type}: ${personality.description}`,
  ].filter(Boolean)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-text-muted animate-pulse">Loading your dashboard...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">DEMO</span>
        </div>
        <p className="text-text-muted">Your financial overview — using demo data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-muted text-sm">Monthly Spending</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold">€{monthly.toFixed(2)}</p>
          <p className="text-text-dim text-sm mt-1">This month</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-muted text-sm">Yearly Projection</span>
            <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-danger" />
            </div>
          </div>
          <p className="text-3xl font-bold text-danger">€{yearly.toLocaleString()}</p>
          <p className="text-text-dim text-sm mt-1">At current rate</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-muted text-sm">Daily Average</span>
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-accent" />
            </div>
          </div>
          <p className="text-3xl font-bold text-accent">€{daily.toFixed(2)}</p>
          <p className="text-text-dim text-sm mt-1">Per day</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-muted text-sm">Total Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-warning" />
            </div>
          </div>
          <p className="text-3xl font-bold">{expenses.length}</p>
          <p className="text-text-dim text-sm mt-1">Logged expenses</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">AI Insight</h2>
              <p className="text-xs text-text-dim">Based on your spending</p>
            </div>
          </div>
          <div className="space-y-3">
            {aiInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-text-muted">
                <span className="text-primary mt-0.5">•</span>
                <span>{insight}</span>
              </div>
            ))}
            <Link href="/ai-coach" className="inline-flex items-center gap-1 text-primary hover:text-primary-hover text-sm font-medium mt-2 transition-colors">
              Talk to AI Coach
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Category Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(breakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => {
                const pct = monthly > 0 ? (amount / monthly) * 100 : 0
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize text-text-muted">{category}</span>
                      <span className="font-medium">€{amount.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-bg rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Money Personality</h2>
          <div className="text-center py-4">
            <div className="text-5xl mb-3">{personality.emoji}</div>
            <h3 className="text-xl font-bold mb-2">{personality.type}</h3>
            <p className="text-text-muted text-sm leading-relaxed">{personality.description}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold mb-4">What Could I Buy Instead?</h2>
          <div className="space-y-3">
            {couldBuy.slice(0, 4).map((item) => (
              <div key={item.item} className="flex items-center justify-between bg-bg rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-sm font-medium">{item.item}</span>
                </div>
                <span className="text-sm text-text-dim">€{item.cost.toLocaleString()}</span>
              </div>
            ))}
            <Link href="/goals" className="inline-flex items-center gap-1 text-accent hover:text-accent-hover text-sm font-medium mt-2 transition-colors">
              Set a Goal
              <Target className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
