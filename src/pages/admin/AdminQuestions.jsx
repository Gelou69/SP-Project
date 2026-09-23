import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FileQuestion, Plus, Search, Trash2, Pencil, Upload, X } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  listQuestions, deleteQuestion, toggleQuestionActive, upsertQuestion, uploadQuestionImage, listLevels,
} from '../../services/adminService'
import { useToast } from '../../contexts/ToastContext'
import { useAudio } from '../../contexts/AudioContext'
import { Badge, Button, Card, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Select, Spinner, Textarea, Toggle, cn } from '../../components/ui'
import QuizImage from '../../components/diagrams/Diagrams'

const TOPICS = [
  'Evidence of Evolution',
  'Fossil Evidence',
  'Homologous Structures',
  'Analogous Structures',
  'Vestigial Structures',
  'Phylogenetic Trees',
  'Cladograms',
  'Natural Selection',
  'Adaptation and Variation',
  'Common Ancestry',
]

const DIFFICULTIES = ['easy', 'medium', 'hard']
const LETTERS = ['A', 'B', 'C', 'D']
const DIAGRAM_KEYS = [
  'fossil', 'homologous', 'analogous', 'vestigial', 'tree', 'cladogram', 'beaks',
  'natural-selection', 'camo', 'mimicry', 'embryo', 'dna', 'archaeopteryx', 'galapagos', 'peppered',
]

const emptyForm = () => ({
  id: null,
  level_number: 1,
  question_text: '',
  image_url: '',
  choice_a: '',
  choice_b: '',
  choice_c: '',
  choice_d: '',
  correct_answer: 'A',
  topic: TOPICS[0],
  difficulty: 'medium',
  is_active: true,
})

