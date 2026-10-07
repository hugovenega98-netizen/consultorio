import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/auth";
import { argentinaToday, fullName } from "@/lib/format";
import { createMedicationListPdf } from "@/lib/simplePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getApiUser(["RECEPTION", "ADMIN"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const repetitions = await prisma.repetition.findMany({
    where: { clearedAt: null },
    orderBy: { createdAt: "asc" },
    include: { patient: true, medications: { orderBy: { position: "asc" } } },
  });

  const rows = repetitions.map((repetition) => {
    const meds = repetition.medications.map((medication) => medication.name);
    return [fullName(repetition.patient), ...Array.from({ length: 5 }, (_, index) => meds[index] ?? "")];
  });
  const date = argentinaToday();
  const buffer = createMedicationListPdf(
    `Repeticiones - ${date.split("-").reverse().join("/")}`,
    `${rows.length} paciente(s) en la lista actual`,
    rows,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=repeticiones-${date}.pdf`,
    },
  });
}
