import { NextResponse } from "next/server";
import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/auth";
import { argentinaToday, fullName } from "@/lib/format";

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

  const header = ["Paciente", "Medicación 1", "Medicación 2", "Medicación 3", "Medicación 4", "Medicación 5"];
  const rows = [
    new TableRow({ children: header.map((text) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })] })) }),
    ...repetitions.map((repetition) => {
      const meds = repetition.medications.map((medication) => medication.name);
      const values = [fullName(repetition.patient), ...Array.from({ length: 5 }, (_, index) => meds[index] ?? "")];
      return new TableRow({ children: values.map((text) => new TableCell({ children: [new Paragraph(text)] })) });
    }),
  ];

  const date = argentinaToday();
  const document = new Document({
    sections: [{
      children: [
        new Paragraph({ text: `Repeticiones - ${date.split("-").reverse().join("/")}`, heading: HeadingLevel.TITLE }),
        new Paragraph({ text: `${repetitions.length} paciente(s) en la lista actual`, spacing: { after: 240 } }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(document);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename=repeticiones-${date}.docx`,
    },
  });
}
