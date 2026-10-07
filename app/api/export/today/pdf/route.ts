import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/auth";
import { argentinaDayRange, argentinaToday, fullName } from "@/lib/format";
import { createConsultationsPdf } from "@/lib/simplePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getApiUser(["RECEPTION", "ADMIN"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const date = argentinaToday();
  const { start, end } = argentinaDayRange(date);
  const consultations = await prisma.consultation.findMany({
    where: { status: "COMPLETED", completedAt: { gte: start, lt: end } },
    orderBy: { completedAt: "asc" },
    include: { patient: true, medications: { orderBy: { position: "asc" } } },
  });

  const rows = consultations.map((consultation) => {
    const meds = consultation.medications.map((medication) => medication.name);
    return [fullName(consultation.patient), ...Array.from({ length: 5 }, (_, index) => meds[index] ?? "")];
  });

  const buffer = createConsultationsPdf(date.split("-").reverse().join("/"), rows);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=consultas-${date}.pdf`,
    },
  });
}
