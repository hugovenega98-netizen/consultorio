import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getApiUser(["RECEPTION", "ADMIN"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const body = await request.json();
  const internalNotes = String(body.internalNotes ?? "").trim();

  const patient = await prisma.patient.findUnique({ where: { id }, select: { id: true } });
  if (!patient) return NextResponse.json({ error: "Paciente inexistente." }, { status: 404 });

  await prisma.patient.update({ where: { id }, data: { internalNotes } });
  return NextResponse.json({ ok: true, internalNotes });
}
