import { prisma } from "../lib/prisma";

async function main() {
  const patient = await prisma.patient.upsert({
    where: { dni: "30111222" },
    update: {},
    create: {
      dni: "30111222",
      firstName: "Paciente",
      lastName: "Demostración",
    },
  });

  const existing = await prisma.consultation.findFirst({
    where: {
      patientId: patient.id,
      status: { in: ["QUEUED", "IN_PROGRESS"] },
    },
  });

  if (!existing) {
    await prisma.consultation.create({
      data: {
        patientId: patient.id,
        queueItem: { create: {} },
      },
    });
  }

  console.log("Seed listo. DNI demo: 30.111.222");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
