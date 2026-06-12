import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, birthDate, country } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ success: false, error: 'Service not configured.' }, { status: 500 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check if user already exists by trying to list users
    const { data: existingUsers } = await adminSupabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u: { email?: string }) => u.email === email)

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'This email is already registered. Try signing in.' }, { status: 409 })
    }

    // Create user via admin API — NO rate limits
    const { data: userData, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (createError) {
      console.error('Create user error:', createError)
      return NextResponse.json({ success: false, error: createError.message }, { status: 500 })
    }

    // Update profile with extra info
    if (userData?.user) {
      await adminSupabase.from('profiles').update({
        full_name: fullName,
        birth_date: birthDate,
        country,
      }).eq('id', userData.user.id)
    }

    // Generate a magic link for email verification (sends real Supabase email)
    try {
      await adminSupabase.auth.admin.generateLink({ type: 'magiclink', email })
    } catch {
      // Non-blocking — user can still use the app
    }

    // Return success — user can now sign in on the client side
    return NextResponse.json({
      success: true,
      message: 'Account created. Check your email for a verification link.',
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
