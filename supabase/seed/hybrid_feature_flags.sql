-- supabase/seed/hybrid_feature_flags.sql

-- Feature flags por defecto para clínica demo
INSERT INTO public.feature_flags (key, enabled, description, rollout, tenants)
VALUES
  ('lab_mode', true, 'Laboratorio de IA para pruebas', 100, '00000000-0000-0000-0000-000000000001'),
  ('real_messages', false, 'Enviar mensajes reales por WhatsApp', 100, '00000000-0000-0000-0000-000000000001'),
  ('owner_commands', true, 'Comandos /hoy, /pausar, /activar por dueño', 100, '00000000-0000-0000-0000-000000000001'),
  ('multi_vertical', true, 'Soporte multi-vertical', 100, '00000000-0000-0000-0000-000000000001'),
  ('attribution', true, 'Atribución de conversiones', 100, '00000000-0000-0000-0000-000000000001'),
  ('conversation_tracking', true, 'Tracking de conversaciones', 100, '00000000-0000-0000-0000-000000000001'),
  ('template_auto_approval', false, 'Aprobar plantillas automáticamente', 30, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  description = EXCLUDED.description,
  rollout = EXCLUDED.rollout,
  tenants = EXCLUDED.tenants;