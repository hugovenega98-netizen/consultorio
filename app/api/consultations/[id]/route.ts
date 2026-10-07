import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getApiUser(["DOCTOR"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const body = await request.json();
  const observations = String(body.observations ?? "").trim();
  const finalize = Boolean(body.finalize);
  const medications = Array.isArray(body.medications)
    ? body.medications.map((value: unknown) => String(value ?? "").trim()).filter(Boolean).slice(0, 5)
    : [];

  const existing = await prisma.consultation.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Consulta inexistente." }, { status: 404 });
  if (existing.status === "COMPLETED") return NextResponse.json({ error: "La consulta ya fue finalizada." }, { status: 409 });
  if (finalize && medications.length < 1) return NextResponse.json({ error: "Agregá al menos una medicación antes de finalizar." }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.medication.deleteMany({ where: { consultationId: id } });
    if (medications.length) {
      await tx.medication.createMany({
        data: medications.map((name: string, position: number) => ({ consultationId: id, name, position: position + 1 })),
      });
    }

    await tx.consultation.update({
      where: { id },
      data: { observations, ...(finalize ? { status: "COMPLETED", completedAt: new Date() } : {}) },
    });

    if (finalize) {
      await tx.queueItem.updateMany({
        where: { consultationId: id },
        data: { status: "DONE", completedAt: new Date() },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
