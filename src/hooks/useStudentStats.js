import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { getLevels, getMyProgress, getMyAttempts } from '../services/quizService'

const emptyStats = {
  currentLevel: 1,
  completedCount: 0,
  totalPoints: 0,
  bestScore: 0,
  attemptsCount: 0,
  progressPercent: 0,
}

export default function useStudentStats() {
  const [levels, setLevels] = useState([])
  const [progress, setProgress] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const mountedRef = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [lvlRows, prog, att] = await Promise.all([
        getLevels(),
        getMyProgress(),
        getMyAttempts(200),
      ])
      setLevels(lvlRows)
      setProgress(prog)
      setAttempts(att)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    load()
    return () => {
      mountedRef.current = false
    }
  }, [load])

  const progressByLevelId = useMemo(() => {
    const map = {}
    for (const p of Array.isArray(progress) ? progress : []) map[p.level_id] = p
    return map
  }, [progress])

  const levelRows = useMemo(() => {
    const rows = []
    for (const l of levels) {
      const p = progressByLevelId[l.id]
      rows.push({
        ...l,
        progress: p || {
          best_score: 0,
          attempts: 0,
          is_unlocked: false,
          is_completed: false,
        },
      })
    }
    return rows
  }, [levels, progressByLevelId])

  const stats = useMemo(() => {
    const completed = levelRows.filter((r) => r.progress.is_completed)
    const current = levelRows.find((r) => r.progress.is_unlocked && !r.progress.is_completed)
    const totalPoints = levelRows.reduce((sum, r) => sum + (r.progress.best_score || 0), 0)
    const bestScore = levelRows.reduce((m, r) => Math.max(m, r.progress.best_score || 0), 0)
    return {
      currentLevel: current?.level_number || (completed.length === levelRows.length && levelRows.length ? 10 : 1),
      completedCount: completed.length,
      totalPoints,
      bestScore,
      attemptsCount: attempts.length,
      progressPercent: levelRows.length ? Math.round((completed.length / levelRows.length) * 100) : 0,
    }
  }, [levelRows, attempts])

  return { levels, levelRows, progress, attempts, loading, error, stats, refresh: load }
}

export { emptyStats }