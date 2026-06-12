'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

type VerifyState = 'idle' | 'verifying' | 'success' | 'error'

function VerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''
  const type = searchParams.get('type') || 'signup'

  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [state, setState] = useState<VerifyState>('idle')
  const [shake, setShake] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [devCode, setDevCode] = useState('')

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown(p => Math.max(0, p - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const updateCode = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    setCode(prev => {
      const next = [...prev]
      next[index] = value.slice(-1)
      return next
    })
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }, [])

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        setCode(prev => {
          const next = [...prev]
          next[index - 1] = ''
          return next
        })
        inputRefs.current[index - 1]?.focus()
      } else {
        setCode(prev => {
          const next = [...prev]
          next[index] = ''
          return next
        })
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus()
  }, [code])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      inputRefs.current[5]?.focus()
      // Auto-submit after paste
      setTimeout(() => verifyCode(pasted), 100)
    }
  }, [])

  const verifyCode = useCallback(async (fullCode: string) => {
    if (fullCode.length !== 6) return
    setState('verifying')
    setError('')

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode, type }),
      })
      const data = await res.json()

      if (data.success) {
        setState('success')
        setTimeout(() => router.push('/onboarding'), 1500)
      } else {
        throw new Error(data.error || 'Invalid code')
      }
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Invalid or expired code')
      setShake(true)
      setCode(Array(6).fill(''))
      setTimeout(() => { inputRefs.current[0]?.focus(); setShake(false) }, 600)
      setTimeout(() => setState('idle'), 2000)
    }
  }, [email, type, router])

  // Auto-submit when all 6 digits filled
  const fullCode = code.join('')
  useEffect(() => {
    if (fullCode.length === 6 && state === 'idle') {
      verifyCode(fullCode)
    }
  }, [fullCode, state, verifyCode])

  const handleResend = async () => {
    if (cooldown > 0) return
    setCooldown(60)
    try {
      await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type }),
      })
    } catch {
      // non-blocking
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 sm:px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md relative z-10 text-center">
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          {state === 'success' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
              <p className="text-text-muted text-sm">Redirecting to onboarding...</p>
            </>
          ) : (
            <>
              <Link href="/" className="inline-flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Mail className="w-6 h-6 text-bg" />
                </div>
                <span className="text-2xl font-bold">WDMG</span>
              </Link>

              <h1 className="text-xl sm:text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-text-muted text-sm mb-6">
                We sent a 6-digit code to <span className="text-primary font-medium">{email || 'your email'}</span>
              </p>

              {/* Dev helper */}
              {devCode && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 text-sm">
                  <span className="text-primary font-medium">Dev code: </span>
                  <span className="font-mono font-bold text-primary text-lg">{devCode}</span>
                </div>
              )}

              {/* Code input */}
              <div className={`flex justify-center gap-2 sm:gap-3 mb-4 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={e => updateCode(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className={`w-11 h-13 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-bg border rounded-xl text-text focus:outline-none focus:border-primary transition-colors ${
                      state === 'error' ? 'border-danger' : digit ? 'border-primary' : 'border-border'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-danger text-sm mb-4">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {state === 'verifying' && (
                <div className="flex items-center justify-center gap-2 text-text-muted text-sm mb-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </div>
              )}

              {/* Resend */}
              <div className="text-sm text-text-muted mb-6">
                Didn&apos;t receive a code?{' '}
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className={`font-medium transition-colors ${
                    cooldown > 0 ? 'text-text-dim cursor-not-allowed' : 'text-primary hover:text-primary-hover'
                  }`}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>

              <Link href="/login"
                className="inline-flex items-center gap-2 text-text-muted hover:text-text transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    }>
      <VerifyPage />
    </Suspense>
  )
}
