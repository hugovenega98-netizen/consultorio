import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatDni } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PatientProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      consultations: {
        orderBy: { createdAt: "desc" },
        include: { medications: { orderBy: { position: "asc" } } },
      },
    },
  });

  if (!patient) notFound();

  return (
    <div>
      <div className="actions" style={{ marginTop: 0, marginBottom: 16 }}><Link className="btn" href="/patients">← Pacientes</Link></div>
      <h1>{patient.firstName} {patient.lastName}</h1>
      <p className="muted">DNI {formatDni(patient.dni)} · {patient.consultations.length} consultas registradas</p>

      <section className="card">
        <h2>Historial</h2>
        <div className="history">
          {patient.consultations.length === 0 && <p className="muted">Todavía no tiene consultas.</p>}
          {patient.consultations.map((consultation) => (
            <article className="history-entry" key={consultation.id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <h3>{formatDateTime(consultation.completedAt ?? consultation.createdAt)}</h3>
                <Link className="btn" href={`/consultations/${consultation.id}`}>Abrir</Link>
              </div>
              <p><strong>Observaciones:</strong> {consultation.observations || "Sin observaciones."}</p>
              <ul className="med-list">
                {consultation.medications.length === 0 && <li>Sin medicaciones cargadas</li>}
                {consultation.medications.map((med) => <li key={med.id}>{med.name}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
