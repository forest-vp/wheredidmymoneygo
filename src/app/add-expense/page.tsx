// @ts-nocheck
'use client'

import { useState, useEffect, FormEvent } from 'react'
import { getSupabase, hasSupabase } from '@/lib/supabase'
import type { Expense } from '@/lib/supabase'
import {
  PlusCircle,
  DollarSign,
  Calendar,
  Tag,
  Repeat,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'food', label: 'Food', emoji: '🍕' },
  { value: 'habits', label: 'Habits', emoji: '🚬' },
  { value: 'transport', label: 'Transport', emoji: '🚗' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { value: 'subscriptions', label: 'Subscriptions', emoji: '📱' },
  { value: 'health', label: 'Health', emoji: '💊' },
  { value: 'other', label: 'Other', emoji: '📦' },
] as const

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const

const MOCK_EXPENSES: Expense[] = [
  { id: '1', user_id: 'demo-user', name: 'Coffee', category: 'food', amount: 3.50, frequency: 'daily', date: '2025-01-15', created_at: '2025-01-15' },
  { id: '2', user_id: 'demo-user', name: 'Netflix', category: 'subscriptions', amount: 15.99, frequency: 'monthly', date: '2025-01-01', created_at: '2025-01-01' },
  { id: '3', user_id: 'demo-user', name: 'Cigarettes', category: 'habits', amount: 8.00, frequency: 'daily', date: '2025-01-14', created_at: '2025-01-14' },
  { id: '4', user_id: 'demo-user', name: 'Uber', category: 'transport', amount: 12.50, frequency: 'weekly', date: '2025-01-13', created_at: '2025-01-13' },
  { id: '5', user_id: 'demo-user', name: 'Amazon Shopping', category: 'shopping', amount: 45.00, frequency: 'monthly', date: '2025-01-10', created_at: '2025-01-10' },
  { id: '6', user_id: 'demo-user', name: 'Gym', category: 'health', amount: 30.00, frequency: 'monthly', date: '2025-01-05', created_at: '2025-01-05' },
  { id: '7', user_id: 'demo-user', name: 'Fast Food', category: 'food', amount: 9.50, frequency: 'weekly', date: '2025-01-12', created_at: '2025-01-12' },
  { id: '8', user_id: 'demo-user', name: 'Spotify', category: 'subscriptions', amount: 9.99, frequency: 'monthly', date: '2025-01-01', created_at: '2025-01-01' },
]

interface StatusMessage {
  type: 'success' | 'error'
  text: string
}

