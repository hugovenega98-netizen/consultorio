"use client";

import { useState } from "react";

export function PatientInternalNotes({ patientId, initialNotes }: { patientId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch(`/api/patients/${patientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internalNotes: notes }),
    });
    const result = await response.json();
    setSaving(false);
    setMessage(response.ok ? "Notas internas guardadas." : (result.error ?? "No se pudieron guardar las notas."));
  }

  return (
    <section className="card" style={{ marginTop: 20 }}>
      <h2>Notas internas</h2>
      <p className="muted">Solo visibles para Recepción y Admin. No aparecen en la pantalla del doctor ni en exportaciones.</p>
      <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ej.: llamar antes, verificar teléfono, traer documentación..." />
      <div className="actions">
        <button className="btn btn-primary" type="button" disabled={saving} onClick={save}>Guardar notas</button>
      </div>
      {message && <div className={`notice ${message.includes("guardadas") ? "success" : "error"}`}>{message}</div>}
    </section>
  );
}
