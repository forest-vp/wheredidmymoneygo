'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TrendingDown, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }
    localStorage.setItem('wdmg_demo', 'true')
    router.push('/dashboard')
  }

  const handleDemoLogin = () => {
    localStorage.setItem('wdmg_demo', 'true')
    router.push('/dashboard')
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
          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-text-muted">Start tracking your money for free</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-danger text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl pl-11 pr-4 py-3 text-text placeholder-text-dim focus:outline-none focus:border-primary transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl pl-11 pr-11 py-3 text-text placeholder-text-dim focus:outline-none focus:border-primary transition-colors"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl pl-11 pr-4 py-3 text-text placeholder-text-dim focus:outline-none focus:border-primary transition-colors"
                  placeholder="Repeat password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Create Account
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-dim text-sm">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={handleDemoLogin}
            className="w-full bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            🚀 Try Demo — No Account Needed
          </button>

          <p className="text-center text-text-muted text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary-hover font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
