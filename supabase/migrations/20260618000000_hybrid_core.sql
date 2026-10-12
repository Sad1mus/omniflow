-- supabase/migrations/20260618000000_hybrid_core.sql

create extension if not exists "uuid-ossp";

-- Tenants
create table if not exists public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  vertical text not null default 'clinic',
  status text not null default 'active',
  timezone text not null default 'America/Mexico_City',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Credenciales Meta por tenant
create table if not exists public.tenant_credentials (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null default 'meta_cloud',
  meta_waba_id text,
  meta_phone_number_id text,
  encrypted_access_token text,
  verify_token text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider)
);

-- Contactos
create table if not exists public.contacts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  whatsapp_phone text not null,
  name text,
  email text,
  external_id text,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  consent_status text not null default 'unknown',
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, whatsapp_phone)
);

-- Conversaciones
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  status text not null default 'open',
  channel text not null default 'whatsapp',
  assigned_to uuid,
  ai_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mensajes
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  meta_message_id text,
  direction text not null,
  type text not null default 'text',
  content text,
  media_url text,
  template_name text,
  status text not null default 'pending',
  error jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Leads
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  vertical text not null default 'clinic',
  source text,
  status text not null default 'new',
  score int,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Citas
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  service text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Plantillas
create table if not exists public.templates (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  vertical text,
  name text not null,
  language text not null default 'es',
  category text not null default 'UTILITY',
  status text not null default 'draft',
  meta_template_id text,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auditoría
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  actor_type text not null default 'system',
  actor_id text,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Laboratorio
create table if not exists public.lab_runs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  vertical text not null,
  status text not null default 'pending',
  score int,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_conversations (
  id uuid primary key default uuid_generate_v4(),
  lab_run_id uuid not null references public.lab_runs(id) on delete cascade,
  persona text not null,
  transcript jsonb not null default '[]'::jsonb,
  passed boolean,
  feedback text,
  created_at timestamptz not null default now()
);