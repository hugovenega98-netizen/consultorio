import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getApiUser(["RECEPTION", "DOCTOR"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [waiting, inProgress] = await Promise.all([
    prisma.queueItem.findMany({
      where: { status: "WAITING" },
      orderBy: { queuedAt: "asc" },
      include: { consultation: { include: { patient: true } } },
    }),
    prisma.queueItem.findMany({
      where: { status: "IN_PROGRESS" },
      orderBy: { startedAt: "asc" },
      include: { consultation: { include: { patient: true } } },
    }),
  ]);

  const mapRow = (item: (typeof waiting)[number]) => ({
    id: item.id,
    status: item.status,
    queuedAt: item.queuedAt,
    consultationId: item.consultationId,
    patient: item.consultation.patient,
  });

  return NextResponse.json({ waiting: waiting.map(mapRow), inProgress: inProgress.map(mapRow) });
}
