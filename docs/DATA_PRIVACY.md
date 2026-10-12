# Data Privacy Policy

## Personal Data Processed

### WhatsApp User Data

| Campo | Origen | Uso | Retención |
|-------|--------|-----|-----------|
| `whatsapp_phone` | Mensajes entrante | Contacto, base de datos, consentimiento | 90 días |
| `name` | Campo perfil | Personalización, respuestas | 90 días |
| `meta_message_id` | Meta Cloud API | Idempotencia, historial | 180 días |
| `meta_template_id` | Meta Cloud API | Envío de plantillas | 180 días |

### Datos de Tenant (Negocio)

| Campo | Origen | Uso | Retención |
|-------|--------|-----|-----------|
| `tenant_id` | Auto-generado | Isolación de datos | Indefinido |
| `settings` | Formulario onboarding | Configuración agente | Indefinido |
| `services` | Formulario onboarding | Servicios ofrecidos | Indefinido |
| `audit_logs` | Sistema | Seguridad, auditoría | 2 años |

### Datos de Laboratorio

| Campo | Origen | Uso | Retención |
|-------|--------|-----|-----------|
| `lab_runs` | Simulaciones | Evaluación agente | 30 días |
| `lab_conversations` | Transcripciones | Evaluación, score | 30 días |

## Rights of Data Subjects

### Right to Access

Usuarios pueden:
- Solicitar todos sus datos guardados
- Exportarlos en formato JSON
- Revocar consentimiento

### Right to Erasure ("Right to be Forgotten")

Usuarios pueden:
- Eliminar su número de WhatsApp de la base de datos
- Eliminar historial de conversaciones
- Solicitud via comando `/panel` o endpoint `DELETE /admin/user-data`

### Right to Data Portability

- Exportar datos de un tenant a otro (migración)
- API: `GET /admin/export?tenant_id=XXXX`

## Data Retention Policy

| Dato | Período | Acción al expirar |
|------|---------|-------------------|
| Mensajes de WhatsApp | 90 días | Borrar automáticamente |
| Histórico de citas | 2 años | Archivar, no borrar |
| Logs de auditoría | 2 años | Borrar tras revisión |
| Configuración tenant | Indefinido | Mantener mientras activo |
| Datos laboratorio | 30 días | Borrar automáticamente |
| Token Meta | Hasta revocación | Indefinido |

## GDPR Compliance Checklist

- [ ] Consentimiento registrado para cada contacto
- [ ] Endpoint de eliminación de datos disponible
- [ ] Datos pseudonimizados en logs
- [ ] Alcance limitado de datos (solo lo necesario)
- [ ] Registro de procesamiento de actividades (APR)
- [ ] Breach notification procedure definida

## Privacy by Design

Todas las nuevas funcionalidades deben:

1. Minimizar datos desde el diseño
2. Separar datos por tenant por defecto
3. Cifrar datos sensibles en reposo
4. Validar consentimiento explícito
5. Documentar flujo de datos