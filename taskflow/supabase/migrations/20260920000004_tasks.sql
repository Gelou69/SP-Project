-- 20260920000004 Tasks and comments
-- Helper: is the current user a member of the organization that owns a project
create or replace function public.can_access_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id
      and public.is_member_of(p.organization_id)
  );
$$;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text not null default '',
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  assignee_id uuid references public.profiles (id) on delete set null,
  due_date date,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Members can view tasks"
  on public.tasks for select
  to authenticated
  using (public.can_access_project(project_id));

create policy "Members can create tasks"
  on public.tasks for insert
  to authenticated
  with check (
    public.can_access_project(project_id)
    and (select auth.uid()) = created_by
  );

create policy "Members can update tasks"
  on public.tasks for update
  to authenticated
  using (public.can_access_project(project_id));

create policy "Members can delete tasks"
  on public.tasks for delete
  to authenticated
  using (public.can_access_project(project_id));

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.touch_updated_at();

create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) > 0),
  created_at timestamptz not null default now()
);

alter table public.task_comments enable row level security;

create policy "Members can view comments"
  on public.task_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id
        and public.can_access_project(t.project_id)
    )
  );

create policy "Members can create comments"
  on public.task_comments for insert
  to authenticated
  with check (
    (select auth.uid()) = author_id
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and public.can_access_project(t.project_id)
    )
  );

create policy "Authors can delete comments"
  on public.task_comments for delete
  to authenticated
  using ((select auth.uid()) = author_id);

create index task_comments_task_id_idx on public.task_comments (task_id);