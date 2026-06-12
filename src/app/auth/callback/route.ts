import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const siteUrl = process.env.NEXT_PUBLIC_URL || requestUrl.origin

  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error) {
    return NextResponse.redirect(
      `${siteUrl}/auth/verify?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    // Redirect to the verify page with the code — client-side Supabase SDK will exchange it
    return NextResponse.redirect(`${siteUrl}/auth/verify?code=${encodeURIComponent(code)}`)
  }

  // No code and no error — redirect to login
  return NextResponse.redirect(`${siteUrl}/login`)
}
