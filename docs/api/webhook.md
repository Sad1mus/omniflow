# Webhook de Meta

## GET /webhook

Verificación inicial de webhook. Meta envía un `GET` con `hub.mode`, `hub.verify_token` y `hub.challenge`.

### Headers esperados

| Header | Valor | Descripción |
|--------|-------|-------------|
| `hub.mode` | `subscribe` | Modo de verificación |
| `hub.verify_token` | `token` | Token de verificación configurado |
| `hub.challenge` | `string` | Retornar como respuesta |

### Respuesta esperada

```text
200 OK
challenge_123
```

### Errores posibles

| Status | Descripción |
|--------|-------------|
| `401` | Verify token incorrecto |
| `404` | Webhook no encontrado |

## POST /webhook

Recibe mensajes entrantes de WhatsApp.

### Headers esperados

| Header | Valor | Descripción |
|--------|-------|-------------|
| `Content-Type` | `application/json` | Payload JSON |
| `X-Hub-Signature-256` | `sha256=...` | Firma del payload |
| `X-Forwarded-For` | `IP` | IP de Meta (opcional) |

### Idempotencia

Cada mensaje de WhatsApp tiene un `id` único. El sistema almacena un `message_id` en Redis y descarta duplicados.

```
key: whatsapp:message:{phone_number_id}:{message_id}
ttl: 24 horas
```

### Respuesta esperada

```json
{
  "ok": true,
  "message": "Webhook procesado"
}
```

### Errores posibles

| Status | Descripción |
|--------|-------------|
| `401` | Firma inválida |
| `403` | Tenant no encontrado |
| `429` | Rate limit excedido |
| `500` | Error interno (reintentar) |

### Payload de ejemplo

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1234567890",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5215511111111",
              "phone_number_id": "1234567890"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Cliente Demo"
                },
                "wa_id": "5215511111111"
              }
            ],
            "messages": [
              {
                "from": "5215511111111",
                "id": "wamid.TEST123",
                "timestamp": "1700000000",
                "type": "text",
                "text": {
                  "body": "Hola, quiero una cita"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```