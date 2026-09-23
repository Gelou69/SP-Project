import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useAudio } from '../contexts/AudioContext'
import { Button, Input } from '../components/ui'
import { calculateAge } from '../utils/helpers'

const today = new Date().toISOString().split('T')[0]

export default function Signup() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signUp } = useAuth()
  const { showToast } = useToast()
  const { playSfx } = useAudio()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'
  const age = useMemo(() => calculateAge(birthdate), [birthdate])
  const validate = () => {
    if (!fullName.trim() || fullName.trim().split(/\s+/).length < 2) {
      return 'Please enter your full first and last name.'
    }
    if (!/^[a-z0-9]+\.[a-z0-9]+$/i.test(username.trim())) {
      return 'Username must use the format lastname.firstname, for example carpio.angelou.'
    }
    if (!age || age < 5) return 'Please enter a valid birthdate. Students are at least 5 years old.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (password !== confirm) return 'Passwords do not match.'
    return ''
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setLoading(true)
    try {
      const profile = await signUp({ fullName, username, birthdate, password })
      playSfx('unlock')
      showToast({
        type: 'sparkle',
        title: 'Account created!',
        message: profile?.username
          ? `Your username is ${profile.username}. You can now sign in with it.`
          : 'You can now sign in with your username.',
      })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-lg items-center justify-center py-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="glow-blob animate-blob right-[-12%] top-[8%] h-80 w-80 bg-violet-400/25" />
        <div className="glow-blob animate-blob-delay bottom-[5%] left-[-12%] h-72 w-72 bg-emerald-400/20" />
      </div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full">
        <div className="mb-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="relative mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-violet-300/40 ring-4 ring-white/80"
          >
            <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-violet-100 via-white to-emerald-100" />
            <img src="/logo.png" alt="Canicon City National High School" className="relative h-full w-full object-cover" />
          </motion.div>
          <h1 className="gradient-text mt-4 text-3xl font-extrabold">Create Account</h1>
          <p className="mt-1 text-sm text-slate-500">Choose a username in the format lastname.firstname</p>
        </div>

        <form onSubmit={onSubmit} className="glass space-y-4 rounded-3xl p-7 shadow-2xl shadow-violet-200/50">
          <Input
            id="full_name"
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Angelou Carpio"
            autoComplete="name"
            required
          />

          <Input
            id="username"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
            placeholder="e.g. carpio.angelou"
            autoComplete="username"
            pattern="[a-zA-Z0-9]+\.[a-zA-Z0-9]+"
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="birthdate"
              label="Birthdate"
              type="date"
              value={birthdate}
              max={today}
              onChange={(e) => setBirthdate(e.target.value)}
              required
            />
            <div className="flex flex-col justify-end pb-1">
              <span className="text-sm font-semibold text-slate-700">Age</span>
              <span className={`mt-1.5 rounded-xl px-3 py-2 text-sm font-bold ${age ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                {age ? `${age} years old` : '—'}
              </span>
            </div>
          </div>

          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            required
          />
          <Input
            id="confirm"
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            autoComplete="new-password"
            required
          />

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <UserPlus className="h-4 w-4" /> Create Account
          </Button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-sky-600 hover:text-sky-700">
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}