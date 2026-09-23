// Generates supabase/seed.sql from supabase/questions.data.js
// Choices are deterministically shuffled (seeded by question index) so the
// correct answer is spread across A, B, C and D in the database.
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(arr, seed) {
  const a = [...arr]
  const rnd = mulberry32(seed)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const mod = await import(pathToFileURL(resolve(repoRoot, 'supabase/questions.data.js')).href)
const { levels, questions } = mod

const esc = (s) =>
  s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`

const rows = questions.map((q, i) => {
  const pairs = [
    ['A', q.a],
    ['B', q.b],
    ['C', q.c],
    ['D', q.d],
  ]
  const shuffled = shuffle(pairs, 1000 + i * 7)
  const correctPos = shuffled.findIndex((p) => p[0] === q.correct)
  const labels = ['A', 'B', 'C', 'D']
  const texts = shuffled.map((p) => p[1])
  return {
    level: q.level,
    text: q.q,
    image: q.image || null,
    choices: texts,
    correct: labels[correctPos],
    topic: q.topic,
    difficulty: q.difficulty,
  }
})

let out = `-- ============================================================
--  GRADE 10 SCIENCE - EVOLUTION QUIZ  |  SEED DATA
--  Generated automatically from supabase/questions.data.js
--  Run AFTER supabase/schema.sql
-- ============================================================

-- LEVELS ----------------------------------------------
insert into public.levels (level_number, title, description, is_active) values
${levels
  .map(
    (l, i) =>
      `  (${l.level_number}, ${esc(l.title)}, ${esc(l.description)}, true)${i === levels.length - 1 ? ';' : ','}`
  )
  .join('\n')}

-- QUESTIONS (100) --------------------------------------
insert into public.questions
  (level_id, question_text, image_url, choice_a, choice_b, choice_c, choice_d,
   correct_answer, topic, difficulty, is_active)
select l.id, v.question_text, v.image_url, v.choice_a, v.choice_b, v.choice_c, v.choice_d,
       v.correct_answer, v.topic, v.difficulty, true
from public.levels l
join (
  values
${rows
  .map(
    (r, i) =>
      `    (${r.level}::int, ${esc(r.text)}::text, ${esc(r.image)}::text, ${esc(r.choices[0])}::text, ${esc(r.choices[1])}::text, ${esc(r.choices[2])}::text, ${esc(r.choices[3])}::text, ${esc(r.correct)}::text, ${esc(r.topic)}::text, ${esc(r.difficulty)}::text)${i === rows.length - 1 ? '' : ','}`
  )
  .join('\n')}
  ) as v(level_number, question_text, image_url, choice_a, choice_b, choice_c, choice_d,
         correct_answer, topic, difficulty)
  on l.level_number = v.level_number;
`

writeFileSync(resolve(repoRoot, 'supabase/seed.sql'), out)
console.log('seed.sql written with', rows.length, 'questions')