# AGENT_INSTRUCTIONS.md

## Objetivo

Transformar el repositorio `agente-clinicas` en una plataforma híbrida multi-tenant de agentes de WhatsApp con IA, fiel a las políticas de Meta 2026/2027.

Esta plataforma combina:

- La seguridad y cumplimiento de la WhatsApp Cloud API oficial.
- La agilidad multi-tenant y vertical de agentes especializados.
- Un laboratorio de pruebas de IA antes de producir.
- Un CRM básico con contactos, conversaciones, pipeline, citas y leads.
- Un sistema de verticales enchufables: clínica, inmobiliaria, e-commerce, taller, etc.

El producto puede llamarse internamente **OmniFlow CRM**, aunque el repositorio siga siendo `agente-clinicas`.

---

## Reglas no negociables

### 1. Producción solo con WhatsApp Cloud API oficial

El sistema no debe usar Baileys, Puppeteer, WhatsApp Web ni ninguna librería no oficial para enviar mensajes reales en producción.

Baileys puede existir solo como proveedor legacy, aislado y desactivado por defecto.

La variable:

```env
WHATSAPP_PROVIDER=cloud
```

debe ser la opción por defecto para producción.

### 2. Cumplimiento estricto de Meta

El sistema debe:

- Validar webhooks usando la firma de Meta.
- Respetar la ventana de 24 horas.
- Bloquear mensajes de texto libre cuando la ventana esté cerrada.
- Permitir envío fuera de ventana solo mediante plantillas aprobadas.
- No inventar precios, disponibilidad, fechas ni datos críticos.
- Escalar a humano cuando haya riesgo médico, legal, financiero o de emergencia.
- Registrar consentimiento y auditoría de mensajes.

### 3. Multi-tenancy real

Un tenant representa a un negocio/cliente.

Cada mensaje, contacto, conversación, cita, lead, plantilla, agente y configuración debe pertenecer a un `tenant_id`.

El sistema debe impedir fugas de datos entre tenants.

Se debe usar Row-Level Security en PostgreSQL/Supabase siempre que sea posible.

### 4. Arquitectura modular

Separar claramente:

```txt
core/       → CRM, WhatsApp, colas, IA, laboratorio, tenants
verticals/  → plugins por industria
routes/     → HTTP API
worker/     → procesamiento asíncrono
legacy/     → código viejo o experimental
```

### 5. Procesamiento asíncrono

El webhook de Meta debe responder rápido.

Flujo obligatorio:

```txt
Meta webhook
  → validar firma
  → responder 200 OK rápido
  → encolar mensaje
  → worker procesa
  → agente IA o comando del dueño
  → respuesta vía Cloud API
```

No se debe procesar LLM directamente dentro del webhook HTTP.

### 6. Idempotencia

Cada mensaje de WhatsApp entrante debe procesarse una sola vez.

Usar el ID del mensaje de Meta como clave de idempotencia.

Ejemplo:

```txt
whatsapp:message:{tenant_id}:{message_id}
```

Si el mismo webhook llega dos veces, el sistema debe ignorar el duplicado.

### 7. Laboratorio de IA seguro

El laboratorio debe simular conversaciones sin enviar mensajes reales por WhatsApp.

Debe evaluar:

- alucinaciones,
- tono,
- escalado a humano,
- cumplimiento de reglas,
- capacidad de agendar,
- manejo de errores,
- resistencia a prompt injection.

### 8. Nada de consejos sensibles

El agente no debe dar consejos médicos, legales, financieros o psicológicos específicos.

Debe:

- dar información general si es seguro,
- recomendar contacto humano,
- o escalar automáticamente.

---

## Fase 0: Descubrimiento del repositorio actual

Antes de escribir código, el agente debe:

1. Leer el `README.md` actual.
2. Leer `package.json`.
3. Leer `tsconfig.json` si existe.
4. Revisar la estructura actual.
5. Identificar archivos existentes como:
   - `src/whatsapp.ts`
   - `src/brain.ts`
   - `src/db.ts`
   - `supabase/schema.sql`
   - `supabase/seed.sql`
   - `.env.example`
6. No borrar código existente sin crear respaldo.
7. Mover código legacy a `src/legacy/` si estorba para la nueva arquitectura.

Resultado esperado:

- Un diagnóstico corto.
- Una lista de archivos existentes que serán reutilizados.
- Una lista de archivos existentes que serán aislados como legacy.

