-- supabase/seed/hybrid_templates_clinic.sql

-- Templates para vertical clínica
insert into public.templates (tenant_id, vertical, name, language, category, status, content)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'clinic',
    'appointment_reminder',
    'es',
    'UTILITY',
    'approved',
    '{"header": "Recordatorio de cita", "body": "Hola {{1}}, te recordamos que tienes una cita el {{2}} a las {{3}}. Por favor confirma tu asistencia respondiendo SÍ o llama al {{4}} si necesitas reagendar.", "footer": "Este mensaje es automático, por favor no responder si no es para confirmar o reagendar."}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'clinic',
    'appointment_confirmation',
    'es',
    'UTILITY',
    'approved',
    '{"header": "Cita confirmada", "body": "Hola {{1}}, tu cita ha sido confirmada para el {{2}} a las {{3}}. Te esperamos en {{5}}.", "footer": "Gracias por confiar en nosotros."}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'clinic',
    'post_visit_satisfaction',
    'es',
    'MARKETING',
    'draft',
    '{"header": "¿Cómo estuvo tu visita?", "body": "Hola {{1}}, esperamos que tu visita haya sido satisfactoria. ¿Podrías calificar tu experiencia del 1 al 5? Tu opinión nos ayuda a mejorar.", "footer": "Responde con un número del 1 al 5."}'::jsonb
  )
on conflict (tenant_id, name) do update set
  category = excluded.category,
  content = excluded.content,
  status = excluded.status,
  updated_at = now();