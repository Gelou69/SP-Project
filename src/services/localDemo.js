import { LAW_OF_SINES_LEVELS, LAW_OF_SINES_QUESTIONS } from '../data/lawOfSinesData'

const STORAGE_KEY = 'law-of-sines-demo-state'

const DEMO_ADMIN = {
  id: 'demo-admin',
  full_name: 'Sammy Malik',
  username: 'sammy.malik',
  password: 'admin123',
  birthdate: '1998-01-15',
  role: 'admin',
  account_status: 'active',
  created_at: new Date().toISOString(),
}

const normalizeDemoUsers = (users = []) => {
  const others = (Array.isArray(users) ? users : []).filter((user) => {
    const username = String(user?.username || '').toLowerCase()
    return user?.id !== 'demo-admin' && username !== 'sammy.malik' && username !== 'admin.lawofsines'
  })

  return [DEMO_ADMIN, ...others]
}

const DEMO_LEVELS = LAW_OF_SINES_LEVELS.map((level) => ({ ...level, is_active: true }))
const DEMO_QUESTIONS = LAW_OF_SINES_QUESTIONS.map((question) => ({ ...question, is_active: question.is_active !== false }))

const defaultState = () => ({
  users: normalizeDemoUsers([]),
  session: null,
  attempts: [],
  questions: DEMO_QUESTIONS,
  levels: DEMO_LEVELS,
})

export function getDemoState() {
  if (typeof window === 'undefined') return defaultState()

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState()))
    return defaultState()
  }

  try {
    const parsed = JSON.parse(raw)
    const repaired = {
      users: normalizeDemoUsers(Array.isArray(parsed.users) ? parsed.users : defaultState().users),
      session: parsed.session || null,
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      questions: Array.isArray(parsed.questions) && parsed.questions.length
        ? parsed.questions.map((question) => ({ ...question, is_active: question.is_active !== false }))
        : DEMO_QUESTIONS,
      levels: Array.isArray(parsed.levels) && parsed.levels.length
        ? parsed.levels.map((level) => ({ ...level, is_active: level.is_active !== false }))
        : DEMO_LEVELS,
    }
    if (JSON.stringify(repaired.users) !== JSON.stringify(parsed.users || [])) {
      saveDemoState(repaired)
    }
    return repaired
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState()))
    return defaultState()
  }
}

