# AGENT_PHASE2.md

## Objetivo

Completar el andamiaje del repositorio `agente-clinicas` con los archivos de soporte necesarios para implementar la plataforma híbrida multi-tenant de WhatsApp con IA.

La Fase 1 creó la estructura base. La Fase 2 debe agregar la capa operativa, técnica y documental necesaria para implementar, probar, desplegar y auditar el sistema.

---

## Alcance de la Fase 2

El agente debe crear y/o completar los siguientes grupos de archivos:

1. Configuración de proyecto.
2. Infraestructura local.
3. CI/CD básico.
4. Documentación API.
5. Runbooks operativos.
6. Seguridad y privacidad.
7. Librerías internas.
8. Middlewares HTTP.
9. Schemas de validación.
10. Servicios de dominio.
11. Módulos específicos de WhatsApp.
12. Módulos específicos de IA.
13. Observabilidad.
14. Feature flags.
15. Seeds adicionales.
16. Fixtures para tests.

---

## Reglas de la Fase 2

### 1. No romper la Fase 1

El agente no debe eliminar los archivos creados en la Fase 1.

Si hay conflicto entre un archivo existente y uno nuevo, debe:

- preservar la intención de `AGENT_INSTRUCTIONS.md`,
- mantener compatibilidad con el README,
- documentar la decisión en `docs/IMPLEMENTATION_PLAN.md`.

### 2. Todo archivo debe tener propósito claro

No crear archivos vacíos sin motivo.

Cada archivo nuevo debe tener al menos:

- exports tipados,
- comentarios mínimos,
- TODOs claros si aún no está implementado.

### 3. TypeScript estricto

Todo el código nuevo debe ser compatible con TypeScript estricto.

No usar `any` sin justificación explícita.

### 4. Validación con Zod

Toda entrada externa debe validarse:

- webhooks de Meta,
- variables de entorno,
- payloads de laboratorio,
- comandos del dueño,
- configuración de tenants,
- templates.

### 5. Seguridad primero

El agente debe crear utilidades para:

- redacción de logs,
- ocultamiento de tokens,
- sanitización de PII,
- auditoría,
- validación de firmas,
- aislamiento por tenant.

### 6. Nada de envío real accidental

Ningún test o laboratorio debe enviar mensajes reales por WhatsApp si:

```env
ENABLE_REAL_MESSAGES=false
```

o si:

```env
LAB_MODE=true
```

---

## Archivos a crear en Fase 2

El agente debe ejecutar:

```bash
bash scripts/bootstrap-phase2.sh
```

Si el script no existe, debe crearlo.

---

## Responsabilidades por archivo

### Configuración de proyecto

#### `.nvmrc`

Debe fijar la versión de Node.js recomendada.

#### `.editorconfig`

Debe estandarizar indentación, salto de línea y encoding.

#### `.dockerignore`

Debe excluir:

```txt
node_modules
dist
.env
.env.local
auth
coverage
.git
```

#### `Makefile`

Debe incluir comandos rápidos:

```txt
make install
make dev
make test
make build
make migrate
make seed
```

---

### CI

#### `.github/workflows/ci.yml`

Debe ejecutar:

```txt
typecheck
lint
test
build
```

Debe usar Node 20 o superior.

---

### Documentación API

#### `docs/api/webhook.md`

Debe documentar:

- GET para verificación de Meta.
- POST para mensajes entrantes.
- headers esperados.
- firma `X-Hub-Signature-256`.
- respuesta esperada.
- idempotencia.
- errores posibles.

#### `docs/api/owner-commands.md`

Debe documentar comandos:

```txt
/hoy
/semana
/pausar
/activar
/clientes
/metrics
/help
```

#### `docs/api/lab.md`

Debe documentar cómo ejecutar pruebas de laboratorio sin enviar mensajes reales.

---

### Runbooks

#### `docs/runbooks/meta-webhook-failures.md`

Debe explicar qué hacer si Meta reintenta webhooks o falla la verificación.

#### `docs/runbooks/rate-limit.md`

Debe explicar cómo manejar límites de Meta.

#### `docs/runbooks/tenant-onboarding.md`

Debe explicar cómo dar de alta un tenant nuevo.

#### `docs/runbooks/number-banned-or-flagged.md`

Debe explicar qué hacer si Meta marca o restringe un número.

#### `docs/runbooks/incident-response.md`

Debe incluir pasos de respuesta ante incidentes.

---

### Librerías internas

#### `src/lib/supabase.ts`

Debe crear cliente Supabase.

#### `src/lib/redis.ts`

Debe crear cliente Redis y conexión para BullMQ.

#### `src/lib/openrouter.ts`

Debe crear cliente compatible con OpenRouter.

#### `src/lib/crypto.ts`

Debe incluir cifrado/descifrado de tokens.

#### `src/lib/time.ts`

