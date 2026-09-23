-- Seed data for TaskFlow (runs after migrations on `supabase db reset`)
--
-- Demo users (email / password):
--   alice@taskflow.local / alice123   (owner of Acme Corp)
--   bob@taskflow.local   / bob123
--   carol@taskflow.local / carol123

-- 1. Auth users -------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  is_super_admin
) values
(
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'alice@taskflow.local',
  crypt('alice123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Alice Adams"}',
  now(), now(), '', '', false
),
(
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated', 'authenticated', 'bob@taskflow.local',
  crypt('bob123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Bob Berger"}',
  now(), now(), '', '', false
),
(
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-3333-3333-333333333333',
  'authenticated', 'authenticated', 'carol@taskflow.local',
  crypt('carol123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Carol Chen"}',
  now(), now(), '', '', false
);

-- 2. Auth identities --------------------------------------------------------
insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values
(
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"alice@taskflow.local","email_verified":true}',
  'email', now(), now(), now()
),
(
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '{"sub":"22222222-2222-2222-2222-222222222222","email":"bob@taskflow.local","email_verified":true}',
  'email', now(), now(), now()
),
(
  '33333333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333333',
  '{"sub":"33333333-3333-3333-3333-333333333333","email":"carol@taskflow.local","email_verified":true}',
  'email', now(), now(), now()
);

-- 3. Organization + members --------------------------------------------------
insert into public.organizations (id, name, description, invite_code, created_by) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Acme Corp',
   'A product company with a lot going on.',
   'acme42',
   '11111111-1111-1111-1111-111111111111');

insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'admin'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'member');

-- 4. Projects ----------------------------------------------------------------
insert into public.projects (id, organization_id, name, description, color, created_by) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Website Redesign', 'Refresh the marketing site and brand.', '#6366f1',
   '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Mobile App v2', 'Next major release of the mobile app.', '#10b981',
   '22222222-2222-2222-2222-222222222222');

-- 5. Tasks -------------------------------------------------------------------
insert into public.tasks (
  id, project_id, title, description, status, priority,
  assignee_id, due_date, created_by, created_at, updated_at
) values
(
  'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  'Design new landing page hero', 'Explore animations for the hero section.',
  'todo', 'high', '22222222-2222-2222-2222-222222222222',
  current_date + 14, '11111111-1111-1111-1111-111111111111', now(), now()
),
(
  'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  'Set up design tokens', 'Create the color and spacing tokens.',
  'in_progress', 'medium', '33333333-3333-3333-3333-333333333333',
  current_date + 7, '11111111-1111-1111-1111-111111111111', now(), now()
),
(
  'cccccccc-cccc-cccc-cccc-ccccccccccc3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  'Migrate CMS content', 'Move blog posts to the new CMS.',
  'done', 'low', '22222222-2222-2222-2222-222222222222',
  current_date - 3, '11111111-1111-1111-1111-111111111111', now(), now()
),
(
  'cccccccc-cccc-cccc-cccc-ccccccccccc4', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
  'Ship offline mode', 'Cache API responses for offline usage.',
  'todo', 'urgent', '11111111-1111-1111-1111-111111111111',
  current_date + 21, '22222222-2222-2222-2222-222222222222', now(), now()
),
(
  'cccccccc-cccc-cccc-cccc-ccccccccccc5', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
  'Fix push notification flakiness', 'Notifications sometimes arrive twice.',
  'in_progress', 'high', '33333333-3333-3333-3333-333333333333',
  current_date + 4, '22222222-2222-2222-2222-222222222222', now(), now()
),
(
  'cccccccc-cccc-cccc-cccc-ccccccccccc6', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
  'Beta test signup flow', 'Run a beta with 20 users.',
  'done', 'medium', '22222222-2222-2222-2222-222222222222',
  current_date - 8, '22222222-2222-2222-2222-222222222222', now(), now()
);

-- 6. Comments ----------------------------------------------------------------
insert into public.task_comments (id, task_id, author_id, body, created_at) values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2',
   '11111111-1111-1111-1111-111111111111',
   'Please use the greens from the brand palette.', now() - interval '1 day'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'cccccccc-cccc-cccc-cccc-ccccccccccc4',
   '22222222-2222-2222-2222-222222222222',
   'Backend support is landing later this sprint.', now() - interval '3 hours');