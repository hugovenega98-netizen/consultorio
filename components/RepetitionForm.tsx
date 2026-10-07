"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RepetitionForm({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [observations, setObservations] = useState("");
  const [medications, setMedications] = useState<string[]>(Array.from({ length: 5 }, () => ""));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/repetitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, observations, medications }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(result.error ?? "No se pudo guardar la repetición.");
      return;
    }
    router.push("/reception/repetitions");
    router.refresh();
  }

  return (
    <div className="card">
      <label>Observaciones
        <textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Observaciones de la repetición..." />
      </label>
      <div style={{ marginTop: 20 }}>
        <h2>Medicaciones</h2>
        <p className="muted">Podés cargar de 1 a 5.</p>
        <div className="med-fields">
          {medications.map((medication, index) => (
            <div className="med-row" key={index}>
              <div className="med-num">{index + 1}</div>
              <input
                value={medication}
                placeholder={`Medicación ${index + 1}`}
                onChange={(e) => setMedications((current) => current.map((value, i) => i === index ? e.target.value : value))}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="actions">
        <button className="btn" type="button" onClick={() => router.push("/reception/repetitions")}>Cancelar</button>
        <button className="btn btn-primary" type="button" disabled={saving} onClick={save}>Guardar repetición</button>
      </div>
      {message && <div className="notice error">{message}</div>}
    </div>
  );
}
