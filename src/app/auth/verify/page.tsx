'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'checking' | 'processing' | 'success' | 'error'>('checking')
  const [message, setMessage] = useState('Checking verification status...')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) {
          setStatus('error')
          setMessage('Unable to connect. Please try again.')
          return
        }

        const code = searchParams.get('code')
        const email = searchParams.get('email')
        const error = searchParams.get('error')

        if (email) setUserEmail(decodeURIComponent(email))

        if (error) {
          setStatus('error')
          setMessage(decodeURIComponent(error))
          return
        }

        if (code) {
          setStatus('processing')
          setMessage('Verifying your email...')

          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('Exchange error:', exchangeError)
            setStatus('error')
            setMessage('This link has expired or is invalid. Please sign in and request a new one.')
            return
          }

          setStatus('success')
          setMessage('Email verified! Redirecting to onboarding...')
          setTimeout(() => router.push('/onboarding'), 2000)
          return
        }

        // No code — check if we already have a session (hash fragment flow)
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          setStatus('success')
          setMessage('Email verified! Redirecting to onboarding...')
          setTimeout(() => router.push('/onboarding'), 2000)
          return
        }

        if (email) {
          setStatus('checking')
          setMessage(`We sent a confirmation link to ${email}. Click the link to verify your account.`)
        } else {
          setStatus('error')
          setMessage('No verification code found. Please sign in and try again.')
        }
      } catch (err) {
        console.error('Verify error:', err)
        setStatus('error')
        setMessage('Something went wrong. Please try signing in again.')
      }
    }

    verifyEmail()
  }, [router, searchParams])

  const handleResend = async () => {
    if (!userEmail) return
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.auth.signInWithOtp({ email: userEmail })
    setMessage(`A new confirmation link has been sent to ${userEmail}.`)
  }

  return (
    <div className="w-full max-w-md relative z-10 text-center">
      <div className="glass-card rounded-2xl p-8">
        {status === 'checking' && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📧</span>
            </div>
            <h1 className="text-xl font-bold mb-2">Check your email</h1>
            <p className="text-text-muted text-sm mb-4">{message}</p>
            <p className="text-text-dim text-xs mb-4">Didn&apos;t receive the email? Check your spam folder or try resending.</p>
            {userEmail && (
              <button onClick={handleResend}
                className="text-primary hover:text-primary-hover font-medium text-sm transition-colors">
                Resend confirmation email
              </button>
            )}
          </>
        )}

        {status === 'processing' && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-xl font-bold mb-2">Verifying your email</h1>
            <p className="text-text-muted text-sm">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-xl font-bold mb-2">Email Verified!</h1>
            <p className="text-text-muted text-sm">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-xl font-bold mb-2">Verification Failed</h1>
            <p className="text-text-muted text-sm mb-4">{message}</p>
            <a href="/login" className="text-primary hover:text-primary-hover font-medium text-sm">
              Go to Login →
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthVerifyPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      <Suspense fallback={
        <div className="w-full max-w-md relative z-10 text-center">
          <div className="glass-card rounded-2xl p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-text-muted text-sm">Loading...</p>
          </div>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  )
}
