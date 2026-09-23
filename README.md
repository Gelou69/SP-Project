# 🧬 Evolution Quest — Grade 10 Science Evolution Quiz

An interactive, fully-functional **Grade 10 Science Evolution quiz game** built with
**React + Vite** and **Supabase** (Auth + PostgreSQL + Row Level Security + Storage).

- **10 levels · 10 questions each · 100 total questions · 100 free points per level**
- Students must earn a **perfect 100/100** to unlock each next level.
- Real accounts, real database scoring (never trust the browser), real randomized
  questions, 30-second per-question timers, sound effects, background music, and a
  complete teacher/admin panel.

---

## ✨ Features

| Area | Highlights |
| --- | --- |
| **Students** | Sign up (auto username `lastname.firstname`), sign in, profile, age auto-calculated from birthdate |
| **Dashboard** | Total points, best score, completed levels, progress %, animated level cards (unlocked / locked / completed) |
| **Quiz** | Seeded randomized question order + shuffled choices per student/attempt, 30 s timer, sounds, toasts, no correct-answer reveal on mistakes |
| **Scoring** | `submit_quiz` RPC recomputes score, attempt number, pass/fail and unlocks **inside the database** — results cannot be forged |
| **Results** | Perfect-score celebration + next-level unlock, or locked modal with "Try Again" |
| **Admin/Teacher** | Overview analytics, student search/filter, per-student performance tables, question CRUD + image upload, level management, charts (Recharts) |
| **Audio** | Procedural Web Audio sound effects + calm background music, SFX/Music toggles persisted in `localStorage`, autoplay-safe |
| **Security** | Row Level Security everywhere; students can only read/write their own records; admins guarded by `is_admin()` in database |

---

## 🚀 Complete Setup

