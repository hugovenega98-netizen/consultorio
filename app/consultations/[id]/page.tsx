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
  const recentMedicationNames = Array.from(new Set(
    recentConsultations.flatMap((item) => item.medications.map((medication) => medication.name)),
  ));
  const completed = consultation.status === "COMPLETED";

  return (
    <div>
      <div className="actions" style={{ marginTop: 0, marginBottom: 16 }}>
        <Link className="btn" href="/doctor">← Puesto de consulta</Link>
      </div>
      <h1>{consultation.patient.firstName} {consultation.patient.lastName}</h1>
      <p className="muted">DNI {formatDni(consultation.patient.dni)} · Consulta {formatDateTime(consultation.createdAt)}</p>

      <section className="card previous-consultation">
        <div className="previous-heading">
          <h2>Última consulta</h2>
          {previousConsultation && <span className="muted">{formatDateTime(previousConsultation.completedAt ?? previousConsultation.createdAt)}</span>}
        </div>
        {previousConsultation ? (
          <>
            <p><strong>Observaciones:</strong> {previousConsultation.observations || "Sin observaciones."}</p>
            <div>
              <strong>Medicaciones:</strong>
              <ul className="med-list">
                {previousConsultation.medications.length === 0 && <li>Sin medicaciones cargadas</li>}
                {previousConsultation.medications.map((med) => <li key={med.id}>{med.name}</li>)}
              </ul>
            </div>
          </>
        ) : (
          <p className="muted">Este paciente no tiene una consulta anterior finalizada.</p>
        )}
      </section>

      <section className="card recent-medications-card">
        <h2>Medicaciones recientes</h2>
        <p className="muted">Resumen único de las últimas 3 consultas finalizadas.</p>
        <ul className="med-list">
          {recentMedicationNames.length === 0 && <li>Sin medicaciones previas</li>}
          {recentMedicationNames.map((name) => <li key={name}>{name}</li>)}
        </ul>
      </section>

      {completed && <div className="notice success">Esta consulta está finalizada y queda en modo lectura.</div>}
      <ConsultationForm
        consultationId={consultation.id}
        initialObservations={consultation.observations}
        initialMedications={consultation.medications.map((m) => m.name)}
        previousMedications={previousConsultation?.medications.map((m) => m.name) ?? []}
        isCompleted={completed}
      />
    </div>
  );
}
