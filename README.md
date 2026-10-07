# Consultorio MVP v0.4

Aplicación web para Vercel + Neon/PostgreSQL con dos puestos de trabajo y administración de usuarios.

## Roles

### RECEPCIÓN
- Lista de pacientes.
- Buscador por DNI, nombre, apellido o teléfono.
- Alta de pacientes con DNI, nombre, apellido, teléfono y dirección.
- Detección de duplicados por DNI y advertencia de posibles duplicados por nombre/apellido o teléfono.
- Perfil del paciente, historial de consultas y notas internas.
- Envío a la cola.
- Repeticiones y su historial separado.
- Repetir una repetición anterior.
- Limpiar queue.
- Exportar consultas del día en DOCX o PDF.

### DOCTOR
- Solo puesto de consulta.
- Botón SIGUIENTE / abrir paciente actual.
- Última consulta anterior.
- Resumen de medicaciones recientes de las últimas 3 consultas.
- Botón para copiar medicaciones de la consulta anterior.
- Observaciones y 1 a 5 medicaciones.
- No ve notas internas ni gestión administrativa.

### ADMIN
- Panel `/admin`.
- Crear usuarios.
- Cambiar nombre visible, contraseña, rol y estado activo/inactivo.
- Las contraseñas cambiadas desde el panel no se pisan en deploys posteriores.
- Acceso de supervisión a pacientes y repeticiones.
- Limpiar queue.
- Exportar DOCX/PDF.

## Buscador global

Recepción y Admin tienen un buscador en el encabezado. Con dos o más caracteres consulta la base y permite abrir directamente un perfil sin volver al listado principal.

## Repeticiones

Las repeticiones usan tablas separadas (`Repetition` y `RepetitionMedication`). No aparecen como consultas realizadas y no se incluyen en el DOCX/PDF diario.

Cada paciente muestra su historial de repeticiones y permite usar `Repetir` para precargar observaciones y medicaciones de una anterior antes de guardar una nueva.

## Notas internas

`Patient.internalNotes` se usa para notas administrativas. Solo Recepción y Admin las pueden ver/editar. No se muestran al Doctor y no se incluyen en exportaciones.

## Base de datos

PostgreSQL / Neon mediante Prisma.

Relaciones principales:

```text
Patient
  ├─ Consultation
  │    ├─ Medication
  │    └─ QueueItem
  └─ Repetition
       └─ RepetitionMedication

User
  └─ Session
```

## Variables de entorno

```env
DATABASE_URL="postgresql://...-pooler..."
DIRECT_URL="postgresql://..."

RECEPTION_USERNAME="recep"
RECEPTION_PASSWORD="recep1234"
DOCTOR_USERNAME="doc"
DOCTOR_PASSWORD="doc1234"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin1234"
```

Las variables de usuarios se usan para CREAR el usuario si todavía no existe. A partir de ahí, el panel Admin manda: un nuevo deploy no sobrescribe contraseña, rol, nombre visible ni estado activo.

Si no agregás `ADMIN_USERNAME` / `ADMIN_PASSWORD`, el primer deploy de v0.4 crea por defecto:

```text
usuario: admin
clave: admin1234
```

Entrá y cambiala inmediatamente desde **Admin → Cambiar clave**.

## Deploy de una instalación v0.3.x existente

No hay que borrar Neon ni recrear la base.

1. Reemplazá los archivos del repo con esta v0.4, conservando `.git` y `.env`.
2. Ejecutá localmente si querés:

```bash
npm install
npx prisma generate
```

3. Subí a GitHub:

```bash
git add .
git commit -m "Consultorio v0.4 nuevas funciones"
git push
```

4. Vercel ejecuta automáticamente:

```text
prisma generate
prisma migrate deploy
prisma db seed
next build
```

La migración `20261007113000_admin_internal_notes`:
- agrega `ADMIN` al enum `UserRole`;
- agrega `Patient.internalNotes`;
- conserva todos los pacientes, consultas, repeticiones y usuarios existentes.

## Exportaciones

- DOCX: `/api/export/today`
- PDF: `/api/export/today/pdf`

Ambas incluyen solo consultas `COMPLETED` del día en horario de Argentina y listan horizontalmente paciente + hasta cinco medicaciones.

## Cola

La cola se actualiza por polling. El botón `Siguiente` usa una operación transaccional con `FOR UPDATE SKIP LOCKED` para evitar que dos puestos reclamen al mismo paciente.

`Limpiar queue` elimina los `QueueItem`. Si había consultas `QUEUED` o `IN_PROGRESS`, se marcan `CANCELLED`; no se borran pacientes ni consultas finalizadas.

## Node

El proyecto requiere Node 22 o superior.