---

## Fase 1: Bootstrap de estructura

El agente debe ejecutar:

```bash
bash scripts/bootstrap-hybrid.sh
```

Este script crea la estructura de carpetas y archivos base.

Si el script no existe, debe crearlo según las instrucciones de este repositorio.

---

## Fase 2: Configuración de entorno

El agente debe crear o actualizar `.env.example.hybrid` con las variables necesarias.

Variables mínimas:

```env
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agencia_clinicas
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=

# WhatsApp provider
WHATSAPP_PROVIDER=cloud
ENABLE_REAL_MESSAGES=false

# Meta Cloud API
META_APP_SECRET=
META_VERIFY_TOKEN=
META_ACCESS_TOKEN=
META_WABA_ID=
META_PHONE_NUMBER_ID=

# AI
OPENROUTER_API_KEY=
DEFAULT_MODEL=anthropic/claude-3.5-sonnet
FALLBACK_MODEL=meta-llama/llama-3.1-70b-instruct
AI_MAX_TOKENS=2048
AI_TEMPERATURE=0.3

# Queue
REDIS_URL=redis://localhost:6379
QUEUE_CONCURRENCY=5

# Lab
LAB_MODE=true
LAB_MAX_TURNS=12

# Safety
GUARDRAILS_STRICT=true
HUMAN_ESCALATION_REQUIRED=false
```

Luego debe integrar estas variables al `.env.example` principal sin eliminar variables legacy útiles.

---

## Fase 3: Núcleo de WhatsApp Cloud API

El agente debe implementar:

### 3.1 Proveedor abstracto

Archivo:

```txt
src/core/whatsapp/provider.ts
```

Debe definir una interfaz similar a:

```ts
export interface WhatsAppProvider {
  sendText(input: SendTextInput): Promise<SendResult>;
  sendTemplate(input: SendTemplateInput): Promise<SendResult>;
  markAsRead?(messageId: string): Promise<void>;
}
```

### 3.2 Proveedor Cloud API

Archivo:

```txt
src/core/whatsapp/providers/cloud.provider.ts
```

Debe usar la API oficial de Meta.

Debe soportar:

- envío de texto,
- envío de plantilla,
- manejo de errores de Meta,
- rate limiting básico,
- reintentos exponenciales,
- logging estructurado.

### 3.3 Proveedor Baileys legacy

Archivo:

```txt
src/core/whatsapp/providers/baileys.provider.ts
```

Solo debe existir para desarrollo o migración.

Debe lanzar una advertencia clara:

```txt
Baileys es no oficial y puede causar baneo. Solo usar en desarrollo.
```

Debe desactivarse si:

```env
NODE_ENV=production
```

o si:

```env
WHATSAPP_PROVIDER=cloud
```

### 3.4 Firma de webhook

Archivo:

```txt
src/core/whatsapp/signature.ts
```

Debe validar la cabecera `X-Hub-Signature-256` usando `META_APP_SECRET`.

Si la firma no es válida:

```txt
respond 401 and do not process
```

### 3.5 Ventana de 24 horas

Archivo:

```txt
src/core/whatsapp/window.ts
```

Debe calcular si un contacto está dentro de la ventana de atención.

Reglas:

- Si el último mensaje entrante del contacto tiene menos de 24 horas, se permiten mensajes libres.
- Si han pasado más de 24 horas, solo se permiten plantillas aprobadas.
- El agente debe poder detectar si una plantilla es adecuada para reabrir conversación.
- Debe existir una función clara:

```ts
isWithin24HourWindow(tenantId, contactId, now): Promise<boolean>
```

### 3.6 Plantillas

Archivo:

```txt
src/core/whatsapp/templates.ts
```

Debe manejar:

- plantillas por tenant,
- plantillas por vertical,
- estado de aprobación,
- variables,
- categoría,
- idioma.

No se debe enviar una plantilla si Meta no la tiene aprobada.

---

## Fase 4: Webhook HTTP

El agente debe crear:

```txt
src/routes/webhook.whatsapp.ts
```

Debe soportar:

### GET para verificación de Meta

Meta enviará:

```txt
hub.mode
hub.verify_token
hub.challenge
```

Si `hub.mode=subscribe` y `hub.verify_token` coincide, responder con `hub.challenge`.

### POST para mensajes

Debe:

