import { supabase, isSupabaseConfigured } from './supabase'
import {
  getCurrentDemoUser,
  setCurrentDemoUser,
  clearCurrentDemoUser,
  findDemoUserByUsername,
  createDemoUser,
  updateDemoUser,
  getDemoState,
  saveDemoState,
} from './localDemo'

const EMAIL_DOMAIN = 'gmail.com'
const LEGACY_EMAIL_DOMAINS = ['evolutionquiz.com', 'evolution.quiz']

export function normalizeUsername(raw) {
  const tokens = String(raw || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
  if (tokens.length < 2) return String(raw || '').trim().toLowerCase().replace(/\s+/g, '')
  const first = tokens[0]
  const last = tokens[tokens.length - 1]
  return `${last}.${first}`.replace(/[^a-z0-9.]/g, '')
}

const emailFor = (username, domain = EMAIL_DOMAIN) => `${username.toLowerCase().replace(/\s+/g, '')}@${domain}`

async function resolveCanonicalUsername(username) {
  if (!isSupabaseConfigured) {
    const user = findDemoUserByUsername(username)
    return user?.username || null
  }

  const normalized = normalizeUsername(username)
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .ilike('username', `${normalized}%`)
    .limit(5)

  if (error) {
    console.warn('profile lookup failed:', error.message)
    return null
  }
  const exact = data?.find((p) => p.username.toLowerCase() === normalized)
  if (exact) return exact.username
  const match = data?.slice().sort((a, b) => a.username.length - b.username.length)[0]
  return match?.username || null
}

export async function signUp({ fullName, username: requestedUsername, birthdate, password }) {
  const normalized = normalizeUsername(requestedUsername)
  if (!/^[a-z0-9]+\.[a-z0-9]+$/.test(normalized)) {
    throw new Error('Username must use the format lastname.firstname.')
  }

  if (!isSupabaseConfigured) {
    const existing = findDemoUserByUsername(normalized)
    if (existing) {
      throw new Error('That username is already in use.')
    }

    const user = createDemoUser({
      fullName,
      username: normalized,
      birthdate,
      password,
    })
    setCurrentDemoUser(user.id)
    return { user: { id: user.id }, profile: user }
  }

  const username = normalized
  const email = emailFor(username)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName.trim(), username, birthdate },
    },
  })

  if (error) {
    if (error.status === 429) {
      throw new Error('Too many sign-up attempts. Please wait a few minutes and try again.')
    }
    const databaseDetails = [error.details, error.hint].filter(Boolean).join(' ')
    throw new Error([error.message, databaseDetails].filter(Boolean).join(' '))
  }
  if (!data?.user) throw new Error('Sign up failed. Please try again.')

  const profile = await waitForProfile(data.user.id)
  return { user: data.user, profile }
}

async function waitForProfile(userId, attempts = 8) {
  for (let i = 0; i < attempts; i++) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (data) return data
    await new Promise((r) => setTimeout(r, 400))
  }
  return null
}

export async function signIn({ username, password }) {
  if (!isSupabaseConfigured) {
    const typed = normalizeUsername(username)
    if (!typed) throw new Error('Please enter your username.')

    const legacyAdminNames = ['sammy.malik', 'admin.lawofsines']
    const legacyAdminPasswords = ['admin123', 'lawofsines123']

    if (legacyAdminNames.includes(typed.toLowerCase()) && legacyAdminPasswords.includes(password)) {
      const adminUser = {
        id: 'demo-admin',
        full_name: 'Sammy Malik',
        username: 'sammy.malik',
        password: 'admin123',
        birthdate: '1998-01-15',
        role: 'admin',
        account_status: 'active',
        created_at: new Date().toISOString(),
      }
      const state = getDemoState()
      state.users = state.users.filter((user) => user.id !== 'demo-admin')
      state.users.unshift(adminUser)
      saveDemoState(state)
      setCurrentDemoUser(adminUser.id)
      return { user: { id: adminUser.id }, profile: adminUser }
    }

    const user = findDemoUserByUsername(typed)
    if (!user) throw new Error('Invalid username or password.')

    if (user.password !== password) {
      throw new Error('Invalid username or password.')
    }

    setCurrentDemoUser(user.id)
    return { user: { id: user.id }, profile: user }
  }

  let typed = normalizeUsername(username)
  if (!typed) throw new Error('Please enter your username.')

  const canonical = await resolveCanonicalUsername(username)
  if (canonical) typed = canonical

  const domains = [EMAIL_DOMAIN, ...LEGACY_EMAIL_DOMAINS]
  let data
  let error

  for (const domain of domains) {
    const result = await supabase.auth.signInWithPassword({
      email: emailFor(typed, domain),
      password,
    })
    data = result.data
    error = result.error
    if (!error) break
  }

  if (error) throw new Error('Invalid username or password.')

  const profile = await fetchProfile(data.user.id)
  if (profile && profile.account_status === 'disabled') {
    await supabase.auth.signOut()
    throw new Error('This account has been disabled by your teacher.')
  }
  return { user: data.user, profile }
}

export async function signOut() {
  if (!isSupabaseConfigured) {
    clearCurrentDemoUser()
    return
  }
  await supabase.auth.signOut()
}

export async function fetchProfile(userId) {
  if (!userId) return null
  if (!isSupabaseConfigured) {
    const user = getCurrentDemoUser() || (typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('law-of-sines-demo-state') || 'null')?.users?.find((u) => u.id === userId) : null)
    return user || null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function updateProfile(fullName, birthdate) {
  if (!isSupabaseConfigured) {
    const user = getCurrentDemoUser()
    if (!user) return null
    const updated = updateDemoUser(user.id, { full_name: fullName, birthdate })
    return updated
  }

  const { data, error } = await supabase.rpc('update_my_profile', {
    p_full_name: fullName,
    p_birthdate: birthdate,
  })
  if (error) throw new Error(error.message)
  return data
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured) {
    const state = getCurrentDemoUser()
    callback(state ? 'SIGNED_IN' : 'SIGNED_OUT', state ? { user: { id: state.id } } : null)
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session))
}

export async function getSessionUser() {
  if (!isSupabaseConfigured) {
    const user = getCurrentDemoUser()
    return user ? { id: user.id, email: `${user.username}@demo.local` } : null
  }
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}