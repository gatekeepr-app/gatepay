
-- ============================================================
-- HELPERS
-- ============================================================

create or replace function public.has_any_role(_user_id uuid, _roles app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = any(_roles)
  )
$$;

-- workspace member = anyone with any of these roles
create or replace function public.is_workspace_member(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(_user_id, array['super_admin','admin','member']::app_role[])
$$;

create or replace function public.is_workspace_manager(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(_user_id, array['super_admin','admin']::app_role[])
$$;

-- ============================================================
-- CLIENTS
-- ============================================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  business_name text,
  brand_name text,
  phone text,
  social_links jsonb not null default '{}'::jsonb,
  notes text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "members read clients" on public.clients
  for select to authenticated using (public.is_workspace_member(auth.uid()));

create policy "members insert clients" on public.clients
  for insert to authenticated
  with check (public.is_workspace_member(auth.uid()) and created_by = auth.uid());

create policy "owner or manager update clients" on public.clients
  for update to authenticated
  using (created_by = auth.uid() or public.is_workspace_manager(auth.uid()))
  with check (created_by = auth.uid() or public.is_workspace_manager(auth.uid()));

create policy "owner or manager delete clients" on public.clients
  for delete to authenticated
  using (created_by = auth.uid() or public.is_workspace_manager(auth.uid()));

-- ============================================================
-- PROJECTS
-- ============================================================
create sequence if not exists public.project_code_seq;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  project_code text not null unique,
  name text not null,
  description text,
  client_id uuid references public.clients(id) on delete set null,
  created_by uuid not null,
  status text not null default 'draft' check (status in ('draft','active','paused','completed')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.generate_project_code()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('public.project_code_seq');
  return 'GK-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
end;
$$;

alter table public.projects alter column project_code set default public.generate_project_code();

alter table public.projects enable row level security;

create policy "members read projects" on public.projects
  for select to authenticated using (public.is_workspace_member(auth.uid()));

create policy "members insert projects" on public.projects
  for insert to authenticated
  with check (public.is_workspace_member(auth.uid()) and created_by = auth.uid());

create policy "owner or manager update projects" on public.projects
  for update to authenticated
  using (created_by = auth.uid() or public.is_workspace_manager(auth.uid()))
  with check (created_by = auth.uid() or public.is_workspace_manager(auth.uid()));

create policy "owner or manager delete projects" on public.projects
  for delete to authenticated
  using (created_by = auth.uid() or public.is_workspace_manager(auth.uid()));

-- ============================================================
-- PROJECT ASSIGNMENTS
-- ============================================================
create table public.project_assignments (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  assigned_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table public.project_assignments enable row level security;

create policy "members read assignments" on public.project_assignments
  for select to authenticated using (public.is_workspace_member(auth.uid()));

create policy "managers or project owner manage assignments" on public.project_assignments
  for all to authenticated
  using (
    public.is_workspace_manager(auth.uid())
    or exists (select 1 from public.projects p where p.id = project_id and p.created_by = auth.uid())
  )
  with check (
    public.is_workspace_manager(auth.uid())
    or exists (select 1 from public.projects p where p.id = project_id and p.created_by = auth.uid())
  );

-- ============================================================
-- PROJECT BILLING
-- ============================================================
create table public.project_billing (
  project_id uuid primary key references public.projects(id) on delete cascade,
  billing_type text not null check (billing_type in ('monthly','yearly','per_project')),
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'BDT',
  months_count integer check (months_count is null or months_count > 0),
  start_date date,
  end_date date,
  total_calculated numeric(14,2) not null default 0,
  payment_terms text,
  notes text,
  updated_at timestamptz not null default now()
);

create or replace function public.calc_billing_total()
returns trigger
language plpgsql
as $$
declare
  yrs numeric;
begin
  if new.billing_type = 'monthly' then
    new.total_calculated := new.amount * coalesce(new.months_count, 1);
  elsif new.billing_type = 'yearly' then
    if new.start_date is not null and new.end_date is not null then
      yrs := greatest(1, ceil(extract(epoch from (new.end_date::timestamp - new.start_date::timestamp)) / (60*60*24*365)));
    else
      yrs := 1;
    end if;
    new.total_calculated := new.amount * yrs;
  else
    new.total_calculated := new.amount;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_calc_billing
  before insert or update on public.project_billing
  for each row execute function public.calc_billing_total();

alter table public.project_billing enable row level security;

create policy "members read billing" on public.project_billing
  for select to authenticated using (public.is_workspace_member(auth.uid()));

create policy "owner or manager manage billing" on public.project_billing
  for all to authenticated
  using (
    public.is_workspace_manager(auth.uid())
    or exists (select 1 from public.projects p where p.id = project_id and p.created_by = auth.uid())
  )
  with check (
    public.is_workspace_manager(auth.uid())
    or exists (select 1 from public.projects p where p.id = project_id and p.created_by = auth.uid())
  );

-- ============================================================
-- INVOICES
-- ============================================================
create sequence if not exists public.invoice_number_seq;

create or replace function public.generate_invoice_number()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('public.invoice_number_seq');
  return 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
end;
$$;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default public.generate_invoice_number(),
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  issue_date date not null default current_date,
  due_date date,
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue','void')),
  currency text not null default 'BDT',
  subtotal numeric(14,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  notes text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

create policy "members read invoices" on public.invoices
  for select to authenticated using (public.is_workspace_member(auth.uid()));

create policy "members insert invoices" on public.invoices
  for insert to authenticated
  with check (public.is_workspace_member(auth.uid()) and created_by = auth.uid());

create policy "owner or manager update invoices" on public.invoices
  for update to authenticated
  using (created_by = auth.uid() or public.is_workspace_manager(auth.uid()))
  with check (created_by = auth.uid() or public.is_workspace_manager(auth.uid()));

create policy "owner or manager delete invoices" on public.invoices
  for delete to authenticated
  using (created_by = auth.uid() or public.is_workspace_manager(auth.uid()));

-- ============================================================
-- INVOICE LINE ITEMS
-- ============================================================
create table public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(14,2) not null default 1,
  unit_price numeric(14,2) not null default 0,
  amount numeric(14,2) not null default 0,
  position integer not null default 0
);

alter table public.invoice_line_items enable row level security;

create policy "members read line items" on public.invoice_line_items
  for select to authenticated using (public.is_workspace_member(auth.uid()));

create policy "owner or manager manage line items" on public.invoice_line_items
  for all to authenticated
  using (
    public.is_workspace_manager(auth.uid())
    or exists (select 1 from public.invoices i where i.id = invoice_id and i.created_by = auth.uid())
  )
  with check (
    public.is_workspace_manager(auth.uid())
    or exists (select 1 from public.invoices i where i.id = invoice_id and i.created_by = auth.uid())
  );

-- ============================================================
-- INVITATIONS
-- ============================================================
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role app_role not null default 'member',
  invited_by uuid not null,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index on public.invitations (email) where status = 'pending';

alter table public.invitations enable row level security;

create policy "super admin manage invitations" on public.invitations
  for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin'::app_role))
  with check (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Allow a signed-in user to view their own pending invitation by email
create policy "user views own pending invitations" on public.invitations
  for select to authenticated
  using (lower(email) = lower((auth.jwt() ->> 'email')));

-- ============================================================
-- AUTO-ACCEPT INVITATION ON SIGN UP
-- ============================================================
create or replace function public.handle_new_user_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
begin
  -- super admin override
  if new.email = 'product.gatekeepr@gmail.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'super_admin')
    on conflict do nothing;
    return new;
  end if;

  -- accept any pending invitation for this email
  for inv in
    select * from public.invitations
    where lower(email) = lower(new.email)
      and status = 'pending'
      and expires_at > now()
  loop
    insert into public.user_roles (user_id, role)
    values (new.id, inv.role)
    on conflict do nothing;

    update public.invitations
       set status = 'accepted', accepted_at = now()
     where id = inv.id;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_invite on auth.users;
create trigger on_auth_user_created_invite
  after insert on auth.users
  for each row execute function public.handle_new_user_invite();

-- ============================================================
-- updated_at triggers
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

create trigger trg_clients_touch before update on public.clients
  for each row execute function public.touch_updated_at();
create trigger trg_projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();
create trigger trg_invoices_touch before update on public.invoices
  for each row execute function public.touch_updated_at();