1. Validar firma.
2. Parsear payload.
3. Resolver tenant por `phone_number_id` o `waba_id`.
4. Verificar idempotencia.
5. Guardar mensaje entrante en DB.
6. Encolar procesamiento.
7. Responder 200 rápidamente.

No debe esperar a la IA.

---

## Fase 5: Cola y worker

El agente debe implementar:

```txt
src/core/queue/queue.ts
src/core/queue/worker.ts
src/worker.ts
```

Jobs mínimos:

```txt
whatsapp.message.received
whatsapp.message.status
lab.conversation.run
tenant.template.sync
```

El worker debe:

1. Tomar mensaje de la cola.
2. Cargar tenant.
3. Cargar vertical.
4. Cargar contacto.
5. Verificar ventana de 24 horas.
6. Detectar si es comando del dueño.
7. Si es comando, ejecutar comando.
8. Si no, pasar al agente IA.
9. Aplicar guardrails.
10. Enviar respuesta mediante proveedor oficial.
11. Guardar mensaje saliente.
12. Registrar métricas.

---

## Fase 6: Multi-tenancy

El agente debe crear:

```txt
src/core/tenants/repository.ts
src/core/tenants/service.ts
```

Un tenant debe tener:

```ts
{
  id: string;
  name: string;
  slug: string;
  vertical: string;
  status: 'active' | 'paused' | 'suspended';
  timezone: string;
  settings: Record<string, unknown>;
  meta_waba_id?: string;
  meta_phone_number_id?: string;
}
```

Las credenciales sensibles de Meta deben guardarse cifradas.

Nunca loguear tokens.

---

## Fase 7: Verticales

El agente debe implementar un registro de verticales.

Archivo:

```txt
src/verticals/registry.ts
```

Cada vertical debe exportar:

```ts
{
  id: string;
  name: string;
  icon?: string;
  description?: string;
  systemPrompt: string;
  tools: AgentTool[];
  templates: VerticalTemplate[];
  ownerCommands: OwnerCommand[];
  guardrails?: GuardrailOverrides;
}
```

Debe implementar como mínimo:

```txt
src/verticals/clinic/
src/verticals/real-estate/
```

---

## Fase 8: Vertical clínica

La vertical clínica debe incluir:

- agendar citas,
- consultar disponibilidad,
- capturar leads,
- recordar citas,
- comandos del dueño,
- reglas médicas seguras.

Herramientas mínimas:

```txt
check_availability
book_appointment
cancel_appointment
reschedule_appointment
capture_lead
escalate_to_human
```

Reglas:

- No diagnosticar.
- No recetar.
- No dar consejos médicos específicos.
- Ante emergencia, indicar contacto humano inmediato.
- Nunca inventar disponibilidad.

---

## Fase 9: Vertical inmobiliaria

La vertical inmobiliaria debe incluir:

- búsqueda de propiedades,
- calificación de lead,
- agendar visitas,
- enviar información de propiedades,
- manejar presupuesto,
- zona,
- tipo de propiedad.

Herramientas mínimas:

```txt
search_properties
schedule_viewing
capture_lead
send_property_details
estimate_budget
escalate_to_human
```

Reglas:

- No inventar propiedades.
- No inventar precios.
- Si la propiedad no existe, ofrecer alternativas.
- Si no hay inventario, capturar lead igualmente.

---

## Fase 10: Agente IA

El agente debe implementar:

```txt
src/core/ai/runtime.ts
src/core/ai/tools.ts
src/core/ai/guardrails.ts
src/core/ai/brain.ts
```

El runtime debe:

1. Construir system prompt usando tenant + vertical.
2. Cargar herramientas permitidas.
3. Enviar conversación al LLM.
4. Detectar tool calls.
5. Ejecutar tools contra DB real.
6. Volver a llamar al LLM si hace falta.
7. Validar respuesta final.
8. Aplicar guardrails.
9. Decidir si responde IA o escala a humano.

Debe usar OpenRouter o cualquier proveedor compatible.

Debe soportar fallback de modelo.

---

## Fase 11: Guardrails

El agente debe crear:

```txt
src/core/ai/guardrails.ts
```

Debe detectar:

- prompt injection,
- solicitudes de ignorar instrucciones,
- intents médicos peligrosos,
- intents legales sensibles,
- intents de emergencia,
- solicitudes de datos privados de terceros,
- intents fuera del vertical.

