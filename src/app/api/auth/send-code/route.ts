import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, type } = await req.json()

    // Validate input
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
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      )
    }

    const now = new Date()
    const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000)

    // Rate limit: count codes sent to this email in the last 15 minutes
    const { data: recentCodes, error: countError } = await supabase
      .from('verification_codes')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', fifteenMinAgo.toISOString())

    if (countError) {
      console.error('Rate limit check error:', countError)
    }

    if ((recentCodes?.length ?? 0) >= 3) {
      return NextResponse.json(
        { success: false, error: 'Too many codes requested. Please wait 15 minutes.' },
        { status: 429 }
      )
    }

    // Generate 6-digit code
    const code = String(Math.floor(Math.random() * 900000) + 100000)
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString()

    // Store the code
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        email,
        code,
        type,
        expires_at: expiresAt,
        used: false,
        created_at: now.toISOString(),
      })

    if (insertError) {
      console.error('Insert verification code error:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to create verification code' },
        { status: 500 }
      )
    }

    const isDev = process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_URL?.includes('localhost')

    if (isDev) {
      // In development, return the code for testing
      return NextResponse.json({
        success: true,
        message: 'Code sent',
        devCode: code,
      })
    }

    // In production, send via email using Supabase auth admin API
    // or integrate with your email provider (Resend, SendGrid, etc.)
    // For now, return success — replace with actual email sending logic.
    //
    // Example with Supabase admin (requires service role key):
    // const { error: emailError } = await supabase.auth.admin.generateLink({
    //   type: 'magiclink',
    //   email,
    // })
    //
    // Example with custom email provider:
    // await sendEmail({ to: email, subject: 'Your verification code', body: `Code: ${code}` })

    return NextResponse.json({
      success: true,
      message: 'Code sent',
    })
  } catch (error) {
    console.error('Send verification code error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
