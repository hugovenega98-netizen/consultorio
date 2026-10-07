"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  consultationId: string;
  initialObservations: string;
  initialMedications: string[];
  previousMedications?: string[];
  isCompleted: boolean;
};

export function ConsultationForm({ consultationId, initialObservations, initialMedications, previousMedications = [], isCompleted }: Props) {
  const router = useRouter();
  const [observations, setObservations] = useState(initialObservations);
  const [medications, setMedications] = useState<string[]>(
    Array.from({ length: 5 }, (_, index) => initialMedications[index] ?? ""),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function copyPreviousMedications() {
    setMedications(Array.from({ length: 5 }, (_, index) => previousMedications[index] ?? ""));
    setMessage("Medicaciones anteriores copiadas. Revisalas antes de finalizar.");
  }

  async function save(finalize: boolean) {
    setSaving(true);
    setMessage("");
    const response = await fetch(`/api/consultations/${consultationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observations, medications, finalize }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(result.error ?? "No se pudo guardar la consulta.");
      return;
    }
    if (finalize) {
      router.push("/doctor");
      router.refresh();
      return;
    }
    setMessage("Consulta guardada.");
  }

  return (
    <div className="card">
      <label>Observaciones
        <textarea value={observations} onChange={(e) => setObservations(e.target.value)} disabled={isCompleted} placeholder="Escribí las observaciones de la consulta..." />
      </label>

      <div style={{ marginTop: 20 }}>
        <div className="section-heading-inline">
          <div>
            <h2>Medicaciones</h2>
            <p className="muted">Podés cargar de 1 a 5. Los campos vacíos no se guardan.</p>
          </div>
          {!isCompleted && previousMedications.length > 0 && (
            <button className="btn" type="button" onClick={copyPreviousMedications}>Copiar medicaciones anteriores</button>
          )}
        </div>
        <div className="med-fields">
          {medications.map((medication, index) => (
            <div className="med-row" key={index}>
              <div className="med-num">{index + 1}</div>
              <input
                value={medication}
                disabled={isCompleted}
                placeholder={`Medicación ${index + 1}`}
                onChange={(e) => setMedications((current) => current.map((value, i) => i === index ? e.target.value : value))}
              />
            </div>
          ))}
        </div>
      </div>

      {!isCompleted && (
        <div className="actions">
          <button className="btn" disabled={saving} onClick={() => save(false)}>Guardar borrador</button>
          <button className="btn btn-primary" disabled={saving} onClick={() => save(true)}>Finalizar consulta</button>
        </div>
      )}
      {message && <div className={`notice ${message.includes("guardada") || message.includes("copiadas") ? "success" : "error"}`}>{message}</div>}
    </div>
  );
}
