'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  TrendingDown,
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  Target,
  Brain,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Home,
  Lock,
} from 'lucide-react'
import { getSupabase, hasSupabase } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/add-expense', icon: PlusCircle, label: 'Add Expense' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics', proOnly: true },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/ai-coach', icon: Brain, label: 'AI Coach', proOnly: true },
  { href: '/pricing', icon: CreditCard, label: 'Pricing' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string; id?: string; plan_type?: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadUser = async () => {
      if (!hasSupabase()) {
        // Demo mode — no Supabase configured
        const stored = localStorage.getItem('wdmg_demo')
        if (stored) {
          setUser({ id: 'demo-user', email: 'demo@wdmg.app', plan_type: 'free' })
        }
        setAuthLoading(false)
        return
      }

      const supabase = getSupabase()
      if (!supabase) {
        setAuthLoading(false)
        return
      }

      // Race between Supabase auth and 3-second timeout
      const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 3000))

      try {
        const result = await Promise.race([
          supabase.auth.getUser(),
          timeout,
        ])

        if (cancelled) return

        if (result && 'data' in result && result.data?.user) {
          const authUser = result.data.user
          // Fetch profile for plan_type
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan_type')
            .eq('id', authUser.id)
            .single()

          setUser({
            id: authUser.id,
            email: authUser.email,
            plan_type: profile?.plan_type || 'free',
          })
        }
      } catch {
        // Silently fail — user stays null (not logged in)
      }

      if (!cancelled) setAuthLoading(false)
    }

    loadUser()
    return () => { cancelled = true }
  }, [])

  const handleLogout = async () => {
    if (hasSupabase()) {
      const supabase = getSupabase()
      if (supabase) {
        try { await supabase.auth.signOut() } catch { /* ignore */ }
      }
    }
    localStorage.removeItem('wdmg_demo')
    setUser(null)
    router.push('/login')
  }

  // Not logged in — redirect to login (but only after auth check completes)
  if (!authLoading && !user && hasSupabase()) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-text-muted mb-4">Please log in to continue</p>
          <Link href="/login" className="text-primary hover:text-primary-hover font-medium">
            Go to Login →
          </Link>
        </div>
      </div>
    )
  }

  const userPlan = user?.plan_type || 'free'
  const isFree = userPlan === 'free'

  return (
    <div className="min-h-screen bg-bg flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-bg-sidebar border-r border-border flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-bg" />
            </div>
            <span className="text-lg font-bold">WDMG</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const locked = item.proOnly && isFree
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : locked
                    ? 'text-text-dim/50 cursor-not-allowed'
                    : 'text-text-muted hover:text-text hover:bg-bg-card'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {locked && <Lock className="w-3 h-3 ml-auto text-text-dim" />}
                {isActive && !locked && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-text-dim truncate">{authLoading ? '...' : user?.email || 'demo@wdmg.app'}</p>
            <span
              className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                userPlan === 'premium'
                  ? 'bg-accent/20 text-accent'
                  : userPlan === 'pro'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-border text-text-dim'
              }`}
            >
              {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
            </span>
            {isFree && (
              <Link href="/pricing" className="block mt-2 text-xs text-primary hover:text-primary-hover font-medium transition-colors">
                Upgrade to Pro →
              </Link>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-danger hover:bg-danger/10 w-full transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen overflow-auto">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="text-text-muted hover:text-text">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold">WDMG</span>
          <Link href="/" className="text-text-muted hover:text-text">
            <Home className="w-6 h-6" />
          </Link>
        </div>
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
