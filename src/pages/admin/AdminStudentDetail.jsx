import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, User as UserIcon, Ban, ShieldCheck, Star, History, TrendingUp, CheckCircle2, XCircle } from 'lucide-react'
import { getStudent, getStudentProgress, getStudentAttempts, setStudentStatus } from '../../services/adminService'
import { useToast } from '../../contexts/ToastContext'
import { Badge, Button, Card, Spinner, PageHeader, cn } from '../../components/ui'
import { calculateAge, formatDate, formatDateTime, initials } from '../../utils/helpers'

export default function AdminStudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [student, setStudent] = useState(null)
  const [progress, setProgress] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStudent(id), getStudentProgress(id), getStudentAttempts(id)])
      .then(([s, p, a]) => {
        setStudent(s)
        setProgress(p)
        setAttempts(a)
      })
      .catch(() => setStudent(null))
      .finally(() => setLoading(false))
  }, [id])

  const performance = useMemo(() => {
    const completed = progress.filter((p) => p.is_completed)
    const passed = progress.filter((p) => (p.best_score || 0) >= 80)
    const best = progress.reduce((m, p) => Math.max(m, p.best_score || 0), 0)
    const totalPoints = progress.reduce((sum, p) => sum + (p.best_score || 0), 0)
    const avg = attempts.length ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length) : 0
    const failed = attempts.filter((a) => !a.passed).length
    const currentLevel = progress.find((p) => p.is_unlocked && !p.is_completed)?.level?.level_number
      || (progress.length && progress.length > 0 && progress.every((p) => p.is_completed) ? 10 : 1)
    return {
      completed: completed.length,
      passed: passed.length,
      best,
      totalPoints,
      avg,
      failed,
      attemptsCount: attempts.length,
      currentLevel,
      highestLevel: progress.filter((p) => p.is_completed).length || 0,
    }
  }, [progress, attempts])

  if (loading) return <Spinner label="Loading student..." />

  if (!student) {
    return (
      <div className="py-10 text-center">
        <p className="text-slate-500">Student not found or you have no access.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate('/admin/students')}>
          <ArrowLeft className="h-4 w-4" /> Back to students
        </Button>
      </div>
    )
  }

  const toggleStatus = async () => {
    try {
      const next = student.account_status === 'active' ? 'disabled' : 'active'
      await setStudentStatus(student.id, next)
      setStudent((s) => ({ ...s, account_status: next }))
      showToast({ type: 'success', title: next === 'active' ? 'Account enabled' : 'Account disabled', message: `${student.full_name} is ${next}.` })
    } catch (err) {
      showToast({ type: 'error', title: 'Action failed', message: err.message })
    }
  }

  const stats = [
    { label: 'Current Level', value: performance.currentLevel, icon: UserIcon },
    { label: 'Total Points', value: performance.totalPoints, icon: Star },
    { label: 'Best Score', value: `${performance.best}/100`, icon: TrendingUp },
    { label: 'Attempts', value: performance.attemptsCount, icon: History },
    { label: 'Average Score', value: `${performance.avg}/100`, icon: TrendingUp },
    { label: 'Passed Levels', value: performance.passed, icon: CheckCircle2 },
    { label: 'Failed Attempts', value: performance.failed, icon: XCircle },
  ]

  return (
    <div>
      <button onClick={() => navigate('/admin/students')} className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> All students
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-violet-500 text-xl font-black text-white shadow-lg">
            {initials(student.full_name)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{student.full_name}</h1>
              {student.account_status === 'active' ? <Badge tone="green">Active</Badge> : <Badge tone="rose">Disabled</Badge>}
            </div>
            <p className="mt-1 text-sm text-slate-500">@{student.username}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> Born {formatDate(student.birthdate)}
              </span>
              <span>{calculateAge(student.birthdate)} years old</span>
              <span className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Joined {formatDate(student.created_at)}
              </span>
            </div>
          </div>
          <Button variant={student.account_status === 'active' ? 'outline' : 'success'} onClick={toggleStatus}>
            {student.account_status === 'active' ? <><Ban className="h-4 w-4" /> Disable account</> : <><ShieldCheck className="h-4 w-4" /> Enable account</>}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <s.icon className="h-4 w-4 text-sky-500" />
            <p className="mt-2 text-lg font-extrabold text-slate-900">{s.value}</p>
            <p className="text-[11px] font-semibold text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Performance by Level</h2>
          <p className="text-xs text-slate-500">
            Highest completed: Level {performance.highestLevel || 0} · Current: Level {performance.currentLevel}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3">Best Score</th>
                <th className="px-5 py-3">Attempts</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {progress.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-extrabold text-slate-800">Level {p.level?.level_number} · {p.level?.title}</td>
                  <td className="px-5 py-3">
                    <span className={cn('font-extrabold', (p.best_score || 0) >= 80 ? 'text-emerald-600' : 'text-slate-800')}>
                      {p.best_score || '—'}
                    </span>
                    {p.best_score > 0 && (
                      <span className="ml-1 text-xs text-slate-400">({p.best_score}%)</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.attempts}</td>
                  <td className="px-5 py-3">
                    {p.is_completed ? (
                      <Badge tone="green"><CheckCircle2 className="h-3 w-3" /> Passed</Badge>
                    ) : p.is_unlocked ? (
                      <Badge tone="sky">Unlocked</Badge>
                    ) : (
                      <Badge tone="slate">Locked</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Quiz Attempts</h2>
          <p className="text-xs text-slate-500">Complete history of every submitted quiz</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Completed</th>
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Score</th>
                <th className="px-5 py-3">Correct</th>
                <th className="px-5 py-3">Wrong</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-400">No attempts yet.</td>
                </tr>
              ) : (
                attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 whitespace-nowrap text-slate-500">{formatDateTime(a.completed_at)}</td>
                    <td className="px-5 py-3 font-bold text-slate-800">Lv {a.level?.level_number} · {a.level?.title}</td>
                    <td className="px-5 py-3 text-slate-500">#{a.attempt_number}</td>
                    <td className="px-5 py-3 font-extrabold text-slate-800">{a.score}</td>
                    <td className="px-5 py-3 text-emerald-600 font-semibold">{a.correct_answers}</td>
                    <td className="px-5 py-3 text-rose-600 font-semibold">{a.wrong_answers}</td>
                    <td className="px-5 py-3 text-slate-500">{a.time_used != null ? `${a.time_used}s` : '—'}</td>
                    <td className="px-5 py-3">{a.passed ? <Badge tone="green">80+ · Passed</Badge> : <Badge tone="amber">Not passed</Badge>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}