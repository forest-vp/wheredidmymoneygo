'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const processCallback = async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) {
          setStatus('error')
          setMessage('Unable to connect. Please try again.')
          return
        }

        // Supabase magic link puts tokens in the URL hash fragment
        // The Supabase JS SDK auto-detects this on page load
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          setStatus('success')
          setMessage('Email verified! Redirecting...')
          setTimeout(() => router.push('/onboarding'), 1500)
          return
        }

        // If no session from hash, try exchanging code from query params
        const code = searchParams.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError

          setStatus('success')
          setMessage('Email verified! Redirecting...')
          setTimeout(() => router.push('/onboarding'), 1500)
          return
        }

        throw new Error('Could not verify email')
      } catch (err) {
        console.error('Callback error:', err)
        setStatus('error')
        setMessage('Verification failed. The link may be expired or invalid.')
      }
    }

    processCallback()
  }, [router, searchParams])

  return (
    <div className="w-full max-w-md relative z-10 text-center">
      <div className="glass-card rounded-2xl p-8">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
            <a href="/login" className="text-primary hover:text-primary-hover font-medium text-sm">Go to Login →</a>
          </>
        )}
      </div>
    </div>
  )
}

export default function CallbackProcessPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      <Suspense fallback={
        <div className="w-full max-w-md text-center">
          <div className="glass-card rounded-2xl p-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-text-muted text-sm">Loading...</p>
          </div>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  )
}
