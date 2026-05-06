-- API keys for the public payment verification endpoint
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index idx_api_keys_active on public.api_keys (revoked_at) where revoked_at is null;

alter table public.api_keys enable row level security;

create policy "managers read api keys"
  on public.api_keys for select to authenticated
  using (is_workspace_manager(auth.uid()));

create policy "managers insert api keys"
  on public.api_keys for insert to authenticated
  with check (is_workspace_manager(auth.uid()) and created_by = auth.uid());

create policy "managers update api keys"
  on public.api_keys for update to authenticated
  using (is_workspace_manager(auth.uid()))
  with check (is_workspace_manager(auth.uid()));

create policy "managers delete api keys"
  on public.api_keys for delete to authenticated
  using (is_workspace_manager(auth.uid()));