export default function AddExpensePage() {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0].value)
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<string>(FREQUENCIES[2].value)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])

  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<StatusMessage | null>(null)

  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchRecentExpenses = async () => {
    setLoadingExpenses(true)
    if (!hasSupabase()) {
      // Load mock + localStorage expenses
      const stored = localStorage.getItem('wdmg_expenses')
      const localExpenses: Expense[] = stored ? JSON.parse(stored) : []
      setRecentExpenses([...MOCK_EXPENSES, ...localExpenses].slice(0, 10))
      setLoadingExpenses(false)
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      setLoadingExpenses(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoadingExpenses(false)
      return
    }

    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) setRecentExpenses(data)
    setLoadingExpenses(false)
  }

  useEffect(() => {
    fetchRecentExpenses()
  }, [])

  const resetForm = () => {
    setName('')
    setCategory(CATEGORIES[0].value)
    setAmount('')
    setFrequency(FREQUENCIES[2].value)
    setDate(new Date().toISOString().split('T')[0])
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus(null)

    if (!name.trim()) {
      setStatus({ type: 'error', text: 'Please enter an expense name.' })
      return
    }

    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setStatus({ type: 'error', text: 'Please enter a valid amount.' })
      return
    }

    setSubmitting(true)

    try {
      if (!hasSupabase()) {
        // Save to localStorage
        const stored = localStorage.getItem('wdmg_expenses')
        const localExpenses: Expense[] = stored ? JSON.parse(stored) : []
        const newExpense: Expense = {
          id: Date.now().toString(),
          user_id: 'demo-user',
          name: name.trim(),
          category,
          amount: parsedAmount,
          frequency,
          date,
          created_at: new Date().toISOString(),
        }
        localExpenses.unshift(newExpense)
        localStorage.setItem('wdmg_expenses', JSON.stringify(localExpenses))
        setRecentExpenses([newExpense, ...recentExpenses].slice(0, 10))
        setStatus({ type: 'success', text: `Added "${name.trim()}" for €${parsedAmount.toFixed(2)}` })
        resetForm()
        setSubmitting(false)
        return
      }

      const supabase = getSupabase()
      if (!supabase) {
        setStatus({ type: 'error', text: 'Supabase is not configured.' })
        setSubmitting(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setStatus({ type: 'error', text: 'You must be logged in to add an expense.' })
        setSubmitting(false)
        return
      }

      const { error } = await supabase.from('expenses').insert({
        user_id: user.id,
        name: name.trim(),
        category,
        amount: parsedAmount,
        frequency,
        date,
      })

      if (error) throw error

      setStatus({ type: 'success', text: `Added "${name.trim()}" for €${parsedAmount.toFixed(2)}` })
      resetForm()
      await fetchRecentExpenses()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setStatus({ type: 'error', text: message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      if (!hasSupabase()) {
        // Delete from localStorage
        const stored = localStorage.getItem('wdmg_expenses')
        const localExpenses: Expense[] = stored ? JSON.parse(stored) : []
        const filtered = localExpenses.filter((e) => e.id !== id)
        localStorage.setItem('wdmg_expenses', JSON.stringify(filtered))
        setRecentExpenses((prev) => prev.filter((e) => e.id !== id))
        setDeletingId(null)
        return
      }

      const supabase = getSupabase()
      if (!supabase) {
        setDeletingId(null)
        return
      }

      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      await fetchRecentExpenses()
    } catch {
      setStatus({ type: 'error', text: 'Failed to delete expense.' })
    } finally {
      setDeletingId(null)
    }
  }

  const selectedCategoryEmoji =
    CATEGORIES.find((c) => c.value === category)?.emoji ?? '📦'

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-1 gradient-text flex items-center gap-3">
          <PlusCircle className="w-8 h-8 text-primary" />
          Add Expense
        </h1>
        <p className="text-text-muted">Track your spending and see where your money goes.</p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
        {/* Status Message */}
        {status && (
          <div
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
              status.type === 'success'
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'bg-danger/10 text-danger border border-danger/20'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{status.text}</span>
          </div>
        )}

        {/* Expense Name */}
        <div>
          <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2">
            <Tag className="w-4 h-4" />
            Expense Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Groceries, Netflix, Uber..."
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            maxLength={100}
          />
        </div>

        {/* Category & Amount Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label htmlFor="category" className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2">
              <span className="text-base">{selectedCategoryEmoji}</span>
              Category
            </label>
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2">
              <DollarSign className="w-4 h-4" />
              Amount (€)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim text-sm">€</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-bg border border-border rounded-xl pl-8 pr-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Frequency & Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Frequency */}
          <div>
            <label htmlFor="frequency" className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2">
              <Repeat className="w-4 h-4" />
              Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FREQUENCIES.map((freq) => (
                <button
                  key={freq.value}
                  type="button"
                  onClick={() => setFrequency(freq.value)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium border transition-all ${
                    frequency === freq.value
                      ? 'bg-primary/15 border-primary text-primary'
                      : 'bg-bg border-border text-text-muted hover:border-border-light hover:text-text'
                  }`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2">
              <Calendar className="w-4 h-4" />
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-xl transition-all text-base"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Adding Expense...
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5" />
              Add Expense
            </>
          )}
        </button>
      </form>

      {/* Recent Expenses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Expenses</h2>
          <span className="text-sm text-text-dim">{recentExpenses.length} shown</span>
        </div>

        {loadingExpenses ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-text-muted animate-pulse">Loading expenses...</div>
          </div>
        ) : recentExpenses.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">💸</div>
            <p className="text-text-muted text-sm">No expenses yet. Add your first one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentExpenses.map((expense) => {
              const catEmoji =
                CATEGORIES.find((c) => c.value === expense.category)?.emoji ?? '📦'
              const isDeleting = deletingId === expense.id

              return (
                <div
                  key={expense.id}
                  className="glass-card rounded-xl p-4 flex items-center justify-between group hover:border-border-light transition-all"
                  style={{ opacity: isDeleting ? 0.5 : 1 }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center text-lg shrink-0">
                      {catEmoji}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-text truncate">{expense.name}</p>
                      <div className="flex items-center gap-2 text-xs text-text-dim mt-0.5">
                        <span className="capitalize">{expense.category}</span>
                        <span>•</span>
                        <span className="capitalize">{expense.frequency}</span>
                        <span>•</span>
                        <span>{formatDate(expense.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="font-semibold text-danger">€{expense.amount.toFixed(2)}</span>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={isDeleting}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-text-dim hover:text-danger hover:bg-danger/10 transition-all disabled:cursor-not-allowed"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
