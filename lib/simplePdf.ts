type PdfRow = string[];

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 34;
const FONT_SIZE = 8;
const LINE_HEIGHT = 10;
const COLUMN_WIDTHS = [155, 130.58, 130.58, 130.58, 130.58, 130.58];

function winAnsi(value: string) {
  return value
    .normalize("NFC")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\xFF]/g, "?");
}

function escapePdfText(value: string) {
  return winAnsi(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text: string, width: number) {
  const approxChars = Math.max(8, Math.floor(width / (FONT_SIZE * 0.52)));
  const words = winAnsi(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= approxChars || !current) current = candidate;
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function textCommand(text: string, x: number, y: number, bold = false, size = FONT_SIZE) {
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(text)}) Tj ET\n`;
}

function rectCommand(x: number, y: number, width: number, height: number, fill = false) {
  if (fill) return `0.93 g ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f 0 g\n`;
  return `0.78 G 0.5 w ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S 0 G\n`;
}

function buildPageContent(title: string, subtitle: string, headers: string[], rows: PdfRow[], startIndex: number) {
  let content = "";
  let y = PAGE_HEIGHT - MARGIN;
  content += textCommand(title, MARGIN, y, true, 18);
  y -= 22;
  content += textCommand(subtitle, MARGIN, y, false, 9);
  y -= 20;

  const drawHeader = () => {
    let x = MARGIN;
    const height = 24;
    headers.forEach((header, index) => {
      content += rectCommand(x, y - height, COLUMN_WIDTHS[index], height, true);
      content += rectCommand(x, y - height, COLUMN_WIDTHS[index], height, false);
      content += textCommand(header, x + 4, y - 15, true, FONT_SIZE);
      x += COLUMN_WIDTHS[index];
    });
    y -= height;
  };

  drawHeader();
  let index = startIndex;
  for (; index < rows.length; index += 1) {
    const row = rows[index];
    const wrapped = row.map((value, col) => wrapText(value, COLUMN_WIDTHS[col] - 8));
    const maxLines = Math.max(1, ...wrapped.map((parts) => parts.length));
    const rowHeight = Math.max(24, maxLines * LINE_HEIGHT + 8);
    if (y - rowHeight < MARGIN) break;

    let x = MARGIN;
    wrapped.forEach((parts, col) => {
      content += rectCommand(x, y - rowHeight, COLUMN_WIDTHS[col], rowHeight, false);
      parts.forEach((line, lineIndex) => {
        content += textCommand(line, x + 4, y - 13 - lineIndex * LINE_HEIGHT);
      });
      x += COLUMN_WIDTHS[col];
    });
    y -= rowHeight;
  }

  return { content, nextIndex: index };
}

function objectBuffer(id: number, body: string | Buffer) {
  const prefix = Buffer.from(`${id} 0 obj\n`, "latin1");
  const suffix = Buffer.from("\nendobj\n", "latin1");
  const middle = Buffer.isBuffer(body) ? body : Buffer.from(body, "latin1");
  return Buffer.concat([prefix, middle, suffix]);
}

export function createMedicationListPdf(title: string, subtitle: string, rows: PdfRow[]) {
  const headers = ["Paciente", "Medicación 1", "Medicación 2", "Medicación 3", "Medicación 4", "Medicación 5"];
  const pages: string[] = [];
  let index = 0;
  do {
    const page = buildPageContent(
      title,
      subtitle,
      headers,
      rows,
      index,
    );
    pages.push(page.content);
    index = page.nextIndex;
  } while (index < rows.length);

  const pageCount = pages.length;
  const catalogId = 1;
  const pagesId = 2;
  const fontRegularId = 3;
  const fontBoldId = 4;
  const firstPageId = 5;
  const objectCount = 4 + pageCount * 2;
  const pageIds = pages.map((_, i) => firstPageId + i * 2);

  const objects = new Map<number, Buffer>();
  objects.set(catalogId, objectBuffer(catalogId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`));
  objects.set(pagesId, objectBuffer(pagesId, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`));
  objects.set(fontRegularId, objectBuffer(fontRegularId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"));
  objects.set(fontBoldId, objectBuffer(fontBoldId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"));

  pages.forEach((content, i) => {
    const pageId = firstPageId + i * 2;
    const contentId = pageId + 1;
    const contentBytes = Buffer.from(content, "latin1");
    objects.set(pageId, objectBuffer(pageId, `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`));
    objects.set(contentId, objectBuffer(contentId, Buffer.concat([
      Buffer.from(`<< /Length ${contentBytes.length} >>\nstream\n`, "latin1"),
      contentBytes,
      Buffer.from("endstream", "latin1"),
    ])));
  });

  const header = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1");
  const chunks: Buffer[] = [header];
  const offsets = new Array<number>(objectCount + 1).fill(0);
  let offset = header.length;

  for (let id = 1; id <= objectCount; id += 1) {
    const object = objects.get(id);
    if (!object) throw new Error(`PDF object ${id} missing`);
    offsets[id] = offset;
    chunks.push(object);
    offset += object.length;
  }

  const xrefOffset = offset;
  let xref = `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= objectCount; id += 1) xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${objectCount + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(Buffer.from(xref, "latin1"));
  return Buffer.concat(chunks);
}


export function createConsultationsPdf(dateLabel: string, rows: PdfRow[]) {
  return createMedicationListPdf(`Consultas - ${dateLabel}`, `${rows.length} consulta(s) finalizada(s)`, rows);
}
