import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatDni } from "@/lib/format";
import { RepetitionForm } from "@/components/RepetitionForm";

export const dynamic = "force-dynamic";

export default async function NewRepetitionPage({
  params,
  searchParams,
}: {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ copy?: string }>;
}) {
  await requirePageUser(["RECEPTION", "ADMIN"]);
  const { patientId } = await params;
  const { copy } = await searchParams;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      repetitions: {
        orderBy: { createdAt: "desc" },
        include: { medications: { orderBy: { position: "asc" } } },
      },
    },
  });
  if (!patient) notFound();

  const source = copy ? patient.repetitions.find((item) => item.id === copy) : undefined;

  return (
    <div>
      <div className="actions" style={{ marginTop: 0, marginBottom: 16 }}>
        <Link className="btn" href="/reception/repetitions">← Repeticiones</Link>
        <Link className="btn" href={`/patients/${patient.id}`}>Ver perfil</Link>
      </div>
      <h1>{patient.firstName} {patient.lastName}</h1>
      <p className="muted">DNI {formatDni(patient.dni)} · {source ? "Repetir una repetición anterior" : "Nueva repetición"}</p>

      {source && (
        <div className="notice success">Datos copiados de la repetición del {formatDateTime(source.createdAt)}. Podés modificarlos antes de guardar.</div>
      )}

      <RepetitionForm
        patientId={patient.id}
        initialObservations={source?.observations ?? ""}
        initialMedications={source?.medications.map((medication) => medication.name) ?? []}
      />

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Historial de repeticiones</h2>
        <div className="history">
          {patient.repetitions.length === 0 && <p className="muted">Todavía no tiene repeticiones.</p>}
          {patient.repetitions.map((repetition) => (
            <article className="history-entry" key={repetition.id}>
              <div className="history-entry-heading">
                <h3>{formatDateTime(repetition.createdAt)}</h3>
                <Link className="btn" href={`/reception/repetitions/${patient.id}?copy=${repetition.id}`}>Repetir</Link>
              </div>
              <p><strong>Observaciones:</strong> {repetition.observations || "Sin observaciones."}</p>
              <ul className="med-list">{repetition.medications.map((medication) => <li key={medication.id}>{medication.name}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
