import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Volume2, VolumeX, ShieldCheck, Settings2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useAudio } from '../../contexts/AudioContext'
import { useToast } from '../../contexts/ToastContext'
import { cn, Button } from '../ui'
import { initials } from '../../utils/helpers'

function AudioControls() {
  const { sfx, toggleSfx } = useAudio()
  const { showToast } = useToast()
  const btn =
    'inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm shadow-slate-200/60 backdrop-blur transition-all duration-200 hover:border-sky-300 hover:bg-white hover:shadow-md hover:shadow-sky-200/50 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500'

  return (
    <div className="flex items-center gap-2">
      <button
        className={btn}
        onClick={() => {
          toggleSfx()
          showToast({ type: 'info', title: sfx ? 'Sound effects off' : 'Sound effects on' })
        }}
        aria-pressed={sfx}
        aria-label="Toggle sound effects"
        title="Sound effects"
      >
        {sfx ? <Volume2 className="h-4 w-4 text-sky-600" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
        {sfx ? 'SFX' : 'Muted'}
      </button>
    </div>
  )
}

export default function Layout() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="flex min-h-screen flex-col">
      {/* ambient animated aurora blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="glow-blob animate-blob left-[-10%] top-[-5%] h-80 w-80 bg-sky-400/30" />
        <div className="glow-blob animate-blob-delay right-[-8%] top-[20%] h-96 w-96 bg-violet-400/25" />
        <div className="glow-blob animate-blob left-[30%] bottom-[-10%] h-80 w-80 bg-emerald-400/20" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/75 shadow-lg shadow-sky-100/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to={isAdmin ? '/admin' : '/dashboard'} className="group flex items-center gap-3 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.12 }}
              transition={{ type: 'spring', stiffness: 320, damping: 16 }}
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-sky-300/40 ring-2 ring-sky-200/80"
            >
              <img src="/logo.png" alt="Law of Sines logo" className="h-full w-full object-cover" />
            </motion.div>
            <div className="leading-tight">
              <p className="text-base font-black tracking-[0.18em] text-slate-900 transition-all duration-200 group-hover:text-sky-700 sm:text-lg">
                LAW OF SINES
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Grade 10 Math Quests</p>
              <p className="mt-1 text-[11px] font-black tracking-[0.08em] text-transparent bg-gradient-to-r from-sky-600 via-violet-600 to-emerald-600 bg-clip-text sm:text-sm">
                Dr. Sahawi S. Malik
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <AudioControls />
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    'hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 sm:inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
                    isActive
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-300/50'
                      : 'text-slate-500 hover:bg-white hover:shadow-md hover:shadow-violet-200/50'
                  )
                }
                title="Admin dashboard"
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </NavLink>
            )}
            {user && (
              <div className="flex items-center gap-2">
                <Link
                  to={isAdmin ? '/admin' : '/profile'}
                  className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  aria-label="Profile"
                >
                  <motion.span
                    whileHover={{ scale: 1.12 }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-500 text-xs font-extrabold text-white shadow-lg shadow-sky-300/50 ring-2 ring-white"
                  >
                    {initials(profile?.full_name || 'User')}
                  </motion.span>
                </Link>
                {isAdmin && (
                  <Link to="/profile" className="hidden text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600 sm:block">
                    <Settings2 className="h-4 w-4" />
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Sign out">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="relative z-10 border-t border-white/70 bg-white/60 py-4 text-center text-xs text-slate-400 backdrop-blur">
        <span className="gradient-text font-semibold">LAW OF SINES</span> · Grade 10 Mathematics · Triangle Relationships, Angles, and Applications
      </footer>
    </div>
  )
}