"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatDni } from "@/lib/format";

type Patient = {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  phone: string;
};

export function GlobalPatientSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/patients?q=${encodeURIComponent(term)}&limit=8`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        setResults(data.patients ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="global-search" ref={wrapRef}>
      <input
        aria-label="Buscar paciente"
        placeholder="Buscar paciente..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && (
        <div className="global-search-results">
          {loading && <div className="global-search-empty">Buscando...</div>}
          {!loading && results.length === 0 && <div className="global-search-empty">Sin resultados</div>}
          {!loading && results.map((patient) => (
            <Link
              key={patient.id}
              href={`/patients/${patient.id}`}
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
            >
              <strong>{patient.lastName}, {patient.firstName}</strong>
              <span>DNI {formatDni(patient.dni)}{patient.phone ? ` · ${patient.phone}` : ""}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
