#!/usr/bin/env bash
set -e

echo "🚀 Iniciando E2E Smoke Test para Go-Live..."

# 1. Health Check
echo "1. Verificando Health Check del Backend..."
curl -f http://localhost:3001/health || { echo "❌ Health check falló"; exit 1; }
echo "✅ Health check OK"

# 2. Metrics Endpoint
echo "2. Verificando Prometheus Metrics..."
curl -f http://localhost:3001/metrics > /dev/null || { echo "❌ Metrics falló"; exit 1; }
echo "✅ Metrics OK"

# 3. Frontend Build Check
echo "3. Verificando build del Frontend..."
cd apps/web && npm run build > /dev/null || { echo "❌ Frontend build falló"; exit 1; }
echo "✅ Frontend build OK"
cd ../..

echo "🎉 Todos los smoke tests pasaron. El sistema está listo para producción."