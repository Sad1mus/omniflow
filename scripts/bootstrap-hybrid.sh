#!/usr/bin/env bash
set -euo pipefail

echo "Creando estructura híbrida OmniFlow..."

# Carpetas principales
mkdir -p docs/adr
mkdir -p scripts
mkdir -p src/config
mkdir -p src/lib
mkdir -p src/core/types
mkdir -p src/core/tenants
mkdir -p src/core/whatsapp/providers
mkdir -p src/core/queue
mkdir -p src/core/ai
mkdir -p src/core/lab
mkdir -p src/core/crm
mkdir -p src/core/owner-commands
mkdir -p src/verticals/clinic
mkdir -p src/verticals/real-estate
mkdir -p src/routes
mkdir -p src/legacy
mkdir -p supabase/migrations
mkdir -p supabase/seed
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/security

# Archivos raíz
touch AGENT_INSTRUCTIONS.md
touch .env.example.hybrid
touch docker-compose.yml
touch Dockerfile
touch tsconfig.build.json

# Docs
touch docs/HYBRID_ARCHITECTURE.md
touch docs/META_COMPLIANCE.md
touch docs/VERTICAL_PLUGIN_GUIDE.md
touch docs/IMPLEMENTATION_PLAN.md
touch docs/adr/0001-oficializar-whatsapp-cloud-api.md
touch docs/adr/0002-arquitectura-multi-tenant.md
touch docs/adr/0003-laboratorio-de-ia.md

# Scripts
touch scripts/bootstrap-hybrid.sh
touch scripts/check-hybrid.sh
touch scripts/db-migrate.sh
touch scripts/seed-vertical-clinic.sh
touch scripts/seed-vertical-real-estate.sh

# Config/lib
touch src/config/env.ts
touch src/lib/logger.ts
touch src/lib/errors.ts
touch src/lib/idempotency.ts

# Core
touch src/core/types.ts

touch src/core/tenants/types.ts
touch src/core/tenants/repository.ts
touch src/core/tenants/service.ts

touch src/core/whatsapp/types.ts
touch src/core/whatsapp/signature.ts
touch src/core/whatsapp/window.ts
touch src/core/whatsapp/templates.ts
touch src/core/whatsapp/meta-client.ts
touch src/core/whatsapp/webhook.ts
touch src/core/whatsapp/provider.ts
touch src/core/whatsapp/providers/cloud.provider.ts
touch src/core/whatsapp/providers/baileys.provider.ts

touch src/core/queue/types.ts
touch src/core/queue/queue.ts
touch src/core/queue/worker.ts

touch src/core/ai/types.ts
touch src/core/ai/runtime.ts
touch src/core/ai/tools.ts
touch src/core/ai/guardrails.ts
touch src/core/ai/brain.ts

touch src/core/lab/types.ts
touch src/core/lab/personas.ts
touch src/core/lab/runner.ts
touch src/core/lab/judge.ts

touch src/core/crm/contacts.ts
touch src/core/crm/conversations.ts
touch src/core/crm/messages.ts
touch src/core/crm/pipeline.ts
touch src/core/crm/appointments.ts
touch src/core/crm/leads.ts

touch src/core/owner-commands/index.ts
touch src/core/owner-commands/handlers.ts

# Verticales
touch src/verticals/types.ts
touch src/verticals/registry.ts

touch src/verticals/clinic/index.ts
touch src/verticals/clinic/config.ts
touch src/verticals/clinic/prompts.ts
touch src/verticals/clinic/tools.ts
touch src/verticals/clinic/templates.ts
touch src/verticals/clinic/commands.ts

touch src/verticals/real-estate/index.ts
touch src/verticals/real-estate/config.ts
touch src/verticals/real-estate/prompts.ts
touch src/verticals/real-estate/tools.ts
touch src/verticals/real-estate/templates.ts
touch src/verticals/real-estate/commands.ts

# HTTP/server
touch src/server.ts
touch src/worker.ts
touch src/app.ts
touch src/routes/health.ts
touch src/routes/webhook.whatsapp.ts
touch src/routes/owner.command.ts
touch src/routes/lab.run.ts

# DB
touch supabase/migrations/20260618000000_hybrid_core.sql
touch supabase/migrations/20260618000100_hybrid_rls.sql
touch supabase/migrations/20260618000200_hybrid_indexes.sql
touch supabase/seed/hybrid_tenants.sql
touch supabase/seed/hybrid_vertical_registry.sql

# Tests
touch tests/unit/env.test.ts
touch tests/unit/whatsapp-signature.test.ts
touch tests/unit/whatsapp-window.test.ts
touch tests/unit/idempotency.test.ts
touch tests/unit/guardrails.test.ts

touch tests/integration/tenant-isolation.test.ts
touch tests/integration/webhook.test.ts
touch tests/integration/queue.test.ts
touch tests/integration/appointment-flow.test.ts

touch tests/security/prompt-injection.test.ts
touch tests/security/cross-tenant.test.ts

chmod +x scripts/bootstrap-hybrid.sh
chmod +x scripts/check-hybrid.sh
chmod +x scripts/db-migrate.sh
chmod +x scripts/seed-vertical-clinic.sh
chmod +x scripts/seed-vertical-real-estate.sh

echo "Bootstrap completado."