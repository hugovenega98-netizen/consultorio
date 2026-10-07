# Consultorio MVP v0.4.2

Aplicación web para Vercel + Neon/PostgreSQL con recepción, puesto médico, repeticiones por tandas y administración de usuarios.

## Roles

### RECEPCIÓN
- Lista de pacientes.
- Buscador por DNI, nombre, apellido o teléfono.
- Alta de pacientes con DNI, nombre, apellido, teléfono y dirección.
- Detección de duplicados por DNI y advertencia de posibles duplicados por nombre/apellido o teléfono.
- Perfil del paciente con historial de consultas y notas internas.
- Envío a la cola.
- Pestaña independiente de Repeticiones.
- Limpiar queue.
- Exportar consultas del día en DOCX o PDF.

### DOCTOR
- Solo puesto de consulta.
- Botón SIGUIENTE / abrir paciente actual.
- Última consulta anterior.
- Resumen de medicaciones recientes de las últimas 3 consultas.
- Botón para copiar medicaciones de la consulta anterior.
- Primera consulta: MC (motivo de consulta) y AP (antecedentes personales).
- Todas las consultas: AF, C, D y A con selector de -5 a +5, T/A y Peso.
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


## Campos clínicos v0.4.2

En la primera consulta finalizada del paciente se cargan además:

- `MC`: motivo de consulta.
- `AP`: antecedentes personales.

En todas las consultas nuevas se cargan:

- `AF`: actividad física, escala de -5 a +5.
- `C`: catarsis, escala de -5 a +5.
- `D`: diuresis, escala de -5 a +5.
- `A`: ansiedad, escala de -5 a +5.
- `T/A`: tensión arterial, texto libre (por ejemplo `120/80`).
- `Peso`: valor numérico en kg.
- Observaciones.
- 1 a 5 medicaciones.

AF/C/D/A se muestran como desplegables. Estos campos, T/A, Peso y al menos una medicación son obligatorios para finalizar una consulta nueva. MC y AP solo son obligatorios si todavía no existe una consulta finalizada previa. Las consultas históricas anteriores a esta versión permanecen válidas y muestran `—` cuando no tienen datos clínicos nuevos.

La pantalla del Doctor muestra estos datos también dentro de la última consulta anterior, y Recepción/Admin los ven en el historial del paciente.

## Repeticiones v0.4.1

Repeticiones funciona exclusivamente desde la pestaña `/reception/repetitions`.

- No hay botón de repetición en el dashboard general de Recepción.
- No se muestran repeticiones dentro del perfil general del paciente.
- Cada paciente disponible tiene `Agregar repetición`.
- `Agregar repetición` copia automáticamente hasta 5 medicaciones de la última consulta finalizada del paciente.
- Si el paciente no tiene una consulta previa con medicaciones, el botón queda deshabilitado.
- Una vez agregado, el paciente deja de aparecer en `Pacientes disponibles` y queda en `Lista actual`.
- Un paciente solo puede aparecer una vez en la lista actual.
- `Limpiar lista` cierra la tanda actual sin borrar el historial y vuelve a habilitar a esos pacientes.
- El historial de repeticiones sigue guardado por paciente dentro de la propia pestaña de Repeticiones.
- Desde el historial todavía se puede usar `Repetir esta` para reutilizar una repetición anterior.

### Exportar lista de repeticiones

La tanda actual se exporta horizontalmente igual que las consultas:

```text
Paciente | Medicación 1 | Medicación 2 | Medicación 3 | Medicación 4 | Medicación 5
```

- Word: `/api/export/repetitions`
- PDF: `/api/export/repetitions/pdf`

Solo se exporta la lista actual, es decir, repeticiones todavía no cerradas con `Limpiar lista`.

## Buscador global

Recepción y Admin tienen un buscador en el encabezado. Con dos o más caracteres consulta la base y permite abrir directamente un perfil.

## Notas internas

`Patient.internalNotes` se usa para notas administrativas. Solo Recepción y Admin las pueden ver/editar. No se muestran al Doctor y no se incluyen en exportaciones.

## Base de datos

PostgreSQL / Neon mediante Prisma.

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

`Repetition.clearedAt` permite separar la tanda actual del historial sin eliminar datos.

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

Las variables de usuarios crean el usuario solo si todavía no existe. Los cambios posteriores realizados desde Admin quedan guardados en Neon.

## Actualizar desde v0.4.1

No hay que borrar Neon ni recrear la base.

1. Reemplazá los archivos del repo conservando `.git` y `.env`.
2. Subí los cambios:

```bash
git add .
git commit -m "Consultorio v0.4.2 campos clinicos"
git push
```

3. Vercel ejecutará automáticamente:

```text
prisma generate
prisma migrate deploy
prisma db seed
next build
```

La migración nueva `20261007162000_consultation_clinical_fields` agrega los campos clínicos a `Consultation` con valores compatibles con las consultas ya existentes. No borra ni modifica consultas anteriores.

## Exportaciones de consultas

- DOCX: `/api/export/today`
- PDF: `/api/export/today/pdf`

Incluyen solo consultas `COMPLETED` del día en horario de Argentina.

## Cola

La cola se actualiza por polling. `Siguiente` usa una operación transaccional con `FOR UPDATE SKIP LOCKED` para evitar que dos puestos reclamen al mismo paciente.

`Limpiar queue` elimina los `QueueItem`. Si había consultas `QUEUED` o `IN_PROGRESS`, se marcan `CANCELLED`; no se borran pacientes ni consultas finalizadas.

## Node

El proyecto requiere Node 22 o superior.

## v0.4.3 - pantalla de consulta reorganizada

La pantalla del Doctor queda organizada en dos columnas:

- encabezado a todo lo ancho con paciente y DNI;
- bloque MC/AP a todo lo ancho (editable solo en la primera consulta y de referencia en las siguientes);
- columna izquierda: AF/C/D/A, T/A, Peso, observaciones, copiar medicaciones anteriores, medicaciones y acciones;
- columna derecha: consulta anterior y medicaciones recientes del paciente.

En pantallas angostas las dos columnas se apilan automáticamente. Esta versión no requiere una migración nueva de Neon.
