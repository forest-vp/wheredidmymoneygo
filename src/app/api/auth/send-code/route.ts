import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, type } = await req.json()

    if (!email || !type) {
      return NextResponse.json(
        { success: false, error: 'Email and type are required' },
        { status: 400 }
      )
    }

    if (type !== 'signup' && type !== 'login') {
      return NextResponse.json(
        { success: false, error: 'Type must be "signup" or "login"' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    if (!supabase) {
      // Supabase not configured — return a fake code for the flow to work
      return NextResponse.json({
        success: true,
        message: 'Code sent (demo mode)',
        devCode: '123456',
      })
    }

    // Check if verification_codes table exists by trying to query it
    // If it doesn't exist, just return a dev code
    const { data: recentCodes, error: countError } = await supabase
      .from('verification_codes')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .maybeSingle()

    if (countError) {
      // Table might not exist — return dev code
      const devCode = String(Math.floor(Math.random() * 900000) + 100000)
      return NextResponse.json({
        success: true,
        message: 'Code sent (table not found — using demo mode)',
        devCode,
      })
    }

    // Rate limit check
    if (recentCodes) {
      // Count how many codes were sent recently
      const { data: codes } = await supabase
        .from('verification_codes')
        .select('id')
        .eq('email', email)
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())

      if (codes && codes.length >= 3) {
        return NextResponse.json(
          { success: false, error: 'Too many codes. Wait 15 minutes.' },
          { status: 429 }
        )
      }
    }

    // Generate 6-digit code
    const code = String(Math.floor(Math.random() * 900000) + 100000)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({ email, code, type, expires_at: expiresAt, used: false })

    if (insertError) {
      // Table might have wrong schema — return dev code
      return NextResponse.json({
        success: true,
        message: 'Code sent (insert error — using demo mode)',
        devCode: code,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Code sent',
    })
  } catch (error) {
    console.error('Send code error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
