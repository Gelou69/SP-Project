import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserCheck, Timer, CheckCircle2, Activity, TrendingUp, Award, ClipboardList,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { getAnalyticsLevels, getAnalyticsOverview } from '../../services/adminService'
import { Card, CardHeader, PageHeader, Badge, Spinner, cn } from '../../components/ui'

const LEVEL_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#14b8a6', '#6366f1', '#0d9488', '#d97706', '#7c3aed']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAnalyticsOverview(), getAnalyticsLevels()])
      .then(([ov, lv]) => {
        setOverview(ov)
        setLevels(lv)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Loading analytics..." />
  if (error) return <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</p>

  const cards = [
    { label: 'Total Students', value: overview?.total_students ?? 0, icon: Users, tone: 'bg-sky-50 text-sky-600' },
    { label: 'Active Students', value: overview?.active_students ?? 0, icon: UserCheck, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Started Quizzes', value: overview?.students_started ?? 0, icon: Timer, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Completed Levels', value: overview?.students_completed ?? 0, icon: CheckCircle2, tone: 'bg-violet-50 text-violet-600' },
    { label: 'Total Attempts', value: overview?.total_attempts ?? 0, icon: Activity, tone: 'bg-rose-50 text-rose-600' },
    { label: 'Avg Score', value: `${overview?.average_score ?? 0}/100`, icon: TrendingUp, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Completion Rate', value: `${overview?.completion_rate ?? 0}%`, icon: Award, tone: 'bg-cyan-50 text-cyan-600' },
  ]

  const passRateData = levels.map((l) => ({ name: `L${l.level_number}`, pass: l.pass_rate ?? 0, score: l.avg_score ?? 0 }))
  const pieData = passRateData.length
    ? passRateData.map((d) => ({ name: d.name, value: Math.max(0, d.pass) }))
    : [{ name: 'No data', value: 100 }]

  return (
    <div>
      <PageHeader
        eyebrow="Teacher dashboard"
        title="Overview"
        subtitle="A live view of how your students are progressing through Evolution Quest."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="card-lift relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-lg shadow-slate-200/40 backdrop-blur-sm"
          >
            <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-white to-transparent opacity-40 blur-xl" />
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl shadow-md', c.tone)}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 truncate text-xl font-extrabold text-slate-900">{c.value}</p>
            <p className="text-[11px] font-semibold text-slate-500">{c.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Average Score per Level" subtitle="Mean quiz score (out of 100)" />
          <div className="h-64 px-4 py-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={passRateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="score" name="Avg score" radius={[6, 6, 0, 0]}>
                  {passRateData.map((entry, i) => (
                    <Cell key={i} fill={LEVEL_COLORS[i % LEVEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Pass Rate per Level" subtitle="Percentage of attempts that reached 80/100 or higher" />
          <div className="h-64 px-4 py-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  label={(e) => `${e.name} ${e.value}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={LEVEL_COLORS[i % LEVEL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader
          title="Students on each level"
          subtitle="Attempt and pass counts per level"
          action={
            <button onClick={() => navigate('/admin/analytics')} className="text-xs font-bold text-sky-600 hover:text-sky-700">
              Full analytics →
            </button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Attempts</th>
                <th className="px-5 py-3">Students Attempted</th>
                <th className="px-5 py-3">Students Passed</th>
                <th className="px-5 py-3">Avg Score</th>
                <th className="px-5 py-3">Pass Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {levels.map((l) => (
                <tr key={l.level_number} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <Badge tone="sky">Level {l.level_number}</Badge>
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-700">{l.title}</td>
                  <td className="px-5 py-3 text-slate-600">{l.attempts}</td>
                  <td className="px-5 py-3 text-slate-600">{l.students_attempted}</td>
                  <td className="px-5 py-3 text-slate-600">{l.students_completed}</td>
                  <td className="px-5 py-3 font-extrabold text-slate-800">{l.avg_score}</td>
                  <td className="px-5 py-3">
                    <span className={cn('font-extrabold', l.pass_rate > 0 ? 'text-emerald-600' : 'text-slate-400')}>
                      {l.pass_rate}%
                    </span>
                  </td>
                </tr>
              ))}
              {levels.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-400">
                    <ClipboardList className="mx-auto h-8 w-8 opacity-40" />
                    <p className="mt-2">No quiz data yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}