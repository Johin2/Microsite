'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from './supabase'
import { isAllowedEmail } from './auth-utils'

export async function requireTeamUser(nextPath = '/my') {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  const user = data?.user ?? null

  if (error || !user) {
    const params = new URLSearchParams({ audience: 'team', next: nextPath })
    redirect(`/sign-in?${params.toString()}`)
  }

  if (!isAllowedEmail(user.email)) {
    const params = new URLSearchParams({ audience: 'team', error: 'unauthorized', next: nextPath })
    redirect(`/sign-in?${params.toString()}`)
  }

  return user
}
