// @ts-nocheck
'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from 'recharts'
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Award } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import {
  getCategoryBreakdown,
  getMonthlyTrend,
  getYearlyProjection,
  getTopExpenses,
} from '@/lib/calculations'

const PIE_COLORS = ['#4F8CFF', '#00E5A8', '#FF4D4D', '#F59E0B', '#8B5CF6', '#EC4899']

export default function AnalyticsPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExpenses = async () => {
      const {
        data: { user },
      } = await getSupabase().auth.getUser()
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

  const categoryData = useMemo(() => {
    const breakdown = getCategoryBreakdown(expenses)
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
  }, [expenses])

  const monthlyTrend = useMemo(() => {
    return getMonthlyTrend(expenses).map((d) => ({
      ...d,
      label: d.month.slice(0, 7),
    }))
  }, [expenses])

  const yearlyProjection = useMemo(() => getYearlyProjection(expenses), [expenses])

  const topExpenses = useMemo(() => getTopExpenses(expenses, 5), [expenses])

  const barData = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const monthName = new Date().toLocaleString('default', { month: 'short' })
    return [
      {
        name: monthName,
        actual: monthlyTrend.reduce((s, d) => s + d.total, 0),
        projected: Math.round(yearlyProjection / 12),
      },
    ]
  }, [monthlyTrend, yearlyProjection])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-text-muted animate-pulse">Loading analytics...</div>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Analytics</h1>
          <p className="text-text-muted">Deep dive into your spending patterns</p>
        </div>
        <div className="glass-card rounded-2xl p-12 text-center">
          <BarChart3 className="w-16 h-16 text-text-dim mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Data Yet</h2>
          <p className="text-text-muted">Add some expenses to see your analytics come to life.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Analytics</h1>
        <p className="text-text-muted">Deep dive into your spending patterns</p>
      </div>

      {/* Yearly Projection Hero */}
      <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-text-muted text-sm font-medium uppercase tracking-wider">
                Yearly Projection
              </span>
            </div>
            <p className="text-5xl md:text-6xl font-bold gradient-text">
              €{yearlyProjection.toLocaleString()}
            </p>
            <p className="text-text-dim text-sm mt-2">
              At your current daily spending rate
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg/60 rounded-xl p-4 text-center min-w-[120px]">
              <p className="text-2xl font-bold text-primary">
                €{Math.round(yearlyProjection / 12).toLocaleString()}
              </p>
              <p className="text-text-dim text-xs mt-1">Per Month</p>
            </div>
            <div className="bg-bg/60 rounded-xl p-4 text-center min-w-[120px]">
              <p className="text-2xl font-bold text-accent">
                €{Math.round(yearlyProjection / 365).toLocaleString()}
              </p>
              <p className="text-text-dim text-xs mt-1">Per Day</p>
            </div>
            <div className="bg-bg/60 rounded-xl p-4 text-center min-w-[120px]">
              <p className="text-2xl font-bold text-warning">
                €{Math.round(yearlyProjection / 52).toLocaleString()}
              </p>
              <p className="text-text-dim text-xs mt-1">Per Week</p>
            </div>
            <div className="bg-bg/60 rounded-xl p-4 text-center min-w-[120px]">
              <p className="text-2xl font-bold text-danger">{expenses.length}</p>
              <p className="text-text-dim text-xs mt-1">Expenses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Pie + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart — Category Breakdown */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <PieChartIcon className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-lg">Category Breakdown</h2>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                >
                  {categoryData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #1E293B',
                    borderRadius: '12px',
                    color: '#E6EAF2',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`€${value.toFixed(2)}`, '']}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-text-muted text-sm capitalize">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart — Yearly Projection vs Actual */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-accent" />
            </div>
            <h2 className="font-semibold text-lg">Actual vs Projected</h2>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="name"
                  stroke="#5A6580"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#5A6580"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `€${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #1E293B',
                    borderRadius: '12px',
                    color: '#E6EAF2',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`€${value.toFixed(2)}`]}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-text-muted text-sm">{value}</span>
                  )}
                />
                <Bar
                  dataKey="actual"
                  name="Actual"
                  fill="#4F8CFF"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                />
                <Bar
                  dataKey="projected"
                  name="Projected"
                  fill="#00E5A8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Area Chart — Monthly Trend */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-warning" />
          </div>
          <h2 className="font-semibold text-lg">Monthly Spending Trend</h2>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F8CFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4F8CFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="label"
                stroke="#5A6580"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#5A6580"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `€${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  color: '#E6EAF2',
                  fontSize: '13px',
                }}
                formatter={(value: number) => [`€${value.toFixed(2)}`, 'Spent']}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#4F8CFF"
                strokeWidth={2}
                fill="url(#colorTotal)"
                dot={{ fill: '#4F8CFF', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: '#4F8CFF', stroke: '#0B0F1A', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 Spending Habits */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-danger/10 flex items-center justify-center">
            <Award className="w-4 h-4 text-danger" />
          </div>
          <h2 className="font-semibold text-lg">Top 5 Spending Habits</h2>
        </div>
        {topExpenses.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">
            No expenses to rank yet.
          </p>
        ) : (
          <div className="space-y-3">
            {topExpenses.map((expense, index) => {
              const maxAmount = topExpenses[0]?.amount || 1
              const barWidth = (expense.amount / maxAmount) * 100
              const categoryColors: Record<string, string> = {
                food: '#4F8CFF',
                transport: '#00E5A8',
                entertainment: '#FF4D4D',
                shopping: '#F59E0B',
                health: '#8B5CF6',
                other: '#EC4899',
              }
              const barColor = categoryColors[expense.category?.toLowerCase()] || '#4F8CFF'

              return (
                <div
                  key={expense.id || index}
                  className="bg-bg/60 rounded-xl p-4 hover:bg-bg-card-hover transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: barColor }}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{expense.name}</p>
                        <p className="text-text-dim text-xs capitalize">
                          {expense.category} · {expense.frequency}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-lg">€{expense.amount.toFixed(2)}</p>
                  </div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
