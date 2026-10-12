# Runbook: Número Baneado o Flaggeado por Meta

## Síntomas de alerta

- Respuestas `403` o `400` con error `error: 180110` (Número no autorizado)
- Meta envía email/notificación: "Your WhatsApp Business account has been restricted"
- El número deja de responder por completo
- `quality_rating` baja a amarillo o rojo

### Clasificación de estados

| Estado | Indicador | Acción |
|--------|-----------|--------|
| `green` | calidad alta, sin restricciones | Operación normal |
| `yellow` | advertencias leves, límite reducido | Monitoreo intensivo |
| `red` | baneo temporal o restricción severa | Acciones inmediatas |

### Pasos para diagnóstico

1. **Revisar API status**:
   ```bash
   curl -H "Authorization: Bearer $META_ACCESS_TOKEN" \
     "https://graph.whatsapp.com/v21.0/1234567890/status"
   ```

2. **Verificar calidad del número**:
   ```bash
   curl -H "Authorization: Bearer $META_ACCESS_TOKEN" \
     "https://graph.whatsapp.com/v21.0/1234567890/quality_rating"
   ```

3. **Revisar logs de errores últimos 24h**:
   ```bash
   tail -n 100 logs/whatsapp.log | grep -E "error|403|180110"
   ```

### Pasos para respuesta

1. **No entrar en pánico**: Los números no se banean sin causa

2. **Identificar causa común**:
   - Uso de librerías no oficiales (Baileys, Puppeteer)
   - Envíos fuera de ventana
   - Muchos reportes de spam por parte de clientes
   - Patrones anti-Meta (firmas extrañas, volúmenes altos)

3. **Acciones inmediatas**:

   ```bash
   # 1. Detener envíos automáticos
   # Cambiar ENABLE_REAL_MESSAGES a false temporalmente
   # Actualizar .env y re-deploy
   
   # 2. Limpiar colas
   redis-cli DEL key:*whatsapp*:queue:*
   
   # 3. Verificar plantillas aprobadas
   # Asegurar que todas las plantillas usadas están "approved" en Meta
   # Re-submit any rejected templates
   
   # 4. Evitar envíos masivos por 24-48h
   # Dejar que el rating recupere su nivel
   
   # 5. Contactar soporte Meta si:
   # - El rating sigue rojo después de 48h
   # - Necesitas reaplicar para WhatsApp Business
   ```

### Prevención a largo plazo

- Usar Cloud API oficial solo (prohibido Baileys/Puppeteer)
- Respetar siempre ventana de 24 horas
- No enviar más de 1 mensaje cada 15 min al mismo número fuera de ventana
- Mantener buena calidad de contenido (evitar spam)
- Rotar plantillas si Meta rechaza una seguida
- Monitorear calidad_rating semanalmente

### Contactos Meta

- Panel de soporte: developers.facebook.com
- Email: business-support@meta.com (para cuentas empresariales)
- Tiemres de respuesta: 2-5 días hábiles para soporte estándar

### Rollback rápido

```bash
# Desactivar envío real en .env
ENABLE_REAL_MESSAGES=false

# Reiniciar servicio
docker compose restart worker

# Monitorear rating por 24h
make metrics
```