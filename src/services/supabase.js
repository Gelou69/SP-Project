import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL

const supabaseAnonKey = [
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  import.meta.env.VITE_SUPABASE_PUBLIC_KEY,
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY,
  import.meta.env.SUPABASE_ANON_KEY,
  import.meta.env.SUPABASE_PUBLISHABLE_KEY,
].find(Boolean)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured && typeof console !== 'undefined') {
  console.warn(
    'Supabase is not configured in this environment. The app will use demo mode until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or the publishable alias) are added in Vercel.'
  )
}

const baseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : {
      auth: {
        signInWithPassword: async () => ({ data: null, error: new Error('Supabase is not configured.') }),
        signUp: async () => ({ data: null, error: new Error('Supabase is not configured.') }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      }),
      rpc: async () => ({ data: null, error: new Error('Supabase is not configured.') }),
      storage: {
        from: () => ({
          upload: async () => ({ error: null }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
    }

export const supabase = baseClient