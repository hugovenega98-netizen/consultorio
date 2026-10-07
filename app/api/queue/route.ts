import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { argentinaDayRange } from "@/lib/format";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET() {
  const { start, end } = argentinaDayRange();
  const [waiting, inProgress, completedToday] = await Promise.all([
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
    prisma.consultation.count({
      where: { status: "COMPLETED", completedAt: { gte: start, lt: end } },
    }),
  ]);

  const mapRow = (item: (typeof waiting)[number]) => ({
    id: item.id,
    status: item.status,
    queuedAt: item.queuedAt,
    consultationId: item.consultationId,
    patient: item.consultation.patient,
  });

  return NextResponse.json({ waiting: waiting.map(mapRow), inProgress: inProgress.map(mapRow), completedToday });
}
