-- supabase/migrations/20261013000000_add_usage_metrics.sql
create extension if not exists "uuid-ossp";

create table if not exists public.usage_metrics (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  metric_date date not null default current_date,
  messages_in int default 0,
  messages_out int default 0,
  llm_calls int default 0,
  llm_tokens int default 0,
  appointments_booked int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, metric_date)
);

create index if not exists idx_usage_metrics_tenant_date on public.usage_metrics(tenant_id, metric_date);

-- Enable Row Level Security
alter table public.usage_metrics enable row level security;

-- Policy: Allow service role (system) to do everything
-- Tenant-specific reads will be handled by application logic or additional policies
create policy "System can manage usage metrics"
  on public.usage_metrics
  for all
  using (true)
  with check (true);

-- Optional: Create the RPC function for atomic increments
create or replace function increment_usage_metric(
  p_tenant_id uuid,
  p_date date,
  p_column text,
  p_value int
)
returns void as $$
begin
  -- First, ensure the row exists for today
  insert into public.usage_metrics (tenant_id, metric_date)
  values (p_tenant_id, p_date)
  on conflict (tenant_id, metric_date) do nothing;

  -- Then increment the specific column
  -- Using dynamic SQL since we can't use parameterized column names directly
  execute format(
    'update public.usage_metrics set %I = %I + $1, updated_at = now() ' ||
    'where tenant_id = $2 and metric_date = $3',
    p_column, p_column
  )
  using p_value, p_tenant_id, p_date;
end;
$$ language plpgsql;

-- Grant execute on the function to service role and anon if needed
grant execute on function increment_usage_metric(uuid, date, text, int) to service_role;
grant execute on function increment_usage_metric(uuid, date, text, int) to anon;