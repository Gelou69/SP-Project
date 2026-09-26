-- ============================================================
--  GRADE 10 SCIENCE – EVOLUTION QUIZ
--  Supabase Schema + Row Level Security + RPC functions
--  Paste into Supabase SQL Editor (Database > SQL Editor) and Run.
--  After this file, ALSO run seed.sql to insert levels + 100 questions.
-- ============================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  birthdate date not null,
  username text not null unique,
  role text not null default 'student' check (role in ('student','admin')),
  account_status text not null default 'active' check (account_status in ('active','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.levels (
  id uuid primary key default gen_random_uuid(),
  level_number int not null unique,
  title text not null,
  description text default '',
  is_active boolean not null default true,
  pretest_enabled boolean not null default true,
  posttest_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  level_id uuid references public.levels(id) on delete cascade,
  question_text text not null,
  image_url text,
  choice_a text not null,
  choice_b text not null,
  choice_c text not null,
  choice_d text not null,
  correct_answer text not null check (correct_answer in ('A','B','C','D')),
  topic text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade,
  level_id uuid references public.levels(id) on delete cascade,
  attempt_number int not null,
  score int not null default 0,
  correct_answers int not null default 0,
  wrong_answers int not null default 0,
  total_questions int not null default 10,
  passed boolean not null default false,
  status text not null default 'completed' check (status in ('completed','abandoned')),
  question_order jsonb,
  time_used int,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references public.quiz_attempts(id) on delete cascade,
  question_id uuid references public.questions(id) on delete cascade,
  selected_answer text,
  is_correct boolean not null default false,
  points int not null default 0,
  time_used int,
  question_order int,
  created_at timestamptz not null default now()
);

create table if not exists public.student_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade,
  level_id uuid references public.levels(id) on delete cascade,
  best_score int not null default 0,
  attempts int not null default 0,
  is_unlocked boolean not null default false,
  is_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (student_id, level_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_questions_level on public.questions(level_id);
create index if not exists idx_questions_active on public.questions(level_id, is_active);
create index if not exists idx_attempts_student on public.quiz_attempts(student_id);
create index if not exists idx_attempts_level on public.quiz_attempts(level_id);
create index if not exists idx_attempts_student_level on public.quiz_attempts(student_id, level_id);
create index if not exists idx_answers_attempt on public.quiz_answers(attempt_id);
create index if not exists idx_progress_student on public.student_progress(student_id);
create index if not exists idx_progress_student_level on public.student_progress(student_id, level_id);
create unique index if not exists idx_profiles_username_ci
  on public.profiles (lower(username));

-- ============================================================
-- HELPERS
-- ============================================================

-- True when the signed-in user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- True when a user profile is disabled
create or replace function public.is_disabled()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and account_status = 'disabled'
  );
$$;

-- Normalize a full name into a lowercase "lastname.firstname" username.
-- Falls back to a numeric suffix when the candidate is already taken.
create or replace function public.make_username(p_full_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parts text[];
  v_first text;
  v_last text;
  v_base text;
  v_candidate text;
  v_suffix int := 1;
begin
  v_parts := regexp_split_to_array(trim(p_full_name), '\s+');
  v_last := v_parts[array_length(v_parts, 1)];
  v_first := v_parts[1];
  v_base := lower(v_last || '.' || v_first);
  v_base := regexp_replace(v_base, '[^a-z0-9.]', '', 'g');
  v_candidate := v_base;
  loop
    if not exists (select 1 from public.profiles where lower(username) = lower(v_candidate)) then
      return v_candidate;
    end if;
    v_suffix := v_suffix + 1;
    v_candidate := v_base || v_suffix::text;
  end loop;
end;
$$;

-- ============================================================
-- PROFILE CREATION TRIGGER (runs after a new auth user signs up)
-- Always creates the profile as role 'student'. The username is
-- auto-generated from full_name. Level 1 is unlocked by default.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_birthdate date;
  v_requested_username text;
  v_username text;
  v_suffix int := 2;
  v_level_1 uuid;
begin
  v_full_name := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')), '');
  if v_full_name is null then
    raise exception 'full_name is required in user metadata';
  end if;
  v_birthdate := coalesce(nullif(new.raw_user_meta_data->>'birthdate', '')::date, '2001-01-01'::date);
  v_requested_username := lower(nullif(trim(new.raw_user_meta_data->>'username'), ''));
  if v_requested_username is null then
    v_username := public.make_username(v_full_name);
  elsif v_requested_username !~ '^[a-z0-9]+\.[a-z0-9]+$' then
    raise exception 'username must use the format lastname.firstname';
  else
    v_username := v_requested_username;
    while exists (select 1 from public.profiles where lower(username) = lower(v_username)) loop
      v_username := v_requested_username || v_suffix::text;
      v_suffix := v_suffix + 1;
    end loop;
  end if;

  insert into public.profiles (id, full_name, birthdate, username, role, account_status)
  values (new.id, v_full_name, v_birthdate, v_username, 'student', 'active');

  select id into v_level_1 from public.levels where level_number = 1;
  if v_level_1 is not null then
    insert into public.student_progress (student_id, level_id, best_score, attempts, is_unlocked, is_completed)
    values (new.id, v_level_1, 0, 0, true, false)
    on conflict (student_id, level_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.levels enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.student_progress enable row level security;

-- profiles ------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
  on public.profiles for insert
  with check (public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  using (public.is_admin());

-- levels ---------------------------------------------------
drop policy if exists "levels_select_authenticated" on public.levels;
create policy "levels_select_authenticated"
  on public.levels for select
  to authenticated
  using (true);

drop policy if exists "levels_admin_all" on public.levels;
create policy "levels_admin_all"
  on public.levels for all
  using (public.is_admin())
  with check (public.is_admin());

-- questions ------------------------------------------------
-- Students read quiz questions ONLY through the
-- public.get_level_questions() RPC, which never exposes
-- correct_answer. Direct selects against questions are admin-only.
drop policy if exists "questions_select_authenticated" on public.questions;
drop policy if exists "questions_select_admin" on public.questions;
create policy "questions_select_admin"
  on public.questions for select
  to authenticated
  using (public.is_admin());

drop policy if exists "questions_admin_all" on public.questions;
create policy "questions_admin_all"
  on public.questions for all
  using (public.is_admin())
  with check (public.is_admin());

-- quiz_attempts --------------------------------------------
drop policy if exists "attempts_select_own_or_admin" on public.quiz_attempts;
create policy "attempts_select_own_or_admin"
  on public.quiz_attempts for select
  using (auth.uid() = student_id or public.is_admin());

drop policy if exists "attempts_admin_all" on public.quiz_attempts;
create policy "attempts_admin_all"
  on public.quiz_attempts for all
  using (public.is_admin())
  with check (public.is_admin());

-- quiz_answers ---------------------------------------------
drop policy if exists "answers_select_own_or_admin" on public.quiz_answers;
create policy "answers_select_own_or_admin"
  on public.quiz_answers for select
  using (exists (
    select 1 from public.quiz_attempts a
    where a.id = attempt_id and (a.student_id = auth.uid() or public.is_admin())
  ));

drop policy if exists "answers_admin_all" on public.quiz_answers;
create policy "answers_admin_all"
  on public.quiz_answers for all
  using (public.is_admin())
  with check (public.is_admin());

-- student_progress -----------------------------------------
drop policy if exists "progress_select_own_or_admin" on public.student_progress;
create policy "progress_select_own_or_admin"
  on public.student_progress for select
  using (auth.uid() = student_id or public.is_admin());

drop policy if exists "progress_admin_all" on public.student_progress;
create policy "progress_admin_all"
  on public.student_progress for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- RPC: update_my_profile
-- Student updates only full_name, birthdate (and regenerates
-- username). Role / account_status / id can never be changed.
-- ============================================================

create or replace function public.update_my_profile(p_full_name text, p_birthdate date)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_username text;
  v_row public.profiles;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_full_name is null or length(trim(p_full_name)) = 0 then
    raise exception 'full_name is required';
  end if;
  if p_birthdate is null then
    raise exception 'birthdate is required';
  end if;

  v_username := public.make_username(p_full_name);

  update public.profiles
     set full_name = trim(p_full_name),
         birthdate = p_birthdate,
         username = v_username,
         updated_at = now()
   where id = v_uid
   returning * into v_row;

  if v_row is null then
    raise exception 'Profile not found';
  end if;
  return v_row;
end;
$$;

-- ============================================================
-- RPC: get_my_progress
-- Returns the student's progress rows, safely upserting one row
-- per level so every level always exists for the user.
-- ============================================================

create or replace function public.get_my_progress()
returns setof public.student_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rec record;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  for v_rec in select id from public.levels where is_active = true order by level_number loop
    insert into public.student_progress (student_id, level_id, is_unlocked)
    values (v_uid, v_rec.id, false)
    on conflict (student_id, level_id) do nothing;
  end loop;

  update public.student_progress sp
     set is_unlocked = (
       l.level_number = 1
       or (
         coalesce((select max(best_score)
                  from public.student_progress sp_prev
                  join public.levels l_prev on l_prev.id = sp_prev.level_id
                  where sp_prev.student_id = v_uid
                    and l_prev.level_number = l.level_number - 1), 0) >= 80
       )
       or sp.is_unlocked
     ),
         updated_at = now()
    from public.levels l
   where sp.student_id = v_uid
     and sp.level_id = l.id
     and sp.is_unlocked is distinct from (
       l.level_number = 1
       or (
         coalesce((select max(best_score)
                  from public.student_progress sp_prev
                  join public.levels l_prev on l_prev.id = sp_prev.level_id
                  where sp_prev.student_id = v_uid
                    and l_prev.level_number = l.level_number - 1), 0) >= 80
       )
       or sp.is_unlocked
     );

  return query
    select sp.*
      from public.student_progress sp
      join public.levels l on l.id = sp.level_id
     where sp.student_id = v_uid
     order by l.level_number;
end;
$$;

-- ============================================================
-- RPC: get_student_leaderboard
-- Shows only student accounts and ranks each student by their
-- best result, not by every individual attempt record.
-- ============================================================

drop function if exists public.get_student_leaderboard(integer);

create or replace function public.get_student_leaderboard(p_limit int default 10)
returns table (
  rank_no bigint,
  student_id uuid,
  full_name text,
  username text,
  correct_answers int,
  score int,
  total_score int,
  highest_level int,
  highest_score int,
  level_summary text
)
language sql
security definer
set search_path = public
as $$
  with student_levels as (
    select
      sp.student_id,
      p.full_name,
      p.username,
      l.level_number,
      coalesce(sp.best_score, 0) as best_score,
      coalesce(sp.best_score / 10, 0) as correct_answers_this_level
    from public.student_progress sp
    join public.levels l on l.id = sp.level_id
    join public.profiles p on p.id = sp.student_id
    where p.role = 'student'
      and p.account_status = 'active'
      and l.is_active = true
  ),
  totals as (
    select
      student_id,
      full_name,
      username,
      sum(correct_answers_this_level)::int as correct_answers,
      sum(best_score)::int as score,
      sum(best_score)::int as total_score,
      max(level_number) as highest_level,
      max(best_score) as highest_score,
      string_agg(format('Lvl%s-%s', level_number, best_score), ' ' order by level_number) as level_summary
    from student_levels
    group by student_id, full_name, username
  ),
  ranked as (
    select
      student_id,
      full_name,
      username,
      coalesce(correct_answers, 0) as correct_answers,
      coalesce(score, 0) as score,
      coalesce(total_score, 0) as total_score,
      coalesce(highest_level, 1) as highest_level,
      coalesce(highest_score, 0) as highest_score,
      coalesce(level_summary, 'Lvl1-0') as level_summary,
      row_number() over (
        order by coalesce(correct_answers, 0) desc,
                 coalesce(total_score, 0) desc,
                 username asc
      ) as rank_no
    from totals
  )
  select
    rank_no,
    student_id,
    full_name,
    username,
    correct_answers,
    score,
    total_score,
    highest_level,
    highest_score,
    level_summary
  from ranked
  where rank_no <= p_limit
  order by rank_no;
$$;

grant execute on function public.get_student_leaderboard(int) to authenticated;

grant execute on function public.get_student_leaderboard(int) to authenticated;

grant execute on function public.get_student_leaderboard(int) to authenticated;

-- ============================================================
-- RPC: get_level_questions
-- The ONLY way a student fetches quiz questions. Returns the
-- question text, image and the four choices — but NEVER the
-- correct_answer column, so the answer key stays server-side.
-- ============================================================

create or replace function public.get_level_questions(p_level_id uuid)
returns table (
  id uuid,
  question_text text,
  image_url text,
  choice_a text,
  choice_b text,
  choice_c text,
  choice_d text,
  topic text,
  difficulty text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_disabled() then
    raise exception 'Account is disabled';
  end if;
  return query
    select q.id, q.question_text, q.image_url,
           q.choice_a, q.choice_b, q.choice_c, q.choice_d,
           q.topic, q.difficulty
      from public.questions q
      join public.levels l on l.id = q.level_id
     where q.level_id = p_level_id
       and q.is_active = true
       and l.is_active = true;
end;
$$;

-- ============================================================
-- RPC: check_answer
-- Tells the client whether a chosen answer is correct so it can
-- give instant green/red feedback WITHOUT sending the correct
-- answer letter to the browser. The final score is still
-- recomputed authoritatively by submit_quiz.
-- ============================================================

create or replace function public.check_answer(p_question_id uuid, p_selected_answer text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correct text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if public.is_disabled() then
    raise exception 'Account is disabled';
  end if;
  select q.correct_answer into v_correct
    from public.questions q
    join public.levels l on l.id = q.level_id
   where q.id = p_question_id and q.is_active = true and l.is_active = true;
  if v_correct is null then
    raise exception 'Question not found or inactive';
  end if;
  return upper(coalesce(p_selected_answer, '')) = v_correct;
end;
$$;

-- ============================================================
-- RPC: submit_quiz — THE SECURE SCORING + UNLOCKING ENTRY POINT
-- The client sends only question ids + selected answers. The
-- database recomputes correctness, score, pass/fail, attempt
-- number and level unlocking. Students can never forge a score.
-- ============================================================

create or replace function public.submit_quiz(
  p_level_number int,
  p_answers jsonb,
  p_time_used int default null,
  p_started_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_level_id uuid;
  v_total int;
  v_correct int := 0;
  v_score int := 0;
  v_passed boolean := false;
  v_attempt_no int;
  v_attempt_id uuid;
  v_answer jsonb;
  v_q_id uuid;
  v_sel text;
  v_right text;
  v_pts int;
  v_order int;
  v_prev_best int := 0;
  v_next_level uuid;
  v_next_no int;
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if v_profile is null then
    raise exception 'Profile not found';
  end if;
  if v_profile.account_status = 'disabled' then
    raise exception 'Account is disabled';
  end if;

  select id into v_level_id from public.levels
   where level_number = p_level_number and is_active = true;
  if v_level_id is null then
    raise exception 'Level not found or inactive';
  end if;

  select count(*) into v_total from public.questions
   where level_id = v_level_id and is_active = true;

  if v_total < 1 then
    raise exception 'No active questions for this level';
  end if;

  -- buffer for answers so we can compute correct answers before attempt exists
  create temp table if not exists pg_temp.answer_buf
    (qid uuid, sel text, ord int, pts int, correct boolean, tu int) on commit drop;
  truncate pg_temp.answer_buf;

  -- compute correct answers server-side
  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    v_q_id   := (v_answer->>'question_id')::uuid;
    v_sel    := upper(coalesce(nullif(v_answer->>'selected_answer',''), ''));
    v_order  := coalesce((v_answer->>'order')::int, 0);

    select correct_answer into v_right
      from public.questions
     where id = v_q_id and level_id = v_level_id;

    if v_right is not null and v_sel = v_right then
      v_correct := v_correct + 1;
      v_pts := 10;
    else
      v_pts := 0;
    end if;

    insert into pg_temp.answer_buf (qid, sel, ord, pts, correct, tu)
    values (v_q_id, case when v_sel = '' then null else v_sel end, v_order, v_pts, v_pts = 10, (v_answer->>'time_used')::int);
  end loop;

  v_score := v_correct * 10;
  v_passed := (v_score >= 80);

  select coalesce(max(attempt_number), 0) + 1 into v_attempt_no
    from public.quiz_attempts where student_id = v_uid and level_id = v_level_id;

  insert into public.quiz_attempts
    (student_id, level_id, attempt_number, score, correct_answers, wrong_answers,
     total_questions, passed, status, question_order, time_used, started_at, completed_at)
  values
    (v_uid, v_level_id, v_attempt_no, v_score, v_correct, v_total - v_correct,
     v_total, v_passed, 'completed',
     (select coalesce(jsonb_agg(jsonb_build_object('question_id', qid, 'selected_answer', sel, 'is_correct', correct, 'points', pts, 'time_used', tu) order by ord), '[]'::jsonb) from pg_temp.answer_buf),
     coalesce(p_time_used, 0),
     p_started_at, now())
  returning id into v_attempt_id;

  insert into public.quiz_answers (attempt_id, question_id, selected_answer, is_correct, points, time_used, question_order)
  select v_attempt_id, qid, sel, correct, pts, tu, ord from pg_temp.answer_buf;

  drop table pg_temp.answer_buf;

  -- update student progress
  select best_score into v_prev_best from public.student_progress
   where student_id = v_uid and level_id = v_level_id;

  if v_prev_best is null then
    v_prev_best := 0;
  end if;

  insert into public.student_progress (student_id, level_id, best_score, attempts, is_unlocked, is_completed, updated_at)
  values (v_uid, v_level_id, greatest(v_prev_best, v_score), 1, v_passed, v_passed, now())
  on conflict (student_id, level_id) do update
    set best_score = greatest(public.student_progress.best_score, excluded.best_score),
        attempts = public.student_progress.attempts + 1,
        is_completed = excluded.is_completed or public.student_progress.is_completed,
        is_unlocked = excluded.is_unlocked or public.student_progress.is_unlocked,
        updated_at = now();

  -- unlock the NEXT level once the student reaches the 80% pass threshold
  if v_passed then
    select l2.id, l2.level_number into v_next_level, v_next_no
      from public.levels l2
     where l2.level_number = p_level_number + 1 and l2.is_active = true;

    if v_next_level is not null then
      insert into public.student_progress (student_id, level_id, is_unlocked)
      values (v_uid, v_next_level, true)
      on conflict (student_id, level_id) do update
        set is_unlocked = true, updated_at = now();
    end if;
  end if;

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'level_number', p_level_number,
    'attempt_number', v_attempt_no,
    'score', v_score,
    'correct_answers', v_correct,
    'wrong_answers', v_total - v_correct,
    'total_questions', v_total,
    'passed', v_passed,
    'time_used', coalesce(p_time_used, 0)
  );
end;
$$;

-- ============================================================
-- RPC: admin_update_student_status
-- ============================================================

create or replace function public.admin_update_student_status(p_student_id uuid, p_status text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  if p_status not in ('active','disabled') then
    raise exception 'Invalid status';
  end if;
  update public.profiles
     set account_status = p_status, updated_at = now()
   where id = p_student_id and role = 'student'
   returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.admin_delete_student(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  delete from auth.users where id = p_student_id;
end;
$$;

-- ============================================================
-- RPC: admin_upsert_question
-- ============================================================

create or replace function public.admin_upsert_question(
  p_id uuid default null,
  p_level_id uuid default null,
  p_level_number int default null,
  p_question_text text default null,
  p_image_url text default null,
  p_choice_a text default null,
  p_choice_b text default null,
  p_choice_c text default null,
  p_choice_d text default null,
  p_correct_answer text default null,
  p_topic text default null,
  p_difficulty text default null,
  p_is_active boolean default true
)
returns public.questions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_level uuid := p_level_id;
  v_row public.questions;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  if p_level_number is not null then
    select id into v_level from public.levels where level_number = p_level_number;
  end if;
  if v_level is null then
    raise exception 'A valid level is required';
  end if;

  if p_correct_answer is not null then
    p_correct_answer := upper(p_correct_answer);
  end if;

  if p_id is null then
    insert into public.questions
      (level_id, question_text, image_url, choice_a, choice_b, choice_c, choice_d,
       correct_answer, topic, difficulty, is_active)
    values
      (v_level, p_question_text, p_image_url, p_choice_a, p_choice_b, p_choice_c, p_choice_d,
       p_correct_answer, p_topic, coalesce(p_difficulty, 'medium'), coalesce(p_is_active, true))
    returning * into v_row;
  else
    update public.questions
       set level_id = v_level,
           question_text = coalesce(p_question_text, question_text),
           image_url = coalesce(p_image_url, image_url),
           choice_a = coalesce(p_choice_a, choice_a),
           choice_b = coalesce(p_choice_b, choice_b),
           choice_c = coalesce(p_choice_c, choice_c),
           choice_d = coalesce(p_choice_d, choice_d),
           correct_answer = coalesce(p_correct_answer, correct_answer),
           topic = coalesce(p_topic, topic),
           difficulty = coalesce(p_difficulty, difficulty),
           is_active = coalesce(p_is_active, is_active),
           updated_at = now()
     where id = p_id
     returning * into v_row;
  end if;

  return v_row;
end;
$$;

create or replace function public.admin_delete_question(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  delete from public.questions where id = p_id;
end;
$$;

create or replace function public.admin_toggle_level(p_id uuid, p_active boolean)
returns public.levels
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.levels;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  update public.levels set is_active = p_active where id = p_id returning * into v_row;
  return v_row;
end;
$$;

-- ============================================================
-- STORAGE: question image bucket
-- ============================================================

insert into storage.buckets (id, name, public)
values ('question-images', 'question-images', true)
on conflict (id) do nothing;

drop policy if exists "question_images_public_read" on storage.objects;
create policy "question_images_public_read"
  on storage.objects for select
  using (bucket_id = 'question-images');

drop policy if exists "question_images_admin_insert" on storage.objects;
create policy "question_images_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'question-images' and public.is_admin());

drop policy if exists "question_images_admin_update" on storage.objects;
create policy "question_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'question-images' and public.is_admin());

drop policy if exists "question_images_admin_delete" on storage.objects;
create policy "question_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'question-images' and public.is_admin());

-- ============================================================
-- PUBLIC VIEWS USED BY ADMIN ANALYTICS
-- security_invoker = true means row-level security of the
-- underlying tables applies to the caller. The outer
-- public.is_admin() guard makes these admin-only regardless.
-- ============================================================

drop view if exists public.analytics_overview;
drop view if exists public.analytics_levels;
drop view if exists public.analytics_questions;

create or replace view public.analytics_overview with (security_invoker = true) as
select * from (
  select
    (select count(*) from public.profiles where role = 'student') as total_students,
    (select count(*) from public.profiles where role = 'student' and account_status = 'active') as active_students,
    (select count(distinct student_id) from public.quiz_attempts) as students_started,
    (select count(distinct student_id) from public.quiz_attempts where score >= 80) as students_completed,
    (select count(*) from public.quiz_attempts) as total_attempts,
    (select coalesce(round(avg(score)::numeric, 1), 0) from public.quiz_attempts) as average_score,
    (select coalesce(round(avg(correct_answers::numeric / nullif(total_questions,0)) * 100, 1), 0) from public.quiz_attempts) as completion_rate
) _ov
where public.is_admin();

create or replace view public.analytics_levels with (security_invoker = true) as
with attempt_summary as (
  select
    a.level_id,
    count(*) as attempts,
    count(distinct a.student_id) as students_attempted,
    count(distinct a.student_id) filter (where a.score >= 80) as students_completed,
    round(avg(a.score)::numeric, 1) as avg_score,
    round(count(*) filter (where a.score >= 80)::numeric / nullif(count(*), 0) * 100, 1) as pass_rate
  from public.quiz_attempts a
  group by a.level_id
)
select * from (
  select
    l.level_number,
    l.title,
    coalesce(s.students_attempted, 0) as students_attempted,
    coalesce(s.students_completed, 0) as students_completed,
    coalesce(s.attempts, 0) as attempts,
    coalesce(s.avg_score, 0) as avg_score,
    coalesce(s.pass_rate, 0) as pass_rate
  from public.levels l
  left join attempt_summary s on s.level_id = l.id
  order by l.level_number
) _lv
where public.is_admin();

create or replace view public.analytics_questions with (security_invoker = true) as
select * from (
  select
    q.id as question_id,
    q.question_text,
    q.topic,
    q.difficulty,
    l.level_number,
    count(qa.id) as times_asked,
    count(qa.id) filter (where qa.is_correct) as times_correct,
    count(qa.id) filter (where not qa.is_correct) as times_wrong,
    coalesce(round(count(qa.id) filter (where qa.is_correct)::numeric / nullif(count(qa.id), 0) * 100, 1), 0) as accuracy
  from public.questions q
  join public.levels l on l.id = q.level_id
  left join public.quiz_answers qa on qa.question_id = q.id
  group by q.id, q.question_text, q.topic, q.difficulty, l.level_number
  order by accuracy asc, times_wrong desc
) _q
where public.is_admin();
