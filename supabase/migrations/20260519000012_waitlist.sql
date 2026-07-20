create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  city text not null,
  role text not null check (role in ('constructor','proveedor','maestro','chofer')),
  created_at timestamptz default now()
);
alter table public.waitlist enable row level security;
-- Only service role can insert/read waitlist
create policy "service_role_only" on public.waitlist using (false);
