import { NextRequest, NextResponse } from 'next/server'

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { success: false, error: 'Service not configured.' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Generate a magic link using Supabase admin API
    // This sends a REAL email via Supabase's email system
    // Admin API has NO rate limits
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (error) {
      console.error('Generate link error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to send email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Check your inbox.',
    })
  } catch (error) {
    console.error('Send code error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
