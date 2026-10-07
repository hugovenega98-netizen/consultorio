import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RepetitionsDashboard } from "@/components/RepetitionsDashboard";

export const dynamic = "force-dynamic";

export default async function RepetitionsPage() {
  await requirePageUser(["RECEPTION", "ADMIN"]);

  const [patients, activeRepetitions] = await Promise.all([
    prisma.patient.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        consultations: {
          where: { status: "COMPLETED" },
          orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
          take: 1,
          include: { medications: { orderBy: { position: "asc" } } },
        },
      },
    }),
    prisma.repetition.findMany({
      where: { clearedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        patient: true,
        medications: { orderBy: { position: "asc" } },
      },
    }),
  ]);

  const activePatientIds = new Set(activeRepetitions.map((item) => item.patientId));

  return (
    <RepetitionsDashboard
      initialPatients={patients
        .filter((patient) => !activePatientIds.has(patient.id))
        .map((patient) => ({
          id: patient.id,
          dni: patient.dni,
          firstName: patient.firstName,
          lastName: patient.lastName,
          phone: patient.phone,
          lastMedications: patient.consultations[0]?.medications.map((medication) => medication.name) ?? [],
        }))}
      initialActive={activeRepetitions.map((repetition) => ({
        id: repetition.id,
        patient: {
          id: repetition.patient.id,
          dni: repetition.patient.dni,
          firstName: repetition.patient.firstName,
          lastName: repetition.patient.lastName,
        },
        medications: repetition.medications.map((medication) => medication.name),
      }))}
    />
  );
}
