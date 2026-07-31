create table if not exists public.public_workspace (
  workspace_key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.public_workspace enable row level security;
grant select, insert, update on public.public_workspace to anon, authenticated;

drop policy if exists "public workspace read" on public.public_workspace;
drop policy if exists "public workspace insert" on public.public_workspace;
drop policy if exists "public workspace update" on public.public_workspace;

create policy "public workspace read" on public.public_workspace
  for select to anon, authenticated using (workspace_key = 'main');
create policy "public workspace insert" on public.public_workspace
  for insert to anon, authenticated with check (workspace_key = 'main');
create policy "public workspace update" on public.public_workspace
  for update to anon, authenticated using (workspace_key = 'main') with check (workspace_key = 'main');

insert into public.public_workspace (workspace_key, data)
values ('main', '{"discounts":[],"products":[],"operations":[],"tasks":[]}'::jsonb)
on conflict (workspace_key) do nothing;
