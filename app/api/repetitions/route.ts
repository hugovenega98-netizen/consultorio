import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await getApiUser(["RECEPTION"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const patientId = String(body.patientId ?? "").trim();
  const observations = String(body.observations ?? "").trim();
  const medications = Array.isArray(body.medications)
    ? body.medications.map((value: unknown) => String(value ?? "").trim()).filter(Boolean).slice(0, 5)
    : [];

  if (!patientId) return NextResponse.json({ error: "Falta seleccionar el paciente." }, { status: 400 });
  if (medications.length < 1) return NextResponse.json({ error: "Agregá al menos una medicación." }, { status: 400 });

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return NextResponse.json({ error: "Paciente inexistente." }, { status: 404 });

  const repetition = await prisma.repetition.create({
    data: {
      patientId,
      observations,
      medications: {
        create: medications.map((name: string, position: number) => ({ name, position: position + 1 })),
      },
    },
  });

  return NextResponse.json({ repetitionId: repetition.id }, { status: 201 });
}
