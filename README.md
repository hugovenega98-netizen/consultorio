# Consultorio MVP — Vercel + Neon

MVP web para trabajar desde dos computadoras sobre la misma base de datos.

## Qué incluye

- Pacientes identificados por DNI, nombre y apellido.
- Una o muchas consultas por paciente.
- Observaciones por consulta.
- Entre 1 y 5 medicaciones por consulta.
- Historial completo desde el perfil del paciente.
- Cola compartida entre computadoras.
- Botón **SIGUIENTE** que toma el primer paciente en espera de forma atómica.
- Actualización automática de la cola cada 2,5 segundos.
- Exportación diaria a `.docx` con paciente + hasta 5 medicaciones en columnas horizontales.
- PostgreSQL mediante Prisma.
- Preparado para desplegar en Vercel y usar Neon PostgreSQL.
- `/api/health` para comprobar rápidamente si Vercel llega a la base.

---

## Opción recomendada: Vercel + Neon

### 1. Crear la base en Neon

1. Crear un proyecto PostgreSQL en Neon.
2. Crear/usar una base (por ejemplo `neondb`).
3. Copiar dos cadenas de conexión:
   - **Pooled connection** → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL`

La URL pooled normalmente tiene `-pooler` en el host. La directa no.

Ejemplo conceptual:

```env
DATABASE_URL="postgresql://usuario:clave@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://usuario:clave@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"
```

No subas el archivo `.env` a Git.

### 2. Subir el proyecto a GitHub

Desde esta carpeta:

```bash
git init
git add .
git commit -m "MVP consultorio Vercel Neon"
git branch -M main
git remote add origin TU_REPO
git push -u origin main
```

> Si ya existe un repositorio, omití `git init` y configurá el remote correspondiente.

### 3. Importar en Vercel

1. Vercel → **Add New → Project**.
2. Importar el repositorio de GitHub.
3. Framework: Next.js (Vercel lo detecta automáticamente).
4. Agregar variables de entorno:

```text
DATABASE_URL = URL POOLED de Neon
DIRECT_URL   = URL DIRECTA de Neon
```

Agregalas al menos en **Production**. Para previews, agregalas también en Preview si querés que funcionen.

5. Deploy.

El `vercel.json` ya ejecuta:

```text
npm run vercel-build
```

que hace:

```text
prisma generate
prisma migrate deploy
next build
```

La región de funciones se configura como `gru1` (São Paulo), conveniente para Argentina.

### 4. Probar el deployment

Abrí:

```text
https://TU-PROYECTO.vercel.app/api/health
```

Debe responder algo similar a:

```json
{"ok":true,"database":"connected"}
```

Después abrí la raíz:

```text
https://TU-PROYECTO.vercel.app
```

Las dos computadoras pueden entrar a esa misma URL.

---

## Flujo de uso

### Computadora 1 — ingreso

1. Abrir la pantalla **Cola**.
2. Ingresar DNI.
3. Si el paciente ya existe, no es necesario volver a escribir nombre/apellido.
4. Si es nuevo, completar nombre y apellido.
5. Pulsar **Agregar a la cola**.

### Computadora 2 — consulta

1. Mantener abierta la pantalla **Cola**.
2. El paciente aparece automáticamente.
3. Pulsar **SIGUIENTE**.
4. Se abre directamente su consulta.
5. Completar observaciones y de 1 a 5 medicaciones.
6. Pulsar **Finalizar consulta**.

### Exportar el cierre del día

En la barra superior usar **Exportar hoy**.

Se descarga:

```text
consultas-AAAA-MM-DD.docx
```

con columnas:

```text
Paciente | Medicación 1 | Medicación 2 | Medicación 3 | Medicación 4 | Medicación 5
```

---

## Desarrollo local con Docker

Requisitos:

- Node.js 22+
- Docker Desktop

### macOS / Linux

```bash
cp .env.example .env
docker compose up -d
npm install
npm run setup
npm run dev
```

Abrir:

```text
http://localhost:3000
```

### Windows PowerShell

```powershell
Copy-Item .env.example .env
docker compose up -d
npm install
npm run setup
npm run dev
```

---

## Comandos útiles

```bash
npm run dev             # desarrollo
npm run build           # validar build
npm run db:migrate      # crear/aplicar migración local
npm run db:deploy       # aplicar migraciones existentes (producción)
npm run db:seed         # paciente demo
npm run db:studio       # visor de base Prisma Studio
```

## Datos demo

El seed crea un paciente de demostración:

```text
DNI: 30.111.222
Nombre: Paciente Demostración
```

No es obligatorio ejecutar el seed en producción.

## Estructura principal

```text
app/
  api/
    consultations/[id]/
    export/today/
    health/
    queue/
      enqueue/
      next/
  consultations/[id]/
  patients/[id]/
  patients/
components/
lib/
prisma/
  migrations/
  schema.prisma
  seed.ts
vercel.json
```

## Notas sobre la cola

El endpoint `POST /api/queue/next` usa una transacción PostgreSQL con `FOR UPDATE SKIP LOCKED`. Si dos solicitudes intentaran tomar al mismo tiempo al siguiente paciente, PostgreSQL evita que ambas reclamen el mismo registro.

## Próximas mejoras previstas

- Login y roles (recepción / profesional / administrador).
- Autocompletado de medicaciones.
- Editar datos básicos del paciente.
- Reabrir/corregir una consulta con auditoría.
- Exportar un rango de fechas.
- Backups y auditoría detallada.
