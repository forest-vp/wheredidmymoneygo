'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  try {
    if (!supabaseInstance) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      if (!url || !key) return null
      supabaseInstance = createClient(url, key, {
        auth: {
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    }
    return supabaseInstance
  } catch {
    return null
  }
}

export function hasSupabase(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export interface User {
  id: string
  email: string
  plan_type: 'free' | 'pro' | 'premium'
  is_premium: boolean
  full_name?: string
  birth_date?: string
  country?: string
  monthly_salary?: number
  onboarding_complete?: boolean
  onboarding_data?: Record<string, unknown>
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  name: string
  category: string
  amount: number
  frequency: string
  date: string
  is_estimated?: boolean
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string
  created_at: string
}

export interface AiReport {
  id: string
  user_id: string
  report_type: 'weekly' | 'monthly'
  content: string
  created_at: string
}
