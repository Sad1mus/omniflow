# Documentación de la API - OmniFlow CRM

Esta carpeta documenta los endpoints y protocolos de la plataforma OmniFlow CRM.

## Endpoints

| Ruta | Descripción |
|------|-------------|
| `/webhook` | Webhook de Meta (GET/POST) |
| `/health` | Health check |
| `/owner` | Comandos del dueño |
| `/lab` | Laboratorio de IA |

## Métodos HTTP soportados

- `GET` - Recuperar datos o verificar configuración
- `POST` - Enviar datos (webhooks, mensajes, comandos)

## Seguridad

- Webhooks de Meta deben validar firma `X-Hub-Signature-256`
- Todos los endpoints responden `200` rápidamente
- Logs sin tokens ni datos sensibles

## Formato de respuesta

```json
{
  "error": {
    "code": "STRING",
    "message": "STRING"
  }
}
```

## Verificación con curl

```bash
curl http://localhost:3000/health
```