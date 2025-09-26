import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@lib/supabase'
import { isAllowedEmail } from '@lib/auth-utils'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user ?? null
  const email = user?.email ?? null
  const isTeam = email ? isAllowedEmail(email) : false

  return NextResponse.json({ isAuthenticated: Boolean(email), email, isTeam })
}
