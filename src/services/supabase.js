import { createClient } from '@supabase/supabase-js'

// Only the ANON key is used on the frontend. Row Level Security keeps
// students from reading or modifying anything they are not allowed to.
// The service_role key must NEVER be placed in this project.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase configuration. Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)