import { supabase } from './supabase'

// All operations below are guarded server-side by public.is_admin()
// inside each RPC / policy — never trust the frontend role.

export async function listStudents({ search = '', status = 'all' } = {}) {
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,username.ilike.%${search}%`
    )
  }
  if (status && status !== 'all') {
    query = query.eq('account_status', status)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function getStudent(studentId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function getStudentProgress(studentId) {
  const { data, error } = await supabase
    .from('student_progress')
    .select('*, level:levels(level_number, title)')
    .eq('student_id', studentId)
    .order('level_number', { foreignTable: 'level' })
  if (error) throw new Error(error.message)
  return data || []
}

export async function getStudentAttempts(studentId) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*, level:levels(level_number, title)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function setStudentStatus(studentId, status) {
  const { data, error } = await supabase.rpc('admin_update_student_status', {
    p_student_id: studentId,
    p_status: status,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function deleteStudent(studentId) {
  const { data, error } = await supabase.rpc('admin_delete_student', {
    p_student_id: studentId,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function listQuestions({ level = 'all', search = '' } = {}) {
  let query = supabase
    .from('questions')
    .select('*, level:levels(level_number, title)')
    .order('level_number', { foreignTable: 'level' })

  if (level && level !== 'all') {
    const { data: levelRows } = await supabase
      .from('levels')
      .select('id')
      .eq('level_number', Number(level))
    const ids = (levelRows || []).map((l) => l.id)
    query = query.in('level_id', ids)
  }
  if (search) {
    query = query.ilike('question_text', `%${search}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function upsertQuestion(payload) {
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
  const { data, error } = await supabase
    .from('questions')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', questionId)
    .select()
  if (error) throw new Error(error.message)
  return data?.[0]
}

export async function deleteQuestion(questionId) {
  const { data, error } = await supabase.rpc('admin_delete_question', {
    p_id: questionId,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function listLevels() {
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .order('level_number', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function toggleLevelActive(levelId, isActive) {
  const { data, error } = await supabase.rpc('admin_toggle_level', {
    p_id: levelId,
    p_active: isActive,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function getAnalyticsOverview() {
  const { data, error } = await supabase.from('analytics_overview').select('*').limit(1)
  if (error) throw new Error(error.message)
  return data?.[0] || {}
}

export async function getAnalyticsLevels() {
  const { data, error } = await supabase.from('analytics_levels').select('*')
  if (error) throw new Error(error.message)
  return data || []
}

export async function getAnalyticsQuestions() {
  const { data, error } = await supabase
    .from('analytics_questions')
    .select('*')
    .order('times_wrong', { ascending: false, nullsFirst: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return data || []
}

/** Uploads a question image to Supabase Storage. Returns the public URL. */
export async function uploadQuestionImage(file, questionSlug) {
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