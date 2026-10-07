import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getApiUser } from "@/lib/auth";
import { normalizeDni } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export async function GET(request: NextRequest) {
  const auth = await getApiUser(["RECEPTION", "ADMIN"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? 0);
  const take = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : undefined;
  const dni = normalizeDni(q);
  const phone = normalizePhone(q);
  const nameParts = q.split(/\s+/).filter(Boolean);

  const or: Prisma.PatientWhereInput[] = [];
  if (dni) or.push({ dni: { contains: dni } });
  if (phone) or.push({ phone: { contains: phone } });
  or.push({ firstName: { contains: q, mode: "insensitive" } });
  or.push({ lastName: { contains: q, mode: "insensitive" } });
  if (nameParts.length > 1) {
    or.push({
      AND: nameParts.map((part) => ({
        OR: [
          { firstName: { contains: part, mode: "insensitive" } },
          { lastName: { contains: part, mode: "insensitive" } },
        ],
      })),
    });
  }

  const patients = await prisma.patient.findMany({
    where: q ? { OR: or } : undefined,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take,
  });

  return NextResponse.json({ patients });
}

export async function POST(request: NextRequest) {
  const auth = await getApiUser(["RECEPTION", "ADMIN"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const dni = normalizeDni(String(body.dni ?? ""));
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const address = String(body.address ?? "").trim();
  const force = Boolean(body.force);

  if (dni.length < 7 || dni.length > 9) return NextResponse.json({ error: "Ingresá un DNI válido." }, { status: 400 });
  if (!firstName || !lastName) return NextResponse.json({ error: "Nombre y apellido son obligatorios." }, { status: 400 });

  const duplicate = await prisma.patient.findUnique({ where: { dni } });
  if (duplicate) return NextResponse.json({ error: "Ya existe un paciente con ese DNI.", patientId: duplicate.id }, { status: 409 });

  if (!force) {
    const [sameName, samePhone] = await Promise.all([
      prisma.patient.findMany({
        where: {
          firstName: { equals: firstName, mode: "insensitive" },
          lastName: { equals: lastName, mode: "insensitive" },
        },
        take: 5,
      }),
      phone.length >= 6
        ? prisma.patient.findMany({ where: { phone: { equals: phone, mode: "insensitive" } }, take: 5 })
        : Promise.resolve([]),
    ]);

    const byId = new Map([...sameName, ...samePhone].map((patient) => [patient.id, patient]));
    const possibleDuplicates = Array.from(byId.values()).slice(0, 5);

    if (possibleDuplicates.length > 0) {
      return NextResponse.json({
        error: "Encontramos pacientes parecidos. Revisalos antes de crear otro.",
        possibleDuplicates,
        requiresConfirmation: true,
      }, { status: 409 });
    }
  }

  const patient = await prisma.patient.create({ data: { dni, firstName, lastName, phone, address } });
  return NextResponse.json({ patient }, { status: 201 });
}