Debe incluir utilidades de fechas y ventana de 24 horas.

#### `src/lib/redact.ts`

Debe redactar datos sensibles en logs.

#### `src/lib/async-context.ts`

Debe permitir contexto por request/tenant.

---

### Middlewares

#### `src/middleware/error-handler.ts`

Debe capturar errores y responder de forma segura.

#### `src/middleware/request-logger.ts`

Debe loguear requests sin exponer secretos.

#### `src/middleware/rate-limit.ts`

Debe proteger webhook y rutas públicas.

#### `src/middleware/tenant-resolver.ts`

Debe resolver tenant por:

- `waba_id`,
- `phone_number_id`,
- token de ruta,
- header autorizado.

#### `src/middleware/auth-owner.ts`

Debe validar comandos del dueño.

---

### Schemas

Todos los schemas deben usar Zod.

Debe existir validación para:

- entorno,
- webhook,
- tenant,
- contacto,
- mensaje,
- cita,
- plantilla,
- laboratorio.

---

### Servicios

#### `src/core/services/inbound-message.service.ts`

Debe procesar mensajes entrantes:

1. validar payload,
2. resolver tenant,
3. verificar idempotencia,
4. guardar contacto,
5. guardar conversación,
6. guardar mensaje,
7. encolar procesamiento.

#### `src/core/services/outbound-message.service.ts`

Debe enviar mensajes salientes:

1. validar ventana 24 horas,
2. validar plantilla si corresponde,
3. aplicar rate limit,
4. enviar con proveedor,
5. guardar mensaje,
6. auditar.

#### `src/core/services/appointment.service.ts`

Debe gestionar citas:

- disponibilidad,
- creación,
- cancelación,
- reagenda,
- validación de horarios.

#### `src/core/services/template.service.ts`

Debe gestionar plantillas:

- por tenant,
- por vertical,
- aprobación,
- variables.

#### `src/core/services/audit.service.ts`

Debe registrar acciones críticas.

---

### WhatsApp

#### `src/core/whatsapp/mapping.ts`

Debe convertir payloads de Meta en tipos internos.

#### `src/core/whatsapp/media.ts`

Debe descargar media de forma segura.

#### `src/core/whatsapp/rate-limiter.ts`

Debe aplicar límites por tenant/número.

#### `src/core/whatsapp/retry.ts`

Debe reintentar errores transitorios de Meta.

---

### IA

#### `src/core/ai/prompt-builder.ts`

Debe construir system prompt usando:

- tenant,
- vertical,
- negocio,
- tono,
- reglas,
- knowledge base.

#### `src/core/ai/intents.ts`

Debe detectar intents:

- agendar,
- consultar precio,
- emergencia,
- queja,
- humano,
- comando owner,
- fuera de alcance.

#### `src/core/ai/escalation.ts`

Debe decidir cuándo escalar a humano.

#### `src/core/ai/memory.ts`

Debe manejar contexto conversacional.

#### `src/core/ai/tool-executor.ts`

Debe ejecutar tools con validación y auditoría.

---

### Observabilidad

#### `src/core/observability/tracing.ts`

Debe generar trace IDs.

#### `src/core/observability/metrics.ts`

Debe registrar métricas de negocio:

- mensajes entrantes,
- mensajes salientes,
- errores,
- escalados,
- citas agendadas,
- leads capturados,
- lab score.

---

### Feature flags

#### `src/core/feature-flags/index.ts`

Debe permitir activar/desactivar:

- laboratorio,
- envío real,
- comandos owner,
- attribution,
- nuevos verticales.

---

## Orden de implementación Fase 2

El agente debe trabajar en este orden:

```txt
1. Crear archivos de proyecto: .nvmrc, .editorconfig, .dockerignore, Makefile
2. Actualizar package.json con scripts y dependencias
3. Crear CI
4. Crear librerías internas
5. Crear middlewares
6. Crear schemas
7. Crear servicios
8. Crear módulos WhatsApp faltantes
9. Crear módulos IA faltantes
10. Crear observabilidad
11. Crear feature flags
12. Crear seeds
13. Crear fixtures
14. Crear docs API
15. Crear runbooks
16. Crear docs de seguridad
17. Correr typecheck
18. Correr tests
```

---

## Definición de terminado para Fase 2

La Fase 2 termina cuando:

1. El script `bootstrap-phase2.sh` crea todos los archivos.
2. `package.json` tiene scripts funcionales.
3. Existe CI con typecheck, lint y tests.
4. Los schemas validan entradas críticas.
5. Los servicios tienen contratos claros.
6. Los fixtures permiten simular webhooks de Meta.
7. Existen seeds para clínica e inmobiliaria.
8. Existen runbooks mínimos.
9. No hay tokens expuestos en logs.
10. El agente puede iniciar Fase 3 sin crear más archivos estructurales.
