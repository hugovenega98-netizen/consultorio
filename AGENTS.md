# Consultorio MVP — contexto técnico

- Next.js 16 App Router + React 19.
- PostgreSQL compartido.
- Prisma ORM 7.
- El DNI se almacena solo con dígitos y es único.
- Una consulta puede tener hasta 5 medicaciones en UI; la base usa relación 1:N.
- Estados: QUEUED -> IN_PROGRESS -> COMPLETED.
- QueueItem refleja WAITING -> IN_PROGRESS -> DONE.
- El endpoint POST /api/queue/next usa FOR UPDATE SKIP LOCKED: no reemplazar por un select+update separado.
- Para el MVP solo se permite una consulta IN_PROGRESS global. En una futura versión multi-consultorio agregar stationId/doctorId y reclamar por puesto.
- La cola se refresca por polling cada 2.5 s; WebSocket/SSE puede agregarse después sin cambiar el modelo.
- La exportación diaria usa America/Argentina/Buenos_Aires (UTC-03) y genera .docx.
- Antes de producción con datos médicos: auth, roles, auditoría, backups y TLS son la siguiente etapa de hardening.
