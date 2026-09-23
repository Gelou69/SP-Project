import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { cn } from '../ui'

export const LETTERS = ['A', 'B', 'C', 'D']

export default function AnswerOption({ label, text, state, onSelect, disabled }) {
  const base =
    'group flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2'

  const styles = {
    idle: 'border-slate-200 bg-white/90 shadow-sm shadow-slate-100 hover:border-sky-400 hover:-translate-y-0.5 hover:bg-sky-50/70 hover:shadow-lg hover:shadow-sky-200/50 cursor-pointer',
    selected: 'border-sky-500 bg-sky-50 shadow-lg shadow-sky-200/50 cursor-default',
    correct: 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-200/60 cursor-default',
    wrong: 'border-rose-500 bg-rose-50 shadow-lg shadow-rose-200/50 cursor-default',
  }

  const letterStyles = {
    idle: 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 group-hover:from-sky-500 group-hover:to-blue-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-sky-300/50',
    selected: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-300/50',
    correct: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-300/50',
    wrong: 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-300/50',
  }

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      whileHover={state === 'idle' ? { scale: 1.01 } : {}}
      whileTap={state === 'idle' ? { scale: 0.98 } : {}}
      onClick={onSelect}
      disabled={disabled || state !== 'idle'}
      className={cn(base, styles[state], disabled && state === 'idle' && 'pointer-events-none')}
      aria-pressed={state === 'selected'}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold transition-all duration-200',
          letterStyles[state]
        )}
      >
        {state === 'correct' ? <Check className="h-5 w-5" aria-hidden /> : state === 'wrong' ? <X className="h-5 w-5" aria-hidden /> : label}
      </span>
      <span className="flex-1 text-sm font-semibold text-slate-800 transition-colors group-hover:text-slate-900 sm:text-base">{text}</span>
      {state === 'correct' && (
        <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm shadow-emerald-300/50">
          Correct
        </span>
      )}
      {state === 'wrong' && (
        <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm shadow-rose-300/50">
          Incorrect
        </span>
      )}
    </motion.button>
  )
}