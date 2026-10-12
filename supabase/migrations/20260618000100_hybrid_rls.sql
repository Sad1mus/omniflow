-- supabase/migrations/20260618000100_hybrid_rls.sql

alter table public.tenants enable row level security;
alter table public.tenant_credentials enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;
alter table public.appointments enable row level security;
alter table public.templates enable row level security;
alter table public.audit_logs enable row level security;
alter table public.lab_runs enable row level security;
alter table public.lab_conversations enable row level security;