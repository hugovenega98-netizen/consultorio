import { NextResponse } from "next/server";
import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/auth";
import { argentinaDayRange, argentinaToday, fullName } from "@/lib/format";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getApiUser(["RECEPTION"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const date = argentinaToday();
  const { start, end } = argentinaDayRange(date);
  const consultations = await prisma.consultation.findMany({
    where: { status: "COMPLETED", completedAt: { gte: start, lt: end } },
    orderBy: { completedAt: "asc" },
    include: { patient: true, medications: { orderBy: { position: "asc" } } },
  });

  const header = ["Paciente", "Medicación 1", "Medicación 2", "Medicación 3", "Medicación 4", "Medicación 5"];
  const rows = [
    new TableRow({ children: header.map((text) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })] })) }),
    ...consultations.map((consultation) => {
      const meds = consultation.medications.map((m) => m.name);
      const values = [fullName(consultation.patient), ...Array.from({ length: 5 }, (_, i) => meds[i] ?? "")];
      return new TableRow({ children: values.map((text) => new TableCell({ children: [new Paragraph(text)] })) });
    }),
  ];

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: `Consultas - ${date.split("-").reverse().join("/")}`, heading: HeadingLevel.TITLE }),
        new Paragraph({ text: `${consultations.length} consulta(s) finalizada(s)`, spacing: { after: 240 } }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename=consultas-${date}.docx`,
    },
  });
}
