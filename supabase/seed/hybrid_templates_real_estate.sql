-- supabase/seed/hybrid_templates_real_estate.sql

-- Templates para vertical inmobiliaria
insert into public.templates (tenant_id, vertical, name, language, category, status, content)
values
  (
    '00000000-0000-0000-0000-000000000002',
    'real-estate',
    'property_follow_up',
    'es',
    'UTILITY',
    'approved',
    '{"header": "Seguimiento de propiedad", "body": "Hola {{1}}, ¿sigues interesado en la propiedad {{2}} en {{3}}? Tenemos más opciones similares si lo deseas.", "footer": "Responde SÍ para más info o NO si ya no te interesa."}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'real-estate',
    'viewing_confirmation',
    'es',
    'UTILITY',
    'approved',
    '{"header": "Visita confirmada", "body": "Hola {{1}}, tu visita a la propiedad {{2}} ha sido agendada para el {{3}} a las {{4}}. Te esperamos en la dirección indicada.", "footer": "Cualquier cambio avísanos con 2h de antelación."}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'real-estate',
    'new_property_alert',
    'es',
    'MARKETING',
    'draft',
    '{"header": "Nueva propiedad disponible", "body": "Hola {{1}}, tenemos una nueva propiedad que coincide con tu búsqueda: {{2}} en {{3}} por {{4}}. ¿Te interesa saber más?", "footer": "Responde SÍ para recibir fotos y detalles."}'::jsonb
  )
on conflict (tenant_id, name) do update set
  category = excluded.category,
  content = excluded.content,
  status = excluded.status,
  updated_at = now();