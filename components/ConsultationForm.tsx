"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PreviousConsultation = {
  date: string;
  actividadFisica: number | null;
  catarsis: number | null;
  diuresis: number | null;
  ansiedad: number | null;
  tensionArterial: string;
  peso: number | null;
  observations: string;
  medications: string[];
};

type Props = {
  consultationId: string;
  patientName: string;
  patientDni: string;
  consultationDate: string;
  isFirstConsultation: boolean;
  referenceMotivoConsulta: string;
  referenceAntecedentesPersonales: string;
  initialMotivoConsulta: string;
  initialAntecedentesPersonales: string;
  initialActividadFisica: number | null;
  initialCatarsis: number | null;
  initialDiuresis: number | null;
  initialAnsiedad: number | null;
  initialTensionArterial: string;
  initialPeso: number | null;
  initialObservations: string;
  initialMedications: string[];
  previousMedications?: string[];
  previousConsultation: PreviousConsultation | null;
  recentMedicationNames: string[];
  isCompleted: boolean;
};

const scaleValues = Array.from({ length: 11 }, (_, index) => index - 5);

function ScaleField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        <option value="">Seleccionar</option>
        {scaleValues.map((scale) => (
          <option key={scale} value={scale}>{scale > 0 ? `+${scale}` : scale}</option>
        ))}
      </select>
    </label>
  );
}

function formatScale(value: number | null) {
  if (value === null) return "—";
  return value > 0 ? `+${value}` : String(value);
}

