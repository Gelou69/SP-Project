import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, Lock, Trophy, Sparkles, Info, PartyPopper } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  wrong: XCircle,
  time: Clock,
  locked: Lock,
  unlock: PartyPopper,
  perfect: Trophy,
  info: Info,
  sparkle: Sparkles,
}

const COLORS = {
  success: 'border-emerald-400/50 bg-white/85 text-emerald-900 shadow-emerald-200/60 backdrop-blur',
  error: 'border-rose-400/50 bg-white/85 text-rose-900 shadow-rose-200/60 backdrop-blur',
  wrong: 'border-rose-400/50 bg-white/85 text-rose-900 shadow-rose-200/60 backdrop-blur',
  time: 'border-amber-400/50 bg-white/85 text-amber-900 shadow-amber-200/60 backdrop-blur',
  locked: 'border-slate-300/60 bg-white/85 text-slate-900 shadow-slate-200/60 backdrop-blur',
  unlock: 'border-violet-400/50 bg-white/85 text-violet-900 shadow-violet-200/60 backdrop-blur',
  perfect: 'border-amber-400/60 bg-gradient-to-r from-white via-amber-50 to-yellow-50 text-amber-900 shadow-amber-200/60 backdrop-blur',
  info: 'border-sky-400/50 bg-white/85 text-sky-900 shadow-sky-200/60 backdrop-blur',
  sparkle: 'border-fuchsia-400/50 bg-white/85 text-fuchsia-900 shadow-fuchsia-200/60 backdrop-blur',
}

function Toast({ toast, onDone }) {
  const Icon = ICONS[toast.type] || Info
  const color = COLORS[toast.type] || COLORS.info
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl ${color}`}
      role="status"
      aria-live="polite"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        {toast.title && <p className="text-sm font-bold leading-tight">{toast.title}</p>}
        {toast.message && <p className="mt-0.5 text-xs leading-snug opacity-90">{toast.message}</p>}
      </div>
    </motion.div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    ({ type = 'info', title, message, duration = 3000 }) => {
      const id = ++idRef.current
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message }])
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss]
  )

  const value = useMemo(() => ({ showToast, dismiss }), [showToast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}