export default function AdminQuestions() {
  const { showToast } = useToast()
  const { playSfx } = useAudio()
  const [questions, setQuestions] = useState([])
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [q, l] = await Promise.all([listQuestions({ level: levelFilter, search }), listLevels()])
      setQuestions(q)
      setLevels(l)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [levelFilter, search])

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  const openNew = () => {
    setForm(emptyForm())
    setFormOpen(true)
  }

  const openEdit = (q) => {
    setForm({
      id: q.id,
      level_number: q.level?.level_number || 1,
      question_text: q.question_text,
      image_url: q.image_url || '',
      choice_a: q.choice_a,
      choice_b: q.choice_b,
      choice_c: q.choice_c,
      choice_d: q.choice_d,
      correct_answer: q.correct_answer,
      topic: q.topic,
      difficulty: q.difficulty,
      is_active: q.is_active,
    })
    setFormOpen(true)
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadQuestionImage(file, form.question_text.toLowerCase().replace(/\W+/g, '-').slice(0, 40))
      setForm((f) => ({ ...f, image_url: url }))
      showToast({ type: 'success', title: 'Image uploaded', message: 'The image is now stored in Supabase Storage.' })
    } catch (err) {
      showToast({ type: 'error', title: 'Upload failed', message: err.message })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const save = async () => {
    if (!form.question_text.trim()) {
      showToast({ type: 'error', title: 'Missing question', message: 'Please type the question text.' })
      return
    }
    const choices = [form.choice_a, form.choice_b, form.choice_c, form.choice_d]
    if (choices.some((c) => !c.trim())) {
      showToast({ type: 'error', title: 'Missing choices', message: 'All four answer choices are required.' })
      return
    }
    setSaving(true)
    try {
      await upsertQuestion(form)
      playSfx('correct')
      showToast({ type: 'success', title: form.id ? 'Question updated' : 'Question added', message: `Saved to Level ${form.level_number}.` })
      setFormOpen(false)
      load()
    } catch (err) {
      showToast({ type: 'error', title: 'Save failed', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    try {
      await deleteQuestion(deleteTarget.id)
      playSfx('wrong')
      showToast({ type: 'success', title: 'Question deleted', message: 'The question was removed.' })
      setDeleteTarget(null)
      load()
    } catch (err) {
      showToast({ type: 'error', title: 'Delete failed', message: err.message })
      setDeleteTarget(null)
    }
  }

  const toggleActive = async (q) => {
    try {
      await toggleQuestionActive(q.id, !q.is_active)
      playSfx('click')
      load()
    } catch (err) {
      showToast({ type: 'error', title: 'Update failed', message: err.message })
    }
  }

  const counts = useMemo(() => {
    const c = {}
    for (const q of questions) {
      c[q.level?.level_number] = (c[q.level?.level_number] || 0) + 1
    }
    return c
  }, [questions])

  const imageKind = form.image_url?.startsWith('diagram://') ? 'diagram' : form.image_url ? 'url' : 'none'

  return (
    <div>
      <PageHeader
        eyebrow="Teacher panel"
        title="Question Management"
        subtitle={`${questions.length} questions in the current view`}
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input aria-label="Search questions" placeholder="Search question text..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select aria-label="Filter by level" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="sm:w-52">
            <option value="all">All levels ({questions.length})</option>
            {levels.map((l) => (
              <option key={l.id} value={l.level_number}>
                Level {l.level_number} · {l.title} ({counts[l.level_number] || 0})
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {error && <p role="alert" className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</p>}

      <div className="mt-4 space-y-3">
        {loading ? (
          <Spinner label="Loading questions..." />
        ) : questions.length === 0 ? (
          <EmptyState
            icon={FileQuestion}
            title="No questions found"
            message="Add a question or change your search / level filter."
            action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Add Question</Button>}
          />
        ) : (
          questions.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}>
              <Card className={cn('flex flex-col gap-4 p-4 sm:flex-row sm:items-center', !q.is_active && 'opacity-60')}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="sky">Level {q.level?.level_number}</Badge>
                    <Badge tone={q.difficulty === 'hard' ? 'rose' : q.difficulty === 'medium' ? 'amber' : 'green'}>{q.difficulty}</Badge>
                    <Badge tone="violet">{q.topic}</Badge>
                    <Badge tone={q.is_active ? 'green' : 'slate'}>{q.is_active ? 'Active' : 'Hidden'}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-800">{q.question_text}</p>
                  <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                    {LETTERS.map((l) => (
                      <span key={l} className={cn('flex items-center gap-1.5', q.correct_answer === l && 'font-extrabold text-emerald-600')}>
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-extrabold text-slate-500">{l}</span>
                        {q[`choice_${l.toLowerCase()}`]}
                        {q.correct_answer === l && <span className="rounded bg-emerald-100 px-1 text-[9px] uppercase">Correct</span>}
                      </span>
                    ))}
                  </div>
                  {q.image_url && (
                    <div className="mt-2 max-w-[180px]">
                      <QuizImage imageUrl={q.image_url} alt="Question image" className="h-24" />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    Active
                    <Toggle checked={q.is_active} onChange={() => toggleActive(q)} aria-label={`Toggle question ${q.id}`} />
                  </label>
                  <Button size="sm" variant="outline" onClick={() => openEdit(q)} aria-label="Edit question">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-rose-500 hover:bg-rose-50" onClick={() => setDeleteTarget(q)} aria-label="Delete question">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? 'Edit Question' : 'Add Question'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>
              {form.id ? 'Save changes' : 'Add question'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Level" value={form.level_number} onChange={set('level_number')}>
            {levels.map((l) => (
              <option key={l.id} value={l.level_number}>Level {l.level_number} · {l.title}</option>
            ))}
          </Select>
          <Select label="Topic" value={form.topic} onChange={set('topic')}>
            {TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <Select label="Difficulty" value={form.difficulty} onChange={set('difficulty')}>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </Select>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Active</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5">
              <Toggle checked={form.is_active} onChange={(v) => setForm((f) => ({ ...f, is_active: v }))} label="Question active" />
              <span className="text-sm text-slate-600">{form.is_active ? 'Visible to students' : 'Hidden'}</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Textarea label="Question text" rows={3} value={form.question_text} onChange={set('question_text')} placeholder="Type the question..." />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {LETTERS.map((l) => (
            <Input key={l} label={`Choice ${l}`} value={form[`choice_${l.toLowerCase()}`]} onChange={set(`choice_${l.toLowerCase()}`)} placeholder={`Answer choice ${l}`} />
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Select label="Correct answer" value={form.correct_answer} onChange={set('correct_answer')}>
            {LETTERS.map((l) => (
              <option key={l} value={l}>Choice {l}</option>
            ))}
          </Select>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Image</span>
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id="question-image-upload"
              />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} loading={uploading} className="flex-1">
                <Upload className="h-4 w-4" /> Upload image
              </Button>
              <Select value={imageKind} onChange={(e) => {
                const v = e.target.value
                if (v === 'none') setForm((f) => ({ ...f, image_url: '' }))
                else if (v === 'diagram') setForm((f) => ({ ...f, image_url: 'diagram://homologous' }))
              }} className="flex-1" aria-label="Image source">
                <option value="none">No image</option>
                <option value="diagram">Built-in diagram</option>
                <option value="url">URL (below)</option>
              </Select>
            </div>
          </div>
        </div>

        {imageKind === 'url' && (
          <div className="mt-3">
            <Input label="Image URL" value={form.image_url} onChange={set('image_url')} placeholder="https://... or diagram://fossil" />
          </div>
        )}

        {imageKind === 'diagram' && (
          <div className="mt-3">
            <Select label="Built-in diagram" value={form.image_url} onChange={set('image_url')}>
              {DIAGRAM_KEYS.map((k) => (
                <option key={k} value={`diagram://${k}`}>{k.replace(/-/g, ' ')}</option>
              ))}
            </Select>
            {form.image_url?.startsWith('diagram://') && (
              <div className="mt-2">
                <QuizImage imageUrl={form.image_url} alt="Diagram preview" className="h-40" />
              </div>
            )}
          </div>
        )}

        {imageKind === 'url' && form.image_url && (
          <div className="mt-2">
            <QuizImage imageUrl={form.image_url} alt="Image preview" className="h-40" />
            <button onClick={() => setForm((f) => ({ ...f, image_url: '' }))} className="mt-1 text-xs font-bold text-rose-600">
              <X className="mr-1 inline h-3 w-3" /> Remove image
            </button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete question?"
        message="This permanently removes the question and any recorded answers. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}