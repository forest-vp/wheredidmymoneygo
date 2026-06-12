'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { TrendingDown, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { getSupabase, hasSupabase } from '@/lib/supabase'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get('registered') === 'true'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!hasSupabase()) {
      setError('Supabase is not configured yet.')
      setLoading(false)
      return
    }

    const supabase = getSupabase()
    if (!supabase) { setError('Unable to connect. Please try again.'); setLoading(false); return }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message === 'Invalid login credentials' ? 'Invalid email or password.' : authError.message)
      setLoading(false)
      return
    }

    // Check if onboarding is complete
    // Note: Email is auto-confirmed via admin API, so no need to check email_verified
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_complete) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-bg" />
            </div>
            <span className="text-2xl font-bold">WDMG</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-text-muted">Sign in to your account</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {justRegistered && (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-accent text-sm mb-5 flex items-center gap-2">
              ✅ Account created successfully! Sign in to continue.
            </div>
          )}

          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-danger text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl pl-11 pr-4 py-3 text-text placeholder-text-dim focus:outline-none focus:border-primary transition-colors"
                  placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl pl-11 pr-11 py-3 text-text placeholder-text-dim focus:outline-none focus:border-primary transition-colors"
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:text-primary-hover font-medium">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text-muted animate-pulse">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
