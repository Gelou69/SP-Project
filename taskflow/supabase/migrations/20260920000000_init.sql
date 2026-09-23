-- 20260920000000 Init: extensions and custom enum types
create extension if not exists "pgcrypto";

create type public.task_status as enum ('todo', 'in_progress', 'done');

create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

create type public.member_role as enum ('owner', 'admin', 'member');