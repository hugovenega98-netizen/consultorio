import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Falta DIRECT_URL o DATABASE_URL para Prisma.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Para migraciones usamos DIRECT_URL (conexión directa de Neon) cuando existe.
    // La app en runtime usa DATABASE_URL (idealmente la URL pooled de Neon).
    url: databaseUrl,
  },
});
