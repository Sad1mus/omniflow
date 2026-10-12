# Runbook: Rate Limit de Meta

## Límites conocidos

- **~80 mensajes/segundo** por WABA (límite teórico)
- **Límites diarios por categoría** (ver [Documentación de Meta](https://developers.facebook.com/docs/whatsapp/platform/limits))

### Cifras aproximadas

| Categoría | Límite aproximado/día |
|-----------|-----------------------|
| Utility | 1,000 |
| Marketing | ~250 |
| Authentication | ~1,000 |

Nota: Meta usa un modelo de reputación del número. Los números con baja calidad reciben límites más bajos.

## Síntomas de exceder límite

- Respuestas `429 Too Many Requests` del webhook
- Errores `429` en respuestas de Cloud API
- Colas de mensajes creciendo sin procesar

### Pasos para diagnosticar

1. **Ver métricas de la cola**:
   ```bash
   make metrics
   ```

2. **Revisar rate limiter**:
   ```bash
   redis-cli monitor | grep ratelimit
   ```

3. **Ver calidad del número**:
   ```bash
   curl -H "Authorization: Bearer $META_ACCESS_TOKEN" \
     "https://graph.whatsapp.com/v21.0/PHONE_NUMBER_ID"
   ```

### Pasos para corregir

1. **Diluir envíos**:
   - Agregar delay entre envíos en ventanas de marketing
   - Priorizar mensajes de utilidad (tienen mayor límite)

2. **Reintentar con backoff**:
   ```
   retry con backoff exponencial:
     intentos: 3
     delay inicial: 1s
     máximo: 30s
   ```

3. **Escalar a Meta** si:
   - Límite aparente es mucho más bajo que lo documentado
   - El problema persiste por más de 24h

4. **Verificar calidad de número**:
   ```bash
   curl -H "Authorization: Bearer $META_ACCESS_TOKEN" \
     "https://graph.whatsapp.com/v21.0/PHONE_NUMBER_ID/quality_rating"
   ```

## Prevención

- Mantener calidad de número (evitar spam, reportes negativos)
- Respetar ventana de 24 horas
- No reenviar mensajes idénticos
- Limpiar listas de contacto regularmente