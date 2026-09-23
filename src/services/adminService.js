import { supabase, isSupabaseConfigured } from './supabase'
import { LAW_OF_SINES_LEVELS, LAW_OF_SINES_QUESTIONS } from '../data/lawOfSinesData'
import {
  getDemoAnalyticsByLevel,
  getDemoAnalyticsOverview,
  getDemoQuestionAnalytics,
  getDemoState,
  getDemoAttemptsForStudent,
  getLevelProgressForDemoUser,
  getDemoQuestionById,
  saveDemoState,
} from './localDemo'

export async function listStudents({ search = '', status = 'all' } = {}) {
  if (!isSupabaseConfigured) {
    const students = getDemoState().users.filter((user) => user.role === 'student')
    return students.filter((student) => {
      const matchesSearch = !search || `${student.full_name} ${student.username}`.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'all' || student.account_status === status
      return matchesSearch && matchesStatus
    })
  }

  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  if (search) query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%`)
  if (status && status !== 'all') query = query.eq('account_status', status)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function getStudent(studentId) {
  if (!isSupabaseConfigured) {
    return getDemoState().users.find((user) => user.id === studentId) || null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function getStudentProgress(studentId) {
  if (!isSupabaseConfigured) {
    return getLevelProgressForDemoUser(studentId)
  }

  const { data, error } = await supabase
    .from('student_progress')
    .select('*, level:levels(level_number, title)')
    .eq('student_id', studentId)
    .order('level_number', { foreignTable: 'level' })
  if (error) throw new Error(error.message)
  return data || []
}

export async function getStudentAttempts(studentId) {
  if (!isSupabaseConfigured) {
    return getDemoAttemptsForStudent(studentId).map((attempt) => ({
      ...attempt,
      level: attempt.level || { level_number: Number(attempt.level_number), title: `Level ${attempt.level_number}` },
    }))
  }

  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*, level:levels(level_number, title)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function setStudentStatus(studentId, status) {
  if (!isSupabaseConfigured) {
    const users = getDemoState().users
    const user = users.find((entry) => entry.id === studentId)
    if (!user) return null
    user.account_status = status
    saveDemoState({ ...getDemoState(), users })
    return user
  }

  const { data, error } = await supabase.rpc('admin_update_student_status', {
    p_student_id: studentId,
    p_status: status,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function deleteStudent(studentId) {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    state.users = state.users.filter((user) => user.id !== studentId)
    state.attempts = state.attempts.filter((attempt) => attempt.student_id !== studentId)
    saveDemoState(state)
    return true
  }

  const { data, error } = await supabase.rpc('admin_delete_student', { p_student_id: studentId })
  if (error) throw new Error(error.message)
  return data
}

export async function listQuestions({ level = 'all', search = '' } = {}) {
  if (!isSupabaseConfigured) {
    let data = [...LAW_OF_SINES_QUESTIONS]
    if (level && level !== 'all') data = data.filter((q) => Number(q.level) === Number(level))
    if (search) data = data.filter((q) => q.question_text.toLowerCase().includes(search.toLowerCase()))
    return data
  }

  let query = supabase
    .from('questions')
    .select('*, level:levels(level_number, title)')
    .order('level_number', { foreignTable: 'level' })

  if (level && level !== 'all') {
    const { data: levelRows } = await supabase.from('levels').select('id').eq('level_number', Number(level))
    const ids = (levelRows || []).map((l) => l.id)
    query = query.in('level_id', ids)
  }
  if (search) query = query.ilike('question_text', `%${search}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function upsertQuestion(payload) {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    const nextQuestion = {
      ...payload,
      id: payload.id || `demo-question-${Date.now()}`,
      level: Number(payload.level_number || 1),
      question_number: Number(payload.question_number || 1),
      question_type: payload.question_type || 'figure',
      image_url: payload.image_url || 'diagram://triangle-1',
      difficulty: payload.difficulty || 'medium',
      topic: payload.topic || 'Law of Sines',
      correct_answer: payload.correct_answer || 'A',
      is_active: payload.is_active !== false,
    }

    const idx = state.questions.findIndex((question) => question.id === nextQuestion.id)
    if (idx >= 0) state.questions[idx] = nextQuestion
    else state.questions.push(nextQuestion)
    saveDemoState(state)
    return nextQuestion
  }

  const { data, error } = await supabase.rpc('admin_upsert_question', {
    p_id: payload.id || null,
    p_level_id: payload.level_id || null,
    p_level_number: payload.level_number || null,
    p_question_text: payload.question_text,
    p_image_url: payload.image_url || null,
    p_choice_a: payload.choice_a,
    p_choice_b: payload.choice_b,
    p_choice_c: payload.choice_c,
    p_choice_d: payload.choice_d,
    p_correct_answer: payload.correct_answer,
    p_topic: payload.topic,
    p_difficulty: payload.difficulty || 'medium',
    p_is_active: payload.is_active !== false,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function toggleQuestionActive(questionId, isActive) {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    const question = state.questions.find((entry) => entry.id === questionId)
    if (!question) return null
    question.is_active = isActive
    saveDemoState(state)
    return question
  }

  const { data, error } = await supabase
    .from('questions')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', questionId)
    .select()
  if (error) throw new Error(error.message)
  return data?.[0]
}

export async function deleteQuestion(questionId) {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    state.questions = state.questions.filter((question) => question.id !== questionId)
    saveDemoState(state)
    return true
  }

  const { data, error } = await supabase.rpc('admin_delete_question', { p_id: questionId })
  if (error) throw new Error(error.message)
  return data
}

export async function listLevels() {
  if (!isSupabaseConfigured) return LAW_OF_SINES_LEVELS

  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .order('level_number', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function toggleLevelActive(levelId, isActive) {
  if (!isSupabaseConfigured) return { id: levelId, is_active: isActive }

  const { data, error } = await supabase.rpc('admin_toggle_level', { p_id: levelId, p_active: isActive })
  if (error) throw new Error(error.message)
  return data
}

export async function getAnalyticsOverview() {
  if (!isSupabaseConfigured) return getDemoAnalyticsOverview()

  const { data, error } = await supabase.from('analytics_overview').select('*').limit(1)
  if (error) throw new Error(error.message)
  return data?.[0] || {}
}

export async function getAnalyticsLevels() {
  if (!isSupabaseConfigured) return getDemoAnalyticsByLevel()

  const { data, error } = await supabase.from('analytics_levels').select('*')
  if (error) throw new Error(error.message)
  return data || []
}

export async function getAnalyticsQuestions() {
  if (!isSupabaseConfigured) return getDemoQuestionAnalytics()

  const { data, error } = await supabase
    .from('analytics_questions')
    .select('*')
    .order('times_wrong', { ascending: false, nullsFirst: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return data || []
}

export async function uploadQuestionImage(file, questionSlug) {
  if (!isSupabaseConfigured) {
    return URL.createObjectURL(file)
  }

  const ext = file.name.split('.').pop() || 'png'
  const path = `questions/${questionSlug || 'question'}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('question-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('question-images').getPublicUrl(path)
  return data?.publicUrl || ''
}