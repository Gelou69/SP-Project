// ============================================================
//  BOOTSTRAP THE FIRST ADMIN / TEACHER ACCOUNT
//
//  Usage (from a terminal, NOT inside the browser app):
//
//    $env:SUPABASE_URL="https://xxxx.supabase.co"
//    $env:SUPABASE_SERVICE_ROLE_KEY="service_role_key_here"
//    node scripts/bootstrap-admin.mjs
//
//  This uses the SECRET service_role key to create the account and
//  promote the profile to 'admin'. The service_role key is used only
//  here in a terminal / CI — never in the React app.
// ============================================================

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const fullName = process.env.ADMIN_FULL_NAME || 'Teacher Admin'
const birthdate = process.env.ADMIN_BIRTHDATE || '1985-01-01'
const password = process.env.ADMIN_PASSWORD || 'teacher123'

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  process.exit(1)
}

// dotenv is a dev convenience; if not installed, read process.env directly.
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

const username = fullName
  .trim()
  .toLowerCase()
  .split(/\s+/)
  .filter(Boolean)

if (username.length < 2) {
  console.error('ADMIN_FULL_NAME must include a first and a last name.')
  process.exit(1)
}

const normalized = `${username[username.length - 1]}.${username[0]}`.replace(/[^a-z0-9.]/g, '')
const email = `${normalized}@evolution.quiz`

console.log(`Creating admin user ${email} ...`)

const { data: user, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName.trim(), birthdate },
})

if (createError) {
  console.error('createUser failed:', createError.message)
  process.exit(1)
}

const { data: profile, error: updateError } = await admin
  .from('profiles')
  .update({ role: 'admin', account_status: 'active' })
  .eq('id', user.id)
  .select()
  .single()

if (updateError) {
  console.error('Promoting to admin failed:', updateError.message)
  process.exit(1)
}

console.log('✅ Admin account created.')
console.log(`   Sign in with username: ${profile.username}`)
console.log(`   (email address:        ${email})`)
console.log(`   Full name:             ${profile.full_name}`)