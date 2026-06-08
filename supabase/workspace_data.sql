create table if not exists public.workspace_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null,
  data jsonb not null default '{}'::jsonb,
  version text not null default 'v1',
  updated_at timestamptz not null default now(),
  unique (user_id, module_key)
);

alter table public.workspace_data enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.workspace_data to authenticated;

drop policy if exists "Users can read own workspace data" on public.workspace_data;
drop policy if exists "Users can insert own workspace data" on public.workspace_data;
drop policy if exists "Users can update own workspace data" on public.workspace_data;
drop policy if exists "Users can delete own workspace data" on public.workspace_data;
drop policy if exists "workspace_data_select_own" on public.workspace_data;
drop policy if exists "workspace_data_insert_own" on public.workspace_data;
drop policy if exists "workspace_data_update_own" on public.workspace_data;
drop policy if exists "workspace_data_delete_own" on public.workspace_data;

create policy "workspace_data_select_own"
  on public.workspace_data
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "workspace_data_insert_own"
  on public.workspace_data
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "workspace_data_update_own"
  on public.workspace_data
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "workspace_data_delete_own"
  on public.workspace_data
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 如果提示表已经加入 publication，可忽略该错误。
alter publication supabase_realtime add table public.workspace_data;