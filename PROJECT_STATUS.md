# Estado del Proyecto OmniFlow

**Última actualización:** 2026-10-12  
**Rama actual:** master  
**Último commit:** aa40eb8 - Fase 6 Bloque 1 - metering, health checks, docker prod

---

## 📋 Resumen del Estado

El proyecto ha completado la **Fase 6 Bloque 2: Observabilidad & Distributed Tracing**. El sistema ahora cuenta con trazabilidad distribuida completa (OpenTelemetry → Jaeger) y métricas Prometheus listas para Grafana.

---

## ✅ Fases Completadas

### Fase 1-2: Base + Verticales + Guardrails
- **Guardrails completos** (5 capas: emergencias médicas, inyección prompt, consejos sensibles, datos inventados, PII)
- **Verticales con tools reales**: clinic (check_availability, escalate_to_human) + real-estate (search_properties, schedule_viewing)
- **Tests**: 32 tests guardrails + tests unitarios/integración/seguridad = 47 passing

### Fase 3: Lab Runner + Encriptación + Legacy Isolation
- Lab runner funcional
- Encriptación AES-256-GCM para credenciales
- Aislamiento legacy (Baileys vs Cloud API)

### Fase 4-5: Metering + Health + Owner Commands + CRM Metrics
- Sistema de metering por tenant
- Health checks (liveness/readiness)
- Owner commands handlers
- Corrección schema lab_runs

### Fase 6 Bloque 1: Metering + Health + Docker Prod
- Metering, health checks, docker producción

### Fase 6 Bloque 2: **Observabilidad & Distributed Tracing** ⬅️ **RECIÉN COMPLETADO**

---

## 🔧 Implementación Fase 6 Bloque 2

### Trazabilidad Distribuida (OpenTelemetry)
| Archivo | Descripción |
|---------|-------------|
| `src/lib/observability/tracing.ts` | NodeSDK + OTLPTraceExporter (OTLP HTTP → Jaeger) |
| Auto-instrumentaciones | express, http, pg, redis-4 |
| Resource | SERVICE_NAME=`omniflow-crm`, SERVICE_VERSION=1.0.0 |
| Inicialización | **Antes de cualquier import** en `server.ts` y `worker.ts` |

### Métricas Prometheus
| Métrica | Tipo | Labels | Descripción |
|---------|------|--------|-------------|
| `omniflow_messages_processed_total` | Counter | tenant_id, direction, status | Mensajes inbound/outbound |
| `omniflow_llm_latency_seconds` | Histogram | tenant_id, model, success | Latencia LLM (buckets 0.1-10s) |
| `omniflow_appointments_booked_total` | Counter | tenant_id, vertical | Citas agendadas |
| Default metrics | - | - | CPU, memoria, GC, etc. |

### Endpoints
- `GET /metrics` → Formato Prometheus (`text/plain; version=4.2`)
- Traces → Jaeger en `http://localhost:16686`

### Integración en código
```typescript
// Inbound messages
recordMessageProcessed(tenantId, 'inbound', 'success')

// Outbound messages
recordMessageProcessed(tenantId, 'outbound', 'success')

// LLM calls
recordLLMLatency(tenantId, model, latencyMs, success)
incrementMetric(tenantId, 'llm_calls', 1)
incrementMetric(tenantId, 'llm_tokens', totalTokens)
```

### Stack Dev (docker-compose.dev.yml)
| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Jaeger | 16686 (UI), 4318 (OTLP) | Trazas distribuidas |
| Prometheus | 9090 | Scraping métricas |
| App | 3000 | API + /metrics |

---

## ✅ Verificación Actual

| Check | Estado |
|-------|--------|
| Typecheck | ✅ 0 errors |
| Build | ✅ compila sin errores |
| Tests | ✅ **52/52 passing** |
| Lint | ✅ 0 errors |

---

## 🚀 Cómo Levantar Observabilidad

```bash
# Levantar stack completo
docker-compose -f docker-compose.dev.yml up -d

# Verificar
curl http://localhost:3000/metrics     # Métricas Prometheus
open http://localhost:16686           # Jaeger UI
open http://localhost:9090            # Prometheus UI
```

---

## 📦 Paquetes Añadidos (Fase 6 Bloque 2)
```
@opentelemetry/api
@opentelemetry/sdk-node
@opentelemetry/auto-instrumentations-node
@opentelemetry/exporter-trace-otlp-http
@opentelemetry/exporter-prometheus
prom-client
```

---

## ⚠️ Riesgos / Deuda Técnica Conocida

1. **Coexistencia legacy**: Baileys + Cloud API en mismo repo — documentar modo exclusivo
2. **Firma webhook**: Bug en `signature.ts` (validación Meta) — pendiente desde Fase 2
3. **Worker vacío**: Si BullMQ falla silenciosamente, no hay alerta
4. **ESM sin extensiones**: `module: ESNext` en tsconfig requiere `tsx` para dev

---

## 📝 Próximos Pasos

1. **Fase 3 pendientes** (de archivo anterior):
   - Vertical registry + tenant-resolver middleware
   - Lab runner completo
   - Tests E2E con tools realistas
   - Documentar legacy vs nuevo

2. **Fase 6 Bloque 3** (siguiente):
   - Alertas Prometheus (PrometheusRule + Alertmanager)
   - Dashboards Grafana predefinidos
   - Logs estructurados correlacionados con traces

---

## 🔗 Referencias Rápidas

- **Specs**: `docs/specs/` (fuente de verdad - SDD)
- **Memory**: `.claude/projects/-home-sadimus-omniflow-crm/memory/omniflow-estado-repo.md`
- **Commits recientes**:
  - `aa40eb8` - Fase 6 Bloque 1
  - `5cdf99e` - Fase 5
  - `7561e4e` - Fase 4 completada
  - `2a1f114` - Fase 2 estabilización
  - `5865d77` - Fase 2 estabilización inicial