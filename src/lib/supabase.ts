'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    if (!url || !key) {
      console.warn('Supabase env vars not set - some features may not work')
    }
    supabaseInstance = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-key')
  }
  return supabaseInstance
}

// Database types
export interface User {
  id: string
  email: string
  plan_type: 'free' | 'pro' | 'premium'
  is_premium: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
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
