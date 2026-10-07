import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

type SeedRole = "RECEPTION" | "DOCTOR" | "ADMIN";

async function ensureUser(input: {
  username: string;
  password: string;
  displayName: string;
  role: SeedRole;
}) {
  const existing = await prisma.user.findUnique({ where: { username: input.username } });
  if (existing) {
    // Once created, the web Admin panel is authoritative. Deploys must not
    // overwrite password, role, display name or active state.
    return;
  }

  await prisma.user.create({
    data: {
      username: input.username,
      displayName: input.displayName,
      passwordHash: hashPassword(input.password),
      role: input.role,
    },
  });
}

async function main() {
  await ensureUser({
    username: (process.env.RECEPTION_USERNAME || "recep").trim().toLowerCase(),
    password: process.env.RECEPTION_PASSWORD || "recep1234",
    displayName: "Recepción",
    role: "RECEPTION",
  });

  await ensureUser({
    username: (process.env.DOCTOR_USERNAME || "doc").trim().toLowerCase(),
    password: process.env.DOCTOR_PASSWORD || "doc1234",
    displayName: "Doctor",
    role: "DOCTOR",
  });

  await ensureUser({
    username: (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "admin1234",
    displayName: "Administrador",
    role: "ADMIN",
  });

  console.log("Seed listo: usuarios base disponibles sin pisar contraseñas existentes.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
