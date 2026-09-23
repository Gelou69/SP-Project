import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useAudio } from '../contexts/AudioContext'
import { Button, Input } from '../components/ui'
import { isSupabaseConfigured } from '../services/supabase'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signIn } = useAuth()
  const { showToast } = useToast()
  const { playSfx } = useAudio()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, navigate, from])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn({ username, password })
      playSfx('unlock')
      showToast({ type: 'success', title: 'Welcome back!', message: 'You are signed in.' })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-md items-center justify-center py-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="glow-blob animate-blob left-[-15%] top-[10%] h-72 w-72 bg-sky-400/25" />
        <div className="glow-blob animate-blob-delay bottom-[5%] right-[-10%] h-72 w-72 bg-violet-400/25" />
      </div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full">
        <div className="mb-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="relative mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-sky-300/40 ring-4 ring-white/80"
          >
            <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-sky-100 via-white to-emerald-100" />
            <img src="/logo.png" alt="Canicon City National High School" className="relative h-full w-full object-cover" />
          </motion.div>
          <h1 className="gradient-text mt-4 text-3xl font-extrabold">LAW OF SINES</h1>
          <p className="mt-1 text-sm text-slate-500">Grade 10 Mathematics · Trigonometry Practice</p>
        </div>

        <form onSubmit={onSubmit} className="glass space-y-4 rounded-3xl p-7 shadow-2xl shadow-sky-200/50">
          <h2 className="text-lg font-bold text-slate-900">Sign in</h2>
          <Input
            id="username"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. santos.maria"
            autoComplete="username"
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <LogIn className="h-4 w-4" /> Sign In
          </Button>
          <p className="text-center text-sm text-slate-500">
            New student?{' '}
            <Link to="/signup" className="font-bold text-sky-600 transition-colors hover:text-violet-600">
              Create an account
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}