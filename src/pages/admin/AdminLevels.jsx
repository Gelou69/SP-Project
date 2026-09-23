import { useCallback, useEffect, useState } from 'react'
import { Layers, CheckCircle2, LockOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { listLevels, toggleLevelActive } from '../../services/adminService'
import { useToast } from '../../contexts/ToastContext'
import { Badge, Button, Card, PageHeader, Spinner, Toggle, cn } from '../../components/ui'

export default function AdminLevels() {
  const { showToast } = useToast()
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setLevels(await listLevels())
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggle = async (level, active) => {
    try {
      await toggleLevelActive(level.id, active)
      setLevels((rows) => rows.map((l) => (l.id === level.id ? { ...l, is_active: active } : l)))
      showToast({ type: 'success', title: active ? 'Level enabled' : 'Level disabled', message: `${level.title} is now ${active ? 'visible to students' : 'hidden'}.` })
    } catch (err) {
      showToast({ type: 'error', title: 'Update failed', message: err.message })
    }
  }

  if (loading) return <Spinner label="Loading levels..." />

  return (
    <div>
      <PageHeader eyebrow="Teacher panel" title="Levels" subtitle="Enable or disable quiz levels. Disabled levels are hidden from students." />

      {error && <p role="alert" className="mb-4 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {levels.map((l, i) => (
          <motion.div key={l.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className={cn('p-5', !l.is_active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-base font-black text-white">
                    {l.level_number}
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{l.title}</h3>
                    <p className="text-xs text-slate-500">Level {l.level_number} · {l.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge tone={l.is_active ? 'green' : 'slate'}>
                    {l.is_active ? <><CheckCircle2 className="h-3 w-3" /> Active</> : <><LockOpen className="h-3 w-3" /> Disabled</>}
                  </Badge>
                  <Toggle checked={l.is_active} onChange={(v) => toggle(l, v)} label={`Toggle ${l.title}`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {levels.length === 0 && (
        <Card className="p-8 text-center text-slate-400">
          <Layers className="mx-auto h-8 w-8 opacity-40" />
          <p className="mt-2 text-sm">No levels found. Run the seed SQL to create Levels 1–10.</p>
          <Button className="mt-4" variant="outline" onClick={load}>Refresh</Button>
        </Card>
      )}
    </div>
  )
}