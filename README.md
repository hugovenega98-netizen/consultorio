# Consultorio MVP v0.3

Aplicación web para trabajar desde dos computadoras sobre la misma base Neon.

## Roles

### Recepción (`RECEPTION`)
- Ve todos los pacientes cargados.
- Busca por DNI, nombre o apellido.
- Carga pacientes con DNI, nombre, apellido, teléfono y dirección.
- Abre el perfil e historial de consultas finalizadas.
- Envía pacientes a la cola del doctor.
- Tiene la pestaña **Repeticiones**.
- Exporta las consultas finalizadas del día a `.docx`.

### Doctor (`DOCTOR`)
- Ve solamente el puesto de consulta.
- Botón **Siguiente** para tomar el primer paciente en espera.
- Abre la consulta actual.
- Durante la consulta ve la **última consulta finalizada anterior** de ese paciente, con observaciones y medicaciones.
- No ve contador de consultas realizadas ni administración de pacientes.

## Repeticiones

Las repeticiones usan un formulario con observaciones y hasta cinco medicaciones, pero se guardan en tablas independientes (`Repetition` y `RepetitionMedication`).

Por diseño:
- no aparecen en el historial de consultas del paciente;
- no cuentan como consulta realizada;
- no entran en el `.docx` diario de consultas;
- sí quedan relacionadas al paciente y visibles desde la pestaña **Repeticiones** de Recepción.

## Stack

- Next.js 16
- React 19
- Prisma 7
- PostgreSQL / Neon
- Vercel
- Node.js 22+

## Variables de entorno

```env
DATABASE_URL="URL_POOLED_DE_NEON"
DIRECT_URL="URL_DIRECTA_DE_NEON"

RECEPTION_USERNAME="recep"
RECEPTION_PASSWORD="cambia-esta-clave"
DOCTOR_USERNAME="doc"
DOCTOR_PASSWORD="cambia-esta-clave"
```

`DATABASE_URL` debe ser la URL pooled de Neon (normalmente contiene `-pooler`).
`DIRECT_URL` es la conexión directa de Neon.

Si no configurás las variables de usuarios, el seed usa temporalmente:
- Recepción: `recep` / `recep1234`
- Doctor: `doc` / `doc1234`

## Deploy sobre un proyecto Vercel ya existente

1. Agregá en **Vercel → Project → Settings → Environment Variables**:
   - `RECEPTION_USERNAME`
   - `RECEPTION_PASSWORD`
   - `DOCTOR_USERNAME`
   - `DOCTOR_PASSWORD`
2. Conservá `DATABASE_URL` y `DIRECT_URL` que ya funcionan.
3. Reemplazá el contenido del repo por esta versión.
4. Ejecutá:

```bash
git add .
git commit -m "Roles doctor recepcion y repeticiones"
git push
```

5. Vercel hará automáticamente:

```bash
prisma generate
prisma migrate deploy
prisma db seed
next build
```

Las nuevas migraciones agregan:
- campos teléfono/dirección;
- usuarios, roles y sesiones;
- repeticiones y sus medicaciones.

## Probar dos computadoras

En PC 1:
1. Abrí la URL pública de Vercel.
2. Iniciá sesión como Recepción.
3. Creá o elegí un paciente.
4. Tocá **Enviar a cola**.

En PC 2:
1. Abrí exactamente la misma URL pública de Vercel.
2. Iniciá sesión como Doctor.
3. El paciente aparecerá como próximo en unos segundos.
4. Tocá **Siguiente**.
5. Se abre su consulta y arriba aparece su última consulta previa, si existe.
6. Cargá observaciones/medicaciones y finalizá.

Al finalizar, el doctor vuelve a su pantalla y puede tocar **Siguiente** otra vez.

## Desarrollo local

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Abrir `http://localhost:3000`.

## Salud de la base

`/api/health` debe responder con `database: connected` cuando la conexión a Neon está correcta.
