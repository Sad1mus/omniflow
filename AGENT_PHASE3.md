# AGENT_PHASE3.md

## Objetivo

Implementar funcionalmente la arquitectura híbrida creada en Fase 1 y estabilizada en Fase 2.

La Fase 3 no debe crear estructura nueva salvo que sea estrictamente necesario.

El objetivo es que el sistema empiece a funcionar de extremo a extremo en modo desarrollo.

---

## Alcance

El agente debe implementar funcionalmente:

1. Configuración de entorno validada con Zod.
2. Logger estructurado con redacción de secretos.
3. Manejo centralizado de errores.
4. Webhook HTTP para WhatsApp Cloud API.
5. Verificación de firma de Meta.
6. Verificación GET de Meta.
7. Idempotencia de mensajes entrantes.
8. Mapeo de payloads de Meta a tipos internos.
9. Servicio de mensajes entrantes.
10. Cola de procesamiento.
11. Worker de procesamiento.
12. Proveedor oficial de WhatsApp Cloud API.
13. Lógica de ventana de 24 horas.
14. Servicio de plantillas.
15. Servicio de mensajes salientes.
16. Resolución de tenant por WABA / phone_number_id.
17. Registro de verticales.
18. Vertical clínica.
19. Vertical inmobiliaria.
20. Agente IA con tool-use.
21. Guardrails.
22. Comandos del dueño.
23. Laboratorio sin envío real.
24. Tests de integración con fixtures.

---

## Reglas no negociables

### 1. Nada de Baileys en producción

Baileys solo puede existir como legacy y desactivado.

### 2. Webhook rápido

El webhook debe responder rápido y delegar trabajo a cola.

No debe ejecutar LLM directamente.

### 3. Idempotencia

Cada mensaje entrante debe procesarse una sola vez.

### 4. Ventana de 24 horas

Si la ventana está cerrada, solo se permiten plantillas aprobadas.

### 5. Datos reales

El agente no debe inventar:

- precios,
- fechas,
- disponibilidad,
- propiedades,
- diagnósticos,
- tratamientos.

### 6. Laboratorio seguro

El laboratorio no debe enviar mensajes reales.

### 7. Logs seguros

Nunca loguear:

- tokens de Meta,
- service role keys,
- API keys,
- tokens de dueño,
- datos médicos sensibles.

---

## Orden de implementación Fase 3

El agente debe trabajar en este orden:

```txt
1. Env schema y config
2. Logger
3. Errors
4. WhatsApp mapping
5. Signature verification
6. Webhook route
7. Inbound message service
8. Queue
9. Worker
10. Tenant resolver
11. Cloud provider
12. Window logic
13. Template service
14. Outbound message service
15. Vertical registry
16. Clinic vertical
17. Real estate vertical
18. AI runtime
19. Tool executor
20. Guardrails
21. Owner commands
22. Lab runner
23. Integration tests
24. Docs update
```

---

## Definición de terminado

La Fase 3 se considera terminada cuando:

1. El servidor HTTP arranca.
2. El worker arranca.
3. El endpoint `/health` responde.
4. El webhook GET de Meta puede verificarse.
5. El webhook POST valida firma.
6. Un payload fixture puede procesarse.
7. El mensaje entrante se guarda en base de datos.
8. El mensaje se encola.
9. El worker lo procesa.
10. El sistema no usa Baileys si `WHATSAPP_PROVIDER=cloud`.
11. La ventana de 24 horas se respeta.
12. El laboratorio corre sin enviar mensajes reales.
13. Los tests de integración pasan.
14. No hay secretos en logs.
15. El proyecto pasa typecheck, lint y test.