import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const siteUrl = process.env.NEXT_PUBLIC_URL || requestUrl.origin

  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const type = requestUrl.searchParams.get('type')

  if (error) {
    return NextResponse.redirect(
      `${siteUrl}/auth/verify?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=Missing+verification+code`)
  }

  // Redirect to the verify page with the code
  // The verify page will call the client-side Supabase SDK to verify the code
  // which creates a session
  const redirectType = type || 'signup'
  return NextResponse.redirect(`${siteUrl}/auth/callback-process?code=${encodeURIComponent(code)}&type=${redirectType}`)
}
