import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, Ban, ShieldCheck, Trash2, ChevronRight, Star, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { getStudentLevelSummaries, listStudents, setStudentStatus, deleteStudent } from '../../services/adminService'
import { useToast } from '../../contexts/ToastContext'
import { Badge, Button, Card, ConfirmDialog, EmptyState, Input, PageHeader, Select, Spinner } from '../../components/ui'
import { calculateAge, formatDate, initials } from '../../utils/helpers'
import { LAW_OF_SINES_LEVELS } from '../../data/lawOfSinesData'

export default function AdminStudents() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [students, setStudents] = useState([])
  const [levelSummaries, setLevelSummaries] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const nextStudents = await listStudents({ search, status })
      const nextSummaries = await getStudentLevelSummaries(nextStudents.map((student) => student.id))
      setStudents(nextStudents)
      setLevelSummaries(nextSummaries)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  const filteredStats = useMemo(
    () => ({
      total: students.length,
      active: students.filter((s) => s.account_status === 'active').length,
    }),
    [students]
  )

  const toggleStatus = async (student) => {
    try {
      const next = student.account_status === 'active' ? 'disabled' : 'active'
      await setStudentStatus(student.id, next)
      showToast({
        type: next === 'disabled' ? 'info' : 'success',
        title: next === 'disabled' ? 'Account disabled' : 'Account enabled',
        message: `${student.full_name}'s account is now ${next}.`,
      })
      load()
    } catch (err) {
      showToast({ type: 'error', title: 'Action failed', message: err.message })
    }
  }

  const remove = async () => {
    try {
      await deleteStudent(confirm.id)
      showToast({ type: 'success', title: 'Student deleted', message: `${confirm.full_name} and all quiz data removed.` })
      setConfirm(null)
      load()
    } catch (err) {
      showToast({ type: 'error', title: 'Delete failed', message: err.message })
      setConfirm(null)
    }
  }

  const getSummaryScores = (student) => LAW_OF_SINES_LEVELS.map((level) => {
    const entry = levelSummaries[student.id]?.[level.level_number]
    return entry?.attempts > 0 ? entry.score : null
  })

  const getSummaryRemark = (student) => {
    const scores = getSummaryScores(student).filter((score) => score !== null)
    if (scores.length === 0) return 'NOT STARTED'
    const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    return `${average} ${average >= 80 ? 'PASSED' : 'NOT PASSED'}`
  }

  const downloadSummary = () => {
    const escapeCsv = (value) => {
      const safeValue = /^[=+\-@\t\r]/.test(String(value)) ? `'${value}` : value
      return `"${String(safeValue ?? '').replace(/"/g, '""')}"`
    }
    const headers = ['Full name', ...LAW_OF_SINES_LEVELS.map((level) => `lvl ${level.level_number}`), 'Remark']
    const rows = students.map((student) => [
      student.full_name,
      ...getSummaryScores(student).map((score) => score ?? ''),
      getSummaryRemark(student),
    ])
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'student-level-summary.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Teacher panel"
        title="Student Management"
        subtitle={`${filteredStats.total} students · ${filteredStats.active} active`}
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              aria-label="Search students"
              placeholder="Search by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-52">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </Select>
        </div>
      </Card>

      {error && <p role="alert" className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</p>}

      <Card className="mt-4 overflow-hidden">
        {loading ? (
          <Spinner label="Loading students..." />
        ) : students.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title="No students found"
              message="Students appear here after they sign up. Try a different search."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Birthdate</th>
                  <th className="px-5 py-3">Age</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3">
                      <button onClick={() => navigate(`/admin/students/${s.id}`)} className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-500 text-xs font-extrabold text-white">
                          {initials(s.full_name)}
                        </span>
                        <span>
                          <span className="block font-bold text-slate-800">{s.full_name}</span>
                          <span className="block text-xs text-slate-400">@{s.username}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(s.birthdate)}</td>
                    <td className="px-5 py-3 text-slate-600">{calculateAge(s.birthdate)}</td>
                    <td className="px-5 py-3">
                      {s.account_status === 'active' ? <Badge tone="green">Active</Badge> : <Badge tone="rose">Disabled</Badge>}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-500">{formatDate(s.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="xs" variant="ghost" onClick={() => navigate(`/admin/students/${s.id}`)} aria-label={`View ${s.full_name}`}>
                          <Star className="h-3.5 w-3.5" />
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="xs"
                          variant={s.account_status === 'active' ? 'outline' : 'success'}
                          onClick={() => toggleStatus(s)}
                          aria-label={s.account_status === 'active' ? `Disable ${s.full_name}` : `Enable ${s.full_name}`}
                        >
                          {s.account_status === 'active' ? <Ban className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                          {s.account_status === 'active' ? 'Disable' : 'Enable'}
                        </Button>
                        <Button size="xs" variant="ghost" className="text-rose-500 hover:bg-rose-50" onClick={() => setConfirm(s)} aria-label={`Delete ${s.full_name}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Student Level Summary</h2>
            <p className="mt-0.5 text-xs text-slate-500">Best score by level · pass mark: 80 average</p>
          </div>
          <Button size="sm" variant="outline" onClick={downloadSummary} disabled={loading || students.length === 0}>
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        </div>
        {loading ? (
          <Spinner label="Building student summary..." />
        ) : students.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No student results to summarize.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-center text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Full name</th>
                  {LAW_OF_SINES_LEVELS.map((level) => <th key={level.level_number} className="px-4 py-3">lvl {level.level_number}</th>)}
                  <th className="px-5 py-3">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 text-left font-medium text-slate-800">{student.full_name}</td>
                    {getSummaryScores(student).map((score, index) => (
                      <td key={LAW_OF_SINES_LEVELS[index].level_number} className="px-4 py-3 text-slate-700">{score ?? '—'}</td>
                    ))}
                    <td className="px-5 py-3 font-semibold text-slate-700">{getSummaryRemark(student)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete student?"
        message={`This permanently removes ${confirm?.full_name ?? 'this student'}, including all progress and quiz history. This cannot be undone.`}
        confirmLabel="Delete forever"
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
