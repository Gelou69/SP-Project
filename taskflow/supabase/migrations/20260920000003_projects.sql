-- 20260920000003 Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text not null default '',
  color text not null default '#6366f1',
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Members can view projects"
  on public.projects for select
  to authenticated
  using (public.is_member_of(organization_id));

create policy "Members can create projects"
  on public.projects for insert
  to authenticated
  with check (
    public.is_member_of(organization_id)
    and (select auth.uid()) = created_by
  );

create policy "Members can update projects"
  on public.projects for update
  to authenticated
  using (public.is_member_of(organization_id));

create policy "Members can delete projects"
  on public.projects for delete
  to authenticated
  using (public.is_member_of(organization_id));

create index projects_organization_id_idx on public.projects (organization_id);