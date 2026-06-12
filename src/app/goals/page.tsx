'use client'

import { useState, useEffect } from 'react'
import { Target, Plus, TrendingUp, Calendar, CheckCircle, AlertCircle, X, ArrowLeft } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'

interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string
  created_at: string
}

function getMonthsRemaining(deadline: string): number {
  const now = new Date()
  const end = new Date(deadline)
  return Math.max((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44), 0.1)
}

function getProgress(current: number, target: number): number {
  return Math.min((current / target) * 100, 100)
}

function getRequiredMonthly(target: number, current: number, deadline: string): number {
  return Math.max((target - current) / getMonthsRemaining(deadline), 0)
}

function getDeadlineLabel(deadline: string): string {
  const end = new Date(deadline)
  const now = new Date()
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'Past deadline'
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return '1 day left'
  if (diffDays < 30) return `${diffDays} days left`
  const months = Math.floor(diffDays / 30)
  return `${months} month${months > 1 ? 's' : ''} left`
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchGoals() }, [])

  async function fetchGoals() {
    setLoading(true)
    setError('')
    const supabase = getSupabase()
    if (!supabase) { setError('Not connected'); setLoading(false); return }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not logged in'); setLoading(false); return }
      const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (data) setGoals(data)
    } catch (err) {
      setError('Failed to load goals')
    }
    setLoading(false)
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !targetAmount || !deadline) return
    setSaving(true)
    setError('')

    const supabase = getSupabase()
    if (!supabase) { setError('Not connected'); setSaving(false); return }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not logged in'); setSaving(false); return }

      const { data, error } = await supabase
        .from('goals')
        .insert({ user_id: user.id, name, target_amount: parseFloat(targetAmount), current_amount: 0, deadline })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setGoals(prev => [data, ...prev])
        setName(''); setTargetAmount(''); setDeadline(''); setShowForm(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal')
    }
    setSaving(false)
  }

  async function handleDeposit(goalId: string) {
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) return
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const newAmount = goal.current_amount + amount

    const supabase = getSupabase()
    if (!supabase) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('goals').update({ current_amount: newAmount }).eq('id', goalId).eq('user_id', user.id)
      if (!error) {
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: newAmount } : g))
        setDepositGoalId(null); setDepositAmount('')
      }
    } catch { /* ignore */ }
  }

  async function handleDeleteGoal(goalId: string) {
    const supabase = getSupabase()
    if (!supabase) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('goals').delete().eq('id', goalId).eq('user_id', user.id)
      setGoals(prev => prev.filter(g => g.id !== goalId))
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-text-muted animate-pulse">Loading your goals...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-1">Goals</h1>
          <p className="text-text-muted">Track your savings targets</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-danger text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create New Goal</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center hover:bg-bg-card-hover transition-colors">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1.5">Goal Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Emergency Fund" required
                  className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1.5">Target Amount (€)</label>
                <input type="number" step="0.01" min="0" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="1000" required
                  className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1.5">Deadline</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required
                  className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors" style={{ colorScheme: 'dark' }} />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                {saving ? 'Creating...' : 'Create Goal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Target className="w-12 h-12 text-text-dim mx-auto mb-3" />
          <p className="text-text-muted mb-4">No goals yet. Create your first savings goal!</p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all">
            <Plus className="w-4 h-4" /> Create Goal
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map(goal => {
            const progress = getProgress(goal.current_amount, goal.target_amount)
            const required = getRequiredMonthly(goal.target_amount, goal.current_amount, goal.deadline)
            const deadlineLabel = getDeadlineLabel(goal.deadline)
            const isOnTrack = progress >= 50

            return (
              <div key={goal.id} className="glass-card rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{goal.name}</h3>
                    <p className="text-sm text-text-muted">€{goal.current_amount.toFixed(2)} of €{goal.target_amount.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${isOnTrack ? 'bg-accent/20 text-accent' : 'bg-warning/20 text-warning'}`}>
                      {deadlineLabel}
                    </span>
                    <button onClick={() => handleDeleteGoal(goal.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-dim hover:text-danger hover:bg-danger/10 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="h-3 bg-bg rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full transition-all duration-500 ${isOnTrack ? 'bg-gradient-to-r from-primary to-accent' : 'bg-warning'}`} style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-dim">{progress.toFixed(0)}% complete</span>
                  <span className="text-text-dim">€{required.toFixed(0)}/month needed</span>
                </div>
                {depositGoalId === goal.id ? (
                  <div className="flex gap-2 mt-4">
                    <input type="number" step="0.01" min="0" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="Amount"
                      className="flex-1 bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-accent transition-colors" />
                    <button onClick={() => handleDeposit(goal.id)} className="bg-accent hover:bg-accent-hover text-bg px-4 py-2 rounded-xl text-sm font-medium transition-all">Add</button>
                    <button onClick={() => { setDepositGoalId(null); setDepositAmount('') }} className="border border-border text-text-muted px-3 py-2 rounded-xl text-sm transition-all hover:text-text">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setDepositGoalId(goal.id)} className="mt-3 text-sm text-accent hover:text-accent-hover font-medium transition-colors">
                    + Add Savings
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
