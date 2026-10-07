import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { normalizeDni } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await getApiUser(["RECEPTION"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const dni = normalizeDni(q);
  const patients = await prisma.patient.findMany({
    where: q
      ? {
          OR: [
            ...(dni ? [{ dni: { contains: dni } }] : []),
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return NextResponse.json({ patients });
}

export async function POST(request: NextRequest) {
  const auth = await getApiUser(["RECEPTION"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const dni = normalizeDni(String(body.dni ?? ""));
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const address = String(body.address ?? "").trim();

  if (dni.length < 7 || dni.length > 9) return NextResponse.json({ error: "Ingresá un DNI válido." }, { status: 400 });
  if (!firstName || !lastName) return NextResponse.json({ error: "Nombre y apellido son obligatorios." }, { status: 400 });

  const duplicate = await prisma.patient.findUnique({ where: { dni } });
  if (duplicate) return NextResponse.json({ error: "Ya existe un paciente con ese DNI.", patientId: duplicate.id }, { status: 409 });

  const patient = await prisma.patient.create({ data: { dni, firstName, lastName, phone, address } });
  return NextResponse.json({ patient }, { status: 201 });
}
