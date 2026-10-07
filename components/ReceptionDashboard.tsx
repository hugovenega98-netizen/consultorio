"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDni } from "@/lib/format";

type Patient = {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
};

type QueueRow = {
  id: string;
  consultationId: string;
  status: string;
  patient: Patient;
};

export function ReceptionDashboard({ initialPatients }: { initialPatients: Patient[] }) {
  const [patients, setPatients] = useState(initialPatients);
  const [query, setQuery] = useState("");
  const [queue, setQueue] = useState<{ waiting: QueueRow[]; inProgress: QueueRow[] }>({ waiting: [], inProgress: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ dni: "", firstName: "", lastName: "", phone: "", address: "" });

  async function refreshPatients() {
    const response = await fetch("/api/patients", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setPatients(data.patients);
    }
  }

  async function refreshQueue() {
    const response = await fetch("/api/queue", { cache: "no-store" });
    if (response.ok) setQueue(await response.json());
  }

  useEffect(() => {
    refreshQueue();
    const timer = window.setInterval(refreshQueue, 2500);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const digits = term.replace(/\D/g, "");
    if (!term) return patients;
    return patients.filter((p) => {
      const name = `${p.firstName} ${p.lastName}`.toLowerCase();
      const phone = p.phone.replace(/\D/g, "");
      return name.includes(term) || p.dni.includes(digits || term) || phone.includes(digits || term);
    });
  }, [patients, query]);

  async function submitPatient(force = false) {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, force }),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok && result.requiresConfirmation && Array.isArray(result.possibleDuplicates)) {
      const candidates = result.possibleDuplicates
        .map((patient: Patient) => `${patient.firstName} ${patient.lastName} · DNI ${formatDni(patient.dni)}${patient.phone ? ` · ${patient.phone}` : ""}`)
        .join("\n");
      const confirmed = window.confirm(`Posibles pacientes duplicados:\n\n${candidates}\n\n¿Querés crear el paciente igualmente?`);
      if (confirmed) await submitPatient(true);
      return;
    }

    if (!response.ok) {
      setMessage(result.error ?? "No se pudo crear el paciente.");
      return;
    }
    setMessage(`${result.patient.firstName} ${result.patient.lastName} fue cargado.`);
    setForm({ dni: "", firstName: "", lastName: "", phone: "", address: "" });
    await refreshPatients();
  }

  async function createPatient(event: React.FormEvent) {
    event.preventDefault();
    await submitPatient(false);
  }

  async function enqueue(patientId: string) {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/queue/enqueue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result.error ?? "No se pudo enviar a la cola.");
      return;
    }
    setMessage(`${result.patient.firstName} ${result.patient.lastName} quedó en espera.`);
    await refreshQueue();
  }

  async function clearQueue() {
    const confirmed = window.confirm(
      "¿Seguro que querés limpiar toda la queue? Se quitarán todos los pacientes en espera y en atención. Los pacientes y las consultas ya finalizadas no se borran.",
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage("");
    const response = await fetch("/api/queue", { method: "DELETE" });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result.error ?? "No se pudo limpiar la queue.");
      return;
    }

    setMessage(result.deleted > 0 ? `Queue limpiada: ${result.deleted} entrada(s) eliminada(s).` : "La queue ya estaba vacía.");
    await refreshQueue();
  }

  const activeIds = new Set([
    ...queue.waiting.map((item) => item.patient.id),
    ...queue.inProgress.map((item) => item.patient.id),
  ]);

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>Recepción</h1>
          <p className="muted">Pacientes, altas y envío a la cola de atención.</p>
        </div>
        <Link className="btn" href="/reception/repetitions">Repeticiones</Link>
      </div>

      {message && <div className={`notice ${message.includes("quedó") || message.includes("cargado") || message.includes("limpiada") || message.includes("vacía") ? "success" : "error"}`}>{message}</div>}

      <div className="grid grid-2 reception-grid">
        <section className="card">
          <h2>Nuevo paciente</h2>
          <form onSubmit={createPatient}>
            <div className="form-grid">
              <label>DNI
                <input inputMode="numeric" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} required />
              </label>
              <label>Teléfono
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label>Nombre
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </label>
              <label>Apellido
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </label>
              <label className="wide">Dirección
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </label>
            </div>
            <div className="actions"><button className="btn btn-primary" disabled={loading}>Guardar paciente</button></div>
          </form>
        </section>

        <section className="card">
          <div className="queue-heading">
            <h2>Cola</h2>
            <button className="btn btn-danger" type="button" disabled={loading} onClick={clearQueue}>
              Limpiar queue
            </button>
          </div>
          {queue.inProgress[0] && (
            <div className="compact-status">
              <span className="badge progress">EN ATENCIÓN</span>
              <strong>{queue.inProgress[0].patient.firstName} {queue.inProgress[0].patient.lastName}</strong>
            </div>
          )}
          <div className="queue-list">
            {queue.waiting.length === 0 && <p className="muted">No hay pacientes esperando.</p>}
            {queue.waiting.map((item, index) => (
              <div className="queue-item" key={item.id}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div className="queue-position">{index + 1}</div>
                  <div><strong>{item.patient.firstName} {item.patient.lastName}</strong><div className="muted">DNI {formatDni(item.patient.dni)}</div></div>
                </div>
                <span className="badge waiting">ESPERA</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="list-toolbar">
          <div>
            <h2>Pacientes</h2>
            <p className="muted">{patients.length} pacientes cargados en la base.</p>
          </div>
          <input className="search-input" placeholder="Buscar por DNI, nombre, apellido o teléfono" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="patient-list">
          {filtered.map((patient) => (
            <div className="patient-row" key={patient.id}>
              <div>
                <div className="patient-name">{patient.lastName}, {patient.firstName}</div>
                <div className="muted">DNI {formatDni(patient.dni)}{patient.phone ? ` · ${patient.phone}` : ""}</div>
              </div>
              <div className="actions row-actions">
                <Link className="btn" href={`/patients/${patient.id}`}>Ver perfil</Link>
                <Link className="btn" href={`/reception/repetitions/${patient.id}`}>Repetición</Link>
                <button className="btn btn-primary" disabled={loading || activeIds.has(patient.id)} onClick={() => enqueue(patient.id)}>
                  {activeIds.has(patient.id) ? "En cola" : "Enviar a cola"}
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="muted">No se encontraron pacientes.</p>}
        </div>
      </section>
    </div>
  );
}