export function ConsultationForm({
  consultationId,
  patientName,
  patientDni,
  consultationDate,
  isFirstConsultation,
  referenceMotivoConsulta,
  referenceAntecedentesPersonales,
  initialMotivoConsulta,
  initialAntecedentesPersonales,
  initialActividadFisica,
  initialCatarsis,
  initialDiuresis,
  initialAnsiedad,
  initialTensionArterial,
  initialPeso,
  initialObservations,
  initialMedications,
  previousMedications = [],
  previousConsultation,
  recentMedicationNames,
  isCompleted,
}: Props) {
  const router = useRouter();
  const [motivoConsulta, setMotivoConsulta] = useState(initialMotivoConsulta);
  const [antecedentesPersonales, setAntecedentesPersonales] = useState(initialAntecedentesPersonales);
  const [actividadFisica, setActividadFisica] = useState(initialActividadFisica === null ? "" : String(initialActividadFisica));
  const [catarsis, setCatarsis] = useState(initialCatarsis === null ? "" : String(initialCatarsis));
  const [diuresis, setDiuresis] = useState(initialDiuresis === null ? "" : String(initialDiuresis));
  const [ansiedad, setAnsiedad] = useState(initialAnsiedad === null ? "" : String(initialAnsiedad));
  const [tensionArterial, setTensionArterial] = useState(initialTensionArterial);
  const [peso, setPeso] = useState(initialPeso === null ? "" : String(initialPeso));
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
      body: JSON.stringify({
        motivoConsulta,
        antecedentesPersonales,
        actividadFisica,
        catarsis,
        diuresis,
        ansiedad,
        tensionArterial,
        peso,
        observations,
        medications,
        finalize,
      }),
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
    <div className="consultation-workspace">
      <section className="card consultation-patient-card">
        <div>
          <span className="consultation-eyebrow">Paciente</span>
          <h1>{patientName}</h1>
          <p className="muted">DNI {patientDni} · Consulta {consultationDate}</p>
        </div>
        {isCompleted && <span className="badge done">FINALIZADA</span>}
      </section>

      <section className="card consultation-initial-details">
        <div className="section-heading-inline">
          <div>
            <h2>MC y AP</h2>
            <p className="muted">Datos iniciales del paciente.</p>
          </div>
          {isFirstConsultation && <span className="badge progress">PRIMERA CONSULTA</span>}
        </div>

        {isFirstConsultation ? (
          <div className="clinical-text-grid">
            <label>
              MC · Motivo de consulta
              <textarea
                value={motivoConsulta}
                onChange={(event) => setMotivoConsulta(event.target.value)}
                disabled={isCompleted}
                placeholder="Motivo de consulta..."
              />
            </label>
            <label>
              AP · Antecedentes personales
              <textarea
                value={antecedentesPersonales}
                onChange={(event) => setAntecedentesPersonales(event.target.value)}
                disabled={isCompleted}
                placeholder="Antecedentes personales..."
              />
            </label>
          </div>
        ) : (
          <div className="consultation-reference-grid">
            <div className="reference-detail">
              <span>MC · Motivo de consulta</span>
              <p>{referenceMotivoConsulta || "—"}</p>
            </div>
            <div className="reference-detail">
              <span>AP · Antecedentes personales</span>
              <p>{referenceAntecedentesPersonales || "—"}</p>
            </div>
          </div>
        )}
      </section>

      {isCompleted && <div className="notice success">Esta consulta está finalizada y queda en modo lectura.</div>}

      <div className="consultation-layout">
        <main className="consultation-main-column">
          <section className="card consultation-current-card">
            <section className="consultation-section consultation-section-first">
              <h2>Consulta actual</h2>
              <div className="clinical-grid consultation-scale-grid">
                <ScaleField label="AF · Actividad física" value={actividadFisica} onChange={setActividadFisica} disabled={isCompleted} />
                <ScaleField label="C · Catarsis" value={catarsis} onChange={setCatarsis} disabled={isCompleted} />
                <ScaleField label="D · Diuresis" value={diuresis} onChange={setDiuresis} disabled={isCompleted} />
                <ScaleField label="A · Ansiedad" value={ansiedad} onChange={setAnsiedad} disabled={isCompleted} />
              </div>
              <div className="consultation-vitals-grid">
                <label>
                  T/A · Tensión arterial
                  <input
                    value={tensionArterial}
                    onChange={(event) => setTensionArterial(event.target.value)}
                    disabled={isCompleted}
                    placeholder="Ej. 120/80"
                  />
                </label>
                <label>
                  Peso
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={peso}
                    onChange={(event) => setPeso(event.target.value)}
                    disabled={isCompleted}
                    placeholder="kg"
                  />
                </label>
              </div>
            </section>

            <section className="consultation-section">
              <label>
                Observaciones
                <textarea
                  value={observations}
                  onChange={(event) => setObservations(event.target.value)}
                  disabled={isCompleted}
                  placeholder="Escribí las observaciones de la consulta..."
                />
              </label>
            </section>

            {!isCompleted && previousMedications.length > 0 && (
              <section className="consultation-section consultation-copy-section">
                <button className="btn" type="button" onClick={copyPreviousMedications}>
                  Copiar medicaciones anteriores
                </button>
              </section>
            )}

            <section className="consultation-section">
              <div className="section-heading-inline">
                <div>
                  <h2>Medicaciones</h2>
                  <p className="muted">Podés cargar de 1 a 5. Los campos vacíos no se guardan.</p>
                </div>
              </div>
              <div className="med-fields">
                {medications.map((medication, index) => (
                  <div className="med-row" key={index}>
                    <div className="med-num">{index + 1}</div>
                    <input
                      value={medication}
                      disabled={isCompleted}
                      placeholder={`Medicación ${index + 1}`}
                      onChange={(event) => setMedications((current) => current.map((value, i) => i === index ? event.target.value : value))}
                    />
                  </div>
                ))}
              </div>
            </section>

            {!isCompleted && (
              <div className="actions consultation-actions">
                <button className="btn" disabled={saving} onClick={() => save(false)}>Guardar borrador</button>
                <button className="btn btn-primary" disabled={saving} onClick={() => save(true)}>Finalizar consulta</button>
              </div>
            )}

            {message && (
              <div className={`notice ${message.includes("guardada") || message.includes("copiadas") ? "success" : "error"}`}>
                {message}
              </div>
            )}
          </section>
        </main>

        <aside className="consultation-side-column">
          <section className="card previous-consultation consultation-previous-card">
            <div className="previous-heading">
              <h2>Consulta anterior</h2>
              {previousConsultation && <span className="muted">{previousConsultation.date}</span>}
            </div>

            {previousConsultation ? (
              <>
                <div className="clinical-summary-grid consultation-previous-summary">
                  <div><span className="muted">AF</span><strong>{formatScale(previousConsultation.actividadFisica)}</strong></div>
                  <div><span className="muted">C</span><strong>{formatScale(previousConsultation.catarsis)}</strong></div>
                  <div><span className="muted">D</span><strong>{formatScale(previousConsultation.diuresis)}</strong></div>
                  <div><span className="muted">A</span><strong>{formatScale(previousConsultation.ansiedad)}</strong></div>
                  <div><span className="muted">T/A</span><strong>{previousConsultation.tensionArterial || "—"}</strong></div>
                  <div><span className="muted">Peso</span><strong>{previousConsultation.peso === null ? "—" : `${previousConsultation.peso} kg`}</strong></div>
                </div>

                <div className="previous-observations">
                  <strong>Observaciones</strong>
                  <p>{previousConsultation.observations || "Sin observaciones."}</p>
                </div>

                <div className="previous-medications">
                  <strong>Medicaciones</strong>
                  <ul className="med-list">
                    {previousConsultation.medications.length === 0 && <li>Sin medicaciones cargadas</li>}
                    {previousConsultation.medications.map((name) => <li key={name}>{name}</li>)}
                  </ul>
                </div>
              </>
            ) : (
              <p className="muted">Este paciente no tiene una consulta anterior finalizada.</p>
            )}
          </section>

          <section className="card recent-medications-card consultation-recent-card">
            <h2>Medicaciones recientes del paciente</h2>
            <p className="muted">Resumen de las últimas 3 consultas finalizadas.</p>
            <ul className="med-list">
              {recentMedicationNames.length === 0 && <li>Sin medicaciones previas</li>}
              {recentMedicationNames.map((name) => <li key={name}>{name}</li>)}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
