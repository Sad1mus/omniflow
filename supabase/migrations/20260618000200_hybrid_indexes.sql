-- supabase/migrations/20260618000200_hybrid_indexes.sql

create index if not exists idx_contacts_tenant_phone
on public.contacts (tenant_id, whatsapp_phone);

create index if not exists idx_messages_tenant_created
on public.messages (tenant_id, created_at desc);

create index if not exists idx_messages_meta_id
on public.messages (tenant_id, meta_message_id);

create index if not exists idx_conversations_tenant_contact
on public.conversations (tenant_id, contact_id);

create index if not exists idx_appointments_tenant_start
on public.appointments (tenant_id, starts_at);

create index if not exists idx_leads_tenant_status
on public.leads (tenant_id, status);

create index if not exists idx_templates_tenant_vertical
on public.templates (tenant_id, vertical);