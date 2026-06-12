'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Shield, Users, Crown, Star, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  plan_type: 'free' | 'pro' | 'premium'
  onboarding_complete: boolean
  created_at: string
  country: string | null
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [secret, setSecret] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('wdmg_admin')
    if (saved === 'true') {
      setAuthenticated(true)
      fetchUsers()
    }
  }, [])

  const handleLogin = () => {
    if (secret === 'wdmg2025') {
      setAuthenticated(true)
      localStorage.setItem('wdmg_admin', 'true')
      fetchUsers()
    } else {
      setMessage('Wrong secret code')
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    const supabase = getSupabase()
    if (!supabase) { setLoading(false); return }
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, plan_type, onboarding_complete, created_at, country')
        .order('created_at', { ascending: false })
      if (profiles) setUsers(profiles as UserProfile[])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const changePlan = async (userId: string, newPlan: 'free' | 'pro' | 'premium') => {
    setUpdating(userId)
    const supabase = getSupabase()
    if (!supabase) return
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan_type: newPlan, is_premium: newPlan === 'premium' })
        .eq('id', userId)
      if (!error) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan_type: newPlan, is_premium: newPlan === 'premium' } : u))
        setMessage(`Plan updated to ${newPlan}`)
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (err) {
      console.error(err)
    }
    setUpdating(null)
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-sm relative z-10">
          <div className="glass-card rounded-2xl p-8 text-center">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
            <p className="text-text-muted text-sm mb-6">Enter the secret code to access</p>
            {message && <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-danger text-sm mb-4">{message}</div>}
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Secret code"
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text text-center text-lg tracking-widest focus:outline-none focus:border-primary transition-colors mb-4"
              autoFocus
            />
            <button onClick={handleLogin} className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-medium transition-all">
              Unlock
            </button>
            <Link href="/dashboard" className="block mt-4 text-text-muted hover:text-text text-sm transition-colors">
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" /> Admin Panel
            </h1>
            <p className="text-text-muted">Manage user plans and subscriptions</p>
          </div>
          <button onClick={() => { setAuthenticated(false); localStorage.removeItem('wdmg_admin') }} className="text-text-muted hover:text-danger text-sm transition-colors">
            Lock
          </button>
        </div>

        {message && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-accent text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {message}
          </div>
        )}

        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-medium">{users.length} users registered</span>
          </div>

          {loading ? (
            <div className="text-center py-8"><Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" /></div>
          ) : users.length === 0 ? (
            <p className="text-text-muted text-center py-8">No users yet</p>
          ) : (
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="bg-bg rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text truncate">{user.full_name || 'No name'}</p>
                    <p className="text-xs text-text-dim truncate">{user.email}</p>
                    <p className="text-xs text-text-dim mt-1">
                      Joined {new Date(user.created_at).toLocaleDateString('en-GB')} • {user.country || 'No country'}
                      {user.onboarding_complete && <span className="text-accent ml-2">✓ Onboarded</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(['free', 'pro', 'premium'] as const).map(plan => (
                      <button
                        key={plan}
                        onClick={() => changePlan(user.id, plan)}
                        disabled={updating === user.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          user.plan_type === plan
                            ? plan === 'premium' ? 'bg-accent text-bg' : plan === 'pro' ? 'bg-primary text-white' : 'bg-border text-text'
                            : 'bg-bg border border-border text-text-muted hover:border-border-light hover:text-text'
                        }`}
                      >
                        {plan === 'premium' && <Crown className="w-3 h-3 inline mr-1" />}
                        {plan === 'pro' && <Star className="w-3 h-3 inline mr-1" />}
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h3 className="font-medium mb-2">Quick Actions</h3>
          <p className="text-text-muted text-sm">
            To give someone Premium for free, click the <span className="text-accent font-medium">premium</span> button next to their name.
            They get instant access to all Premium features. No payment needed.
          </p>
        </div>
      </div>
    </div>
  )
}
