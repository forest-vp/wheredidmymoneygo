'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TrendingDown, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, User, Calendar, Globe } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [fullStep, setFullStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [country, setCountry] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleNext = () => {
    setError('')
    if (fullStep === 1) {
      if (!fullName.trim()) { setError('Please enter your full name'); return }
      if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email'); return }
      setFullStep(2)
    } else if (fullStep === 2) {
      if (!birthDate) { setError('Please enter your birth date'); return }
      if (!country) { setError('Please select your country'); return }
      setFullStep(3)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    const supabase = getSupabase()
    if (!supabase) { setError('Unable to connect. Please try again.'); setLoading(false); return }

    // Create user via client-side signUp (auto-creates session)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (signUpError) {
      if (signUpError.message.includes('rate limit') || signUpError.message.includes('Too many')) {
        setError('Too many signup attempts. Please wait 15 minutes and try again.')
      } else if (signUpError.message.includes('already registered')) {
        setError('This email is already registered. Try signing in instead.')
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    // Ensure session is set by signing in explicitly
    // This fixes issues where Vercel Edge doesn't persist the session from signUp
    try {
      await supabase.auth.signInWithPassword({ email, password })
    } catch {
      // If sign-in fails, the session from signUp might still work
    }

    // Save email for display
    localStorage.setItem('wdmg_user_email', email)

    // Update profile with extra info
    if (data?.user) {
      try {
        await supabase.from('profiles').update({
          full_name: fullName,
          birth_date: birthDate,
          country,
        }).eq('id', data.user.id)
      } catch { /* non-blocking */ }
    }

    // Send verification email via admin API (no rate limits)
    try {
      await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'signup' }),
      })
    } catch { /* non-blocking */ }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4 sm:px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-md relative z-10 text-center">
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-text-muted text-sm mb-2">We sent a verification link to</p>
            <p className="text-primary font-medium mb-4 break-all">{email}</p>
            <p className="text-text-dim text-sm mb-6">Click the link to verify your account. You can also skip and start using the app now.</p>
            <div className="flex gap-3">
              <button onClick={() => router.push('/onboarding')}
                className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                Start Onboarding <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-text-dim text-xs mt-4">You can verify your email later from settings.</p>
          </div>
        </div>
      </div>
    )
  }

  const COUNTRIES = ['Albania','Argentina','Australia','Austria','Belgium','Brazil','Bulgaria','Canada','Croatia','Cyprus','Czech Republic','Denmark','Egypt','Estonia','Finland','France','Germany','Greece','Hungary','India','Indonesia','Ireland','Italy','Japan','Latvia','Lithuania','Luxembourg','Malta','Mexico','Netherlands','Norway','Poland','Portugal','Romania','Serbia','Singapore','Slovakia','Slovenia','South Africa','South Korea','Spain','Sweden','Switzerland','Thailand','Turkey','Ukraine','United Arab Emirates','United Kingdom','United States','Vietnam'].sort()

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"><TrendingDown className="w-6 h-6 text-bg" /></div>
            <span className="text-2xl font-bold">WDMG</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-text-muted text-sm">{fullStep === 3 ? 'Set your password' : `Step ${fullStep} of 3`}</p>
          <div className="flex gap-2 justify-center mt-4">
            {[1,2,3].map(s => <div key={s} className={`h-2 rounded-full transition-all ${s <= fullStep ? 'w-8 bg-primary' : 'w-2 bg-border'}`} />)}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8">
          {error && <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-danger text-sm mb-5">{error}</div>}

          {fullStep === 1 && (
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim" />
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-bg border border-border rounded-xl pl-11 pr-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors" placeholder="John Doe" required autoFocus />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-bg border border-border rounded-xl pl-11 pr-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors" placeholder="you@example.com" required />
                </div>
              </div>
              <button type="button" onClick={handleNext} className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {fullStep === 2 && (
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Birth Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim pointer-events-none" />
                  <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} max={new Date().toISOString().split('T')[0]} min="1920-01-01" className="w-full bg-bg border border-border rounded-xl pl-12 pr-4 py-3 text-text focus:outline-none focus:border-primary transition-colors text-base" style={{ colorScheme: 'dark' }} required autoFocus />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Country</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim pointer-events-none" />
                  <select value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-bg border border-border rounded-xl pl-12 pr-10 py-3 text-text appearance-none focus:outline-none focus:border-primary transition-colors cursor-pointer text-base" required>
                    <option value="">Select your country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><svg className="w-4 h-4 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setFullStep(1)} className="px-4 sm:px-6 border border-border text-text-muted hover:text-text py-3 rounded-xl font-medium transition-all text-sm sm:text-base">Back</button>
                <button type="button" onClick={handleNext} className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base">Continue <ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {fullStep === 3 && (
            <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Password (min 8 characters)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-bg border border-border rounded-xl pl-11 pr-11 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors" placeholder="Min 8 characters" required minLength={8} autoFocus />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim" />
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-bg border border-border rounded-xl pl-11 pr-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors" placeholder="Repeat password" required minLength={8} />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setFullStep(2)} disabled={loading} className="px-4 sm:px-6 border border-border text-text-muted hover:text-text py-3 rounded-xl font-medium transition-all disabled:opacity-50 text-sm sm:text-base">Back</button>
                <button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-text-dim text-center">By signing up, you agree to our Terms of Service and Privacy Policy.</p>
            </form>
          )}

          <p className="text-center text-text-muted text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary-hover font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
