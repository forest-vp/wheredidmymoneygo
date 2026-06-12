import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, code, type } = await req.json()

    if (!email || !code || !type) {
      return NextResponse.json(
        { success: false, error: 'Email, code, and type are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    if (!supabase) {
      // Demo mode — accept any 6-digit code
      if (code.length === 6 && /^\d{6}$/.test(code)) {
        return NextResponse.json({ success: true, message: 'Verified (demo mode)' })
      }
      return NextResponse.json(
        { success: false, error: 'Invalid code' },
        { status: 400 }
      )
    }

    // Find valid code
    const { data: codes, error: fetchError } = await supabase
      .from('verification_codes')
      .select('id')
      .eq('email', email)
      .eq('code', code)
      .eq('type', type)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .limit(1)

    if (fetchError || !codes || codes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired code' },
        { status: 400 }
      )
    }

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', codes[0].id)

    // If signup verification, mark email as verified in profiles
    if (type === 'signup') {
      await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('email', email)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
