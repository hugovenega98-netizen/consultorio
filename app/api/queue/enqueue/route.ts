import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeDni } from "@/lib/format";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const dni = normalizeDni(String(body.dni ?? ""));
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();

  if (dni.length < 7 || dni.length > 9) {
    return NextResponse.json({ error: "Ingresá un DNI válido." }, { status: 400 });
  }

  let patient = await prisma.patient.findUnique({ where: { dni } });
  if (!patient) {
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "El DNI no existe. Completá nombre y apellido para crear el paciente." }, { status: 400 });
    }
    patient = await prisma.patient.create({ data: { dni, firstName, lastName } });
  }

  const active = await prisma.consultation.findFirst({
    where: { patientId: patient.id, status: { in: ["QUEUED", "IN_PROGRESS"] } },
    include: { queueItem: true },
  });
  if (active) {
    return NextResponse.json({ error: "Este paciente ya tiene una consulta activa en la cola." }, { status: 409 });
  }

  const consultation = await prisma.consultation.create({
    data: {
      patientId: patient.id,
      queueItem: { create: {} },
    },
  });

  return NextResponse.json({ patient, consultationId: consultation.id }, { status: 201 });
}
