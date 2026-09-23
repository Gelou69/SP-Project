import { supabase } from './supabase'

/** 30 seconds per question, 10 points each. */
export const QUIZ_TIME_PER_QUESTION = 30
export const POINTS_PER_QUESTION = 10
export const QUESTIONS_PER_LEVEL = 10

/**
 * Deterministic seeded RNG (mulberry32) so that after deriving a seed from
 * student id + attempt + a random session salt the same input always yields
 * the same order, but different students/attempts get different orders.
 */
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

/** Builds a new per-attempt shuffle seed so the same student retries in a new order. */
export function makeAttemptSeed(studentId, levelNumber, attemptSalt) {
  const base = hashCode(`${studentId}:${levelNumber}:${attemptSalt}`)
  return base
}

export async function getLevels() {
  const { data, error } = await supabase
    .from('levels')
    .select('id, level_number, title, description, is_active')
    .order('level_number', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function getMyProgress() {
  const { data, error } = await supabase.rpc('get_my_progress')
  if (error) throw new Error(error.message)
  return data || []
}

export async function getQuestionsForLevel(levelId) {
  const { data, error } = await supabase.rpc('get_level_questions', {
    p_level_id: levelId,
  })
  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Live per-answer check for instant green/red feedback. The correct
 * answer letter never reaches the browser — only whether a pick was right.
 */
export async function checkAnswer(questionId, selectedAnswer) {
  const { data, error } = await supabase.rpc('check_answer', {
    p_question_id: questionId,
    p_selected_answer: selectedAnswer,
  })
  if (error) throw new Error(error.message)
  return Boolean(data)
}

/**
 * Loads and orders a quiz for a level.
 *  - questions are shuffled by a seed derived from student id + level + attempt salt
 *  - choices are shuffled per question (correct answer position randomized)
 */
export async function buildQuiz({ levelNumber, levels, studentId, attemptSalt }) {
  const level = levels.find((l) => l.level_number === levelNumber)
  if (!level) throw new Error('Level not found.')
  const questions = await getQuestionsForLevel(level.id)

  if (questions.length < QUESTIONS_PER_LEVEL) {
    throw new Error(`Level ${levelNumber} needs at least ${QUESTIONS_PER_LEVEL} active questions.`)
  }

  const seed = makeAttemptSeed(studentId, levelNumber, attemptSalt)
  const orderedQuestions = shuffleWithSeed(questions, seed).map((q, qi) => {
    const pairs = [
      { label: 'A', text: q.choice_a },
      { label: 'B', text: q.choice_b },
      { label: 'C', text: q.choice_c },
      { label: 'D', text: q.choice_d },
    ]
    // Shuffle the ORDER of the four choices. Each option keeps its original
    // persisted letter glued to its text, so the letter the student submits
    // always matches the column submit_quiz re-checks server-side.
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

/**
 * Submits the quiz to the database. The score, pass/fail, attempt number and
 * level unlocking are all computed server-side by the submit_quiz RPC —
 * the client can never forge them.
 */
export async function submitQuiz({ levelNumber, answers, timeUsed, startedAt }) {
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
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*, level:levels(level_number, title)')
    .eq('id', attemptId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function getAttemptAnswers(attemptId) {
  const { data, error } = await supabase
    .from('quiz_answers')
    .select('*, question:questions(question_text)')
    .eq('attempt_id', attemptId)
    .order('question_order', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function getMyAttempts(limit = 100) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*, level:levels(level_number, title)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data || []
}

/** Only for the quiz start flow: verify the student may access this level. */
export async function getProgressForLevel(levelId) {
  const { data, error } = await supabase
    .from('student_progress')
    .select('*')
    .eq('level_id', levelId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}