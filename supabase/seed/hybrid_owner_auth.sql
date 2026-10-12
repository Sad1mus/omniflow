-- supabase/seed/hybrid_owner_auth.sql

-- Usuarios/tenants autorizados como dueños
-- Un tenant puede ser dueño de su propia clínica (se define en la tabla clients)

-- Owner auth tokens de prueba
INSERT INTO public.owner_authorizations (tenant_id, owner_phone, token, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', '5215511111111', 'owner_token_demo_clinic', true)
ON CONFLICT (owner_phone) DO NOTHING;

-- Roles por tenant
INSERT INTO public.roles (id, tenant_id, name, permissions)
VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'admin', '["*"]'::jsonb),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'receptionist', '["messages", "appointments.read"]'::jsonb)
ON CONFLICT DO NOTHING;