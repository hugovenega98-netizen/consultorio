import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDni } from "@/lib/format";
import { RepetitionForm } from "@/components/RepetitionForm";

export const dynamic = "force-dynamic";

export default async function NewRepetitionPage({ params }: { params: Promise<{ patientId: string }> }) {
  await requirePageUser(["RECEPTION"]);
  const { patientId } = await params;
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) notFound();

  return (
    <div>
      <div className="actions" style={{ marginTop: 0, marginBottom: 16 }}>
        <Link className="btn" href="/reception/repetitions">← Repeticiones</Link>
      </div>
      <h1>{patient.firstName} {patient.lastName}</h1>
      <p className="muted">DNI {formatDni(patient.dni)} · Nueva repetición</p>
      <RepetitionForm patientId={patient.id} />
    </div>
  );
}
