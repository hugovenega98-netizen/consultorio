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

export async function DELETE() {
  const auth = await getApiUser(["RECEPTION"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const result = await prisma.$transaction(async (tx) => {
    const items = await tx.queueItem.findMany({
      select: { consultationId: true, status: true },
    });

    const activeConsultationIds = items
      .filter((item) => item.status === "WAITING" || item.status === "IN_PROGRESS")
      .map((item) => item.consultationId);

    if (activeConsultationIds.length > 0) {
      await tx.consultation.updateMany({
        where: {
          id: { in: activeConsultationIds },
          status: { in: ["QUEUED", "IN_PROGRESS"] },
        },
        data: { status: "CANCELLED" },
      });
    }

    const deleted = await tx.queueItem.deleteMany({});
    return { deleted: deleted.count, cancelledConsultations: activeConsultationIds.length };
  });

  return NextResponse.json({ ok: true, ...result });
}
