import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatDni } from "@/lib/format";
import { PatientInternalNotes } from "@/components/PatientInternalNotes";

export const dynamic = "force-dynamic";

export default async function PatientProfile({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser(["RECEPTION", "ADMIN"]);
  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      consultations: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        include: { medications: { orderBy: { position: "asc" } } },
      },
    },
  });

  if (!patient) notFound();

  return (
    <div>
      <div className="actions" style={{ marginTop: 0, marginBottom: 16 }}>
        <Link className="btn" href="/reception">← Pacientes</Link>
      </div>
      <h1>{patient.firstName} {patient.lastName}</h1>
      <p className="muted">DNI {formatDni(patient.dni)} · {patient.consultations.length} consultas registradas</p>

      <section className="card patient-data">
        <h2>Datos</h2>
        <div className="info-grid">
          <div><span className="muted">Teléfono</span><strong>{patient.phone || "—"}</strong></div>
          <div><span className="muted">Dirección</span><strong>{patient.address || "—"}</strong></div>
        </div>
      </section>

      <PatientInternalNotes patientId={patient.id} initialNotes={patient.internalNotes} />

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Historial de consultas</h2>
        <div className="history">
          {patient.consultations.length === 0 && <p className="muted">Todavía no tiene consultas finalizadas.</p>}
          {patient.consultations.map((consultation) => (
            <article className="history-entry" key={consultation.id}>
              <h3>{formatDateTime(consultation.completedAt ?? consultation.createdAt)}</h3>
              {(consultation.motivoConsulta || consultation.antecedentesPersonales) && (
                <div className="history-clinical-text">
                  {consultation.motivoConsulta && <p><strong>MC:</strong> {consultation.motivoConsulta}</p>}
                  {consultation.antecedentesPersonales && <p><strong>AP:</strong> {consultation.antecedentesPersonales}</p>}
                </div>
              )}
              <div className="clinical-summary-grid">
                <div><span className="muted">AF</span><strong>{consultation.actividadFisica === null ? "—" : consultation.actividadFisica > 0 ? `+${consultation.actividadFisica}` : consultation.actividadFisica}</strong></div>
                <div><span className="muted">C</span><strong>{consultation.catarsis === null ? "—" : consultation.catarsis > 0 ? `+${consultation.catarsis}` : consultation.catarsis}</strong></div>
                <div><span className="muted">D</span><strong>{consultation.diuresis === null ? "—" : consultation.diuresis > 0 ? `+${consultation.diuresis}` : consultation.diuresis}</strong></div>
                <div><span className="muted">A</span><strong>{consultation.ansiedad === null ? "—" : consultation.ansiedad > 0 ? `+${consultation.ansiedad}` : consultation.ansiedad}</strong></div>
                <div><span className="muted">T/A</span><strong>{consultation.tensionArterial || "—"}</strong></div>
                <div><span className="muted">Peso</span><strong>{consultation.peso === null ? "—" : `${consultation.peso} kg`}</strong></div>
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
