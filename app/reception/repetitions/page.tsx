import Link from "next/link";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatDni } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RepetitionsPage() {
  await requirePageUser(["RECEPTION"]);
  const [patients, repetitions] = await Promise.all([
    prisma.patient.findMany({ orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    prisma.repetition.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { patient: true, medications: { orderBy: { position: "asc" } } },
    }),
  ]);

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>Repeticiones</h1>
          <p className="muted">Se guardan aparte y no aparecen como consultas realizadas.</p>
        </div>
        <Link className="btn" href="/reception">← Pacientes</Link>
      </div>

      <section className="card">
        <h2>Nueva repetición</h2>
        <p className="muted">Elegí el paciente para abrir el formulario de observaciones y medicaciones.</p>
        <div className="patient-list compact-patients">
          {patients.map((patient) => (
            <div className="patient-row" key={patient.id}>
              <div>
                <div className="patient-name">{patient.lastName}, {patient.firstName}</div>
                <div className="muted">DNI {formatDni(patient.dni)}</div>
              </div>
              <Link className="btn btn-primary" href={`/reception/repetitions/${patient.id}`}>Cargar repetición</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Últimas repeticiones</h2>
        <div className="history">
          {repetitions.length === 0 && <p className="muted">Todavía no hay repeticiones registradas.</p>}
          {repetitions.map((repetition) => (
            <article className="history-entry" key={repetition.id}>
              <h3>{repetition.patient.firstName} {repetition.patient.lastName}</h3>
              <div className="muted">{formatDateTime(repetition.createdAt)} · DNI {formatDni(repetition.patient.dni)}</div>
              <p><strong>Observaciones:</strong> {repetition.observations || "Sin observaciones."}</p>
              <ul className="med-list">
                {repetition.medications.map((med) => <li key={med.id}>{med.name}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
