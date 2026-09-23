import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  fetchProfile,
  onAuthStateChange,
  updateProfile as authUpdateProfile,
} from '../services/authService'
import { getSessionUser } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let profileTimer = null

    const load = async () => {
      try {
        const sessionUser = await getSessionUser()
        if (!sessionUser) {
          setUser(null)
          setProfile(null)
          return
        }
        setUser(sessionUser)
        // The signup trigger creates the profile row; retry briefly.
        let attempts = 0
        const tick = async () => {
          const p = await fetchProfile(sessionUser.id).catch(() => null)
          if (p && mounted) {
            setProfile(p)
          } else if (attempts < 6 && mounted) {
            attempts += 1
            profileTimer = setTimeout(tick, 500)
          }
        }
        tick()
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    const { data: sub } = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      } else if (event === 'SIGNED_IN' && session) {
        setUser(session.user)
        fetchProfile(session.user.id)
          .then((p) => {
            if (mounted) setProfile(p)
          })
          .catch(() => {})
      }
    })

    return () => {
      mounted = false
      if (profileTimer) clearTimeout(profileTimer)
      sub?.data?.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (creds) => {
    const { user: u, profile: p } = await authSignIn(creds)
    setUser(u)
    setProfile(p)
    return p
  }, [])

  const signUp = useCallback(async (details) => {
    const { user: u, profile: p } = await authSignUp(details)
    setUser(u)
    setProfile(p)
    return p
  }, [])

  const signOut = useCallback(async () => {
    await authSignOut()
    setUser(null)
    setProfile(null)
  }, [])

  const updateProfile = useCallback(
    async (fullName, birthdate) => {
      const p = await authUpdateProfile(fullName, birthdate)
      // RPC returns the new profile row (may not include everything we need)
      const fresh = await fetchProfile(user?.id)
      if (fresh) setProfile(fresh)
      else if (p) setProfile(p)
      return p
    },
    [user]
  )

  const value = useMemo(
    () => ({ user, profile, loading, signIn, signUp, signOut, updateProfile }),
    [user, profile, loading, signIn, signUp, signOut, updateProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}