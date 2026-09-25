import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Lock,
  Medal,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react'
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
  const { user, profile } = useAuth()
  const { playSfx } = useAudio()

  const [attempt, setAttempt] = useState(location.state?.result || null)
  const [loading, setLoading] = useState(!location.state?.result)
  const [replayModal, setReplayModal] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

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

  const score = Number(result.score ?? result.percentage ?? 0)
  const effectivePassed = score >= PASSING_SCORE || Boolean(result.passed)
  const justFinishedNonPerfect = Boolean(
    location.state?.result && !effectivePassed
  )

  // Arriving straight from a finished quiz below the pass threshold → show the
  // required retake modal for the 80% progression rule.
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
  const passed = score >= PASSING_SCORE || Boolean(result.passed)
  const correct = result.correct_answers ?? 0
  const wrong = result.wrong_answers ?? 0
  const total = result.total_questions ?? 10
  const levelNumber = result.level_number || result.level?.level_number
  const title = result.level?.title || `Level ${levelNumber}`

  const totalLevels = LAW_OF_SINES_LEVELS.length
  const certificateLevelsRequired = Math.min(5, totalLevels)
  const nextLevel = levelNumber != null ? levelNumber + 1 : 2
  const lectureVideoUrl = 'https://youtu.be/MmfO1YgzmHI?si=MF-xBK3_Mt3KVHXd'
  const certificateName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.full_name ||
    user?.email?.split('@')[0] ||
    'Student'
  const isFinalAchievement = passed && levelNumber >= certificateLevelsRequired

  const handleDownloadCertificate = async () => {
    const name = (certificateName || 'Student').trim() || 'Student'
    setIsDownloading(true)

    try {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.src = '/Certificate.png'

      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = () => reject(new Error('Certificate image failed to load'))
      })

      const canvas = document.createElement('canvas')
      const width = 1600
      const height = 1000
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(image, 0, 0, width, height)

      const safeName = name.toUpperCase()
      const centerX = width / 2
      const nameY = 665

      ctx.save()
      ctx.translate(centerX, nameY)
      ctx.shadowColor = 'rgba(245, 158, 11, 0.45)'
      ctx.shadowBlur = 18
      ctx.fillStyle = 'rgba(255,255,255,0.26)'
      ctx.beginPath()
      ctx.roundRect(-420, -38, 840, 110, 26)
      ctx.fill()
      ctx.restore()

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#1f2937'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
      ctx.shadowBlur = 7
      ctx.shadowOffsetY = 3
      ctx.font = safeName.length > 18 ? '700 56px Georgia, serif' : safeName.length > 12 ? '700 68px Georgia, serif' : '700 80px Georgia, serif'
      ctx.fillText(safeName, centerX, nameY)

      const link = document.createElement('a')
      link.download = `${safeName.trim().replace(/\s+/g, '_')}-Certificate.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Certificate download failed:', error)
      window.open('/Certificate.png', '_blank', 'noopener,noreferrer')
    } finally {
      setIsDownloading(false)
    }
  }

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
                  className="rounded-3xl border-4 border-amber-300 bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-200 px-5 py-5 shadow-xl shadow-amber-300/50"
                >
                  <p className="text-2xl font-black tracking-wide text-amber-950 sm:text-3xl">
                    {levelNumber < totalLevels ? `Level ${nextLevel} Unlocked!` : `You completed all ${totalLevels} levels!`}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-amber-900/80">
                    Excellent work — you earned {score}/100 and can continue to the next level. 🎉
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
                    Complete the level and get 80+ average score to unlock the certificate.
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    You need a {PASSING_SCORE}/100 score to continue.
                  </p>
                </motion.div>
              )}
            </div>

            {isFinalAchievement && (
              <motion.div
                initial={{ opacity: 0, y: 22, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-7 overflow-hidden rounded-[28px] border border-amber-200/80 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 p-4 shadow-[0_25px_60px_-25px_rgba(245,158,11,0.7)]"
              >
                <div className="mb-3 flex items-center justify-center gap-2 text-amber-700">
                  <Medal className="h-5 w-5" />
                  <p className="text-sm font-black uppercase tracking-[0.24em]">Achievement unlocked</p>
                </div>

                <div className="relative overflow-hidden rounded-[22px] border border-white/70 bg-slate-900/5 p-3 shadow-inner shadow-amber-200/40">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(circle at top, rgba(251,191,36,0.3), transparent 42%), radial-gradient(circle at bottom, rgba(14,165,233,0.18), transparent 48%)',
                    }}
                  />
                  <div className="relative">
                    <img
                      src="/Certificate.png"
                      alt="Achievement certificate"
                      className="h-auto w-full rounded-[18px] object-cover shadow-2xl shadow-amber-200/40"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-[30%] flex justify-center px-6">
                      <div className="rounded-full border border-amber-300/80 bg-white/50 px-5 py-2 shadow-[0_0_24px_rgba(245,158,11,0.18)] backdrop-blur-[2px]">
                        <span className="font-serif text-[clamp(1.2rem,3vw,2.7rem)] font-black uppercase tracking-[0.08em] text-slate-800">
                          {certificateName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="flex-1 btn-sheen" onClick={() => window.open('/Certificate.png', '_blank', 'noopener,noreferrer')}>
                    <Download className="h-4 w-4" />
                    View Certificate
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleDownloadCertificate}>
                    {isDownloading ? 'Preparing...' : 'Download'}
                  </Button>
                </div>
              </motion.div>
            )}

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
          <Button
            variant="outline"
            onClick={() => window.open(lectureVideoUrl, '_blank', 'noopener,noreferrer')}
          >
            Study first
          </Button>
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