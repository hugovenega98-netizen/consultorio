import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDni } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const digits = query.replace(/\D/g, "");

  const orFilters: Prisma.PatientWhereInput[] = [];
  if (digits) orFilters.push({ dni: { contains: digits } });
  if (query) {
    orFilters.push({ firstName: { contains: query, mode: "insensitive" } });
    orFilters.push({ lastName: { contains: query, mode: "insensitive" } });
  }

  const patients = await prisma.patient.findMany({
    where: query ? { OR: orFilters } : undefined,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 100,
    include: { _count: { select: { consultations: true } } },
  });

  return (
    <div>
      <h1>Pacientes</h1>
      <p className="muted">Buscá por DNI, nombre o apellido.</p>
      <form className="card" method="get">
        <div className="form-grid">
          <label className="wide">Buscar
            <input name="q" defaultValue={query} placeholder="DNI, nombre o apellido" />
          </label>
        </div>
        <div className="actions"><button className="btn btn-primary">Buscar</button></div>
      </form>

      <div className="card">
        <div className="patient-list">
          {patients.length === 0 && <p className="muted">No encontramos pacientes.</p>}
          {patients.map((patient) => (
            <Link className="patient-row" href={`/patients/${patient.id}`} key={patient.id}>
              <div>
                <div className="patient-name">{patient.firstName} {patient.lastName}</div>
                <div className="muted">DNI {formatDni(patient.dni)}</div>
              </div>
              <span className="badge">{patient._count.consultations} consultas</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
