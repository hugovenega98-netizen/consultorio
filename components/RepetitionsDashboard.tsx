"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDni } from "@/lib/format";

type PatientRow = {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  phone: string;
  lastMedications: string[];
};

type ActiveRepetition = {
  id: string;
  patient: { id: string; dni: string; firstName: string; lastName: string };
  medications: string[];
};

export function RepetitionsDashboard({
  initialPatients,
  initialActive,
}: {
  initialPatients: PatientRow[];
  initialActive: ActiveRepetition[];
}) {
  const [patients, setPatients] = useState(initialPatients);
  const [active, setActive] = useState(initialActive);
  const [query, setQuery] = useState("");
  const [loadingId, setLoadingId] = useState("");
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const digits = term.replace(/\D/g, "");
    if (!term) return patients;
    return patients.filter((patient) => {
      const name = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const phone = patient.phone.replace(/\D/g, "");
      return name.includes(term) || patient.dni.includes(digits || term) || phone.includes(digits || term);
    });
  }, [patients, query]);

  async function addRepetition(patient: PatientRow) {
    setLoadingId(patient.id);
    setMessage("");
    const response = await fetch("/api/repetitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: patient.id, copyLastConsultation: true }),
    });
    const result = await response.json();
    setLoadingId("");
    if (!response.ok) {
      setMessage(result.error ?? "No se pudo agregar la repetición.");
      return;
    }

    setPatients((current) => current.filter((item) => item.id !== patient.id));
    setActive((current) => [
      ...current,
      {
        id: result.repetition.id,
        patient: result.repetition.patient,
        medications: result.repetition.medications,
      },
    ]);
    setMessage(`${patient.firstName} ${patient.lastName} fue agregado a la lista de repeticiones.`);
  }

  async function clearList() {
    if (!active.length) return;
    const confirmed = window.confirm(
      "¿Limpiar la lista de repeticiones actual? No se borrará el historial. Los pacientes volverán a quedar disponibles para una nueva tanda.",
    );
    if (!confirmed) return;

    setLoadingId("__clear__");
    setMessage("");
    const response = await fetch("/api/repetitions", { method: "DELETE" });
    const result = await response.json();
    setLoadingId("");
    if (!response.ok) {
      setMessage(result.error ?? "No se pudo limpiar la lista.");
      return;
    }
    window.location.reload();
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>Repeticiones</h1>
          <p className="muted">Tanda independiente de las consultas. Cada alta copia las medicaciones de la última consulta finalizada.</p>
        </div>
      </div>

      {message && <div className={`notice ${message.includes("agregado") ? "success" : "error"}`}>{message}</div>}

      <section className="card">
        <div className="section-heading-inline">
          <div>
            <h2>Lista actual</h2>
            <p className="muted">{active.length} paciente(s) en la tanda de repeticiones.</p>
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            <a className="btn" href="/api/export/repetitions">Exportar Word</a>
            <a className="btn" href="/api/export/repetitions/pdf">Exportar PDF</a>
            <button className="btn btn-danger" type="button" disabled={!active.length || loadingId === "__clear__"} onClick={clearList}>Limpiar lista</button>
          </div>
        </div>

        <div className="patient-list" style={{ marginTop: 16 }}>
          {active.length === 0 && <p className="muted">La lista de repeticiones está vacía.</p>}
          {active.map((item) => (
            <div className="patient-row" key={item.id}>
              <div>
                <div className="patient-name">{item.patient.lastName}, {item.patient.firstName}</div>
                <div className="muted">DNI {formatDni(item.patient.dni)}</div>
                <ul className="med-list">{item.medications.map((medication, index) => <li key={`${item.id}-${index}`}>{medication}</li>)}</ul>
              </div>
              <Link className="btn" href={`/reception/repetitions/${item.patient.id}`}>Historial</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="list-toolbar">
          <div>
            <h2>Pacientes disponibles</h2>
            <p className="muted">Al agregarlos desaparecen de esta lista hasta que limpies la tanda actual.</p>
          </div>
          <input className="search-input" placeholder="Buscar por DNI, nombre, apellido o teléfono" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="patient-list compact-patients">
          {filtered.map((patient) => (
            <div className="patient-row" key={patient.id}>
              <div>
                <div className="patient-name">{patient.lastName}, {patient.firstName}</div>
                <div className="muted">DNI {formatDni(patient.dni)}{patient.phone ? ` · ${patient.phone}` : ""}</div>
                {patient.lastMedications.length > 0 ? (
                  <ul className="med-list">{patient.lastMedications.map((medication, index) => <li key={`${patient.id}-${index}`}>{medication}</li>)}</ul>
                ) : (
                  <div className="muted" style={{ marginTop: 6 }}>Sin medicaciones en una consulta previa.</div>
                )}
              </div>
              <div className="actions row-actions">
                <Link className="btn" href={`/reception/repetitions/${patient.id}`}>Historial</Link>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={loadingId === patient.id || patient.lastMedications.length === 0}
                  onClick={() => addRepetition(patient)}
                >
                  Agregar repetición
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="muted">No hay pacientes disponibles con ese criterio.</p>}
        </div>
      </section>
    </div>
  );
}
