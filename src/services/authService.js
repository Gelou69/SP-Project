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
const LEGACY_EMAIL_DOMAINS = ['evolutionquiz.com', 'evolution.quiz', 'gmail.com']

function usernameCandidates(raw) {
  const base = String(raw || '').trim().toLowerCase()
  if (!base) return []

  const candidates = new Set([
    base,
    base.replace(/\s+/g, ''),
    base.replace(/\./g, ''),
  ])

  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length > 1) {
    const last = parts[parts.length - 1]
    const first = parts[0]
    candidates.add(`${last}.${first}`)
    candidates.add(`${first}.${last}`)
  }

  if (base.includes('.')) {
    const [first, last] = base.split('.')
    if (first && last) {
      candidates.add(`${last}.${first}`)
      candidates.add(`${first}.${last}`)
    }
  }

  return [...candidates].filter(Boolean)
}

export function normalizeUsername(raw) {
  const trimmed = String(raw || '').trim().toLowerCase()
  if (!trimmed) return ''

  const tokens = trimmed.split(/\s+/).filter(Boolean)
  if (tokens.length < 2) return trimmed.replace(/\s+/g, '')

  const first = tokens[0]
  const last = tokens[tokens.length - 1]
  return `${last}.${first}`.replace(/[^a-z0-9.]/g, '')
}

function demoUsernameVariants(raw) {
  const base = String(raw || '').trim().toLowerCase()
  if (!base) return []

  const variants = new Set([
    base,
    base.replace(/\s+/g, ''),
    normalizeUsername(base),
  ])

  if (base.includes('.')) {
    const [first, last] = base.split('.')
    if (first && last) {
      variants.add(`${last}.${first}`)
      variants.add(`${first} ${last}`)
    }
  }

  if (base.includes(' ')) {
    const parts = base.split(/\s+/)
    const first = parts[0]
    const last = parts[parts.length - 1]
    if (first && last) {
      variants.add(`${last}.${first}`)
      variants.add(`${first}.${last}`)
    }
  }

  return [...variants].filter(Boolean)
}

const emailFor = (username, domain = EMAIL_DOMAIN) => `${username.toLowerCase().replace(/\s+/g, '')}@${domain}`

async function findProfileByUsername(username) {
  if (!isSupabaseConfigured || !username) return null

  const candidates = Array.from(new Set([
    normalizeUsername(username),
    String(username || '').trim().toLowerCase(),
    String(username || '').trim().replace(/\s+/g, ''),
    ...usernameCandidates(String(username || '').trim()),
  ].filter(Boolean)))

  if (!candidates.length) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('username', candidates)
    .limit(20)

  if (error) {
    console.warn('profile lookup failed:', error.message)
    return null
  }

  return data?.find((row) => candidates.some((candidate) => row.username.toLowerCase() === candidate.toLowerCase())) || null
}

async function resolveCanonicalUsername(username) {
  if (!isSupabaseConfigured) {
    const user = findDemoUserByUsername(username)
    return user?.username || null
  }

  const input = String(username || '').trim()
  if (!input) return null

  const profile = await findProfileByUsername(input)
  if (profile) return profile.username

  const fallbackCandidates = Array.from(new Set([
    normalizeUsername(input),
    input.toLowerCase(),
    input.replace(/\s+/g, ''),
    ...usernameCandidates(input),
    ...(input.includes('@') ? [input.split('@')[0], normalizeUsername(input.split('@')[0])] : []),
  ].filter(Boolean)))

  if (!fallbackCandidates.length) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .or(fallbackCandidates.map((candidate) => `username.ilike.%${candidate}%`).join(','))
    .limit(20)

  if (error) {
    console.warn('profile fallback lookup failed:', error.message)
    return null
  }

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

  let profile = await waitForProfile(data.user.id)
  if (!profile) {
    profile = await ensureProfileExists({
      userId: data.user.id,
      fullName,
      username,
      birthdate,
    })
  }

  if (!profile) {
    throw new Error('Profile creation did not complete. Please run the Supabase SQL schema in supabase/schema.sql.')
  }

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

async function ensureProfileExists({ userId, fullName, username, birthdate }) {
  if (!userId) return null

  const profile = {
    id: userId,
    full_name: fullName.trim(),
    birthdate,
    username,
    role: 'student',
    account_status: 'active',
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select('*')
    .maybeSingle()

  if (error) {
    console.warn('ensureProfileExists failed:', error.message)
    return null
  }

  return data || profile
}

export async function signIn({ username, password }) {
  if (!isSupabaseConfigured) {
    const raw = String(username || '').trim()
    if (!raw) throw new Error('Please enter your username.')

    const typed = normalizeUsername(raw)
    const legacyAdminPasswords = ['admin123', 'lawofsines123']
    const adminMatches = demoUsernameVariants(raw).filter((value) => ['sammy.malik', 'admin.lawofsines'].includes(value))

    if (adminMatches.length > 0 && legacyAdminPasswords.includes(String(password || ''))) {
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
      state.users = state.users.filter((user) => user.id !== 'demo-admin' && user.username.toLowerCase() !== 'admin.lawofsines')
      state.users.unshift(adminUser)
      saveDemoState(state)
      setCurrentDemoUser(adminUser.id)
      return { user: { id: adminUser.id }, profile: adminUser }
    }

    const state = getDemoState()
    const matchingUser = state.users.find((user) => {
      const userNames = demoUsernameVariants(user.username)
      const entered = demoUsernameVariants(raw)
      return userNames.some((name) => entered.includes(name)) && user.password === String(password || '')
    })

    if (!matchingUser) throw new Error('Invalid username or password.')

    setCurrentDemoUser(matchingUser.id)
    return { user: { id: matchingUser.id }, profile: matchingUser }
  }

  const rawInput = String(username || '').trim()
  const typed = normalizeUsername(rawInput)
  if (!typed && !rawInput.includes('@')) throw new Error('Please enter your username.')

  const canonical = await resolveCanonicalUsername(rawInput)
  const loginCandidates = Array.from(new Set([
    canonical || typed || rawInput,
    rawInput,
    rawInput.toLowerCase(),
    rawInput.replace(/\s+/g, ''),
    ...(rawInput.includes('@') ? [rawInput.split('@')[0], normalizeUsername(rawInput.split('@')[0])] : []),
    ...(typed ? [typed, ...usernameCandidates(typed)] : []),
  ].filter(Boolean)))

  const domains = Array.from(new Set([EMAIL_DOMAIN, ...LEGACY_EMAIL_DOMAINS]))
  let data
  let error

  const emailCandidates = Array.from(new Set(
    loginCandidates.flatMap((candidate) => {
      const values = [candidate]
      const local = String(candidate).split('@')[0]
      if (local && local !== candidate) values.push(local)
      return values.flatMap((value) => domains.map((domain) => emailFor(value, domain)))
    })
  ))

  for (const email of emailCandidates) {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    data = result.data
    error = result.error
    if (!error) break
  }

  if (error && typed) {
    const alternateEmails = [...new Set(usernameCandidates(typed).flatMap((candidate) => domains.map((domain) => emailFor(candidate, domain))))]
    for (const email of alternateEmails) {
      const fallback = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (!fallback.error) {
        data = fallback.data
        error = null
        break
      }
    }
  }

  if (error) {
    const profileMatch = await findProfileByUsername(canonical || typed || rawInput)
    if (profileMatch) {
      throw new Error('This account exists in the database but is not linked to a valid Supabase Auth user. Please create it again through signup or ask the admin to recreate the account.')
    }
    throw new Error('Invalid username or password.')
  }

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