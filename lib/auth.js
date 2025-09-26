'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from './supabase'
import { isAllowedEmail } from './auth-utils'

export async function requireTeamUser(nextPath = '/my') {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  const user = data?.user ?? null

  if (error || !user) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`)
  }

  if (!isAllowedEmail(user.email)) {
    redirect(`/sign-in?error=unauthorized&next=${encodeURIComponent(nextPath)}`)
  }

  return user
}
