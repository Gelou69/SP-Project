import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, CheckCircle2, Crown, Edit3, Save, User as UserIcon, X, History, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import useStudentStats from '../hooks/useStudentStats'
import { Badge, Button, Card, Input, Spinner } from '../components/ui'
import { calculateAge, formatDate, formatDateTime, initials } from '../utils/helpers'

const today = new Date().toISOString().split('T')[0]

export default function Profile() {
  const { profile, updateProfile } = useAuth()
  const { showToast } = useToast()
  const { levelRows, loading, error, stats, attempts } = useStudentStats()
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const age = useMemo(() => calculateAge(profile?.birthdate), [profile?.birthdate])

  const beginEdit = () => {
    setFullName(profile?.full_name || '')
    setBirthdate(profile?.birthdate || '')
    setEditing(true)
  }

  const save = async () => {
    setSaveError('')
    setSaving(true)
    try {
      await updateProfile(fullName, birthdate)
      showToast({ type: 'success', title: 'Profile updated', message: 'Your username was regenerated from your new name.' })
      setEditing(false)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!profile || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading profile..." />
      </div>
    )
  }

  const isAdmin = profile.role === 'admin'

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-lift relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-sky-200/50 backdrop-blur-sm sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-sky-200/40 to-violet-200/40 blur-2xl" />
        </div>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <motion.div
            whileHover={{ scale: 1.06, rotate: -3 }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 via-violet-500 to-emerald-500 text-2xl font-black text-white shadow-xl shadow-violet-300/40 ring-4 ring-white"
          >
            {initials(profile.full_name)}
          </motion.div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{profile.full_name}</h1>
              <Badge tone={isAdmin ? 'violet' : 'sky'}>{isAdmin ? 'Admin' : 'Student'}</Badge>
              <Badge tone={profile.account_status === 'active' ? 'green' : 'rose'}>
                {profile.account_status === 'active' ? 'Active' : 'Disabled'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">@{profile.username}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> Born {formatDate(profile.birthdate)} · {age} years old
              </span>
              <span className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Joined {formatDate(profile.created_at)}
              </span>
            </div>
          </div>
          {!editing && (
            <Button variant="outline" onClick={beginEdit}>
              <Edit3 className="h-4 w-4" /> Edit Profile
            </Button>
          )}
        </div>

        {editing && (
          <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/50 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-800">
              <UserIcon className="h-4 w-4 text-sky-600" /> Update your information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Input label="Birthdate" type="date" max={today} value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Your username is generated automatically from your name (lastname.firstname, lowercase).
            </p>
            {saveError && (
              <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
                {saveError}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <Button onClick={save} loading={saving}>
                <Save className="h-4 w-4" /> Save changes
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" /> Cancel
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}

      {/* progress table */}
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Quiz Progress</h2>
          <p className="text-xs text-slate-500">
            Current level: {isAdmin ? 'Admin' : `Level ${stats.currentLevel}`} · Completed: {stats.completedCount}/10 · Total points: {stats.totalPoints}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Best Score</th>
                <th className="px-5 py-3">Attempts</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {levelRows.map((row) => {
                const p = row.progress
                return (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-extrabold text-slate-800">Level {row.level_number}</td>
                    <td className="px-5 py-3 text-slate-600">{row.title}</td>
                    <td className="px-5 py-3">
                      <span className={`font-extrabold ${(p.best_score || 0) >= 80 ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {p.best_score || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{p.attempts}</td>
                    <td className="px-5 py-3">
                      {p.is_completed ? (
                        <Badge tone="green">
                          <CheckCircle2 className="h-3 w-3" /> Passed
                        </Badge>
                      ) : p.is_unlocked ? (
                        <Badge tone="sky">Unlocked</Badge>
                      ) : (
                        <Badge tone="slate">Locked</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {p.is_unlocked && (
                        <Button size="xs" variant="ghost" onClick={() => navigate(`/quiz/${row.level_number}`)}>
                          Play →
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* full attempt history */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <History className="h-4 w-4 text-sky-600" /> Quiz History
          </h2>
          <Badge tone="violet">{attempts.length} attempt{attempts.length === 1 ? '' : 's'}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3">Attempt</th>
                <th className="px-5 py-3">Score</th>
                <th className="px-5 py-3">Correct</th>
                <th className="px-5 py-3">Result</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-400">
                    <Star className="mx-auto h-8 w-8 opacity-40" />
                    <p className="mt-2">No attempts yet — complete a level to see it here.</p>
                  </td>
                </tr>
              ) : (
                attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 whitespace-nowrap text-slate-500">{formatDateTime(a.completed_at)}</td>
                    <td className="px-5 py-3 font-bold text-slate-800">Lv {a.level?.level_number} · {a.level?.title}</td>
                    <td className="px-5 py-3 text-slate-600">#{a.attempt_number}</td>
                    <td className="px-5 py-3 font-extrabold text-slate-800">{a.score}</td>
                    <td className="px-5 py-3 text-slate-600">{a.correct_answers}/{a.total_questions}</td>
                    <td className="px-5 py-3">
                      {a.passed ? <Badge tone="green">80+ · Passed</Badge> : <Badge tone="amber">Not passed</Badge>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button size="xs" variant="ghost" onClick={() => navigate(`/results/${a.id}`)}>
                        Details →
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {!isAdmin && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <Crown className="mr-1 inline h-4 w-4 text-amber-500" />
          Reach <strong>{80}/100</strong> on each level to unlock the next one!
        </div>
      )}
    </div>
  )
}