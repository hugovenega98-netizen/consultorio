import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ClaimedRow = { id: string; consultationId: string };

export const runtime = "nodejs";

export async function POST() {
  const auth = await getApiUser(["DOCTOR"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const existing = await prisma.queueItem.findFirst({
    where: { status: "IN_PROGRESS" },
    orderBy: { startedAt: "asc" },
  });
  if (existing) return NextResponse.json({ consultationId: existing.consultationId, resumed: true });

  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ClaimedRow[]>`
      WITH next_item AS (
        SELECT id
        FROM "QueueItem"
        WHERE status = 'WAITING'
        ORDER BY "queuedAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE "QueueItem" q
      SET status = 'IN_PROGRESS', "startedAt" = NOW()
      FROM next_item
      WHERE q.id = next_item.id
      RETURNING q.id, q."consultationId"
    `;

    const claimed = rows[0];
    if (!claimed) return null;

    await tx.consultation.update({
      where: { id: claimed.consultationId },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });
    return claimed;
  });

  if (!result) return NextResponse.json({ error: "No hay pacientes en espera." }, { status: 404 });
  return NextResponse.json({ consultationId: result.consultationId });
}
