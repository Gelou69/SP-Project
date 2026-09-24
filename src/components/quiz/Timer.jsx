import { cn } from '../ui'
import { Clock3 } from 'lucide-react'

/** Circular countdown ring. Turns red in the final seconds. */
export default function Timer({ seconds, total = 60, muted = false }) {
  const ratio = Math.max(0, Math.min(1, seconds / total))
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const dash = circumference * (1 - ratio)
  const danger = seconds <= 5
  const stroke = danger ? '#f43f5e' : '#0ea5e9'

  return (
    <div
      className={cn(
        'relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg ring-4 backdrop-blur',
        danger
          ? 'ring-rose-200 shadow-rose-300/60 animate-pulse'
          : 'ring-sky-200 shadow-sky-300/50'
      )}
      role="timer"
      aria-label={`${seconds} seconds remaining`}
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dash}
        />
      </svg>
      <div className="flex flex-col items-center leading-none">
        <span className={cn('text-2xl font-extrabold tabular-nums', danger ? 'text-rose-600' : 'text-slate-900')}>
          {seconds}
        </span>
        <Clock3 className={cn('mt-0.5 h-3 w-3', danger ? 'text-rose-400' : 'text-slate-400')} aria-hidden />
      </div>
    </div>
  )
}