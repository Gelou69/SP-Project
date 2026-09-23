import { supabase } from './supabase'

const EMAIL_DOMAIN = 'gmail.com'
const LEGACY_EMAIL_DOMAINS = ['evolutionquiz.com', 'evolution.quiz']

/** Normalizes any name into a lowercase, space-free "lastname.firstname" form used for login lookups. */
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

/** Derive the auth email for a normalized username. */
const emailFor = (username, domain = EMAIL_DOMAIN) => `${username.toLowerCase().replace(/\s+/g, '')}@${domain}`

/** Resolve a typed username to the canonical username stored in profiles (handles suffix usernames). */
async function resolveCanonicalUsername(username) {
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
  // Prefer the shortest matching suffix, otherwise return null so the caller
  // falls back to the raw typed username.
  const match = data?.slice().sort((a, b) => a.username.length - b.username.length)[0]
  return match?.username || null
}

export async function signUp({ fullName, username: requestedUsername, birthdate, password }) {
  const username = normalizeUsername(requestedUsername)
  if (!/^[a-z0-9]+\.[a-z0-9]+$/.test(username)) {
    throw new Error('Username must use the format lastname.firstname.')
  }
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

  // The database trigger creates the profile row; wait for it before returning.
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
  await supabase.auth.signOut()
}

export async function fetchProfile(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function updateProfile(fullName, birthdate) {
  const { data, error } = await supabase.rpc('update_my_profile', {
    p_full_name: fullName,
    p_birthdate: birthdate,
  })
  if (error) throw new Error(error.message)
  return data
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session))
}

export async function getSessionUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}