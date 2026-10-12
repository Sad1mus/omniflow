# Runbook: Tenant Onboarding

## Proceso de incorporación de un nuevo tenant (cliente)

### Paso 1: Recolección de información

Utilizar el formulario estándar: `docs/ONBOARDING_CLIENTE.md`

Información requerida:
- Nombre del negocio
- Tipo de vertical (clinic, real-estate, etc.)
- Teléfono humano (para emergencias y comandos)
- Servicios ofrecidos
- Horario de atención
- Zona horaria
- Tono de comunicación (profesional, comercial, etc.)

### Paso 2: Creación en base de datos

Ejecutar script de onboarding:
```bash
npx tsx scripts/nueva_clinica.ts --json '{
  "nombre": "Nuevo Negocio",
  "vertical": "clinic",
  "telefono_humano": "57300123456",
  "servicios": ["consulta", "limpieza"],
  "horario": "08:00-18:00",
  "timezone": "America/Bogota",
  "tone": "profesional",
  "ciudad": "Bogota"
}'
```

O manualmente con SQL:
```sql
INSERT INTO public.tenants (name, slug, vertical, timezone, settings)
VALUES (
  'Nuevo Negocio',
  'nuevo-negocio',
  'clinic',
  'America/Bogota',
  '{"servicios": ["consulta", "limpieza"], "tone": "profesional", "horario": "08:00-18:00"}'::jsonb
) RETURNING id;
```

### Paso 3: Configuración de WhatsApp Cloud API

1. En Meta Developers:
   - Crear App de WhatsApp Business (si no existe)
   - Añadir producto WhatsApp
   - Obtener `WABA ID` y `PHONE NUMBER ID`

2. Generar token de sistema:
   - Permisos: `whatsapp_business_messaging`, `whatsapp_business_management`

3. Actualizar tenant credentials:
```sql
INSERT INTO public.tenant_credentials (tenant_id, meta_waba_id, meta_phone_number_id, encrypted_access_token, verify_token)
VALUES (
  'TENANT_ID_FROM_STEP_2',
  'WABA_ID',
  'PHONE_NUMBER_ID',
  'ENCRYPTED_TOKEN',
  'RANDOM_VERIFY_TOKEN'
);
```

4. Actualizar tenant:
```sql
UPDATE public.tenants SET status = 'active' WHERE id = 'TENANT_ID_FROM_STEP_2';
```

### Paso 4: Prueba de integración

1. **Webhook verification**:
   ```
   GET https://tu-dominio.com/webhook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=123
   ```
   Debería responder: `123`

2. **Envío de prueba**:
   ```bash
   # Usando Cloud API directamente
   curl -X POST "https://graph.facebook.com/v21.0/PHONE_NUMBER_ID/messages" \
     -H "Authorization: Bearer SYSTEM_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "messaging_product": "whatsapp",
       "to": "521XXXXXXXX",
       "type": "template",
       "template": {
         "name": "hello_world",
         "language": { "code": "en_US" }
       }
     }'
   ```

### Paso 5: Activación de laboratorio

1. Ejecutar test de laboratorio:
   ```bash
   npm run lab:test -- --tenant=nuevo-negocio --vertical=clinic --persona=comprador_decidido
   ```

2. Verificar score > 70 para considerar listo para producción

### Paso 6: Comunicación al cliente

Enviar:
1. Link del panel: `https://tu-dominio.com/d/DASHBOARD_TOKEN`
2. Instrucciones para probar:
   - Enviar "Hola" al número de WhatsApp configurado
   - Esperar respuesta automática
3. Recordatorio de ventana de 24 horas

## Verificación post-deploy

✅ Webhook responde 200 a GET de verificación  
✅ Mensajes de prueba entran y responden  
✅ Comandos del dueño funcionan (/hoy, /pausar)  
✅ Panel muestra datos en tiempo real  
✅ Laboratorio corre sin enviar mensajes reales  

## Rollback

Si algo falla durante onboarding:
1. `UPDATE public.tenants SET status = 'suspended' WHERE id = 'TENANT_ID';`
2. Revisar logs: `docker compose logs -f worker`
3. Reintentar paso fallido
4. Si es error de credenciales: eliminar de tenant_credentials y reintentar