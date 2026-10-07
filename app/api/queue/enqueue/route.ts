import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { normalizeDni } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await getApiUser(["RECEPTION"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const patientId = String(body.patientId ?? "").trim();
  const dni = normalizeDni(String(body.dni ?? ""));

  const patient = patientId
    ? await prisma.patient.findUnique({ where: { id: patientId } })
    : dni
      ? await prisma.patient.findUnique({ where: { dni } })
      : null;

  if (!patient) return NextResponse.json({ error: "Paciente inexistente. Primero cargalo en Recepción." }, { status: 404 });

  const active = await prisma.consultation.findFirst({
    where: { patientId: patient.id, status: { in: ["QUEUED", "IN_PROGRESS"] } },
  });
  if (active) return NextResponse.json({ error: "Este paciente ya está en la cola o en atención." }, { status: 409 });

  const consultation = await prisma.consultation.create({
    data: { patientId: patient.id, queueItem: { create: {} } },
  });

  return NextResponse.json({ patient, consultationId: consultation.id }, { status: 201 });
}
