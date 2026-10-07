import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function parseScale(value: unknown): number | null | "invalid" {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < -5 || parsed > 5) return "invalid";
  return parsed;
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getApiUser(["DOCTOR"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const body = await request.json();
  const motivoConsulta = String(body.motivoConsulta ?? "").trim();
  const antecedentesPersonales = String(body.antecedentesPersonales ?? "").trim();
  const tensionArterial = String(body.tensionArterial ?? "").trim();
  const observations = String(body.observations ?? "").trim();
  const finalize = Boolean(body.finalize);
  const medications = Array.isArray(body.medications)
    ? body.medications.map((value: unknown) => String(value ?? "").trim()).filter(Boolean).slice(0, 5)
    : [];

  const actividadFisica = parseScale(body.actividadFisica);
  const catarsis = parseScale(body.catarsis);
  const diuresis = parseScale(body.diuresis);
  const ansiedad = parseScale(body.ansiedad);
  const scales = [actividadFisica, catarsis, diuresis, ansiedad];
  if (scales.includes("invalid")) {
    return NextResponse.json({ error: "AF, C, D y A deben estar entre -5 y +5." }, { status: 400 });
  }

  const pesoText = String(body.peso ?? "").trim();
  const peso = pesoText === "" ? null : Number(pesoText);
  if (peso !== null && (!Number.isFinite(peso) || peso <= 0)) {
    return NextResponse.json({ error: "Ingresá un peso válido." }, { status: 400 });
  }

  const existing = await prisma.consultation.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Consulta inexistente." }, { status: 404 });
  if (existing.status === "COMPLETED") return NextResponse.json({ error: "La consulta ya fue finalizada." }, { status: 409 });

  const previousCompletedCount = await prisma.consultation.count({
    where: {
      patientId: existing.patientId,
      id: { not: id },
      status: "COMPLETED",
      createdAt: { lt: existing.createdAt },
    },
  });
  const isFirstConsultation = previousCompletedCount === 0;

  if (finalize) {
    if (isFirstConsultation && (!motivoConsulta || !antecedentesPersonales)) {
      return NextResponse.json({ error: "En la primera consulta completá MC y AP." }, { status: 400 });
    }
    if (scales.some((value) => value === null)) {
      return NextResponse.json({ error: "Completá AF, C, D y A antes de finalizar." }, { status: 400 });
    }
    if (!tensionArterial) {
      return NextResponse.json({ error: "Completá la tensión arterial antes de finalizar." }, { status: 400 });
    }
    if (peso === null) {
      return NextResponse.json({ error: "Completá el peso antes de finalizar." }, { status: 400 });
    }
    if (medications.length < 1) {
      return NextResponse.json({ error: "Agregá al menos una medicación antes de finalizar." }, { status: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.medication.deleteMany({ where: { consultationId: id } });
    if (medications.length) {
      await tx.medication.createMany({
        data: medications.map((name: string, position: number) => ({ consultationId: id, name, position: position + 1 })),
      });
    }

    await tx.consultation.update({
      where: { id },
      data: {
        motivoConsulta: isFirstConsultation ? motivoConsulta : existing.motivoConsulta,
        antecedentesPersonales: isFirstConsultation ? antecedentesPersonales : existing.antecedentesPersonales,
        actividadFisica: actividadFisica === "invalid" ? null : actividadFisica,
        catarsis: catarsis === "invalid" ? null : catarsis,
        diuresis: diuresis === "invalid" ? null : diuresis,
        ansiedad: ansiedad === "invalid" ? null : ansiedad,
        tensionArterial,
        peso,
        observations,
        ...(finalize ? { status: "COMPLETED", completedAt: new Date() } : {}),
      },
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
