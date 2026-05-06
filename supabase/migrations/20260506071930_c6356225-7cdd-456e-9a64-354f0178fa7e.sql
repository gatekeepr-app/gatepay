
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_ref text not null,
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'BDT',
  occurred_at timestamptz not null default now(),
  method text null,
  client_id uuid null references public.clients(id) on delete set null,
  project_id uuid null references public.projects(id) on delete set null,
  invoice_id uuid null references public.invoices(id) on delete set null,
  verified_external_name text null,
  verified_external_user_id text null,
  verified_source text null,
  verified_at timestamptz null,
  notes text null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index transactions_ref_unique_lower on public.transactions (lower(transaction_ref));
create index transactions_occurred_at_idx on public.transactions (occurred_at desc);
create index transactions_client_idx on public.transactions (client_id);
create index transactions_project_idx on public.transactions (project_id);

alter table public.transactions enable row level security;

create policy "members read transactions"
  on public.transactions for select
  to authenticated
  using (public.is_workspace_member(auth.uid()));

create policy "members insert transactions"
  on public.transactions for insert
  to authenticated
  with check (public.is_workspace_member(auth.uid()) and created_by = auth.uid());

create policy "owner or manager update transactions"
  on public.transactions for update
  to authenticated
  using (created_by = auth.uid() or public.is_workspace_manager(auth.uid()))
  with check (created_by = auth.uid() or public.is_workspace_manager(auth.uid()));

create policy "owner or manager delete transactions"
  on public.transactions for delete
  to authenticated
  using (created_by = auth.uid() or public.is_workspace_manager(auth.uid()));

create trigger transactions_touch_updated_at
before update on public.transactions
for each row execute function public.touch_updated_at();

alter table public.projects
  add column if not exists last_transaction_ref text null,
  add column if not exists last_payment_at timestamptz null;
