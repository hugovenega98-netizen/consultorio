import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConsultationForm } from "@/components/ConsultationForm";
import { formatDateTime, formatDni } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser(["DOCTOR"]);
  const { id } = await params;

  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: { patient: true, medications: { orderBy: { position: "asc" } } },
  });

  if (!consultation) notFound();

  const recentConsultations = await prisma.consultation.findMany({
    where: {
      patientId: consultation.patientId,
      id: { not: consultation.id },
      status: "COMPLETED",
      createdAt: { lt: consultation.createdAt },
    },
    orderBy: { completedAt: "desc" },
    take: 3,
    include: { medications: { orderBy: { position: "asc" } } },
  });

  const previousConsultation = recentConsultations[0] ?? null;
  const isFirstConsultation = previousConsultation === null;

  const firstCompletedConsultation = isFirstConsultation
    ? null
    : await prisma.consultation.findFirst({
        where: {
          patientId: consultation.patientId,
          status: "COMPLETED",
        },
        orderBy: [{ completedAt: "asc" }, { createdAt: "asc" }],
        select: {
          motivoConsulta: true,
          antecedentesPersonales: true,
        },
      });

  const recentMedicationNames = Array.from(
    new Set(recentConsultations.flatMap((item) => item.medications.map((medication) => medication.name))),
  );

  const completed = consultation.status === "COMPLETED";

  return (
    <div className="consultation-page">
      <div className="actions consultation-back" style={{ marginTop: 0 }}>
        <Link className="btn" href="/doctor">← Puesto de consulta</Link>
      </div>

      <ConsultationForm
        consultationId={consultation.id}
        patientName={`${consultation.patient.firstName} ${consultation.patient.lastName}`}
        patientDni={formatDni(consultation.patient.dni)}
        consultationDate={formatDateTime(consultation.createdAt)}
        isFirstConsultation={isFirstConsultation}
        referenceMotivoConsulta={firstCompletedConsultation?.motivoConsulta ?? consultation.motivoConsulta}
        referenceAntecedentesPersonales={firstCompletedConsultation?.antecedentesPersonales ?? consultation.antecedentesPersonales}
        initialMotivoConsulta={consultation.motivoConsulta}
        initialAntecedentesPersonales={consultation.antecedentesPersonales}
        initialActividadFisica={consultation.actividadFisica}
        initialCatarsis={consultation.catarsis}
        initialDiuresis={consultation.diuresis}
        initialAnsiedad={consultation.ansiedad}
        initialTensionArterial={consultation.tensionArterial}
        initialPeso={consultation.peso}
        initialObservations={consultation.observations}
        initialMedications={consultation.medications.map((m) => m.name)}
        previousMedications={previousConsultation?.medications.map((m) => m.name) ?? []}
        previousConsultation={previousConsultation ? {
          date: formatDateTime(previousConsultation.completedAt ?? previousConsultation.createdAt),
          actividadFisica: previousConsultation.actividadFisica,
          catarsis: previousConsultation.catarsis,
          diuresis: previousConsultation.diuresis,
          ansiedad: previousConsultation.ansiedad,
          tensionArterial: previousConsultation.tensionArterial,
          peso: previousConsultation.peso,
          observations: previousConsultation.observations,
          medications: previousConsultation.medications.map((m) => m.name),
        } : null}
        recentMedicationNames={recentMedicationNames}
        isCompleted={completed}
      />
    </div>
  );
}
