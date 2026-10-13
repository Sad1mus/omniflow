-- supabase/migrations/20261013000001_user_profiles.sql
-- Tabla de perfiles de usuario

create extension if not exists "uuid-ossp";

create table if not exists public.user_profiles (
  user_id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password_hash text not null,
  tenant_id uuid references public.tenants(id) on delete cascade,
  role text not null default 'owner',
  name text not null,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.user_profiles enable row level security;

-- Policy: Allow service role (system) to do everything
-- Tenant-specific reads/writes handled by application logic
create policy "Service role can manage user profiles"
  on public.user_profiles
  for all
  using (true)
  with check (true);