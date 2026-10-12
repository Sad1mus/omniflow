#!/usr/bin/env bash
set -euo pipefail

echo "Creando estructura Fase 2..."

files=(
  ".github/workflows/ci.yml"
  ".github/PULL_REQUEST_TEMPLATE.md"
  ".dockerignore"
  ".editorconfig"
  ".nvmrc"
  "Makefile"

  "docs/api/README.md"
  "docs/api/webhook.md"
  "docs/api/owner-commands.md"
  "docs/api/lab.md"

  "docs/runbooks/meta-webhook-failures.md"
  "docs/runbooks/rate-limit.md"
  "docs/runbooks/tenant-onboarding.md"
  "docs/runbooks/number-banned-or-flagged.md"
  "docs/runbooks/incident-response.md"

  "docs/SECURITY.md"
  "docs/DATA_PRIVACY.md"
  "docs/THREAT_MODEL.md"

  "src/lib/supabase.ts"
  "src/lib/redis.ts"
  "src/lib/openrouter.ts"
  "src/lib/crypto.ts"
  "src/lib/time.ts"
  "src/lib/async-context.ts"
  "src/lib/redact.ts"
  "src/lib/http.ts"

  "src/middleware/error-handler.ts"
  "src/middleware/request-logger.ts"
  "src/middleware/rate-limit.ts"
  "src/middleware/tenant-resolver.ts"
  "src/middleware/auth-owner.ts"

  "src/core/schemas/env.schema.ts"
  "src/core/schemas/webhook.schema.ts"
  "src/core/schemas/tenant.schema.ts"
  "src/core/schemas/contact.schema.ts"
  "src/core/schemas/message.schema.ts"
  "src/core/schemas/appointment.schema.ts"
  "src/core/schemas/template.schema.ts"
  "src/core/schemas/lab.schema.ts"

  "src/core/services/inbound-message.service.ts"
  "src/core/services/outbound-message.service.ts"
  "src/core/services/conversation.service.ts"
  "src/core/services/appointment.service.ts"
  "src/core/services/template.service.ts"
  "src/core/services/tenant-onboarding.service.ts"
  "src/core/services/audit.service.ts"

  "src/core/whatsapp/mapping.ts"
  "src/core/whatsapp/media.ts"
  "src/core/whatsapp/rate-limiter.ts"
  "src/core/whatsapp/retry.ts"

  "src/core/ai/prompt-builder.ts"
  "src/core/ai/intents.ts"
  "src/core/ai/escalation.ts"
  "src/core/ai/memory.ts"
  "src/core/ai/tool-executor.ts"

  "src/core/observability/tracing.ts"
  "src/core/observability/metrics.ts"

  "src/core/security/pii.ts"

  "src/core/settings/index.ts"
  "src/core/feature-flags/index.ts"

  "supabase/seed/hybrid_templates_clinic.sql"
  "supabase/seed/hybrid_templates_real_estate.sql"
  "supabase/seed/hybrid_owner_auth.sql"
  "supabase/seed/hybrid_feature_flags.sql"

  "tests/fixtures/meta/webhook-text.json"
  "tests/fixtures/meta/webhook-image.json"
  "tests/fixtures/meta/webhook-audio.json"
  "tests/fixtures/meta/webhook-status.json"
  "tests/fixtures/meta/webhook-interactive-button.json"
  "tests/fixtures/meta/verify-subscribe.json"

  "tests/fixtures/tenants/clinic.json"
  "tests/fixtures/tenants/real-estate.json"

  "tests/fixtures/lab/personas.json"
)

for file in "${files[@]}"; do
  mkdir -p "$(dirname "$file")"
  if [[ ! -f "$file" ]]; then
    touch "$file"
    echo "Creado: $file"
  else
    echo "Ya existe: $file"
  fi
done

chmod +x scripts/bootstrap-phase2.sh || true

echo "Fase 2 bootstrap completado."