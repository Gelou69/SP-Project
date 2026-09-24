import { supabase, isSupabaseConfigured } from './supabase'
import { LAW_OF_SINES_LEVELS, LAW_OF_SINES_QUESTIONS } from '../data/lawOfSinesData'
import {
  getCurrentDemoUser,
  getDemoAttemptById,
  getDemoAttemptsForStudent,
  getDemoQuestionById,
  getDemoQuestionsForLevel,
  getDemoState,
  getLevelProgressForDemoUser,
  saveDemoAttempt,
} from './localDemo'
import { getSessionUser } from './authService'

export const QUIZ_TIME_PER_QUESTION = 60
export const POINTS_PER_QUESTION = 10
export const QUESTIONS_PER_LEVEL = 10
export const PASSING_SCORE = 80

export function normalizeAssessmentType(value) {
  return value === 'posttest' ? 'posttest' : 'pretest'
}

export function isAssessmentEnabled(level, assessmentType) {
  if (!level) return false
  if (level.is_active === false) return false
  const normalized = normalizeAssessmentType(assessmentType)
  const isEnabled = normalized === 'posttest' ? level.posttest_enabled : level.pretest_enabled
  return isEnabled !== false
}

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hashCode = (str) => {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return h >>> 0
}

export function shuffleWithSeed(array, seed) {
  const copy = [...array]
  const rnd = mulberry32(seed)
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function makeAttemptSeed(studentId, levelNumber, attemptSalt) {
  return hashCode(`${studentId}:${levelNumber}:${attemptSalt}`)
}

export function ensureDefaultUnlockedProgress(levels = [], progress = []) {
  const rows = Array.isArray(progress) ? [...progress] : []

  for (const level of Array.isArray(levels) ? levels : []) {
    const levelId = String(level.id)
    const levelNumber = Number(level.level_number)
    const existing = rows.find((row) => {
      const rowLevelId = row?.level_id != null ? String(row.level_id) : ''
      const rowLevelNumber = Number(row?.level_number)
      return rowLevelId === levelId || (!Number.isNaN(rowLevelNumber) && rowLevelNumber === levelNumber)
    })

    if (existing) {
      existing.is_unlocked = Boolean(existing.is_unlocked) || levelNumber === 1
      existing.is_completed = Boolean(existing.is_completed)
      if (existing.level_number == null) existing.level_number = levelNumber
      if (existing.level_id == null) existing.level_id = levelId
      continue
    }

    rows.push({
      level_id: levelId,
      level_number: levelNumber,
      best_score: 0,
      attempts: 0,
      is_unlocked: levelNumber === 1,
      is_completed: false,
      updated_at: new Date().toISOString(),
    })
  }

  return rows
}

export async function getLevels() {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    return state.levels.filter((level) => level.is_active !== false)
  }

  const { data, error } = await supabase
    .from('levels')
    .select('id, level_number, title, description, is_active, pretest_enabled, posttest_enabled')
    .order('level_number', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function getMyProgress() {
  if (!isSupabaseConfigured) {
    const user = getCurrentDemoUser() || (await getSessionUser())
    if (!user) return []
    const activeLevels = getDemoState().levels.filter((level) => level.is_active !== false)
    const activeIds = new Set(activeLevels.map((level) => level.id))
    const rows = getLevelProgressForDemoUser(user.id).filter((progress) => activeIds.has(progress.level_id))
    return ensureDefaultUnlockedProgress(activeLevels, rows)
  }

  const [lvlRows, { data, error }] = await Promise.all([
    getLevels(),
    supabase.rpc('get_my_progress'),
  ])
  if (error) throw new Error(error.message)
  return ensureDefaultUnlockedProgress(lvlRows, data || [])
}

export async function getQuestionsForLevel(levelId) {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    return state.questions.filter((question) => Number(question.level) === Number(levelId))
  }

  if (!levelId) return []

  const { data, error } = await supabase.rpc('get_level_questions', {
    p_level_id: levelId,
  })

  if (Array.isArray(data) && data.length) return data

  if (error) {
    const fallback = await supabase
      .from('questions')
      .select('*')
      .eq('level_id', levelId)
      .eq('is_active', true)

    if (!fallback.error && Array.isArray(fallback.data)) {
      return fallback.data
    }

    if (!fallback.error && !fallback.data?.length) {
      return []
    }

    throw new Error(error.message)
  }

  return data || []
}

export async function checkAnswer(questionId, selectedAnswer) {
  if (!isSupabaseConfigured) {
    const question = getDemoQuestionById(questionId)
    return Boolean(question && question.correct_answer === selectedAnswer)
  }

  const { data, error } = await supabase.rpc('check_answer', {
    p_question_id: questionId,
    p_selected_answer: selectedAnswer,
  })
  if (error) throw new Error(error.message)
  return Boolean(data)
}

export async function buildQuiz({ levelNumber, levels, studentId, attemptSalt, assessmentType = 'pretest' }) {
  const normalizedAssessmentType = normalizeAssessmentType(assessmentType)
  const level = levels.find((l) => l.level_number === levelNumber)
  if (!level) throw new Error('Level not found.')
  if (!isAssessmentEnabled(level, normalizedAssessmentType)) {
    throw new Error(`${normalizedAssessmentType === 'posttest' ? 'Post-test' : 'Pre-test'} is currently disabled for this level.`)
  }

  const questions = isSupabaseConfigured
    ? await getQuestionsForLevel(level.id)
    : getDemoQuestionsForLevel(levelNumber)

  if (questions.length < QUESTIONS_PER_LEVEL) {
    throw new Error(`Level ${levelNumber} needs at least ${QUESTIONS_PER_LEVEL} questions.`)
  }

  const seed = makeAttemptSeed(studentId, levelNumber, attemptSalt)
  const orderedQuestions = shuffleWithSeed(questions, seed).slice(0, QUESTIONS_PER_LEVEL).map((q, qi) => {
    const pairs = [
      { label: 'A', text: q.choice_a },
      { label: 'B', text: q.choice_b },
      { label: 'C', text: q.choice_c },
      { label: 'D', text: q.choice_d },
    ]
    const shuffledChoices = shuffleWithSeed(pairs, seed * 31 + qi * 7 + 13)
    return {
      id: q.id,
      question_text: q.question_text,
      image_url: q.image_url,
      topic: q.topic,
      choices: shuffledChoices.map((c) => ({ label: c.label, text: c.text })),
    }
  })

  return { level, questions: orderedQuestions }
}

export async function submitQuiz({ levelNumber, answers, timeUsed, startedAt, assessmentType = 'pretest' }) {
  const normalizedAssessmentType = normalizeAssessmentType(assessmentType)

  if (!isSupabaseConfigured) {
    const user = getCurrentDemoUser()
    if (!user) throw new Error('You must be signed in to submit quiz answers.')

    const now = new Date().toISOString()
    const correct = answers.filter((answer) => answer.isCorrect).length
    const total = answers.length
    const score = Math.round((correct / total) * 100)
    const passed = score >= PASSING_SCORE
    const attempt = {
      id: `demo-attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      student_id: user.id,
      level_number: Number(levelNumber),
      level: { level_number: Number(levelNumber), title: LAW_OF_SINES_LEVELS.find((level) => level.level_number === Number(levelNumber))?.title || `Level ${levelNumber}` },
      score,
      correct_answers: correct,
      wrong_answers: total - correct,
      total_questions: total,
      percentage: score,
      passed,
      assessment_type: normalizedAssessmentType,
      started_at: startedAt || now,
      completed_at: now,
      created_at: now,
      answers: answers.map((answer) => ({
        questionId: answer.questionId,
        question_id: answer.questionId,
        selected_answer: answer.selectedLabel,
        correct_answer: answer.correctAnswer || null,
        isCorrect: answer.isCorrect,
        is_correct: answer.isCorrect,
      })),
    }
    saveDemoAttempt(attempt)
    return {
      attempt_id: attempt.id,
      level_number: Number(levelNumber),
      level: attempt.level,
      score,
      correct_answers: correct,
      wrong_answers: total - correct,
      total_questions: total,
      percentage: score,
      passed,
      assessment_type: normalizedAssessmentType,
      completed_at: now,
    }
  }

  const payload = answers.map((a, idx) => ({
    question_id: a.questionId,
    selected_answer: a.selectedLabel || null,
    time_used: a.timeUsed,
    order: idx + 1,
  }))

  const { data, error } = await supabase.rpc('submit_quiz', {
    p_level_number: levelNumber,
    p_answers: payload,
    p_time_used: Math.round(timeUsed),
    p_started_at: startedAt,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function getLevelNotes(levelNumber) {
  const level = Number(levelNumber)
  const lectureVideoUrl = 'https://youtu.be/MmfO1YgzmHI?si=MF-xBK3_Mt3KVHXd'

  const base = {
    level_number: level,
    title: `Lecture Video for Level ${level}`,
    summary: 'Watch this prepared lecture video to review the main ideas before continuing with the quiz.',
    quickReview: 'Use the video as your lecture resource for this level and review the explanation before retaking the quiz.',
    keyPoints: [
      'Watch the full lecture video for the lesson explanation.',
      'Review the concept before attempting the next quiz.',
      'Use the video as the shared lecture resource for all levels.',
    ],
    videoUrl: lectureVideoUrl,
  }

  if (!isSupabaseConfigured) {
    return base
  }

  const { data: levelRow, error } = await supabase
    .from('levels')
    .select('level_number, title, description')
    .eq('level_number', level)
    .maybeSingle()

  if (error) throw new Error(error.message)

  return {
    ...base,
    title: `Lecture Video: ${levelRow?.title || `Level ${level}`}`,
    description: levelRow?.description || base.summary,
  }
}

export async function getLeaderboard(limit = 10) {
  if (!isSupabaseConfigured) {
    return [
      { rank: 1, name: 'Ariana', username: 'ariana.quiz', correct_answers: 10, score: 100 },
      { rank: 2, name: 'Marcus', username: 'marcus.quiz', correct_answers: 10, score: 98 },
      { rank: 3, name: 'Leah', username: 'leah.quiz', correct_answers: 9, score: 80 },
      { rank: 4, name: 'Noah', username: 'noah.quiz', correct_answers: 9, score: 89 },
      { rank: 5, name: 'Jasmine', username: 'jasmine.quiz', correct_answers: 9, score: 88 },
      { rank: 6, name: 'Daniel', username: 'daniel.quiz', correct_answers: 8, score: 87 },
      { rank: 7, name: 'Mila', username: 'mila.quiz', correct_answers: 8, score: 85 },
      { rank: 8, name: 'Owen', username: 'owen.quiz', correct_answers: 8, score: 84 },
      { rank: 9, name: 'Sofia', username: 'sofia.quiz', correct_answers: 8, score: 83 },
      { rank: 10, name: 'Lucas', username: 'lucas.quiz', correct_answers: 8, score: 82 },
    ].slice(0, limit)
  }

  const { data, error } = await supabase.rpc('get_student_leaderboard', { p_limit: limit })
  if (error) throw new Error(error.message)

  return (data || []).map((row) => ({
    rank: Number(row.rank_no || 0),
    student_id: row.student_id,
    name: row.full_name,
    username: row.username,
    correct_answers: Number(row.correct_answers || 0),
    score: Number(row.score || 0),
  }))
}

export async function getAttempt(attemptId) {
  if (!isSupabaseConfigured) {
    const attempt = getDemoAttemptById(attemptId)
    if (!attempt) return null
    return {
      ...attempt,
      level_number: Number(attempt.level_number),
      level: attempt.level || { level_number: Number(attempt.level_number), title: `Level ${attempt.level_number}` },
      score: Number(attempt.score || 0),
      correct_answers: Number(attempt.correct_answers || 0),
      wrong_answers: Number(attempt.wrong_answers || 0),
      total_questions: Number(attempt.total_questions || 0),
      percentage: Number(attempt.percentage || 0),
      passed: Boolean(attempt.passed),
    }
  }

  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*, level:levels(level_number, title)')
    .eq('id', attemptId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function getAttemptAnswers(attemptId) {
  if (!isSupabaseConfigured) {
    const attempt = getDemoAttemptById(attemptId)
    return Array.isArray(attempt?.answers) ? attempt.answers : []
  }

  const { data, error } = await supabase
    .from('quiz_answers')
    .select('*, question:questions(question_text)')
    .eq('attempt_id', attemptId)
    .order('question_order', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function getMyAttempts(limit = 100) {
  if (!isSupabaseConfigured) {
    const user = getCurrentDemoUser() || (await getSessionUser())
    if (!user) return []
    return getDemoAttemptsForStudent(user.id)
      .slice(0, limit)
      .map((attempt) => ({
        ...attempt,
        level: attempt.level || { level_number: Number(attempt.level_number), title: `Level ${attempt.level_number}` },
      }))
  }

  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*, level:levels(level_number, title)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data || []
}

export async function getProgressForLevel(levelId) {
  if (!isSupabaseConfigured) {
    const user = getCurrentDemoUser()
    if (!user) return null
    return getLevelProgressForDemoUser(user.id).find((progress) => progress.level_id === levelId) || null
  }

  const { data, error } = await supabase
    .from('student_progress')
    .select('*')
    .eq('level_id', levelId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}