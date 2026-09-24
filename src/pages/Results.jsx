import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Lock, RotateCcw, Trophy, XCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAudio } from '../contexts/AudioContext'
import { getAttempt, PASSING_SCORE } from '../services/quizService'
import { Button, Card, Modal, Spinner } from '../components/ui'
import { formatClock } from '../utils/helpers'
import { LAW_OF_SINES_LEVELS } from '../data/lawOfSinesData'

export default function Results() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { playSfx } = useAudio()

  const [attempt, setAttempt] = useState(location.state?.result || null)
  const [loading, setLoading] = useState(!location.state?.result)
  const [replayModal, setReplayModal] = useState(false)

  useEffect(() => {
    if (attemptId && !location.state?.result) {
      getAttempt(attemptId)
        .then((a) => {
          setAttempt(a)
          playSfx(a?.passed ? 'unlock' : 'complete')
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [attemptId, location.state, playSfx])

  const result = useMemo(() => {
    if (!attempt) return null
    if (attempt.score !== undefined && attempt.correct_answers !== undefined) return attempt
    // raw DB row
    return attempt
  }, [attempt])

  const justFinishedNonPerfect = Boolean(
    location.state?.result && !location.state.result.passed
  )

  // Arriving straight from a finished quiz below the pass threshold → show the
  // required retake modal for the 90% progression rule.
  useEffect(() => {
    if (justFinishedNonPerfect && !loading) {
      setReplayModal(true)
    }
  }, [justFinishedNonPerfect, loading])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Loading results..." />
      </div>
    )
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-slate-500">No attempt found.</p>
        <Button className="mt-4" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const assessmentType = result?.assessment_type === 'posttest' ? 'posttest' : 'pretest'
  const assessmentLabel = assessmentType === 'posttest' ? 'Post-test' : 'Pre-test'
  const passed = Boolean(result.passed)
  const score = result.score ?? 0
  const correct = result.correct_answers ?? 0
  const wrong = result.wrong_answers ?? 0
  const total = result.total_questions ?? 10
  const levelNumber = result.level_number || result.level?.level_number
  const title = result.level?.title || `Level ${levelNumber}`

  const totalLevels = LAW_OF_SINES_LEVELS.length
  const nextLevel = levelNumber != null ? levelNumber + 1 : 2

  return (
    <div className="mx-auto max-w-xl py-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
        <Card className="overflow-hidden text-center shadow-2xl shadow-slate-300/50">
          <div className={passed ? 'relative overflow-hidden bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 px-6 py-8 shadow-inner' : 'relative overflow-hidden bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 px-6 py-8 text-white shadow-inner'}>
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="animate-float absolute left-8 top-3 h-24 w-24 rounded-full bg-white/10 blur-xl" />
              <div className="animate-float-delay absolute right-10 top-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
              className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/95 text-amber-500 shadow-xl shadow-amber-900/20 ring-4 ring-white/60"
            >
              {passed ? <Trophy className="h-10 w-10" /> : <Lock className="h-9 w-9 text-slate-500" />}
            </motion.div>
            <h1 className="relative mt-4 text-2xl font-extrabold sm:text-3xl">{assessmentLabel} · Level {levelNumber}</h1>
            <p className="relative mt-1 text-sm opacity-80">{title}</p>
          </div>

          <div className="px-6 py-7">
            <p className="text-5xl font-black tracking-tight text-slate-900">
              {score}
              <span className="text-2xl font-bold text-slate-400"> / 100</span>
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="card-lift rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100/50 px-4 py-3 shadow-sm shadow-emerald-200/50">
                <p className="flex items-center justify-center gap-1.5 text-xl font-extrabold text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" /> {correct}
                </p>
                <p className="text-xs font-semibold text-emerald-600">Correct</p>
              </div>
              <div className="card-lift rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-rose-100/50 px-4 py-3 shadow-sm shadow-rose-200/50">
                <p className="flex items-center justify-center gap-1.5 text-xl font-extrabold text-rose-700">
                  <XCircle className="h-5 w-5" /> {wrong}
                </p>
                <p className="text-xs font-semibold text-rose-600">Incorrect</p>
              </div>
              <div className="card-lift rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/60 px-4 py-3 shadow-sm shadow-slate-200/50">
                <p className="text-xl font-extrabold text-slate-700">{correct} / {total}</p>
                <p className="text-xs font-semibold text-slate-500">Correct answers</p>
              </div>
              <div className="card-lift rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-sky-100/50 px-4 py-3 shadow-sm shadow-sky-200/50">
                <p className="text-xl font-extrabold text-sky-700">{result.time_used != null ? formatClock(result.time_used) : '—'}</p>
                <p className="text-xs font-semibold text-sky-600">Time used</p>
              </div>
            </div>

            <div className="mt-6">
              {passed ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 px-5 py-4 shadow-lg shadow-amber-200/60"
                >
                  <p className="text-lg font-extrabold text-amber-700">Pass Score Achieved!</p>
                  <p className="mt-0.5 text-sm text-amber-700/80">
                    {levelNumber < totalLevels ? `Level ${nextLevel} Unlocked! 🎉` : `You conquered all ${totalLevels} levels! Amazing!`}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/60 px-5 py-4 shadow-md shadow-slate-200/60"
                >
                  <p className="text-lg font-extrabold text-slate-700">Level Locked</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    You need a {PASSING_SCORE}/100 score to unlock the next level.
                  </p>
                </motion.div>
              )}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {passed && levelNumber < totalLevels ? (
                <Button size="lg" className="flex-1" onClick={() => navigate(`/quiz/${nextLevel}`)}>
                  Continue to Level {nextLevel} <ArrowRight className="h-4 w-4" />
                </Button>
              ) : passed ? (
                <Button size="lg" className="flex-1" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              ) : (
                <Button size="lg" className="flex-1" onClick={() => setReplayModal(true)}>
                  <RotateCcw className="h-4 w-4" /> Try Again
                </Button>
              )}
              <Button variant="outline" size="lg" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <Modal
        open={replayModal}
        onClose={() => setReplayModal(false)}
        title={passed ? 'Retake Level?' : `${PASSING_SCORE}/100 Required`}
        size="sm"
      >
        {passed ? (
          <p className="text-sm text-slate-600">
            Retaking <strong>Level {levelNumber}</strong> will start a fresh attempt with shuffled questions.
            Your previous score will still be kept in your history.
          </p>
        ) : (
          <div>
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3">
              <Trophy className="h-6 w-6 text-amber-500" />
              <p className="text-sm font-bold text-amber-800">You scored {score}/100</p>
            </div>
            <p className="text-sm text-slate-600">
              You need to score <strong>{PASSING_SCORE}/100</strong> before you can proceed to
              Level {nextLevel}.
            </p>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setReplayModal(false)}>
            {justFinishedNonPerfect ? 'Later' : 'Cancel'}
          </Button>
          <Button onClick={() => navigate(`/quiz/${levelNumber}`)}>
            <RotateCcw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      </Modal>
    </div>
  )
}