"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDni } from "@/lib/format";

type QueueRow = {
  id: string;
  consultationId: string;
  patient: { id: string; dni: string; firstName: string; lastName: string };
};

export function DoctorDashboard() {
  const router = useRouter();
  const [data, setData] = useState<{ waiting: QueueRow[]; inProgress: QueueRow[] }>({ waiting: [], inProgress: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    const response = await fetch("/api/queue", { cache: "no-store" });
    if (response.ok) setData(await response.json());
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 2500);
    return () => window.clearInterval(timer);
  }, []);

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
  const next = data.waiting[0];

  return (
    <div className="doctor-screen">
      <div>
        <h1>Consulta</h1>
        <p className="muted">El puesto se actualiza automáticamente.</p>
      </div>
      <section className="card doctor-card">
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
              <div className="name">{next ? `${next.patient.firstName} ${next.patient.lastName}` : "Sin pacientes"}</div>
              <div className="dni">{next ? `DNI ${formatDni(next.patient.dni)}` : "La cola está vacía"}</div>
              <button className="btn btn-primary btn-large" onClick={nextPatient} disabled={loading || !next}>SIGUIENTE</button>
            </>
          )}
        </div>
        {message && <div className="notice error">{message}</div>}
      </section>
    </div>
  );
}
