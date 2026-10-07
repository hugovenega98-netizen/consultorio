"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDni } from "@/lib/format";

type QueueRow = {
  id: string;
  status: "WAITING" | "IN_PROGRESS" | "DONE";
  queuedAt: string;
  consultationId: string;
  patient: { id: string; dni: string; firstName: string; lastName: string };
};

type QueueResponse = {
  waiting: QueueRow[];
  inProgress: QueueRow[];
  completedToday: number;
};

export function QueueDashboard() {
  const router = useRouter();
  const [data, setData] = useState<QueueResponse>({ waiting: [], inProgress: [], completedToday: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ dni: "", firstName: "", lastName: "" });

  async function refresh() {
    const response = await fetch("/api/queue", { cache: "no-store" });
    if (response.ok) setData(await response.json());
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 2500);
    return () => window.clearInterval(timer);
  }, []);

  async function enqueue(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/queue/enqueue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result.error ?? "No se pudo agregar el paciente.");
      return;
    }
    setMessage(`${result.patient.firstName} ${result.patient.lastName} quedó en espera.`);
    setForm({ dni: "", firstName: "", lastName: "" });
    refresh();
  }

  async function nextPatient() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/queue/next", { method: "POST" });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result.error ?? "No hay pacientes en espera.");
      refresh();
      return;
    }
    router.push(`/consultations/${result.consultationId}`);
  }

  const current = data.inProgress[0];

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1>Cola de atención</h1>
        <p className="muted">Se actualiza automáticamente cada 2,5 segundos en todas las computadoras.</p>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <h2>Ingreso de paciente</h2>
          <form onSubmit={enqueue}>
            <div className="form-grid">
              <label className="wide">DNI
                <input inputMode="numeric" placeholder="Ej. 30111222" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} required />
              </label>
              <label>Nombre <span className="muted">(solo si es nuevo)</span>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </label>
              <label>Apellido <span className="muted">(solo si es nuevo)</span>
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </label>
            </div>
            <div className="actions">
              <button className="btn btn-primary" disabled={loading}>Agregar a la cola</button>
            </div>
          </form>
          {message && <div className={`notice ${message.includes("espera") ? "success" : "error"}`}>{message}</div>}
        </section>

        <section className="card">
          <h2>Puesto de atención</h2>
          <div className="big-next">
            {current ? (
              <>
                <span className="badge progress">EN ATENCIÓN</span>
                <div className="name">{current.patient.firstName} {current.patient.lastName}</div>
                <div className="dni">DNI {formatDni(current.patient.dni)}</div>
                <button className="btn btn-primary btn-large" onClick={nextPatient} disabled={loading}>ABRIR CONSULTA</button>
              </>
            ) : (
              <>
                <span className="badge waiting">PRÓXIMO</span>
                <div className="name">{data.waiting[0] ? `${data.waiting[0].patient.firstName} ${data.waiting[0].patient.lastName}` : "Sin pacientes"}</div>
                <div className="dni">{data.waiting[0] ? `DNI ${formatDni(data.waiting[0].patient.dni)}` : "La cola está vacía"}</div>
                <button className="btn btn-primary btn-large" onClick={nextPatient} disabled={loading || data.waiting.length === 0}>SIGUIENTE</button>
              </>
            )}
          </div>
          <p className="muted">Finalizadas hoy: <strong>{data.completedToday}</strong></p>
        </section>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <h2>En espera ({data.waiting.length})</h2>
        <div className="queue-list">
          {data.waiting.length === 0 && <p className="muted">No hay pacientes esperando.</p>}
          {data.waiting.map((item, index) => (
            <div className="queue-item" key={item.id}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className="queue-position">{index + 1}</div>
                <div>
                  <div className="patient-name">{item.patient.firstName} {item.patient.lastName}</div>
                  <div className="muted">DNI {formatDni(item.patient.dni)}</div>
                </div>
              </div>
              <span className="badge waiting">ESPERA</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
