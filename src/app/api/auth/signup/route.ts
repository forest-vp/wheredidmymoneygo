import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, birthDate, country } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
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

    // Create user via admin API — NO rate limits
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm so user can sign in immediately
      user_metadata: { full_name: fullName },
    })

    if (createError) {
      if (createError.message.includes('already registered') || createError.message.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: 'This email is already registered.' },
          { status: 409 }
        )
      }
      console.error('Create user error:', createError)
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 500 }
      )
    }

    // Update profile with extra info
    if (userData?.user) {
      await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          birth_date: birthDate,
          country,
        })
        .eq('id', userData.user.id)
    }

    // Generate a magic link for email verification
    await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    return NextResponse.json({
      success: true,
      message: 'Account created. Check your email for a verification link.',
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
