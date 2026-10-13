<div align="center">

# 🌊 OmniFlow
### Plataforma Multi-Tenant de Agentes con IA para Negocios de Servicios

**El gestor de comunicaciones open source que cumple con las políticas de Meta 2026/2027,  
soporta múltiples verticales y se pone a prueba solo antes de hablar con tus clientes.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPLv3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Node](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org)
[![Meta API](https://img.shields.io/badge/WhatsApp-Cloud%20API-25D366.svg)](https://developers.facebook.com/docs/whatsapp)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](httpswww.docker.com)

[🚀 Quick Start](#-quick-start) · [🏗️ Arquitectura](#-arquitectura) · [📦 Verticales](#-verticales) · [🔒 Compliance Meta](#-compliance-con-meta) · [🧪 Laboratorio](#-laboratorio-de-ia) · [📚 Docs](#-documentación)

</div>

---

## ❓ ¿Qué es OmniFlow?

**OmniFlow** es una plataforma *self-hosted* de nivel enterprise que combina lo mejor de dos mundos: la **seguridad y cumplimiento** de la WhatsApp Cloud API oficial (Meta) y la **agilidad multi-tenant** de agentes verticales especializados. 

Nacido de la fusión conceptual de *Vocero CRM* y *Agente Clínicas*, OmniFlow permite a una sola instancia atender **cientos de negocios** (clínicas, inmobiliarias, talleres, e-commerce) con agentes de IA que agendan citas, capturan leads y responden 24/7, manteniendo un aislamiento de datos estricto y **cero riesgo de baneo**.

> ⚠️ **¿Por qué no usar librerías no oficiales como Baileys?**
> En 2026, Meta detecta y **banea permanentemente** números que usan clientes no oficiales (web sockets simulados). OmniFlow usa exclusivamente la **Cloud API oficial**, garantizando que el activo más valioso de tu negocio (su número de teléfono) esté protegido.

### ✨ Características Principales

| Feature | Descripción |
|---------|-------------|
| 🔌 **Cloud API Oficial** | Conexión directa con Meta Graph API. Cero riesgo de baneo. |
| 🏢 **Multi-Tenant (RLS)** | Una instancia = cientos de negocios. Aislamiento total de datos vía Row-Level Security. |
| 🧪 **Laboratorio de IA** | 6 clientes simulados prueban tu agente en un sandbox antes de pasar a producción. |
| 📅 **Agendamiento Real** | Consultas disponibilidad real en DB. El agente *nunca* inventa horarios. |
| ⏰ **Ventana 24h** | Manejo automático de la ventana de atención de Meta + fallback a plantillas. |
| 📋 **Plantillas Oficiales** | Sync con Meta, aprobación automática, variables dinámicas por vertical. |
| 📊 **Conversions API** | Reporta ventas a Meta para optimizar el ROAS de tus anuncios Click-to-WhatsApp. |
| 💬 **Comandos del Dueño** | `/hoy`, `/semana`, `/pausar` directo por WhatsApp para control rápido. |
| 🎯 **Pipeline Kanban** | Leads se mueven solos según intención de compra detectada por IA. |
| 🔐 **Self-Hosted** | Tus datos en tu servidor. Sin suscripciones ocultas ni límites de mensajes artificiales. |

---

## 🏗️ Arquitectura (Nivel Principal Engineering)

Diseñada para soportar picos de tráfico (ej. Black Friday) sin perder mensajes ni duplicar respuestas.

```text
WhatsApp Cloud API (Meta Webhooks)
        │
        ▼
┌─────────────────────────────────────────────────┐
│         Webhook Gateway (Next.js API)           │
│  • Valida firma (X-Hub-Signature-256)           │
│  • Idempotency check (evita duplicados)         │
│  • Identifica tenant por WABA/Phone ID          │
│  • Responde 200 OK en <100ms (Backpressure)     │
└──────────────────┬──────────────────────────────┘
                   │ (Enqueue)
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────┐      ┌──────────────┐
│  BullMQ      │      │  Owner       │
│  (Redis)     │      │  Commands    │
│  - Mensajes  │      │  (/hoy, etc) │
│  - Media     │      │              │
└──────┬───────┘      └──────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│              Agent Workers (Auto-Scaling)        │
│  ┌─────────────┐  ┌─────────────┐               │
│  │ Vertical:   │  │ Vertical:   │               │
│  │ Clinic      │  │ Real Estate │  ...           │
│  │ - Agendar   │  │ - Buscar    │               │
│  │ - Triaje    │  │ - Visitas   │               │
│  └─────────────┘  └─────────────┘               │
│                                                  │
│  Tools: check_availability, book_appointment,    │
│         search_properties, capture_lead          │
└──────────────────┬───────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │  Redis       │
│  + Drizzle   │      │  (Cache +    │
│  + RLS       │      │   Queues)    │
└──────────────┘      └──────────────┘
```

### 🧩 Principios de Diseño

1. **Core Universal, Verticales Pluggable**: El núcleo (bandeja, pipeline, auth) no cambia entre industrias. Solo se añaden plugins verticales.
2. **Nunca Inventar Datos (Grounding)**: Precios, disponibilidad y fechas SIEMPRE vienen de la base de datos. Si no está en la KB, el agente escala a humano.
3. **Fail-Safe & Idempotency**: Si el procesamiento falla, la cola reintenta. Si Meta reenvía el webhook, el `message_id` evita duplicados.
4. **Observabilidad Primero**: OpenTelemetry integrado. Cada mensaje tiene un trace ID para debugging distribuido.
5. **Multi-Tenant por Diseño**: Row-Level Security (RLS) en PostgreSQL. Un tenant NUNCA ve datos de otro, ni siquiera por error de código.

---

## 📦 Verticales Soportadas (Plugins)

OmniFlow no es un bot genérico. Cada vertical tiene agentes, herramientas (tools) y plantillas específicas.

| Vertical | Icono | Agentes | Herramientas | Estado |
|----------|-------|---------|-------------|--------|
| **Clínicas** (vet/dental/estética) | 🏥 | Agendador, Triaje, Recordatorios | `check_availability`, `book_appointment` | ✅ Estable |
| **Inmobiliarias** | 🏠 | Calificador, Buscador, Visitas | `search_properties`, `schedule_viewing` | ✅ Estable |
| **E-commerce** | 🛒 | Rastreador, Recomendador, Devoluciones | `track_order`, `create_return` | 🟡 Beta |
| **Talleres Mecánicos** | 🚗 | Diagnóstico, Servicio, Cotización | `diagnose_issue`, `book_service` | 🟡 Beta |
| **Restaurantes** | 🍽️ | Reservas, Pedidos, Delivery | `check_table`, `take_order` | 🔜 Pronto |

### 🔄 ¿Quieres crear tu propio vertical?

```bash
# Genera la estructura base
npm run vertical:create -- --name "gimnasios" --icon "🏋️"
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Razón |
|------|-----------|-------|
| **Framework** | Next.js 15 (App Router) | API routes + SSR para panel |
| **UI** | React 19 + Tailwind CSS | Componentes modernos, dark mode |
| **Lenguaje** | TypeScript estricto | Type safety en todo el código |
| **Base de Datos** | PostgreSQL 16 + Drizzle ORM | RLS nativo, migraciones type-safe |
| **Cache/Colas** | Redis 7 + BullMQ | Rate limiting, colas de mensajes |
| **Auth** | Better Auth | Multi-tenant, roles por tenant |
| **WhatsApp** | WhatsApp Cloud API (Meta) | Oficial, sin riesgo de baneo |
| **IA** | OpenRouter (multi-modelo) | Tool-use, fallback automático |
| **Deploy** | Docker multi-stage | 2GB RAM mínimo |

---

## 🚀 Quick Start

### Prerrequisitos
- Node.js 20+ y Docker 24+
- Un VPS con 2GB RAM mínimo
- Un dominio con HTTPS (Meta exige HTTPS para webhooks)
- Una cuenta en [Meta for Developers](https://developers.facebook.com)

### 1. Clonar y configurar

```bash
git clone https://github.com/tu-org/omniflow-crm.git
cd omniflow-crm
cp .env.example .env
```

### 2. Configurar variables de entorno

```env
# .env
DATABASE_URL="postgresql://user:pass@localhost:5432/omniflow"
REDIS_URL="redis://localhost:6379"
ENCRYPTION_KEY="32-byte-random-key-here"  # openssl rand -hex 32
OPENROUTER_API_KEY="sk-or-..."
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
```

### 3. Levantar servicios

```bash
docker compose up -d
docker compose exec app npm run db:migrate
```

### 4. Conectar tu primer número de WhatsApp
1. Ve a `Configuración → WhatsApp → Conectar` en el panel.
2. Crea una App en Meta for Developers → Añade WhatsApp.
3. Genera un token de sistema con permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
4. Pega WABA ID + Phone Number ID + Token.
5. OmniFlow registra el webhook automáticamente y valida el handshake.

---

## 🔒 Compliance con Meta (2026/2027)

### ✅ Lo que OmniFlow cumple estrictamente

| Política de Meta | Implementación en OmniFlow |
|-----------------|---------------|
| **Solo Cloud API oficial** | Cero uso de Baileys/Puppeteer. Conexión vía Graph API. |
| **Ventana de 24 horas** | Bloqueo automático de texto libre + fallback a plantillas cuando expira. |
| **Plantillas aprobadas** | Sync con Meta, validación de estado, rechazo automático si Meta rechaza. |
| **Quality Rating** | Monitoreo continuo. Alertas si el número baja a amarillo/rojo. |
| **Rate Limiting** | Token bucket por WABA. Respeta límites de Meta (80 msg/s). |
| **Webhook Security** | Verificación de firma con App Secret en cada request. |

### ⚠️ Lo que OmniFlow NUNCA hace
❌ Enviar mensajes fuera de ventana sin plantilla aprobada.
❌ Inventar precios, fechas o disponibilidad (Alucinaciones).
❌ Dar consejo médico/legal/financiero específico.
❌ Compartir datos entre tenants (Cross-tenant leakage).

---

## 🧪 Laboratorio de IA

La pieza estrella. Antes de que tu agente hable con clientes reales, **se prueba solo en un sandbox interno que jamás envía mensajes reales a WhatsApp**.

### ¿Cómo funciona?
6 Clientes Simulados (El comprador decidido, El preguntón de precios, El cliente enojado, El que pregunta lo que no sabes, El que exige un humano, El que escribe con typos) conversan contra tu agente REAL.

Un **Juez LLM Independiente** evalúa cada conversación y te entrega:
- 📊 Un **score 0–100** de qué tan listo está el agente.
- 🔍 **Hallazgos con evidencia** (alucinaciones, huecos del conocimiento).
- 💡 **Sugerencias aplicables con un click** al knowledge base.

```bash
# Probar el agente de un tenant específico
npm run lab:test -- --tenant=clinica-dental
```

---

## 📅 Sistema de Agendamiento y Comandos

### Garantías que no se negocian
✅ Solo se reserva un horario que SE OFRECIÓ (el modelo no puede inventar "martes a las 10").
✅ Nunca se confirma una cita que NO SE CREÓ (si el hueco se ocupó, ofrece alternativas).

### Comandos del Dueño (por WhatsApp)
| Comando | Qué hace |
|---------|----------|
| `/hoy` | Resumen del día: citas, mensajes, leads nuevos |
| `/semana` | Reporte semanal con comparativas |
| `/pausar` | Detener el agente (y recordatorios) |
| `/activar` | Reactivar el agente |
| `/editar "cerramos el 25"` | Actualizar info en lenguaje natural |

---

## 🛡️ Seguridad y Escalabilidad Enterprise

### Datos en Reposo y Tránsito
- **Tokens de WhatsApp**: Cifrados con AES-256-GCM.
- **Aislamiento Multi-Tenant**: Row-Level Security (RLS) en PostgreSQL. Cada query lleva `tenant_id` obligatorio a nivel de DB.
- **Webhooks**: Firma `X-Hub-Signature-256` validada en el edge.

### Mitigación de Prompt Injection
1. Separación estricta de system prompt y user input.
2. Output validation: verificar que la respuesta no contradiga reglas de negocio (ej. precios).
3. Sandboxing: el agente solo puede ejecutar tools permitidas, no código arbitrario.

### Observabilidad
- **OpenTelemetry**: Tracing distribuido para ver latencia exacta de DB, LLM y Meta API.
- **Métricas de Negocio**: Dashboard de conversión, velocidad de respuesta y origen de anuncios (Conversions API).

---

## 🧪 Testing

```bash
npm run test:unit          # Unit tests (tools, validators)
npm run test:integration   # Integration tests (DB, API)
npm run test:isolation     # Tests de aislamiento multi-tenant (Cross-tenant)
npm run test:security      # Tests de prompt injection
npm run test:load          # Load testing (1000 mensajes simultáneos)
```

---

## 🗺️ Roadmap

- **v1.0 (Actual)**: Core, Multi-tenancy RLS, Verticales (Clínicas/Inmobiliarias), Laboratorio de IA.
- **v1.1 (Q2 2026)**: Verticales E-commerce y Talleres, Sistema de billing integrado (Stripe), Soporte multimodal (imágenes/audio).
- **v2.0 (Q4 2026)**: Marketplace de verticales, Multi-región (data residency), White-label completo para agencias.
- **v3.0 (2027)**: Agentes autónomos con memoria a largo plazo, Voice AI (llamadas de WhatsApp).

---

## 🤝 Contribuir

OmniFlow es un proyecto open source. Aceptamos Bug reports, Feature requests, Documentation improvements and Nuevos verticales.

```bash
git clone https://github.com/tu-org/omniflow-crm.git
cd omniflow-crm
npm install
npm run dev
```

Lee nuestra [Guía de Contribución](CONTRIBUTING.md) y [Código de Conducta](CODE_OF_CONDUCT.md).

---

## 📄 Licencia

Este proyecto está bajo la licencia **AGPL v3**.
- ✅ Uso comercial permitido
- ✅ Modificación permitida
- ⚠️ Si lo modificas y ofreces como servicio (SaaS), debes liberar tu código.

Para licencias comerciales (sin obligación de liberar código / Enterprise): [licencia@omniflow.dev](mailto:licencia@omniflow.dev)