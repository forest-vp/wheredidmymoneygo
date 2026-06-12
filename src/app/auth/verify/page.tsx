'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''
  const type = searchParams.get('type') || 'signup'
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    setResendMsg('')
    try {
      await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type }),
      })
      setResendMsg('Verification email sent!')
    } catch {
      setResendMsg('Failed to send. Please try again.')
    }
    setResending(false)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 sm:px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md relative z-10 text-center">
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Mail className="w-6 h-6 text-bg" />
            </div>
            <span className="text-2xl font-bold">WDMG</span>
          </Link>

          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-text-muted text-sm mb-2">
            We sent a verification link to
          </p>
          <p className="text-primary font-medium mb-4 break-all">{email || 'your email'}</p>
          <p className="text-text-dim text-sm mb-6">
            Click the link in the email to verify your account.
          </p>

          {resendMsg && (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-accent text-sm mb-4">
              {resendMsg}
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 mb-6"
          >
            {resending ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Resend verification email
          </button>

          <Link href="/login"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
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
      <VerifyContent />
    </Suspense>
  )
}
