import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await getApiUser(["RECEPTION", "ADMIN"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const patientId = String(body.patientId ?? "").trim();
  const copyLastConsultation = body.copyLastConsultation === true;
  let observations = String(body.observations ?? "").trim();
  let medications = Array.isArray(body.medications)
    ? body.medications.map((value: unknown) => String(value ?? "").trim()).filter(Boolean).slice(0, 5)
    : [];

  if (!patientId) return NextResponse.json({ error: "Falta seleccionar el paciente." }, { status: 400 });

  const active = await prisma.repetition.findFirst({ where: { patientId, clearedAt: null }, select: { id: true } });
  if (active) {
    return NextResponse.json({ error: "Este paciente ya está en la lista actual de repeticiones." }, { status: 409 });
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      consultations: {
        where: { status: "COMPLETED" },
        orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
        take: 1,
        include: { medications: { orderBy: { position: "asc" } } },
      },
    },
  });
  if (!patient) return NextResponse.json({ error: "Paciente inexistente." }, { status: 404 });

  if (copyLastConsultation) {
    const latest = patient.consultations[0];
    if (!latest) {
      return NextResponse.json({ error: "El paciente no tiene una consulta finalizada para copiar." }, { status: 400 });
    }
    medications = latest.medications.map((medication) => medication.name).filter(Boolean).slice(0, 5);
    observations = "";
  }

  if (medications.length < 1) return NextResponse.json({ error: "No hay medicaciones para agregar a la repetición." }, { status: 400 });

  try {
    const repetition = await prisma.repetition.create({
      data: {
        patientId,
        activeKey: patientId,
        observations,
        medications: {
          create: medications.map((name: string, position: number) => ({ name, position: position + 1 })),
        },
      },
      include: {
        patient: true,
        medications: { orderBy: { position: "asc" } },
      },
    });

    return NextResponse.json({
      repetition: {
        id: repetition.id,
        patient: {
          id: repetition.patient.id,
          dni: repetition.patient.dni,
          firstName: repetition.patient.firstName,
          lastName: repetition.patient.lastName,
        },
        medications: repetition.medications.map((medication) => medication.name),
      },
    }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Este paciente ya está en la lista actual de repeticiones." }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE() {
  const auth = await getApiUser(["RECEPTION", "ADMIN"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const result = await prisma.repetition.updateMany({
    where: { clearedAt: null },
    data: { clearedAt: new Date(), activeKey: null },
  });

  return NextResponse.json({ cleared: result.count });
}
