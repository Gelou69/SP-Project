import { useEffect, useRef, useState } from 'react'

/**
 * A countdown that resets whenever `key` changes.
 * Calls onExpire() when it reaches zero. Returns seconds remaining.
 */
export function useCountdown({ key, duration = 30, onExpire, onTick }) {
  const [seconds, setSeconds] = useState(duration)
  const [running, setRunning] = useState(true)
  const onExpireRef = useRef(onExpire)
  const onTickRef = useRef(onTick)
  onExpireRef.current = onExpire
  onTickRef.current = onTick

  useEffect(() => {
    setSeconds(duration)
    setRunning(true)
  }, [key, duration])

  useEffect(() => {
    if (!running) return undefined
    if (seconds <= 0) {
      onExpireRef.current?.()
      return undefined
    }
    const timer = setTimeout(() => {
      setSeconds((s) => s - 1)
      onTickRef.current?.(seconds - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [running, seconds])

  const stop = () => setRunning(false)
  const reset = () => {
    setSeconds(duration)
    setRunning(true)
  }

  return { seconds, running, stop, reset }
}