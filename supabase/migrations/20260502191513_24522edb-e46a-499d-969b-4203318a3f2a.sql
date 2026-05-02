-- Roles enum + user_roles table
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Users can view their own roles; admins can view all
create policy "Users view own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Admins manage roles"
on public.user_roles for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin role to designated email on signup
create or replace function public.handle_new_user_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email = 'product.gatekeepr@gmail.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created_admin
after insert on auth.users
for each row execute function public.handle_new_user_admin();

-- Leads table
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- Anyone (incl. anon) can insert a lead via the contact form
create policy "Anyone can submit a lead"
on public.leads for insert
to anon, authenticated
with check (true);

-- Only admins can read/update/delete
create policy "Admins read leads"
on public.leads for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins update leads"
on public.leads for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete leads"
on public.leads for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));