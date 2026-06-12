import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, code, type } = await req.json()

    // Validate input
    if (!email || !code || !type) {
      return NextResponse.json(
        { success: false, error: 'Email, code, and type are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      )
    }

    const now = new Date().toISOString()

    // Look up a matching, unused, non-expired code
    const { data: records, error: fetchError } = await supabase
      .from('verification_codes')
      .select('id')
      .eq('email', email)
      .eq('code', code)
      .eq('type', type)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('Lookup verification code error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }

    if (!records || records.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired code' },
        { status: 400 }
      )
    }

    // Mark the code as used
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', records[0].id)

    if (updateError) {
      console.error('Mark code used error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }

    // If this is a signup code, mark the user's profile as email verified
    if (type === 'signup') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('email', email)

      if (profileError) {
        console.error('Update profile email_verified error:', profileError)
        // Don't fail the entire request if this update fails;
        // the code was already consumed successfully.
      }
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
