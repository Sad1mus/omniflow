# Runbook: Fallos de Webhook Meta

## Problema: Meta reintenta webhook o firma no coincide

### Síntomas

- Webhook responde con `401` constante
- Errores de firma en logs
- Meta muestra "Failed to validate webhook" en panel de control

### Pasos para diagnosticar

1. **Verificar configuración**:
   ```bash
   grep META_APP_SECRET .env
   ```

2. **Validar firma**:
   ```python
   import hmac, hashlib
   signature = "sha256=..."  # del header X-Hub-Signature-256
   payload = raw_body  # el cuerpo crudo
   expected = "sha256=" + hmac.new(app_secret.encode(), payload, hashlib.sha256).hexdigest()
   is_valid = signature == expected
   ```

3. **Revisar logs de errores**:
   ```bash
   tail -f logs/webhook.log
   ```

### Pasos para corregir

1. **Verificar META_APP_SECRET** en .env
2. **Re-deploy después de cambios**:
   ```bash
   make deploy
   ```

3. **Si la firma siempre falla**:
   - Meta suele cambiar app_secret en renovaciones de app
   - Revisar panel de Meta Developers → Configuración de la app
   - Generar nuevo token si es necesario

4. **Revalidar webhook**:
   ```bash
   # En el panel de Meta: Configuración → Webhooks
   # Re-registrar la URL con nuevos tokens
   ```

### Rollback

Si todo falla y no se identifica el problema:
1. Desactivar webhook temporalmente en panel de Meta
2. Los mensajes de clientes entrarán en modo "fuera de ventana" automáticamente
3. Usar plantillas manuales vía dashboard mientras se soluciona
4. Reactivar webhook tras verificar firma