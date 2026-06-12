'use client'

import { useState, useRef, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { TrendingDown, Mail, Shield, ArrowRight, Loader2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sent'>('idle')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = useCallback((index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)
    if (!digit && value !== '') return

    setCode(prev => {
      const next = [...prev]
      next[index] = digit
      return next
    })

    // Clear error when user types
    if (status === 'error') {
      setStatus('idle')
      setErrorMsg('')
    }

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }, [status])

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      setCode(prev => {
        const next = [...prev]
        next[index - 1] = ''
        return next
      })
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }, [code])

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const next = [...code]
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || ''
    }
    setCode(next)

    // Focus the last filled input or the next empty one
    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()

    // Clear error
    if (status === 'error') {
      setStatus('idle')
      setErrorMsg('')
    }
  }, [code, status])

  const handleSubmit = useCallback(async () => {
    const token = code.join('')
    if (token.length !== 6 || !email) return

    setStatus('submitting')
    setErrorMsg('')

    const supabase = getSupabase()
    if (!supabase) {
      setStatus('error')
      setErrorMsg('Unable to connect. Please try again.')
      return
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    })

    if (error) {
      setStatus('error')
      setErrorMsg('Invalid or expired code')
      return
    }

    setStatus('success')
    setTimeout(() => router.push('/onboarding'), 1500)
  }, [code, email, router])

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (code.every(d => d !== '') && status === 'idle') {
      handleSubmit()
    }
  }, [code, status, handleSubmit])

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return
    const supabase = getSupabase()
    if (!supabase) return

    await supabase.auth.resend({ type: 'signup', email })
    setResendStatus('sent')
    setResendCooldown(60)
    setTimeout(() => setResendStatus('idle'), 3000)
  }

  // Format email for display (mask part of it)
  const maskedEmail = email.replace(/(.{2})(.*)(@.+)/, (_, start, middle, end) =>
    start + '*'.repeat(middle.length) + end
  )

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Logo / Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-bg" />
          </div>
          <span className="text-2xl font-bold text-text">WDMG</span>
        </Link>
      </div>

      <div className="glass-card rounded-2xl p-8">
        {/* Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            {status === 'success' ? (
              <span className="text-3xl">✅</span>
            ) : status === 'submitting' ? (
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Mail className="w-8 h-8 text-primary" />
            )}
          </div>

          {status === 'success' ? (
            <>
              <h1 className="text-2xl font-bold text-text mb-2">Email Verified!</h1>
              <p className="text-text-muted">Redirecting you to onboarding...</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
                <span className="text-accent text-sm font-medium">Setting up your account</span>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-text mb-2">Check your email</h1>
              <p className="text-text-muted text-sm">
                We sent a 6-digit code to
              </p>
              <p className="text-primary font-medium text-sm mt-1">{maskedEmail}</p>
            </>
          )}
        </div>

        {/* Code Input */}
        {status !== 'success' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-muted mb-3 text-center">
              Enter verification code
            </label>
            <div className="flex gap-2 justify-center">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={status === 'submitting'}
                  className={`
                    w-12 h-14 text-center text-xl font-bold rounded-xl border-2
                    bg-bg/50 text-text placeholder-text-dim
                    focus:outline-none transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${status === 'error'
                      ? 'border-danger/50 focus:border-danger animate-[shake_0.3s_ease-in-out]'
                      : digit
                        ? 'border-primary/50 focus:border-primary'
                        : 'border-border focus:border-primary'
                    }
                  `}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {/* Error Message */}
            {status === 'error' && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-danger" />
                <p className="text-danger text-sm font-medium">{errorMsg}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {status !== 'success' && (
          <div className="text-center space-y-4">
            {/* Resend Code */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-text-dim text-sm">Didn&apos;t receive the code?</span>
              {resendStatus === 'sent' ? (
                <span className="text-accent text-sm font-medium">✓ Code sent!</span>
              ) : resendCooldown > 0 ? (
                <span className="text-text-dim text-sm">Resend in {resendCooldown}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-primary hover:text-primary-hover text-sm font-medium transition-colors"
                >
                  Resend code
                </button>
              )}
            </div>

            {/* Back to Login */}
            <div>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                Back to login
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Trust badge */}
      <p className="text-center text-text-dim text-xs mt-6">
        🔒 Your data is encrypted and secure
      </p>
    </div>
  )
}

export default function AuthVerifyPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.02] rounded-full blur-3xl" />
      </div>

      <Suspense fallback={
        <div className="w-full max-w-md relative z-10">
          <div className="glass-card rounded-2xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-text-muted text-sm">Loading...</p>
            </div>
          </div>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  )
}
