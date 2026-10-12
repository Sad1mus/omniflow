# Runbook: Respuesta ante Incidentes

## Escalamiento de incidentes

Niveles de severidad:

| Nivel | Descripción | Tiempo de respuesta |
|-------|-------------|---------------------|
| `P0` | Servicio completo caído | Inmediato (<15 min) |
| `P1` | Función crítica dañada | <1 hora |
| `P2` | Función secundada dañada | <8 horas |
| `P3` | Problema menor | <48 horas |

## Pasos iniciales

### Paso 1: Reconocer

Detectar el incidente:
- Alertas de monitorización
- Reportes de usuarios
- Errores en logs

### Paso 2: Contener

- Desactivar envíos automáticos si hay riesgo de más daños
- `ENABLE_REAL_MESSAGES=false` si hay spam
- `LAB_MODE=false` si hay pruebas problemáticas

### Paso 3: Diagnosticar

Recolectar información:
```bash
# Ver estado de servicios
docker compose ps

# Ver logs recientes
docker compose logs -f worker
docker compose logs -f server

# Ver colas
make queue-status
```

### Paso 4: Corregir

Aplicar fix o rollback:
```bash
# Ver git log
git log --oneline -5

# Si se necesita rollback
git revert <commit>
make deploy
```

### Paso 5: Verificar

Comprobar que la solución funciona:
- Webhook responde 200
- Mensajes llegan y responden
- Colas no se acumulan

### Paso 6: Documentar

Registrar:
- Qué pasó
- Causa raíz
- Qué se hizo
- Lecciones aprendidas
- Cómo prevenir en el futuro

## Casos comunes

### Webhook 401 constante

Ver runbook `meta-webhook-failures.md`

### Colas infinitas

```bash
# Ver tamaño de cola
make queue-size
# Limpiar jobs en fallo
redis-cli DEL bull:queue:whatsapp-messages:*
```

### Mensajes duplicados

Normal: la idempotencia ya lo maneja. Verificar `message_id` no se procesa dos veces.

### Tenant con datos mezclados

**CRÍTICO**:
1. Detener procesamiento inmediatamente
2. Verificar RLS está activo
3. Revisar logs de acceso a DB
4. Reportar a seguridad