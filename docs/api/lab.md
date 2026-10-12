# Laboratorio de IA

## POST /lab/run

Ejecuta una conversación de prueba con un cliente simulado sin enviar mensajes reales.

### Body

```json
{
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "vertical": "clinic",
  "persona": "comprador_decidido",
  "max_turns": 12
}
```

### Parámetros

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tenant_id` | UUID | Tenant a probar |
| `vertical` | string | Vertical a usar (`clinic`, `real-estate`, etc.) |
| `persona` | string | Cliente simulado (ver fixtures) |
| `max_turns` | number (opcional) | Máximo número de turnos (default: 12) |

### Respuesta

```json
{
  "lab_run_id": "00000000-0000-0000-0000-000000000001",
  "score": 87,
  "passed": true,
  "findings": [
    "Buena detección de intención de agendar",
    "Respuestas dentro del tono profesional",
    "Nunca inventó disponibilidad"
  ],
  "suggestions": [
    "Agregar información sobre horarios de tarde",
    "Mejorar detección de urgencias menores"
  ],
  "transcript": [
    "Usuario: Hola, quiero una cita para mañana",
    "Agente: Claro, ¿preferirías mañana por la mañana o por la tarde?",
    ...
  ]
}
```

### Errores posibles

| Status | Descripción |
|--------|-------------|
| `400` | Parámetros inválidos |
| `404` | Tenant no encontrado |
| `404` | Persona no encontrada |
| `500` | Error interno del laboratorio |

## Uso desde CLI

```bash
npm run lab:test -- --tenant=clinica-demo --vertical=clinic --persona=pregunton_precios
```