export function saveDemoState(nextState) {
  if (typeof window === 'undefined') return nextState
  const normalized = {
    ...nextState,
    questions: Array.isArray(nextState.questions)
      ? nextState.questions.map((question) => ({ ...question, is_active: question.is_active !== false }))
      : DEMO_QUESTIONS,
    levels: Array.isArray(nextState.levels)
      ? nextState.levels.map((level) => ({ ...level, is_active: level.is_active !== false }))
      : DEMO_LEVELS,
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export function setDemoLevelActive(levelId, isActive) {
  const state = getDemoState()
  state.levels = state.levels.map((level) =>
    level.id === levelId ? { ...level, is_active: Boolean(isActive) } : level
  )
  saveDemoState(state)
  return state.levels.find((level) => level.id === levelId) || null
}

export function getCurrentDemoUser() {
  const state = getDemoState()
  return state.session ? state.users.find((user) => user.id === state.session.userId) || null : null
}

export function setCurrentDemoUser(userId) {
  const state = getDemoState()
  state.session = { userId }
  saveDemoState(state)
  return state
}

export function clearCurrentDemoUser() {
  const state = getDemoState()
  state.session = null
  saveDemoState(state)
  return state
}

export function findDemoUserByUsername(username) {
  const state = getDemoState()
  const normalized = String(username || '').trim().toLowerCase()
  return state.users.find((user) => user.username.toLowerCase() === normalized) || null
}

export function createDemoUser({ fullName, username, birthdate, password }) {
  const state = getDemoState()
  const user = {
    id: `demo-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    full_name: fullName.trim(),
    username: username.toLowerCase(),
    password,
    birthdate,
    role: 'student',
    account_status: 'active',
    created_at: new Date().toISOString(),
  }
  state.users.push(user)
  saveDemoState(state)
  return user
}

export function updateDemoUser(userId, updates) {
  const state = getDemoState()
  const target = state.users.find((user) => user.id === userId)
  if (!target) return null
  Object.assign(target, updates)
  saveDemoState(state)
  return target
}

export function getDemoQuestionById(questionId) {
  return getDemoState().questions.find((question) => question.id === questionId) || null
}

export function getDemoLevelsForStudent() {
  return getDemoState().levels.filter((level) => level.is_active !== false)
}

export function getDemoQuestionsForLevel(levelNumber) {
  return getDemoState().questions.filter((question) => Number(question.level) === Number(levelNumber))
}

export function saveDemoAttempt(attempt) {
  const state = getDemoState()
  state.attempts.push(attempt)
  saveDemoState(state)
  return attempt
}

export function getDemoAttemptById(attemptId) {
  return getDemoState().attempts.find((attempt) => attempt.id === attemptId) || null
}

export function getDemoAttemptsForStudent(studentId) {
  return getDemoState().attempts.filter((attempt) => attempt.student_id === studentId)
}

export function getLevelProgressForDemoUser(studentId) {
  const state = getDemoState()
  const attempts = getDemoAttemptsForStudent(studentId)
  const progress = state.levels.filter((level) => level.is_active !== false).map((level) => {
    const levelAttempts = attempts.filter((attempt) => Number(attempt.level_number) === Number(level.level_number))
    const bestScore = Math.max(0, ...levelAttempts.map((attempt) => Number(attempt.score || 0)))
    const isCompleted = levelAttempts.some((attempt) => Number(attempt.score || 0) >= 100)
    const isUnlocked = level.level_number === 1 || levelAttempts.some((attempt) => Number(attempt.score || 0) >= 100) || level.level_number === 1
    return {
      id: `${studentId}-${level.level_number}`,
      level_id: level.id,
      level_number: level.level_number,
      student_id: studentId,
      best_score: bestScore,
      attempts: levelAttempts.length,
      is_unlocked: isUnlocked,
      is_completed: isCompleted,
      updated_at: new Date().toISOString(),
    }
  })

  return progress
}

export function getDemoAnalyticsOverview() {
  const state = getDemoState()
  const totalStudents = state.users.filter((user) => user.role === 'student').length
  const attempts = state.attempts
  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0) / attempts.length)
    : 0
  const completionRate = attempts.length
    ? Math.round((attempts.filter((attempt) => Number(attempt.passed || 0) === 1).length / attempts.length) * 100)
    : 0

  return {
    total_students: totalStudents,
    active_students: totalStudents,
    students_started: totalStudents,
    students_completed: state.attempts.filter((attempt) => Number(attempt.passed || 0) === 1).length,
    total_attempts: attempts.length,
    average_score: avgScore,
    completion_rate: completionRate,
  }
}

export function getDemoAnalyticsByLevel() {
  return LAW_OF_SINES_LEVELS.map((level) => {
    const levelAttempts = getDemoState().attempts.filter((attempt) => Number(attempt.level_number) === Number(level.level_number))
    const attempts = levelAttempts.length
    const avgScore = attempts
      ? Math.round(levelAttempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0) / attempts)
      : 0
    const passRate = attempts
      ? Math.round((levelAttempts.filter((attempt) => Number(attempt.passed || 0) === 1).length / attempts) * 100)
      : 0

    return {
      level_number: level.level_number,
      title: level.title,
      attempts,
      students_attempted: new Set(levelAttempts.map((attempt) => attempt.student_id)).size,
      students_completed: levelAttempts.filter((attempt) => Number(attempt.passed || 0) === 1).length,
      avg_score: avgScore,
      pass_rate: passRate,
    }
  })
}

export function getDemoQuestionAnalytics() {
  const state = getDemoState()
  const questionMap = new Map()

  for (const attempt of state.attempts) {
    const answers = Array.isArray(attempt.answers) ? attempt.answers : []
    for (const answer of answers) {
      const questionId = answer.questionId || answer.question_id
      const question = getDemoQuestionById(questionId)
      if (!question) continue
      const entry = questionMap.get(questionId) || {
        question_id: questionId,
        level_number: question.level,
        question_text: question.question_text,
        topic: question.topic,
        difficulty: question.difficulty,
        times_asked: 0,
        times_wrong: 0,
      }
      entry.times_asked += 1
      if (answer.isCorrect === false || answer.is_correct === false) {
        entry.times_wrong += 1
      }
      questionMap.set(questionId, entry)
    }
  }

  return Array.from(questionMap.values()).map((entry) => ({
    ...entry,
    accuracy: entry.times_asked ? Math.max(0, Math.round(((entry.times_asked - entry.times_wrong) / entry.times_asked) * 100)) : 100,
  }))
}
