// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Target, Plus, TrendingUp, Calendar, CheckCircle, AlertCircle, X, ArrowLeft } from 'lucide-react'
import { getSupabase, hasSupabase } from '@/lib/supabase'
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

const MOCK_GOALS: Goal[] = [
  { id: '1', user_id: 'demo-user', name: 'New iPhone', target_amount: 1200, current_amount: 350, deadline: '2025-12-31', created_at: '2025-01-01' },
  { id: '2', user_id: 'demo-user', name: 'Vacation', target_amount: 2000, current_amount: 800, deadline: '2025-08-31', created_at: '2025-01-01' },
]

function getMonthsRemaining(deadline: string): number {
  const now = new Date()
  const end = new Date(deadline)
  const diffMs = end.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return Math.max(diffDays / 30.44, 0.1)
}

function getProgress(current: number, target: number): number {
  return Math.min((current / target) * 100, 100)
}

function getRequiredMonthly(target: number, current: number, deadline: string): number {
  const months = getMonthsRemaining(deadline)
  return Math.max((target - current) / months, 0)
}

function getDeadlineLabel(deadline: string): string {
  const end = new Date(deadline)
  const now = new Date()
  const diffMs = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'Past deadline'
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return '1 day left'
  if (diffDays < 30) return `${diffDays} days left`
  const months = Math.floor(diffDays / 30)
  const remainingDays = diffDays % 30
  if (remainingDays === 0) return `${months} month${months > 1 ? 's' : ''} left`
  return `${months}m ${remainingDays}d left`
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchGoals()
  }, [])

  async function fetchGoals() {
    if (!hasSupabase()) {
      // Load mock + localStorage goals
      const stored = localStorage.getItem('wdmg_goals')
      const localGoals: Goal[] = stored ? JSON.parse(stored) : []
      setGoals([...MOCK_GOALS, ...localGoals])
      setLoading(false)
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setGoals(data)
    setLoading(false)
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !targetAmount || !deadline) return

    setSaving(true)

    if (!hasSupabase()) {
      // Save to localStorage
      const stored = localStorage.getItem('wdmg_goals')
      const localGoals: Goal[] = stored ? JSON.parse(stored) : []
      const newGoal: Goal = {
        id: Date.now().toString(),
        user_id: 'demo-user',
        name,
        target_amount: parseFloat(targetAmount),
        current_amount: 0,
        deadline,
        created_at: new Date().toISOString(),
      }
      localGoals.unshift(newGoal)
      localStorage.setItem('wdmg_goals', JSON.stringify(localGoals))
      setGoals((prev) => [newGoal, ...prev])
      setName('')
      setTargetAmount('')
      setDeadline('')
      setShowForm(false)
      setSaving(false)
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      setSaving(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        name,
        target_amount: parseFloat(targetAmount),
        current_amount: 0,
        deadline,
      })
      .select()
      .single()

    if (!error && data) {
      setGoals((prev) => [data, ...prev])
      setName('')
      setTargetAmount('')
      setDeadline('')
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleDeposit(goalId: string) {
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) return

    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return

    const newAmount = goal.current_amount + amount

    if (!hasSupabase()) {
      // Update localStorage
      const stored = localStorage.getItem('wdmg_goals')
      const localGoals: Goal[] = stored ? JSON.parse(stored) : []
      const updated = localGoals.map((g) => g.id === goalId ? { ...g, current_amount: newAmount } : g)
      localStorage.setItem('wdmg_goals', JSON.stringify(updated))
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, current_amount: newAmount } : g))
      )
      setDepositGoalId(null)
      setDepositAmount('')
      return
    }

    const supabase = getSupabase()
    if (!supabase) return

    const { error } = await supabase
      .from('goals')
      .update({ current_amount: newAmount })
      .eq('id', goalId)

    if (!error) {
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, current_amount: newAmount } : g))
      )
    }
    setDepositGoalId(null)
    setDepositAmount('')
  }

  async function handleDeleteGoal(goalId: string) {
    if (!hasSupabase()) {
      // Delete from localStorage
      const stored = localStorage.getItem('wdmg_goals')
      const localGoals: Goal[] = stored ? JSON.parse(stored) : []
      const filtered = localGoals.filter((g) => g.id !== goalId)
      localStorage.setItem('wdmg_goals', JSON.stringify(filtered))
      setGoals((prev) => prev.filter((g) => g.id !== goalId))
      return
    }

    const supabase = getSupabase()
    if (!supabase) return

    const { error } = await supabase.from('goals').delete().eq('id', goalId)
    if (!error) {
      setGoals((prev) => prev.filter((g) => g.id !== goalId))
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-1">Goals</h1>
          <p className="text-text-muted">Track your savings targets</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Create Goal Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create New Goal</h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center hover:bg-bg-card-hover transition-colors"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1.5">Goal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emergency Fund"
                  required
                  className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1.5">
                  Target Amount (€)
                </label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="5000"
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1.5">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-xl font-medium transition-all"
              >
                {saving ? 'Creating...' : 'Create Goal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Target className="w-16 h-16 text-text-dim mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No goals yet</h2>
          <p className="text-text-muted mb-6">
            Set a savings target and start tracking your progress.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = getProgress(goal.current_amount, goal.target_amount)
            const requiredMonthly = getRequiredMonthly(
              goal.target_amount,
              goal.current_amount,
              goal.deadline
            )
            const monthsLeft = getMonthsRemaining(goal.deadline)
            const deadlineLabel = getDeadlineLabel(goal.deadline)
            const isComplete = goal.current_amount >= goal.target_amount
            const isPastDeadline = new Date(goal.deadline) < new Date() && !isComplete
            const remaining = Math.max(goal.target_amount - goal.current_amount, 0)

            const createdAt = new Date(goal.created_at)
            const now = new Date()
            const monthsSinceCreation = Math.max(
              (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
              0.1
            )
            const actualMonthlyRate = goal.current_amount / monthsSinceCreation
            const isOnTrack = isComplete || actualMonthlyRate >= requiredMonthly * 0.9

            return (
              <div key={goal.id} className="glass-card rounded-2xl p-6">
                {/* Goal Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isComplete
                          ? 'bg-accent/10'
                          : isPastDeadline
                          ? 'bg-danger/10'
                          : 'bg-primary/10'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle className="w-5 h-5 text-accent" />
                      ) : isPastDeadline ? (
                        <AlertCircle className="w-5 h-5 text-danger" />
                      ) : (
                        <Target className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{goal.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {deadlineLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-text-dim hover:text-danger text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-text-muted">
                      €{goal.current_amount.toLocaleString()} of{' '}
                      €{goal.target_amount.toLocaleString()}
                    </span>
                    <span
                      className={`font-medium ${
                        isComplete
                          ? 'text-accent'
                          : isPastDeadline
                          ? 'text-danger'
                          : 'text-primary'
                      }`}
                    >
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-3 bg-bg rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete
                          ? 'bg-gradient-to-r from-accent to-accent'
                          : isPastDeadline
                          ? 'bg-gradient-to-r from-danger to-danger'
                          : 'bg-gradient-to-r from-primary to-accent'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <div className="bg-bg rounded-xl p-3">
                    <p className="text-xs text-text-dim mb-1">Remaining</p>
                    <p className="font-semibold text-sm">
                      €{remaining.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-bg rounded-xl p-3">
                    <p className="text-xs text-text-dim mb-1">
                      {isComplete ? 'Completed!' : 'Required / month'}
                    </p>
                    <p className="font-semibold text-sm">
                      €{requiredMonthly.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-bg rounded-xl p-3 col-span-2 md:col-span-1">
                    <p className="text-xs text-text-dim mb-1">Status</p>
                    <div className="flex items-center gap-1.5">
                      {isComplete ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-accent" />
                          <span className="font-semibold text-sm text-accent">
                            Complete!
                          </span>
                        </>
                      ) : isOnTrack ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-accent" />
                          <span className="font-semibold text-sm text-accent">
                            On Track
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-danger" />
                          <span className="font-semibold text-sm text-danger">
                            Behind
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Deposit Section */}
                {!isComplete && (
                  <div className="border-t border-border pt-4">
                    {depositGoalId === goal.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="Amount"
                          min="0.01"
                          step="0.01"
                          className="flex-1 bg-bg border border-border rounded-xl px-4 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
                        />
                        <button
                          onClick={() => handleDeposit(goal.id)}
                          className="bg-accent hover:bg-accent-hover text-bg px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setDepositGoalId(null)
                            setDepositAmount('')
                          }}
                          className="bg-bg hover:bg-bg-card-hover text-text-muted px-3 py-2 rounded-xl text-sm transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDepositGoalId(goal.id)}
                        className="flex items-center gap-2 text-primary hover:text-primary-hover text-sm font-medium transition-colors"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Add Savings
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