### 1. Prerequisites
- Node.js **18+** (works with current LTS and Node 24)
- A free [Supabase](https://supabase.com) project

### 2. Install dependencies

```bash
npm install
```

### 3. Create the Supabase database

Open your Supabase project → **SQL Editor** → run the two files **in order**:

1. `supabase/schema.sql` — tables, triggers, indexes, RLS policies, secure RPCs, storage bucket, analytics views
2. `supabase/seed.sql` — Levels 1–10 and the **100 question seed**

> ⚠️ The questions were authored in `supabase/questions.data.js`. To regenerate the seed
> (e.g. after adding questions), run `npm run gen:seed` and re-run `supabase/seed.sql`.

### 4. Configure auth (important)

Supabase Auth → **Authentication → Providers → Email**:
- Turn **OFF** *"Confirm email"* (the app auto-derives a school email per student;
  nothing is actually sent to these addresses).
- Turn **ON** *"Allow new users to sign up"*.

### 5. Frontend environment

```bash
copy .env.example .env
```

Fill `.env` with your project's public keys
(Project Settings → API):

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

Only the **anon** key is used in the React app. The **service_role** key is used
**only** in the terminal bootstrap script below and must never be put in `.env` or the frontend.

### 6. Create the first teacher/admin account

```powershell
$env:SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
$env:ADMIN_FULL_NAME="Angelou Carpio"
node scripts/bootstrap-admin.mjs
```

The script signs the account in as a **student automatically**, then promotes the
profile to **admin** using the service role. Sign in with the printed username.

### 7. Run the app

```bash
npm run dev        # http://localhost:5173
npm run build      # production build to /dist
npm run preview    # preview the production build locally
```

---

## 🎮 How the game works

1. A new student signs up — the database trigger creates their profile with a
   normalized lowercase `lastname.firstname` username (uniqueness enforced, with a
   numeric suffix on collisions) and unlocks **Level 1**.
2. Each level has 10 questions, 30 seconds each, 10 points each (100 max).
3. **Perfect score (100/100) → next level unlocks.** Anything less shows the
   *"Perfect Score Required"* modal and **Level N+1 stays locked**.
4. Answer order and choice order are seeded from `studentId + level + attempt salt`,
   so retry order differs and students can't share an answer sequence.
5. On submit, the app sends only question ids + selected letters to the
   `submit_quiz` database function, which recomputes everything server-side.
6. Teachers see everything in `/admin` (students, per-level performance, full
   attempt history, question bank management, analytics).

---

## ⚙️ Secure scoring (how students can't cheat)

- The frontend never writes scores, unlocks, or correct answers.
- `submit_quiz(p_level_number, p_answers, ...)` is a **`SECURITY DEFINER`** RPC:
  it re-reads the correct answers from the `questions` table, tallies points,
  computes `passed`, auto-numbers the attempt, inserts `quiz_attempts` +
  `quiz_answers`, updates `student_progress`, and unlocks the next level **only if** the
  score is exactly `100`.
- Students fetch quiz questions **only** through `get_level_questions(level_id)`,
  which returns question text, image and the four choices — **never `correct_answer`**.
  Direct selects against `questions` are revoked for students by RLS.
- Instant green/red feedback at pick time uses `check_answer(question_id, answer)`,
  which returns only `true/false` — the correct letter never reaches the browser.
- Direct writes to `quiz_attempts`, `quiz_answers`, `student_progress`, and `questions`
  are blocked for students by RLS. Levels unlock **only** through the RPC.
- Admin-only RPCs (`admin_*`) throw unless `public.is_admin()` is true, and the
  analytics views are admin-gated too.

---

## 🗄 Database schema

```
profiles            id · full_name · birthdate · username · role · account_status · created_at · updated_at
levels              id · level_number · title · description · is_active
questions           id · level_id · question_text · image_url · choice_a..d · correct_answer · topic · difficulty · is_active
quiz_attempts       id · student_id · level_id · attempt_number · score · correct_answers · wrong_answers · total_questions · passed · status · question_order · time_used · started_at · completed_at
quiz_answers        id · attempt_id · question_id · selected_answer · is_correct · points · time_used · question_order
student_progress    id · student_id · level_id · best_score · attempts · is_unlocked · is_completed
+ storage bucket "question-images" (public read, admin-only write)
+ analytics views for the teacher dashboard
```

Foreign keys: `profiles.id → auth.users`, `questions.level_id → levels`,
`quiz_attempts.student_id → profiles`, `quiz_answers.attempt_id`,
`student_progress (student_id, level_id)` unique.

---

## 📁 Project structure

```
.
├── index.html
├── vite.config.js · tailwind.config.js · postcss.config.js
├── .env.example
├── supabase/
│   ├── schema.sql            # full schema + RLS + RPCs + storage + views
│   ├── seed.sql              # generated 10 levels + 100 questions
│   └── questions.data.js     # human-authored question bank (source)
├── scripts/
│   ├── build-seed.mjs        # regenerates supabase/seed.sql
│   └── bootstrap-admin.mjs   # creates the first admin account
├── public/dna.svg
└── src/
    ├── main.jsx · App.jsx · index.css
    ├── services/             # supabase, auth, quiz, admin (all DB access)
    ├── contexts/             # Auth, Audio (SFX+music), Toast providers
    ├── hooks/                # useCountdown, useStudentStats
    ├── utils/                # helpers (age, dates, formatting)
    ├── components/
    │   ├── layout/           # app shell + audio toggles
    │   ├── ui/               # Button, Card, Modal, ProgressBar, Toggle, ...
    │   ├── diagrams/         # built-in SVG educational diagrams
    │   ├── quiz/             # Timer, QuestionCard, AnswerOption
    │   └── ProtectedRoute.jsx
    └── pages/
        ├── Login · Signup · Dashboard · Quiz · Results · Profile · HomeRedirect
        └── admin/            # AdminLayout + Dashboard/Students/StudentDetail/
                              # Questions/Levels/Analytics
```

Routes:

```
/login  /signup
/dashboard  /quiz/:level  /results/:attemptId  /profile
/admin  /admin/students  /admin/students/:id
/admin/questions  /admin/levels  /admin/analytics
```

Students are redirected away from `/admin`; unauthenticated users are sent to `/login`.

---

## 🧪 Question bank (100 questions)

| Level | Title | Focus |
| --- | --- | --- |
| 1 | Foundations of Evolution | evidence, fossils, structures, natural selection basics |
| 2 | Fossils and Time | sedimentary rocks, index fossils, whale vestigial bones |
| 3 | Anatomy Uncovered | homologous vs analogous vs vestigial, Archaeopteryx |
| 4 | Evidence in DNA and Embryos | molecular evidence, embryos, radiometric dating |
| 5 | Natural Selection in Action | peppered moths, finch beaks, antibiotic resistance |
| 6 | Trees of Life | phylogenetic tree reading, clades, speciation |
| 7 | Cladograms and Classification | derived characters, outgroups, monophyly |
| 8 | Adaptation and Survival | camouflage, mimicry, migration, cactus spines |
| 9 | Evolution in the Modern World | DDT/antibiotic resistance, molecular clocks, Hox genes |
| 10 | Master of Evolution | synthesis, transitional fossils, missing links |

Questions include 15 built-in SVG diagrams (fossils, forelimbs, wings, vestigial organs,
phylogenetic trees, cladograms, finch beaks, peppered moths, embryos, mimicry, DNA, …)
referenced as `diagram://<key>` so images always render offline. Any remote image URL
is supported too (with a graceful fallback if it fails to load).

---

## ❓ Troubleshooting

- **`Missing Supabase configuration`** → you forgot the `.env` step; restart the dev server after editing.
- **Sign-in says "Invalid username or password"** even though the password is right → email confirmation
  is ON in Supabase Auth settings; turn it off and re-create the account, or confirm the auto-generated email.
- **Levels don't appear** → run both `supabase/schema.sql` **and** `supabase/seed.sql`.
- **Students appear disabled after sign-up** → run the bootstrap-admin script or promote a profile to
  `role = 'admin'` in the SQL editor (`update public.profiles set role = 'admin' where username = '...'`).
- **Image upload fails** → ensure the `question-images` Storage bucket was created (schema.sql does it)
  and that you are signed in as an admin.