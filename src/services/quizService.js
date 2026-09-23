import { supabase, isSupabaseConfigured } from './supabase'
import { LAW_OF_SINES_LEVELS, LAW_OF_SINES_QUESTIONS } from '../data/lawOfSinesData'
import { getCurrentDemoUser, getDemoAttemptById, getDemoAttemptsForStudent, getDemoQuestionById, getDemoQuestionsForLevel, getLevelProgressForDemoUser, saveDemoAttempt } from './localDemo'
import { getSessionUser } from './authService'

export const QUIZ_TIME_PER_QUESTION = 30
export const POINTS_PER_QUESTION = 10
export const QUESTIONS_PER_LEVEL = 10

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

export async function getLevels() {
  if (!isSupabaseConfigured) {
    return LAW_OF_SINES_LEVELS
  }

  const { data, error } = await supabase
    .from('levels')
    .select('id, level_number, title, description, is_active')
    .order('level_number', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function getMyProgress() {
  if (!isSupabaseConfigured) {
    const user = getCurrentDemoUser() || (await getSessionUser())
    if (!user) return []
    return getLevelProgressForDemoUser(user.id)
  }

  const { data, error } = await supabase.rpc('get_my_progress')
  if (error) throw new Error(error.message)
  return data || []
}

export async function getQuestionsForLevel(levelId) {
  if (!isSupabaseConfigured) {
    return LAW_OF_SINES_QUESTIONS.filter((question) => Number(question.level) === Number(levelId))
  }

  const { data, error } = await supabase.rpc('get_level_questions', {
    p_level_id: levelId,
  })
  if (error) throw new Error(error.message)
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

export async function buildQuiz({ levelNumber, levels, studentId, attemptSalt }) {
  const level = levels.find((l) => l.level_number === levelNumber)
  if (!level) throw new Error('Level not found.')

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
  const normalizedAssessmentType = assessmentType === 'posttest' ? 'posttest' : 'pretest'

  if (!isSupabaseConfigured) {
    const user = getCurrentDemoUser()
    if (!user) throw new Error('You must be signed in to submit quiz answers.')

    const now = new Date().toISOString()
    const correct = answers.filter((answer) => answer.isCorrect).length
    const total = answers.length
    const score = Math.round((correct / total) * 100)
    const passed = score >= 100
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