export function normalizeDni(value: string) {
  return value.replace(/\D/g, "");
}

export function formatDni(value: string) {
  const digits = normalizeDni(value);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function fullName(patient: { firstName: string; lastName: string }) {
  return `${patient.firstName} ${patient.lastName}`.trim();
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function argentinaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function argentinaDayRange(date = argentinaToday()) {
  const start = new Date(`${date}T00:00:00-03:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}
