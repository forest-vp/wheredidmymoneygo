// TEMP: Email confirmation is disabled in Supabase
// This route handles the callback but since we auto-confirm, users are already logged in
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const siteUrl = process.env.NEXT_PUBLIC_URL || requestUrl.origin

  // Just redirect to login — users auto-login after signup
  return NextResponse.redirect(`${siteUrl}/onboarding`)
}
