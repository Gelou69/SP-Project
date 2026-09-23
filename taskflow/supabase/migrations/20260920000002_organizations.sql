-- 20260920000002 Organizations and members
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  invite_code text not null unique default encode(gen_random_bytes(6), 'hex'),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.organization_members enable row level security;

-- Helper: is user a member of an organization
create or replace function public.is_member_of(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = (select auth.uid())
  );
$$;

-- Helper: is user an owner or admin of an organization
create or replace function public.is_admin_of(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = (select auth.uid())
      and om.role in ('owner', 'admin')
  );
$$;

-- Organizations RLS
create policy "Members can view organizations"
  on public.organizations for select
  to authenticated
  using (public.is_member_of(id));

create policy "Owners and admins can update organizations"
  on public.organizations for update
  to authenticated
  using (public.is_admin_of(id));

create policy "Owners can delete organizations"
  on public.organizations for delete
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = id
        and om.user_id = (select auth.uid())
        and om.role = 'owner'
    )
  );

-- Organization members RLS
create policy "Members can view members"
  on public.organization_members for select
  to authenticated
  using (public.is_member_of(organization_id));

create policy "Owners and admins can manage members"
  on public.organization_members for all
  to authenticated
  using (public.is_admin_of(organization_id))
  with check (public.is_admin_of(organization_id));

-- RPC: create an organization and make the caller the owner
create or replace function public.create_organization(p_name text, p_description text default '')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
begin
  insert into public.organizations (name, description, created_by)
  values (p_name, p_description, (select auth.uid()))
  returning id into org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, (select auth.uid()), 'owner');

  return org_id;
end;
$$;

-- RPC: join an organization using its invite code
create or replace function public.join_organization(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
begin
  select id into org_id from public.organizations
  where invite_code = p_invite_code;

  if org_id is null then
    raise exception 'invalid invite code';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, (select auth.uid()), 'member')
  on conflict (organization_id, user_id) do nothing;

  return org_id;
end;
$$;