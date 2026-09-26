import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LineChart, Line, Legend,
} from 'recharts'
import { AlertTriangle, BarChart3, TrendingDown, Trophy } from 'lucide-react'
import { getAnalyticsLevels, getAnalyticsOverview, getAnalyticsQuestions } from '../../services/adminService'
import { Badge, Card, CardHeader, PageHeader, Spinner, cn } from '../../components/ui'
import { motion } from 'framer-motion'

const COLORS = ['#8b5cf6', '#f43f5e', '#f59e0b', '#10b981', '#0ea5e9', '#d97706', '#14b8a6', '#6366f1', '#7c3aed', '#e11d48']

export default function AdminAnalytics() {
  const [levels, setLevels] = useState([])
  const [overview, setOverview] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAnalyticsLevels(), getAnalyticsOverview(), getAnalyticsQuestions()])
      .then(([l, o, q]) => {
        setLevels(l)
        setOverview(o)
        setQuestions(q)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Building analytics..." />
  if (error) return <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</p>

  const avgData = levels.map((l) => ({ name: `L${l.level_number}`, score: l.avg_score ?? 0 }))
  const passData = levels.map((l) => ({ name: `L${l.level_number}`, pass: l.pass_rate ?? 0 }))
  const hasAttempts = levels.some((level) => Number(level.attempts) > 0)
  const hardest = questions.filter((q) => (q.accuracy ?? 100) < 100).slice(0, 10)

  return (
    <div>
      <PageHeader
        eyebrow="Teacher panel"
        title="Analytics"
        subtitle="Which levels and questions are the hardest for your students?"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total attempts', value: overview?.total_attempts ?? 0 },
          { label: 'Avg score', value: overview?.average_score ?? 0 },
          { label: 'Completion rate', value: `${overview?.completion_rate ?? 0}%` },
          { label: 'Students started', value: overview?.students_started ?? 0 },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
            <p className="text-xs font-semibold text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader title="Average Score per Level" subtitle="Mean attempt score out of 100" />
          {hasAttempts ? (
            <div className="h-72 min-w-0 px-4 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avgData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="score" name="Avg score" radius={[6, 6, 0, 0]}>
                    {avgData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-slate-500">
              Average scores will appear here after students submit a quiz.
            </div>
          )}
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Pass Rate Trend" subtitle="Pass-rate percentage per level (80/100+)" />
          {hasAttempts ? (
            <div className="h-72 min-w-0 px-4 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={passData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="pass" name="Pass rate %" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-slate-500">
              Pass rates will appear here after students submit a quiz.
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader
          title="Most Difficult Questions"
          subtitle="Questions students miss most often (lowest accuracy, most wrong answers)"
          action={<Badge tone="rose"><AlertTriangle className="h-3 w-3" /> {hardest.length} flagged</Badge>}
        />
        {hardest.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Trophy className="mx-auto h-8 w-8 opacity-40" />
            <p className="mt-2 text-sm">No incorrect answers yet — every recorded answer was correct!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {hardest.map((q, i) => (
              <div key={q.question_id} className="flex items-start gap-3 px-5 py-4">
                <span className={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold',
                  i < 3 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                )}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">{q.question_text}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge tone="sky">Level {q.level_number}</Badge>
                    <Badge tone="violet">{q.topic}</Badge>
                    <Badge tone={q.difficulty === 'hard' ? 'rose' : q.difficulty === 'medium' ? 'amber' : 'green'}>{q.difficulty}</Badge>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn('text-sm font-extrabold', q.accuracy < 40 ? 'text-rose-600' : 'text-slate-700')}>
                    {q.accuracy}% accuracy
                  </p>
                  <p className="text-xs text-slate-400">
                    asked {q.times_asked} · wrong {q.times_wrong}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {questions.length === 0 && (
        <Card className="mt-6 p-8 text-center text-slate-400">
          <TrendingDown className="mx-auto h-8 w-8 opacity-40" />
          <p className="mt-2 text-sm">No question-level data yet. Analytics appear once students complete quizzes.</p>
        </Card>
      )}
    </div>
  )
}
