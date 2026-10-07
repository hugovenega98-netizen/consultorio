import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

async function ensureUser(input: {
  username: string;
  password: string;
  displayName: string;
  role: "RECEPTION" | "DOCTOR";
}) {
  const existing = await prisma.user.findUnique({ where: { username: input.username } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { displayName: input.displayName, role: input.role, active: true, passwordHash: hashPassword(input.password) },
    });
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

  console.log("Seed listo: usuarios de Recepción y Doctor disponibles.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
