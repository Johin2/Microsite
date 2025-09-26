import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { headers, cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.warn('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.')
}

if (!anonKey) {
  console.warn('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.')
}

export function createBrowserSupabaseClient() {
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase browser client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: true
    }
  })
}

export function createServiceSupabaseClient() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase service client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export function createServerSupabaseClient() {
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase server client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const cookieStore = cookies()
  const headerList = headers()

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set() {
        // Cookies are read-only in Next.js Server Components, so we provide a noop setter.
      },
      remove() {
        // Noop remover for the same reason as set().
      }
    },
    headers: {
      'X-Client-Info': 'project-ops-microsite/0.1.0',
      'X-Forwarded-For': headerList.get('x-forwarded-for') ?? undefined
    }
  })
}
