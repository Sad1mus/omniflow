# Comandos del Dueño

Los dueños pueden interactuar con el agente enviando comandos por WhatsApp.

## Comandos disponibles

| Comando | Qué hace |
|---------|----------|
| `/hoy` | Resumen del día: citas, mensajes, leads nuevos |
| `/semana` | Reporte semanal con comparativas |
| `/pausar` | Detener el agente (y recordatorios) |
| `/activar` | Reactivar el agente |
| `/panel` | Link de su panel de clientas |
| `/info` | Ver toda la información de su negocio |
| `/editar "cambio"` | Actualizar info en lenguaje natural |
| `/clientes` | Últimos clientes que escribieron |
| `/metrics` | Métricas de la semana |
| `/help` | Lista de comandos disponibles |

## Autenticación

El sistema verifica que quien envía comandos es el dueño mediante:

- Teléfono autorizado (`owner_phone` en la base de datos)
- Token de owner (`owner_token`)

## Ventana de 24 horas

Los comandos del dueño pueden enviarse en cualquier momento, incluso fuera de la ventana de 24 horas. No están sujetos al mismo límite que los mensajes de cliente.

## Respuestas típicas

```text
/hoy
→ 📅 Hoy: 3 citas confirmadas, 1 pendiente. 5 mensajes atendidos.

/pausar
→ 🛑 Agente pausado. Reactiva con /activar.

/editar "cerramos el 25 de diciembre"
→ ✅ Cambio aplicado. Cerramos el 25/12.
```