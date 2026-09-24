import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Award, BookOpen, CheckCircle2, Lock, LockOpen, Play, History, Star, Target, Medal, TrendingUp, Trophy,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAudio } from '../contexts/AudioContext'
import useStudentStats from '../hooks/useStudentStats'
import { getLeaderboard, getLevelNotes } from '../services/quizService'
import { Badge, Button, Card, EmptyState, Modal, ProgressBar, Spinner } from '../components/ui'
import { calculateAge, formatDateTime, progressPercent } from '../utils/helpers'

const LEVEL_EMOJI = {
  1: '🧬', 2: '🦴', 3: '🐒', 4: '🦇', 5: '🦎',
  6: '🌳', 7: '🌿', 8: '🐦', 9: '👨‍👩‍👧', 10: '👑',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { playSfx } = useAudio()
  const { levelRows, attempts, loading, error, stats } = useStudentStats()
  const [leaderboard, setLeaderboard] = useState([])
  const [notes, setNotes] = useState(null)

  useEffect(() => {
    getLeaderboard(10)
      .then((rows) => setLeaderboard(rows))
      .catch(() => setLeaderboard([]))
  }, [])

  const openLevelNotes = async (levelNumber) => {
    try {
      const noteSet = await getLevelNotes(levelNumber)
      setNotes({
        ...noteSet,
        title: 'Law of Sines Lecture Video',
        summary: 'Watch the main lesson for all levels and review the key ideas before continuing.',
        quickReview: 'This lesson is used as the shared overview for the whole journey, so you can prepare before each quiz challenge.',
        keyPoints: ['Review the main triangle relationship', 'Watch the full explanation before retrying', 'Use this lesson as your overall prep for the next level'],
        level_number: null,
      })
    } catch (err) {
      setNotes({
        title: 'Law of Sines Lecture Video',
        summary: 'Watch the main lesson for all levels and review the key ideas before continuing.',
        quickReview: 'This lesson is used as the shared overview for the whole journey, so you can prepare before each quiz challenge.',
        keyPoints: ['Review the main triangle relationship', 'Watch the full explanation before retrying', 'Use this lesson as your overall prep for the next level'],
        level_number: null,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading your progress..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* greeting */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="portal-panel relative overflow-hidden rounded-[28px] border border-sky-200/80 bg-gradient-to-r from-sky-100 via-sky-50 to-sky-100 p-5 text-slate-800 shadow-[0_12px_26px_-18px_rgba(14,165,233,0.5)] sm:p-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-8 top-5 h-14 w-14 rounded-full bg-sky-200/35 blur-xl" />
          <div className="absolute right-24 top-6 h-16 w-16 rounded-full bg-violet-200/25 blur-xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.7),_transparent_40%)]" />
        </div>

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-xl shadow-sm shadow-amber-200/60 ring-1 ring-amber-200/80">
              👋
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-600">Welcome back</p>
              <h1 className="truncate text-xl font-extrabold text-slate-900 sm:text-2xl">
                {profile?.full_name?.split(' ')[0] || 'Student'}
              </h1>
            </div>
          </div>

          <div className="flex w-[220px] shrink-0 items-center justify-center rounded-[22px] border border-slate-200/80 bg-white/75 p-3 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.35)] backdrop-blur-sm">
            <div className="flex w-full items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Progress</p>
                <p className="text-sm font-black text-slate-800">{stats.progressPercent}%</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-500 text-sm font-black text-white shadow-md shadow-sky-200/60">
                {stats.completedCount}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* stats */}
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Star} label="Total Points" value={stats.totalPoints} tone="amber" />
        <StatCard icon={Target} label="Best Score" value={`${stats.bestScore}/100`} tone="emerald" />
        <StatCard icon={Medal} label="Completed Levels" value={`${stats.completedCount}/10`} tone="sky" />
        <StatCard icon={History} label="Quiz Attempts" value={stats.attemptsCount} tone="violet" />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200">
          {error}
        </p>
      )}

      {/* level grid */}
      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-slate-900">
          <Target className="h-5 w-5 text-sky-600" /> Choose a Level
        </h2>

        {levelRows.length === 0 ? (
          <EmptyState
            icon={Lock}
            title="No levels available yet"
            message="Ask your teacher to run the schema and seed SQL, and to assign the levels."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {levelRows.map((row, idx) => (
              <LevelCard
                key={row.id}
                row={row}
                index={idx}
                onPlay={(type) => {
                  playSfx('click')
                  navigate(`/quiz/${row.level_number}?type=${type}`)
                }}
                onNotes={(levelNumber) => {
                  playSfx('click')
                  openLevelNotes(levelNumber)
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="portal-panel floating-card overflow-hidden border-0 bg-white/75">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <Trophy className="h-5 w-5 text-amber-500" /> Top 10 Leaderboard
            </h2>
            <Badge tone="amber">Most correct</Badge>
          </div>
          <div className="divide-y divide-slate-100">
            {leaderboard.length === 0 ? (
              <div className="px-5 py-8 text-sm text-slate-500">No leaderboard data available yet.</div>
            ) : (
              leaderboard.map((entry) => (
                <div key={`${entry.student_id || entry.username || entry.rank}`} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ${entry.rank === 1 ? 'bg-amber-100 text-amber-700' : entry.rank === 2 ? 'bg-slate-200 text-slate-700' : entry.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-sky-50 text-sky-700'}`}>
                      {entry.rank === 1 ? '1st' : entry.rank === 2 ? '2nd' : entry.rank === 3 ? '3rd' : `${entry.rank}th`}
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">{entry.name}</p>
                      <p className="text-xs text-slate-500">@{entry.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-800">{entry.correct_answers} correct</p>
                    <p className="text-[11px] font-semibold text-slate-500">{entry.score}/100 score</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="portal-panel floating-card overflow-hidden border-0 bg-white/75">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <BookOpen className="h-5 w-5 text-violet-500" /> Study Notes
            </h2>
            <Badge tone="violet">One video</Badge>
          </div>
          <div className="p-5">
            <button
              onClick={() => openLevelNotes(1)}
              className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-sky-50 px-3 py-3 text-left transition duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_18px_35px_-18px_rgba(124,58,237,0.45)]"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-violet-500">Lecture video</p>
                <p className="text-sm font-bold text-slate-800">Watch the main lesson for all levels</p>
              </div>
              <BookOpen className="h-4 w-4 text-violet-600" />
            </button>
          </div>
        </Card>
      </div>

      {/* recent attempts */}
      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-slate-900">
          <History className="h-5 w-5 text-sky-600" /> Recent Quiz History
        </h2>
        <Card className="portal-panel floating-card border-0 bg-white/75">
          {attempts.length === 0 ? (
            <EmptyState
              icon={History}
              title="No attempts yet"
              message="Complete Level 1 to start building your history."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {attempts.slice(0, 5).map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigate(`/results/${a.id}`)}
                  className="group flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-all duration-200 hover:bg-gradient-to-r hover:from-sky-50 hover:to-violet-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-lg shadow-sm shadow-sky-200/60 ring-1 ring-sky-100 transition-transform duration-200 group-hover:scale-110">
                      {LEVEL_EMOJI[a.level?.level_number] || '🧬'}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Level {a.level?.level_number} · {a.level?.title}</p>
                      <p className="text-xs text-slate-400">
                        {a.assessment_type === 'posttest' ? 'Post-test' : 'Pre-test'} · {formatDateTime(a.completed_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.passed && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    <span className={`text-sm font-extrabold ${a.passed ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {a.score}/100
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {notes && (
        <Modal
          open={Boolean(notes)}
          onClose={() => setNotes(null)}
          title={notes.title || 'Level Notes'}
          size="lg"
        >
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-sky-50 p-4">
              <p className="text-sm font-semibold text-slate-500">{notes.level_number ? `Level ${notes.level_number}` : 'Overall lesson'}</p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">{notes.title}</p>
              <p className="mt-2 text-sm text-slate-600">{notes.summary}</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="aspect-video w-full">
                <iframe
                  className="h-full w-full"
                  src="https://www.youtube.com/embed/MmfO1YgzmHI?si=MF-xBK3_Mt3KVHXd"
                  title="Law of Sines lecture video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Quick review</p>
              <p className="mt-2 text-sm text-slate-700">{notes.quickReview || notes.description || 'Review all key ideas before continuing.'}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Key points</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {(notes.keyPoints || []).map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-violet-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    amber: 'text-amber-500 bg-amber-50 shadow-amber-200/60',
    emerald: 'text-emerald-500 bg-emerald-50 shadow-emerald-200/60',
    sky: 'text-sky-500 bg-sky-50 shadow-sky-200/60',
    violet: 'text-violet-500 bg-violet-50 shadow-violet-200/60',
  }
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      className="card-lift relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-lg shadow-slate-200/50 backdrop-blur-sm"
    >
      <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-white to-transparent opacity-40 blur-xl" />
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-md ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-xl font-extrabold text-slate-900 transition-colors duration-200 group-hover:text-sky-700">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </motion.div>
  )
}

function LevelCard({ row, index, onPlay, onNotes }) {
  const p = row.progress
  const isUnlocked = p.is_unlocked
  const isCompleted = p.is_completed
  const isCurrent = isUnlocked && !isCompleted
  const pct = progressPercent(p.best_score || 0)
  const pretestAllowed = row.pretest_enabled !== false
  const posttestAllowed = row.posttest_enabled !== false
  const emoji = LEVEL_EMOJI[row.level_number] || '🧬'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 320, damping: 26 }}
      whileHover={{ y: -7 }}
      className={`portal-panel floating-card relative overflow-hidden rounded-[28px] border bg-white/80 p-5 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.25)] backdrop-blur-sm ${
        isCurrent
          ? 'border-sky-300 ring-2 ring-sky-200 shadow-sky-200/50'
          : isUnlocked
            ? 'border-emerald-200 shadow-emerald-100/50'
            : 'border-slate-200 shadow-slate-200/40'
      }`}
    >
      {/* top gradient accent */}
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 h-1.5 ${
          isCurrent
            ? 'bg-gradient-to-r from-sky-400 via-violet-400 to-emerald-400'
            : isUnlocked
              ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
              : 'bg-gradient-to-r from-slate-300 to-slate-200'
        }`}
      />

      {isCurrent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18 }}
          className="level-badge-glow absolute right-4 top-4 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white shadow-md shadow-sky-300/50"
        >
          Current
        </motion.div>
      )}

      <div className="flex items-center gap-3">
        <motion.span
          animate={isCurrent ? { scale: [1, 1.12, 1], rotate: [0, 6, 0] } : { scale: 1 }}
          transition={isCurrent ? { repeat: Infinity, duration: 2.2 } : {}}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 text-xl shadow-md shadow-slate-200/60 ring-1 ring-slate-200/70"
        >
          {emoji}
        </motion.span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Level {row.level_number}</p>
          <h3 className="text-base font-extrabold leading-tight text-slate-900">{row.title}</h3>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs text-slate-500">{row.description}</p>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500">Best score</span>
          <span className="font-extrabold text-slate-800">{p.best_score || 0}/100</span>
        </div>
        <div className="flex items-center gap-2">
          <ProgressBar value={p.best_score || 0} max={100} tone={isCompleted ? 'green' : 'sky'} className="flex-1" />
          <span className="text-[11px] font-bold text-slate-500">{pct}%</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {isUnlocked ? (
          <Badge tone={isCompleted ? 'green' : 'sky'}>
            {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
            {isCompleted ? 'Completed' : 'Unlocked'}
          </Badge>
        ) : (
          <Badge tone="slate">
            <Lock className="h-3 w-3" /> Locked
          </Badge>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant={isUnlocked && pretestAllowed ? 'success' : 'outline'}
          disabled={!isUnlocked || !pretestAllowed}
          onClick={() => onPlay('pretest')}
          aria-label={isUnlocked && pretestAllowed ? `Start pre-test for Level ${row.level_number}` : `Pre-test for Level ${row.level_number} is currently disabled`}
        >
          <Play className="h-3.5 w-3.5" /> Pre-test
        </Button>
        <Button
          size="sm"
          variant={isUnlocked && posttestAllowed ? 'outline' : 'outline'}
          disabled={!isUnlocked || !posttestAllowed}
          onClick={() => onPlay('posttest')}
          aria-label={isUnlocked && posttestAllowed ? `Start post-test for Level ${row.level_number}` : `Post-test for Level ${row.level_number} is currently disabled`}
        >
          <Play className="h-3.5 w-3.5" /> Post-test
        </Button>
      </div>

      {isUnlocked && !isCompleted && (
        <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
          <Award className="h-3.5 w-3.5" /> Score 80/100 to unlock Level {row.level_number + 1}
        </p>
      )}
      {!isUnlocked && (
        <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-slate-400">
          <Lock className="h-3.5 w-3.5" /> Reach 80% on the previous level to continue
        </p>
      )}
      {isCompleted && (
        <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-slate-400">
          <TrendingUp className="h-3.5 w-3.5" /> {p.attempts} attempt{p.attempts === 1 ? '' : 's'}
        </p>
      )}
    </motion.div>
  )
}