'use client'

import { useState, useEffect, FormEvent } from 'react'
import { getSupabase } from '@/lib/supabase'
import {
  PlusCircle, DollarSign, Calendar, Tag, Repeat,
  CheckCircle, AlertCircle, Loader2, Trash2, ArrowLeft,
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

export default function AddExpensePage() {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0].value)
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<string>(FREQUENCIES[2].value)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [recentExpenses, setRecentExpenses] = useState<any[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(true)

  useEffect(() => {
    fetchRecentExpenses()
  }, [])

  const fetchRecentExpenses = async () => {
    setLoadingExpenses(true)
    const supabase = getSupabase()
    if (!supabase) { setLoadingExpenses(false); return }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
        if (data) setRecentExpenses(data)
      }
    } catch { /* ignore */ }
    setLoadingExpenses(false)
  }

  const resetForm = () => {
    setName(''); setCategory(CATEGORIES[0].value); setAmount(''); setFrequency(FREQUENCIES[2].value); setDate(new Date().toISOString().split('T')[0])
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus(null)
    if (!name.trim()) { setStatus({ type: 'error', text: 'Please enter an expense name.' }); return }
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) { setStatus({ type: 'error', text: 'Please enter a valid amount.' }); return }
    setSubmitting(true)

    const supabase = getSupabase()
    if (!supabase) {
      setStatus({ type: 'error', text: 'Not connected. Please log in.' })
      setSubmitting(false); return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus({ type: 'error', text: 'Please log in to add expenses.' }); setSubmitting(false); return }

      const { error } = await supabase.from('expenses').insert({
        user_id: user.id, name: name.trim(), category, amount: parsedAmount, frequency, date,
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
    const supabase = getSupabase()
    if (!supabase) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('expenses').delete().eq('id', id).eq('user_id', user.id)
      setRecentExpenses(prev => prev.filter(e => e.id !== id))
    } catch { /* ignore */ }
  }

  const selectedCategoryEmoji = CATEGORIES.find(c => c.value === category)?.emoji ?? '📦'

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-1 gradient-text flex items-center gap-3">
          <PlusCircle className="w-8 h-8 text-primary" /> Add Expense
        </h1>
        <p className="text-text-muted">Track your spending and see where your money goes.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
        {status && (
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${status.type === 'success' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
            {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{status.text}</span>
          </div>
        )}

        <div>
          <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2"><Tag className="w-4 h-4" /> Expense Name</label>
          <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Groceries, Netflix, Uber..." className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" maxLength={100} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2"><span className="text-base">{selectedCategoryEmoji}</span> Category</label>
            <div className="relative">
              <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer">
                {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>)}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"><svg className="w-4 h-4 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
            </div>
          </div>
          <div>
            <label htmlFor="amount" className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2"><DollarSign className="w-4 h-4" /> Amount (€)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim text-sm">€</span>
              <input id="amount" type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-bg border border-border rounded-xl pl-8 pr-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="frequency" className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2"><Repeat className="w-4 h-4" /> Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {FREQUENCIES.map(freq => (
                <button key={freq.value} type="button" onClick={() => setFrequency(freq.value)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium border transition-all ${frequency === freq.value ? 'bg-primary/15 border-primary text-primary' : 'bg-bg border-border text-text-muted hover:border-border-light hover:text-text'}`}>
                  {freq.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="date" className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2"><Calendar className="w-4 h-4" /> Date</label>
            <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-xl transition-all text-base">
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Adding...</> : <><PlusCircle className="w-5 h-5" /> Add Expense</>}
        </button>
      </form>

      {/* Recent Expenses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Expenses</h2>
          <span className="text-sm text-text-dim">{recentExpenses.length} shown</span>
        </div>

        {loadingExpenses ? (
          <div className="glass-card rounded-2xl p-8 text-center"><div className="text-text-muted animate-pulse">Loading...</div></div>
        ) : recentExpenses.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">💸</div>
            <p className="text-text-muted text-sm">No expenses yet. Add your first one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentExpenses.map(expense => {
              const catEmoji = CATEGORIES.find(c => c.value === expense.category)?.emoji ?? '📦'
              return (
                <div key={expense.id} className="glass-card rounded-xl p-4 flex items-center justify-between group hover:border-border-light transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center text-lg shrink-0">{catEmoji}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-text truncate">{expense.name}</p>
                      <div className="flex items-center gap-2 text-xs text-text-dim mt-0.5">
                        <span className="capitalize">{expense.category}</span><span>•</span>
                        <span className="capitalize">{expense.frequency}</span><span>•</span>
                        <span>{new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="font-semibold text-danger">€{expense.amount.toFixed(2)}</span>
                    <button onClick={() => handleDelete(expense.id)} className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-text-dim hover:text-danger hover:bg-danger/10 transition-all" title="Delete">
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
