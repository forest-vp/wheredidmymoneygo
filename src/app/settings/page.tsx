// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User,
  Mail,
  CreditCard,
  Calendar,
  Trash2,
  AlertTriangle,
  Shield,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

interface Profile {
  id: string
  email: string
  plan_type: 'free' | 'pro' | 'premium'
  stripe_subscription_id: string | null
  subscription_status: string | null
  created_at: string
}

const planConfig = {
  free: {
    label: 'Free',
    badgeClass: 'bg-border text-text-dim',
    icon: Shield,
    description: 'Basic expense tracking',
  },
  pro: {
    label: 'Pro',
    badgeClass: 'bg-primary/20 text-primary',
    icon: Shield,
    description: 'Advanced analytics & AI insights',
  },
  premium: {
    label: 'Premium',
    badgeClass: 'bg-accent/20 text-accent',
    icon: Shield,
    description: 'Unlimited everything',
  },
}

const subscriptionStatusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: 'Active', color: 'text-success', icon: CheckCircle2 },
  canceled: { label: 'Canceled', color: 'text-danger', icon: XCircle },
  past_due: { label: 'Past Due', color: 'text-warning', icon: AlertTriangle },
  trialing: { label: 'Trialing', color: 'text-accent', icon: Clock },
  unpaid: { label: 'Unpaid', color: 'text-danger', icon: XCircle },
  incomplete: { label: 'Incomplete', color: 'text-warning', icon: Clock },
  incomplete_expired: { label: 'Expired', color: 'text-danger', icon: XCircle },
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await getSupabase().auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, plan_type, stripe_subscription_id, subscription_status, created_at')
        .eq('id', user.id)
        .single()

      if (fetchError) throw fetchError
      setProfile(data)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleManageSubscription = async () => {
    try {
      const { data, error: fnError } = await getSupabase().functions.invoke('create-portal-session', {
        body: {
          return_url: `${window.location.origin}/settings`,
        },
      })

      if (fnError) throw fnError

      if (data?.url) {
        window.location.href = data.url
      } else {
        setError('Could not open subscription portal. Please try again.')
      }
    } catch (err) {
      console.error('Error opening portal:', err)
      setError('Could not open subscription portal. Please contact support.')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return

    setDeleting(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await getSupabase().auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Delete user data first
      await getSupabase().from('expenses').delete().eq('user_id', user.id)
      await getSupabase().from('goals').delete().eq('user_id', user.id)
      await getSupabase().from('ai_reports').delete().eq('user_id', user.id)
      await getSupabase().from('profiles').delete().eq('id', user.id)

      // Sign out (auth user deletion requires server-side admin call)
      await getSupabase().auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('Error deleting account:', err)
      setError('Failed to delete account. Please contact support.')
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="glass-card rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
          <p className="text-text-muted mb-4">{error}</p>
          <button
            onClick={fetchProfile}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const plan = profile ? planConfig[profile.plan_type] || planConfig.free : planConfig.free
  const PlanIcon = plan.icon
  const hasSubscription = !!profile?.stripe_subscription_id
  const subStatus = profile?.subscription_status
    ? subscriptionStatusConfig[profile.subscription_status] || null
    : null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-xl bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-text hover:border-primary/50 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-text-muted">Manage your account and preferences</p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="glass-card rounded-2xl p-4 border border-danger/30 bg-danger/5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Account Info */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Account Information
        </h2>

        <div className="space-y-5">
          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Email Address</p>
                <p className="text-sm text-text-muted">{profile?.email || '—'}</p>
              </div>
            </div>
          </div>

          {/* Member since */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm text-text-muted">
                  {profile?.created_at ? formatDate(profile.created_at) : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan & Subscription */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Plan & Subscription
        </h2>

        <div className="space-y-5">
          {/* Current plan */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center">
                <PlanIcon className="w-5 h-5 text-text-muted" />
              </div>
              <div>
                <p className="text-sm font-medium">Current Plan</p>
                <p className="text-sm text-text-muted">{plan.description}</p>
              </div>
            </div>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${plan.badgeClass}`}>
              {plan.label}
            </span>
          </div>

          {/* Subscription status */}
          {hasSubscription && subStatus && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center">
                  <subStatus.icon className={`w-5 h-5 ${subStatus.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">Subscription Status</p>
                  <p className={`text-sm ${subStatus.color}`}>{subStatus.label}</p>
                </div>
              </div>
              <button
                onClick={handleManageSubscription}
                className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Manage Subscription
              </button>
            </div>
          )}

          {/* Upgrade button for free users */}
          {(!profile || profile.plan_type === 'free') && (
            <div className="pt-2">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                <Shield className="w-4 h-4" />
                Upgrade Plan
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card rounded-2xl p-6 border border-danger/20">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-danger">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-sm text-text-muted mb-5">
          Once you delete your account, there is no going back. All your data will be permanently removed.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-2 bg-danger/10 hover:bg-danger/20 text-danger px-5 py-2.5 rounded-xl text-sm font-medium transition-all border border-danger/20"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteModal(false)
              setDeleteConfirmText('')
            }}
          />

          {/* Modal */}
          <div className="relative bg-bg-card border border-danger/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-danger" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Delete Account</h3>
                <p className="text-sm text-text-muted">This action is irreversible</p>
              </div>
            </div>

            <p className="text-sm text-text-muted mb-4 leading-relaxed">
              This will permanently delete your account, all your expenses, goals, and AI reports.
              Please type <span className="font-bold text-danger">DELETE</span> to confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-danger/50 transition-colors mb-5"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1 bg-bg hover:bg-bg-card text-text-muted hover:text-text px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-border"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 bg-danger hover:bg-danger/90 disabled:bg-danger/30 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Forever
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
