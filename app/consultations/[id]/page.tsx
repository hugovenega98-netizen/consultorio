import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConsultationForm } from "@/components/ConsultationForm";
import { formatDateTime, formatDni } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: { patient: true, medications: { orderBy: { position: "asc" } } },
  });

  if (!consultation) notFound();
  const completed = consultation.status === "COMPLETED";

  return (
    <div>
      <div className="actions" style={{ marginTop: 0, marginBottom: 16 }}>
        <Link className="btn" href="/">← Cola</Link>
        <Link className="btn" href={`/patients/${consultation.patient.id}`}>Ver perfil</Link>
      </div>
      <h1>{consultation.patient.firstName} {consultation.patient.lastName}</h1>
      <p className="muted">DNI {formatDni(consultation.patient.dni)} · Consulta {formatDateTime(consultation.createdAt)}</p>
      {completed && <div className="notice success">Esta consulta está finalizada y queda en modo lectura.</div>}
      <ConsultationForm
        consultationId={consultation.id}
        initialObservations={consultation.observations}
        initialMedications={consultation.medications.map((m) => m.name)}
        isCompleted={completed}
      />
    </div>
  );
}
