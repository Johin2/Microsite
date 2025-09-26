import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