Acciones posibles:

```txt
block
warn
redirect
escalate_to_human
```

---

## Fase 12: Laboratorio de IA

El agente debe crear:

```txt
src/core/lab/runner.ts
src/core/lab/personas.ts
src/core/lab/judge.ts
```

El laboratorio debe:

- correr conversaciones simuladas,
- no enviar mensajes reales,
- usar clientes simulados,
- evaluar con un juez LLM independiente,
- generar score 0-100,
- guardar resultados en DB.

Personas mínimas:

```txt
comprador_decidido
pregunton_precios
cliente_enojado
pregunta_desconocida
exige_humano
typos_informal
prompt_injection
```

Cada corrida debe generar:

```txt
score
findings
suggestions
passed
tenant_id
vertical_id
agent_version
timestamp
```

---

## Fase 13: CRM básico

El agente debe implementar módulos para:

```txt
contacts
conversations
messages
leads
pipeline
appointments
```

No es necesario un frontend completo en la primera fase, pero la base de datos y servicios deben quedar listos.

---

## Fase 14: Comandos del dueño

El agente debe implementar comandos por WhatsApp.

Comandos mínimos:

```txt
/hoy
/semana
/pausar
/activar
/clientes
/metrics
/help
```

Debe reconocer al dueño por:

- teléfono autorizado,
- rol en base de datos,
- o token interno de owner.

Si el comando viene de un usuario no autorizado, debe ignorarlo o responder con permiso denegado.

---

## Fase 15: Base de datos

El agente debe crear migraciones en:

```txt
supabase/migrations/
```

Tablas mínimas:

```txt
tenants
tenant_credentials
contacts
conversations
messages
leads
pipeline_stages
pipeline_items
appointments
templates
template_variables
audit_logs
lab_runs
lab_conversations
lab_results
owner_authorizations
```

Debe aplicar:

```sql
alter table public.tenants enable row level security;
```

y políticas RLS para tablas críticas.

---

## Fase 16: Tests

El agente debe crear tests unitarios, de integración y seguridad.

Tests obligatorios:

### Unitarios

- validación de entorno,
- firma de webhook,
- ventana de 24 horas,
- idempotencia,
- guardrails básicos.

### Integración

- webhook recibe mensaje y encola,
- tenant isolation,
- flujo de cita,
- procesamiento de job.

### Seguridad

- prompt injection,
- cross-tenant access,
- webhook inválido,
- token no logueado.

---

## Fase 17: Definición de terminado

La implementación se considera terminada cuando:

1. `WHATSAPP_PROVIDER=cloud` funciona sin Baileys.
2. El webhook valida firma de Meta.
3. El webhook responde rápido y encola.
4. La idempotencia evita duplicados.
5. La ventana de 24 horas se respeta.
6. Las plantillas se usan cuando la ventana está cerrada.
7. Un tenant no puede leer datos de otro.
8. El laboratorio corre sin enviar mensajes reales.
9. El agente no inventa disponibilidad.
10. Los tests pasan.
11. No hay tokens en logs.
12. Existe documentación mínima actualizada.

---

## Orden de implementación recomendado

El agente debe trabajar en este orden:

```txt
1. Bootstrap
2. Env config
3. Logger/errors
4. WhatsApp types
5. Signature verification
6. Queue
7. Webhook route
8. Worker
9. Tenant resolution
10. Cloud provider
11. Window logic
12. Templates
13. DB schema
14. Vertical registry
15. Clinic vertical
16. Real estate vertical
17. AI runtime
18. Guardrails
19. Owner commands
20. Lab
21. Tests
22. Docs
```

---

## Prohibiciones explícitas

El agente no debe:

- eliminar el README actual,
- usar Baileys en producción,
- enviar mensajes reales si `ENABLE_REAL_MESSAGES=false`,
- loguear tokens de Meta,
- mezclar datos entre tenants,
- procesar LLM directamente en el webhook,
- inventar datos para pruebas,
- dejar tests rotos,
- instalar dependencias innecesarias sin justificación.

---

## Entrega esperada

El agente debe entregar:

1. Código TypeScript limpio.
2. Scripts funcionales.
3. Migraciones SQL.
4. Tests.
5. Documentación actualizada.
6. Checklist de cumplimiento.
7. Instrucciones para correr local.
8. Instrucciones para desplegar.
9. Lista de pendientes futuros.
