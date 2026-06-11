import { Expense } from './supabase'

/**
 * ALL raw number calculations go here.
 * AI/UI only explains and rephrases these — never calculates.
 */

export function getDailyAverage(expenses: Expense[]): number {
  const daily: Record<string, number> = {}
  expenses.forEach((e) => {
    const d = e.date.slice(0, 10)
    daily[d] = (daily[d] || 0) + e.amount
  })
  const days = Object.keys(daily).length || 1
  const total = Object.values(daily).reduce((a, b) => a + b, 0)
  return total / days
}

export function getWeeklyTotal(expenses: Expense[]): number {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return expenses
    .filter((e) => new Date(e.date) >= weekAgo)
    .reduce((sum, e) => sum + e.amount, 0)
}

export function getMonthlyTotal(expenses: Expense[]): number {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  return expenses
    .filter((e) => new Date(e.date) >= monthStart)
    .reduce((sum, e) => sum + e.amount, 0)
}

export function getYearlyProjection(expenses: Expense[]): number {
  const daily = getDailyAverage(expenses)
  return Math.round(daily * 365)
}

export function getLifetimeProjection(expenses: Expense[], years: number = 10): number {
  return getYearlyProjection(expenses) * years
}

export function getCategoryBreakdown(expenses: Expense[]): Record<string, number> {
  const breakdown: Record<string, number> = {}
  expenses.forEach((e) => {
    breakdown[e.category] = (breakdown[e.category] || 0) + e.amount
  })
  return breakdown
}

export function getTopExpenses(expenses: Expense[], limit: number = 5): Expense[] {
  return [...expenses].sort((a, b) => b.amount - a.amount).slice(0, limit)
}

export function getMonthlyTrend(expenses: Expense[]): { month: string; total: number }[] {
  const months: Record<string, number> = {}
  expenses.forEach((e) => {
    const d = new Date(e.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months[key] = (months[key] || 0) + e.amount
  })
  return Object.entries(months)
    .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export function getWhatCouldIBuy(amount: number): { item: string; emoji: string; cost: number }[] {
  const items = [
    { item: 'iPhone 16 Pro', emoji: '📱', cost: 1200 },
    { item: 'Gaming PC', emoji: '🖥️', cost: 1500 },
    { item: 'Round-trip flight to Tokyo', emoji: '✈️', cost: 1800 },
    { item: 'Month of rent (avg)', emoji: '🏠', cost: 1000 },
    { item: 'Tesla Model 3 down payment', emoji: '🚗', cost: 5000 },
    { item: '100 nice dinners', emoji: '🍽️', cost: 3000 },
    { item: 'Year of Netflix', emoji: '🎬', cost: 240 },
    { item: 'Designer bag', emoji: '👜', cost: 2500 },
    { item: 'Emergency fund (3 months)', emoji: '🛡️', cost: 3000 },
    { item: 'Weekend trip to Paris', emoji: '🇫🇷', cost: 800 },
  ]
  return items.filter((i) => i.cost <= amount * 1.5).sort((a, b) => b.cost - a.cost)
}

export function getTimeToEarn(amount: number, hourlyWage: number = 15): number {
  return Math.round((amount / hourlyWage) * 60) // minutes
}

export function detectMoneyLeaks(expenses: Expense[]): { name: string; monthlyTotal: number; category: string }[] {
  const categoryMonthly: Record<string, number> = {}
  expenses.forEach((e) => {
    const timesPerMonth = e.frequency === 'daily' ? 30 : e.frequency === 'weekly' ? 4 : 1
    categoryMonthly[e.name] = (categoryMonthly[e.name] || 0) + e.amount * timesPerMonth
  })
  return Object.entries(categoryMonthly)
    .filter(([, total]) => total > 0)
    .map(([name, total]) => ({
      name,
      monthlyTotal: Math.round(total * 100) / 100,
      category: expenses.find((e) => e.name === name)?.category || 'other',
    }))
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal)
}

export function getMoneyPersonality(expenses: Expense[]): {
  type: string
  description: string
  emoji: string
} {
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const categories = Object.keys(getCategoryBreakdown(expenses)).length
  const avgTransaction = total / (expenses.length || 1)
  const frequentSmall = expenses.filter((e) => e.frequency === 'daily' && e.amount < 10).length

  if (frequentSmall > expenses.length * 0.5) {
    return {
      type: 'The Impulse Spender',
      description: 'Small daily purchases are silently draining your wallet. Those €3 coffees add up to over €1,000 a year.',
      emoji: '⚡',
    }
  }
  if (avgTransaction > 100) {
    return {
      type: 'The Big Spender',
      description: 'You tend to make large purchases. Make sure they align with your long-term goals.',
      emoji: '💎',
    }
  }
  if (categories > 5) {
    return {
      type: 'The Diversified Spender',
      description: 'Your spending is spread across many categories. Great for life, tough for budgets.',
      emoji: '🌈',
    }
  }
  if (total < 500) {
    return {
      type: 'The Conscious Planner',
      description: 'You keep your spending tight. Just make sure you\'re not missing out on life.',
      emoji: '🧠',
    }
  }
  return {
    type: 'The Balanced Spender',
    description: 'You have a healthy mix of spending. Keep tracking to stay on top of your goals.',
    emoji: '⚖️',
  }
}
