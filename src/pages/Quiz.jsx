import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Lock, Play, RotateCcw, Trophy } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAudio } from '../contexts/AudioContext'
import { useToast } from '../contexts/ToastContext'
import {
  buildQuiz,
  checkAnswer,
  getLevels,
  getMyProgress,
  submitQuiz,
  PASSING_SCORE,
  QUIZ_TIME_PER_QUESTION,
} from '../services/quizService'
import { useCountdown } from '../hooks/useCountdown'
import { Button, Card, Badge, Spinner } from '../components/ui'
import Timer from '../components/quiz/Timer'
import QuestionCard from '../components/quiz/QuestionCard'

const randomSalt = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

export default function Quiz() {
  const { level } = useParams()
  const [searchParams] = useSearchParams()
  const levelNumber = Number(level)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { playSfx, startQuizMusic, stopQuizMusic } = useAudio()
  const { showToast } = useToast()

  const [levels, setLevels] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [gate, setGate] = useState('loading') // loading | locked | ready | active | submitting
  const [unlocked, setUnlocked] = useState(false)

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selectedLabel, setSelectedLabel] = useState(null)
  const [answerResult, setAnswerResult] = useState(null) // 'correct' | 'wrong' | null
  const startedAtRef = useRef(null)
  const saltRef = useRef(randomSalt())
  const processingRef = useRef(false)
  const quizMusicRef = useRef(false)
  const focusViolationRef = useRef(0)
  const focusFailureLockedRef = useRef(false)
  const lastViolationAtRef = useRef(0)
  const focusLeftRef = useRef(false)

  const attempt = searchParams.get('attempt') || '1'
  const assessmentType = searchParams.get('type') === 'posttest' ? 'posttest' : 'pretest'
  const assessmentLabel = assessmentType === 'posttest' ? 'Post-test' : 'Pre-test'
  const activeQuizSessionKey = `quiz-session-${levelNumber}-${attempt}`
  const levelMeta = useMemo(() => levels.find((l) => l.level_number === levelNumber), [levels, levelNumber])
  const assessmentEnabled = levelMeta
    ? (assessmentType === 'posttest' ? levelMeta.posttest_enabled !== false : levelMeta.pretest_enabled !== false)
    : true

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [lvlRows, prog] = await Promise.all([getLevels(), getMyProgress()])
      setLevels(lvlRows)
      setProgress(prog)
      const levelRow = lvlRows.find((l) => l.level_number === levelNumber)
      const progRow = levelRow ? prog.find((p) => p.level_id === levelRow.id) : null
      const fallbackUnlocked = levelNumber === 1 || Boolean(progRow?.is_unlocked)
      const assessmentEnabled = levelRow
        ? (assessmentType === 'posttest' ? levelRow.posttest_enabled !== false : levelRow.pretest_enabled !== false)
        : false
      setUnlocked(fallbackUnlocked)
      setGate(lvlRows.length && levelRow ? ((fallbackUnlocked && assessmentEnabled) ? 'ready' : 'locked') : 'locked')
    } catch (err) {
      showToast({ type: 'error', title: 'Could not load level', message: err.message })
      setGate('locked')
    } finally {
      setLoading(false)
    }
  }, [assessmentType, levelNumber, showToast])

  useEffect(() => {
    if (!user) return
    load()
  }, [user, load])

  useEffect(() => {
    if (!user || gate !== 'active' || questions.length === 0) return

    const payload = {
      levelNumber,
      attempt,
      currentIndex,
      answers,
      selectedLabel,
      answerResult,
      questions,
      startedAt: startedAtRef.current,
    }

    sessionStorage.setItem(activeQuizSessionKey, JSON.stringify(payload))
  }, [activeQuizSessionKey, answerResult, answers, attempt, currentIndex, gate, levelNumber, questions, selectedLabel, user])

  useEffect(() => {
    if (!user || gate !== 'ready') return

    const saved = sessionStorage.getItem(activeQuizSessionKey)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      if (!parsed || parsed.levelNumber !== levelNumber || parsed.attempt !== attempt) return
      if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) return

      startedAtRef.current = parsed.startedAt || new Date().toISOString()
      setQuestions(parsed.questions)
      setCurrentIndex(parsed.currentIndex || 0)
      setAnswers(parsed.answers || [])
      setSelectedLabel(parsed.selectedLabel ?? null)
      setAnswerResult(parsed.answerResult ?? null)
      setGate('active')
    } catch (err) {
      sessionStorage.removeItem(activeQuizSessionKey)
    }
  }, [activeQuizSessionKey, attempt, gate, levelNumber, user])

  // seconds remaining for the current question
  const countdown = useCountdown({
    key: `q${currentIndex}`,
    duration: QUIZ_TIME_PER_QUESTION,
    onExpire: () => {
      if (processingRef.current) return
      recordAnswer(null)
    },
    onTick: (s) => {
      if (s > 0 && s <= 5) playSfx('tick')
    },
  })

  const currentQuestion = useMemo(() => questions[currentIndex] || null, [questions, currentIndex])

  const advance = useCallback(() => {
    setSelectedLabel(null)
    setAnswerResult(null)
    if (currentIndex + 1 >= questions.length) {
      finalizeQuiz()
    } else {
      setCurrentIndex((i) => i + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questions.length])

  const recordAnswer = useCallback(
    async (label) => {
      if (processingRef.current) return
      processingRef.current = true
      countdown.stop()

      const q = questions[currentIndex]
      if (!q) {
        processingRef.current = false
        return
      }

      const timeUsed =
        label === null ? QUIZ_TIME_PER_QUESTION : QUIZ_TIME_PER_QUESTION - countdown.seconds

      // The correct answer never reaches the browser: the server only answers
      // whether the picked choice was right (instant feedback without exposing
      // the answer key).
      let isCorrect = false
      if (label !== null) {
        isCorrect = await checkAnswer(q.id, label).catch(() => false)
      }

      setAnswers((prev) => [...prev, { questionId: q.id, selectedLabel: label, timeUsed, isCorrect }])
      setSelectedLabel(label)
      setAnswerResult(label === null ? 'wrong' : isCorrect ? 'correct' : 'wrong')

      if (label === null) {
        playSfx('timeup')
        showToast({ type: 'time', title: 'Time is up!', message: 'This question was marked incorrect.' })
      } else if (isCorrect) {
        playSfx('correct')
        showToast({ type: 'success', title: 'Correct! +10 points', message: 'Nice work, keep going!' })
      } else {
        playSfx('wrong')
        showToast({ type: 'wrong', title: 'Incorrect. +0 points', message: 'The correct answer stays hidden — try the next one!' })
      }

      setTimeout(() => {
        processingRef.current = false
        advance()
      }, 1050)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, questions, countdown.seconds, advance, playSfx, showToast]
  )

  const startQuiz = useCallback(async () => {
    try {
      if (!assessmentEnabled) {
        setGate('locked')
        showToast({
          type: 'info',
          title: `${assessmentLabel} disabled`,
          message: 'This assessment is currently turned off by the teacher.',
        })
        return
      }

      focusViolationRef.current = 0
      focusFailureLockedRef.current = false
      focusLeftRef.current = false
      lastViolationAtRef.current = 0
      sessionStorage.removeItem(activeQuizSessionKey)

      setGate('active')
      startQuizMusic()
      quizMusicRef.current = true
      const built = await buildQuiz({ levelNumber, levels, studentId: user.id, attemptSalt: saltRef.current, assessmentType })
      startedAtRef.current = new Date().toISOString()
      setQuestions(built.questions)
      setCurrentIndex(0)
      setAnswers([])
      setSelectedLabel(null)
      setAnswerResult(null)
      playSfx('notify')
      showToast({ type: 'info', title: `${assessmentLabel} started!`, message: `Level ${levelNumber} · answer all 10 questions and reach ${PASSING_SCORE}/100 to continue.` })
    } catch (err) {
      stopQuizMusic()
      quizMusicRef.current = false
      setGate('ready')
      showToast({ type: 'error', title: 'Cannot start quiz', message: err.message })
    }
  }, [activeQuizSessionKey, assessmentEnabled, assessmentLabel, levelNumber, levels, user, showToast, startQuizMusic, stopQuizMusic])

  const finalizeQuiz = useCallback(async (forced = false) => {
    if (gate === 'submitting') return
    setGate('submitting')
    stopQuizMusic()
    quizMusicRef.current = false
    sessionStorage.removeItem(activeQuizSessionKey)
    try {
      const totalTime = Math.round(
        (new Date().getTime() - new Date(startedAtRef.current).getTime()) / 1000
      )
      const submissionAnswers = [...answers]
      if (currentQuestion && !submissionAnswers.some((entry) => entry.questionId === currentQuestion.id)) {
        submissionAnswers.push({
          questionId: currentQuestion.id,
          selectedLabel: selectedLabel ?? null,
          timeUsed: Math.max(0, QUIZ_TIME_PER_QUESTION - countdown.seconds),
          isCorrect: false,
        })
      }
      const result = await submitQuiz({
        levelNumber,
        answers: submissionAnswers,
        timeUsed: totalTime,
        startedAt: startedAtRef.current,
        assessmentType,
      })
      playSfx(result.passed ? 'unlock' : 'complete')
      if (forced) {
        showToast({
          type: 'info',
          title: 'Quiz auto-failed',
          message: 'You were removed from the quiz focus. Please try again.',
          duration: 4000,
        })
      }
      navigate(`/results/${result.attempt_id}`, { state: { result } })
    } catch (err) {
      setGate('active')
      showToast({ type: 'error', title: 'Submit failed', message: err.message })
      showToast({ type: 'info', title: 'Retry submitted answers', message: 'The level has been saved, no points were recorded.' })
    }
  }, [answers, countdown.seconds, currentQuestion, gate, levelNumber, navigate, playSfx, selectedLabel, showToast, startQuizMusic, stopQuizMusic])

  const handleFocusViolation = useCallback(async (reason) => {
    if (gate !== 'active' || focusFailureLockedRef.current || processingRef.current) return
    if (focusLeftRef.current) return

    focusLeftRef.current = true

    const now = Date.now()
    if (now - lastViolationAtRef.current < 1200) return
    lastViolationAtRef.current = now

    focusViolationRef.current += 1

    if (focusViolationRef.current === 1) {
      showToast({
        type: 'info',
        title: 'First warning',
        message: 'Please stay focused on this quiz. Switching tabs or closing the page will fail the attempt.',
      })
      return
    }

    if (focusViolationRef.current === 2) {
      showToast({
        type: 'info',
        title: 'Last warning',
        message: 'This is your final warning. The next tab change or browser close will auto-fail this attempt.',
      })
      return
    }

    focusFailureLockedRef.current = true
    showToast({
      type: 'error',
      title: 'Quiz failed',
      message: `The quiz was ended because you ${reason}. Please try again.`,
    })
    countdown.stop()
    await finalizeQuiz(true)
  }, [countdown, finalizeQuiz, gate, showToast])

  useEffect(() => {
    if (gate !== 'active') return

    const resetFocusState = () => {
      focusLeftRef.current = false
      lastViolationAtRef.current = 0
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleFocusViolation('left the quiz tab')
      } else {
        resetFocusState()
      }
    }

    const onWindowBlur = () => {
      if (document.hidden || !document.hasFocus()) {
        handleFocusViolation('left the quiz window')
      }
    }

    const onWindowFocus = () => {
      resetFocusState()
    }

    const onBeforeUnload = (event) => {
      if (gate !== 'active') return
      event.preventDefault()
      event.returnValue = ''
      handleFocusViolation('closed the website')
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onWindowBlur)
    window.addEventListener('focus', onWindowFocus)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onWindowBlur)
      window.removeEventListener('focus', onWindowFocus)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [gate, handleFocusViolation])

  useEffect(() => () => {
    if (quizMusicRef.current) stopQuizMusic()
  }, [stopQuizMusic])

  const isReady = gate === 'active' && questions.length > 0
  const progressScore = answers.filter((a) => a.isCorrect).length * 10

  if (loading || gate === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Loading level..." />
      </div>
    )
  }

  if (gate === 'locked') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 shadow-xl shadow-slate-300/40 ring-1 ring-slate-200"
        >
          <div aria-hidden className="pulse-ring absolute inset-0 rounded-full bg-rose-300/40" />
          <Lock className="relative h-9 w-9 text-slate-500" />
        </motion.div>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-900">{assessmentEnabled ? `Level ${levelNumber} is locked` : `${assessmentLabel} is disabled`}</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-600">
          {assessmentEnabled
            ? `You need a ${PASSING_SCORE}/100 score on Level ${levelNumber - 1} to unlock this level.`
            : `This ${assessmentLabel.toLowerCase()} is currently turned off by the teacher. Please wait until it is enabled.`}
        </p>
        <Button className="mt-6" variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    )
  }

  if (gate === 'ready') {
    return (
      <div className="mx-auto max-w-xl py-6">
        <Card className="overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-violet-600 to-emerald-600 px-6 py-8 text-white shadow-inner">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="animate-float absolute -left-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-xl" />
              <div className="animate-float-delay absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-xl" />
            </div>
            <Badge tone="amber" className="relative bg-amber-400 text-amber-950 shadow-md shadow-amber-300/50">
              Level {levelNumber} of 10
            </Badge>
            <h1 className="relative mt-3 text-3xl font-extrabold">{levelMeta?.title || `Level ${levelNumber}`}</h1>
            <p className="relative mt-1 text-sm text-white/80">{levelMeta?.description}</p>
          </div>
          <div className="space-y-3 px-6 py-6 text-sm text-slate-600">
            <p className="group flex items-center justify-between border-b border-slate-100 pb-3 transition-colors hover:bg-slate-50/60 hover:px-2">
              <span>Questions</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-900">10</span>
            </p>
            <p className="group flex items-center justify-between border-b border-slate-100 pb-3 transition-colors hover:bg-slate-50/60 hover:px-2">
              <span>Points per question</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-900">10</span>
            </p>
            <p className="group flex items-center justify-between border-b border-slate-100 pb-3 transition-colors hover:bg-slate-50/60 hover:px-2">
              <span>Time per question</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-900">60 seconds</span>
            </p>
            <p className="flex items-center justify-between">
              <span>Passing score (to unlock next)</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-700 shadow-sm shadow-emerald-200/60">{PASSING_SCORE} / 100</span>
            </p>
            <p className="rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 to-violet-50 px-4 py-3 text-xs text-sky-700 shadow-sm shadow-sky-100/60">
              Questions and answer choices are shuffled every attempt. Your score and level unlocks are
              validated securely by the database.
            </p>
            <div className="pt-2">
              <Button size="lg" className="w-full" onClick={startQuiz}>
                <Play className="h-4 w-4" /> Start Level {levelNumber}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (gate === 'submitting') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Spinner label="Scoring your quiz securely..." />
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Trophy className="h-4 w-4 text-amber-500" /> Validating your score in the database
        </p>
      </div>
    )
  }

  // Active quiz
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-white hover:text-slate-700 hover:shadow-md hover:shadow-slate-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Exit
        </button>
        <Badge tone="violet" className="shadow-md shadow-violet-200/50">
          Attempt {attempt} · Level {levelNumber}
        </Badge>
        <div className="flex items-center gap-2">
          <Timer seconds={countdown.seconds} total={QUIZ_TIME_PER_QUESTION} />
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <ProgressLite value={answers.length} max={questions.length} />
        <span className="whitespace-nowrap text-lg font-extrabold text-slate-900">{progressScore} / 100</span>
      </div>

      <Card className="relative overflow-hidden p-5 shadow-2xl shadow-sky-200/40 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-violet-400 to-emerald-400"
        />
        <AnimatePresence mode="wait">
          {isReady && currentQuestion ? (
            <QuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              index={currentIndex}
              total={questions.length}
              selectedLabel={selectedLabel}
              answerResult={answerResult}
              onSelect={recordAnswer}
              locked={selectedLabel !== null}
            />
          ) : null}
        </AnimatePresence>
      </Card>
    </div>
  )
}

function ProgressLite({ value, max }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="progress-shine h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200 shadow-inner">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500"
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      />
    </div>
  )
}