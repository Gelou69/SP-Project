import { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'

const loader = (cx) => (...classes) => cx.filter(Boolean).join(' ')

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// ---------------- Button ----------------
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, className = '', children, disabled, ...props },
  ref
) {
  const variants = {
    primary: 'btn-sheen bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 text-white shadow-lg shadow-sky-300/50 hover:shadow-xl hover:shadow-sky-300/60',
    success: 'btn-sheen bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-300/50 hover:shadow-xl hover:shadow-emerald-300/60',
    outline: 'border border-slate-300 bg-white/80 backdrop-blur text-slate-700 shadow-sm hover:border-sky-400 hover:bg-white hover:shadow-md hover:shadow-sky-200/60',
    ghost: 'text-slate-600 hover:bg-white/80 hover:shadow-sm hover:shadow-slate-200',
    danger: 'btn-sheen bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 text-white shadow-lg shadow-rose-300/50 hover:shadow-xl hover:shadow-rose-300/60',
    amber: 'btn-sheen bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white shadow-lg shadow-amber-300/50 hover:shadow-xl hover:shadow-amber-300/60',
    violet: 'btn-sheen bg-gradient-to-r from-violet-500 via-violet-600 to-purple-600 text-white shadow-lg shadow-violet-300/50 hover:shadow-xl hover:shadow-violet-300/60',
  }
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return (
    <motion.button
      ref={ref}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96, y: 0 }}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  )
})

// ---------------- Card ----------------
export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={cn(
        'card-lift rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4', className)}>
      <div>
        {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ---------------- Badge ----------------
export function Badge({ tone = 'slate', className = '', children }) {
  const tones = {
    slate: 'border-slate-200 bg-slate-100/70 text-slate-600 shadow-sm shadow-slate-200/50',
    sky: 'border-sky-200 bg-sky-100/70 text-sky-700 shadow-sm shadow-sky-200/60',
    green: 'border-emerald-200 bg-emerald-100/70 text-emerald-700 shadow-sm shadow-emerald-200/60',
    amber: 'border-amber-200 bg-amber-100/70 text-amber-700 shadow-sm shadow-amber-200/60',
    rose: 'border-rose-200 bg-rose-100/70 text-rose-700 shadow-sm shadow-rose-200/60',
    violet: 'border-violet-200 bg-violet-100/70 text-violet-700 shadow-sm shadow-violet-200/60',
    blue: 'border-blue-200 bg-blue-100/70 text-blue-700 shadow-sm shadow-blue-200/60',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm transition-transform duration-200', tones[tone], className)}>
      {children}
    </span>
  )
}

export function LockBadge({ locked }) {
  return (
    <Badge tone={locked ? 'slate' : 'green'}>{locked ? 'Locked' : 'Unlocked'}</Badge>
  )
}

// ---------------- Input / Select ----------------
const fieldBase =
  'w-full rounded-2xl border bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm shadow-slate-100 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-sky-500/20 hover:shadow-md hover:shadow-sky-100'

export const Input = forwardRef(function Input({ label, error, hint, className = '', id, ...props }, ref) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={cn(
          fieldBase,
          error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/20' : 'border-slate-300 focus:border-sky-500'
        )}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
})

export const Select = forwardRef(function Select({ label, error, className = '', id, children, ...props }, ref) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={cn(
          fieldBase,
          'appearance-none pr-8',
          error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/20' : 'border-slate-300 focus:border-sky-500'
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
})

export function Textarea({ label, error, className = '', id, ...props }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          fieldBase,
          error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/20' : 'border-slate-300 focus:border-sky-500'
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}

// ---------------- Progress bar ----------------
export function ProgressBar({ value = 0, max = 100, tone = 'sky', className = '', height = 'h-2.5' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const tones = {
    sky: 'bg-gradient-to-r from-sky-500 to-blue-400',
    green: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    amber: 'bg-gradient-to-r from-amber-400 to-orange-400',
    rose: 'bg-gradient-to-r from-rose-500 to-red-400',
    violet: 'bg-gradient-to-r from-violet-500 to-purple-400',
    gradient: 'bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500',
  }
  return (
    <div className={cn('progress-shine w-full overflow-hidden rounded-full bg-slate-100 shadow-inner', height, className)}>
      <motion.div
        className={cn('h-full rounded-full', tones[tone])}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  )
}

// ---------------- Modal ----------------
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className={cn('w-full rounded-3xl border border-slate-200/70 bg-white shadow-2xl shadow-violet-500/10', sizes[size])}
          >
            <div className="relative flex items-start justify-between gap-4 overflow-hidden border-b border-slate-100 px-6 py-4">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-50 via-violet-50 to-emerald-50"
              />
              <div className="relative flex-1">
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="relative rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="px-6 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 rounded-b-3xl">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---------------- Confirm dialog ----------------
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = true, onConfirm, onCancel, loading = false }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

// ---------------- Empty state ----------------
export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 px-6 py-12 text-center backdrop-blur-sm">
      {Icon && <Icon className="h-10 w-10 text-slate-300" />}
      <p className="mt-3 text-sm font-bold text-slate-700">{title}</p>
      {message && <p className="mt-1 max-w-sm text-xs text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ---------------- Spinner ----------------
export function Spinner({ label = 'Loading...', className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16', className)} role="status">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="h-10 w-10 rounded-full border-4 border-sky-200 border-t-sky-600 shadow-lg shadow-sky-300/30"
      />
      <p className="animate-pulse text-sm text-slate-500">{label}</p>
    </div>
  )
}

// ---------------- Toggle (switch) ----------------
export function Toggle({ checked, onChange, label, ariaLabel = label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
        checked ? 'bg-gradient-to-r from-sky-500 to-violet-500 shadow-md shadow-sky-300/50' : 'bg-slate-300'
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}

// ---------------- Page heading ----------------
export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-100 to-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-sky-700 shadow-sm shadow-violet-200/50">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export default loader