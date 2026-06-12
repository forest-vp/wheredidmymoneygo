'use client'

import { Suspense, useRef, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Mail, ArrowLeft, Loader2, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type VerificationState = 'idle' | 'verifying' | 'success' | 'error'

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''
  const type = searchParams.get('type') || 'signup'

  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [state, setState] = useState<VerificationState>('idle')
  const [shake, setShake] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendSent, setResendSent] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  // Initialize supabase client on mount
  getSupabase()

  // Focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Shake animation reset
  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 600)
      return () => clearTimeout(timer)
    }
  }, [shake])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [resendCooldown])

  const triggerShake = useCallback(() => {
    setShake(true)
  }, [])

  const updateCodeAtIndex = useCallback((index: number, value: string) => {
    setCode((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }, [])

  const handleVerify = useCallback(
    async (fullCode: string) => {
      if (fullCode.length !== 6 || !email) return

      setState('verifying')

      try {
        const res = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: fullCode, type }),
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setState('success')
          // Redirect after success animation
          await new Promise((r) => setTimeout(r, 1200))
          if (type === 'signup') {
            router.push('/onboarding')
          } else {
            router.push('/dashboard')
          }
        } else {
          setState('error')
          triggerShake()
          setCode(Array(6).fill(''))
          // Focus first input after error
          setTimeout(() => inputRefs.current[0]?.focus(), 100)
          // Reset error state after shake
          setTimeout(() => setState('idle'), 2000)
        }
      } catch {
        setState('error')
        triggerShake()
        setCode(Array(6).fill(''))
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
        setTimeout(() => setState('idle'), 2000)
      }
    },
    [email, type, router, triggerShake]
  )

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (code.every((d) => d !== '') && state === 'idle') {
      handleVerify(code.join(''))
    }
  }, [code, state, handleVerify])

  const handleInputChange = (index: number, value: string) => {
    if (state === 'verifying' || state === 'success') return

    // Only allow digits
    const digit = value.replace(/\D/g, '')
    if (!digit && value !== '') return

    updateCodeAtIndex(index, digit.slice(-1))

    // Auto-focus next box if digit entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (state === 'verifying' || state === 'success') {
      e.preventDefault()
      return
    }

    if (e.key === 'Backspace') {
      e.preventDefault()
      if (code[index]) {
        // Clear current box
        updateCodeAtIndex(index, '')
      } else if (index > 0) {
        // Move to previous and clear it
        updateCodeAtIndex(index - 1, '')
        inputRefs.current[index - 1]?.focus()
      }
      return
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
      return
    }

    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
      return
    }

    if (e.key === 'Enter') {
      const fullCode = code.join('')
      if (fullCode.length === 6) {
        handleVerify(fullCode)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (state === 'verifying' || state === 'success') {
      e.preventDefault()
      return
    }

    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 0) return

    e.preventDefault()

    const newCode = Array(6).fill('')
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i]
    }
    setCode(newCode)

    // Focus last filled box or next empty
    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()

    // Auto-submit if all 6 pasted
    if (pasted.length === 6) {
      handleVerify(pasted)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading || !email) return

    setResendLoading(true)
    try {
      await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type }),
      })
      setResendSent(true)
      setResendCooldown(60)
      setTimeout(() => setResendSent(false), 3000)
    } catch {
      // silently fail
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="glass-card rounded-2xl p-8 md:p-10 shadow-2xl shadow-black/20">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                state === 'success'
                  ? 'bg-accent/20 shadow-lg shadow-accent/20'
                  : state === 'error'
                    ? 'bg-danger/20 shadow-lg shadow-danger/20'
                    : 'bg-primary/20 shadow-lg shadow-primary/20'
              }`}
            >
              {state === 'success' ? (
                <Check className="w-8 h-8 text-accent" strokeWidth={2.5} />
              ) : state === 'error' ? (
                <AlertCircle className="w-8 h-8 text-danger" strokeWidth={2.5} />
              ) : (
                <Mail className="w-8 h-8 text-primary" strokeWidth={1.5} />
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-text text-center mb-2">
            {state === 'success' ? 'Email Verified!' : 'Check your email'}
          </h1>

          {/* Subtitle */}
          <p className="text-text-muted text-center mb-2">
            {state === 'success'
              ? 'Redirecting you...'
              : "We've sent a 6-digit code to"}
          </p>

          {/* Email display */}
          {state !== 'success' && email && (
            <p className="text-primary font-semibold text-center mb-8 truncate">
              {email}
            </p>
          )}

          {state === 'success' && (
            <div className="flex justify-center mb-8">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
          )}

          {/* Code input boxes */}
          {state !== 'success' && (
            <>
              <div
                className={`flex gap-2 md:gap-3 justify-center mb-6 ${
                  shake ? 'animate-[shake_0.5s_ease-in-out]' : ''
                }`}
              >
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={state === 'verifying'}
                    className={`w-11 h-14 md:w-12 md:h-15 text-center text-xl md:text-2xl font-bold rounded-xl border-2 outline-none
                      transition-all duration-200 cursor-text
                      ${
                        state === 'error'
                          ? 'border-danger/60 bg-danger/10 text-danger'
                          : digit
                            ? 'border-primary/60 bg-primary/10 text-primary'
                            : 'border-border bg-bg-card text-text focus:border-primary/60 focus:bg-primary/5 focus:shadow-lg focus:shadow-primary/10'
                      }
                      ${state === 'verifying' ? 'opacity-60 cursor-not-allowed' : ''}
                    `}
                    style={{ caretColor: '#4F8CFF' }}
                  />
                ))}
              </div>

              {/* Error message */}
              {state === 'error' && (
                <p className="text-danger text-sm text-center mb-4 font-medium animate-[fadeIn_0.3s_ease-in-out]">
                  Invalid or expired code
                </p>
              )}

              {/* Resend section */}
              <div className="text-center mb-8">
                <p className="text-text-dim text-sm mb-3">
                  Didn&apos;t receive the code?
                </p>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resendLoading || resendSent}
                  className={`text-sm font-semibold px-5 py-2.5 rounded-lg transition-all duration-200
                    ${resendCooldown > 0 || resendSent
                      ? 'bg-accent/10 text-accent cursor-default'
                      : 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer'
                    }
                    ${resendLoading ? 'opacity-60 cursor-wait' : ''}
                  `}
                >
                  {resendSent
                    ? '✓ Code sent!'
                    : resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : resendLoading
                        ? 'Sending...'
                        : 'Resend code'}
                </button>
              </div>

              {/* Back to login */}
              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-text-muted hover:text-text transition-colors text-sm group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer hint */}
        {state === 'idle' && (
          <p className="text-text-dim text-xs text-center mt-6">
            The code will expire in 10 minutes
          </p>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-text-muted text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}
