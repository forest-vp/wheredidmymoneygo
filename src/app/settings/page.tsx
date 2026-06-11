'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ email?: string; plan_type?: string; created_at?: string; country?: string } | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) { setLoading(false); return }
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setProfile({
          email: user.email,
          plan_type: 'free',
          created_at: user.created_at,
        })
        const { data } = await supabase.from('profiles').select('plan_type, country, created_at').eq('id', user.id).single()
        if (data) setProfile(prev => ({ ...prev, ...data }))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [router])

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleting(true)
    try {
      const supabase = getSupabase()
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('expenses').delete().eq('user_id', user.id)
      await supabase.from('goals').delete().eq('user_id', user.id)
      await supabase.from('profiles').delete().eq('id', user.id)
      await supabase.auth.signOut()
      router.push('/login')
    } catch {
      setError('Failed to delete account.')
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-text-muted">Manage your account and preferences</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Account Information
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-text-dim" />
            <div>
              <p className="text-xs text-text-dim">Email</p>
              <p className="text-sm font-medium">{loading ? '...' : profile?.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-text-dim" />
            <div>
              <p className="text-xs text-text-dim">Member since</p>
              <p className="text-sm font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Plan & Subscription
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-text-dim" />
            <div>
              <p className="text-sm font-medium capitalize">{loading ? '...' : profile?.plan_type || 'Free'} Plan</p>
              <p className="text-xs text-text-dim">Basic expense tracking</p>
            </div>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-border text-text-dim capitalize">
            {loading ? '...' : profile?.plan_type || 'Free'}
          </span>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <Link href="/pricing" className="text-primary hover:text-primary-hover text-sm font-medium transition-colors">
            View Plans →
          </Link>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border-danger/20">
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-danger">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-text-muted text-sm mb-4">Permanently delete your account and all data. This cannot be undone.</p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full border-danger/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <h3 className="text-lg font-bold">Delete Account</h3>
            </div>
            <p className="text-text-muted text-sm mb-4">
              This will permanently delete all your expenses, goals, and data. Type <span className="text-danger font-bold">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-danger transition-colors mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
                className="flex-1 bg-border hover:bg-border-light text-text py-2.5 rounded-xl text-sm font-medium transition-all">
                Cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 bg-danger hover:bg-danger-hover disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
