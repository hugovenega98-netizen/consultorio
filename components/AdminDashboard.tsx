"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Role = "RECEPTION" | "DOCTOR" | "ADMIN";
type UserRow = { id: string; username: string; displayName: string; role: Role; active: boolean };

export function AdminDashboard({ initialUsers, currentUserId }: { initialUsers: UserRow[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", displayName: "", password: "", role: "RECEPTION" as Role });

  async function refreshUsers() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    if (response.ok) setUsers((await response.json()).users);
  }

  useEffect(() => { refreshUsers(); }, []);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setMessage("");
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(result.error ?? "No se pudo crear el usuario.");
    setForm({ username: "", displayName: "", password: "", role: "RECEPTION" });
    setMessage("Usuario creado.");
    await refreshUsers();
  }

  async function updateUser(user: UserRow, changes: Partial<UserRow> & { password?: string }) {
    setLoading(true); setMessage("");
    const response = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(result.error ?? "No se pudo actualizar el usuario.");
    setMessage("Usuario actualizado.");
    await refreshUsers();
  }

  async function changePassword(user: UserRow) {
    const password = window.prompt(`Nueva contraseña para ${user.username} (mínimo 6 caracteres):`);
    if (!password) return;
    await updateUser(user, { password });
  }

  async function renameUser(user: UserRow) {
    const displayName = window.prompt(`Nombre visible para ${user.username}:`, user.displayName);
    if (!displayName || displayName.trim() === user.displayName) return;
    await updateUser(user, { displayName: displayName.trim() });
  }

  async function clearQueue() {
    if (!window.confirm("¿Limpiar toda la queue? Las consultas activas se cancelarán, sin borrar pacientes ni consultas finalizadas.")) return;
    setLoading(true); setMessage("");
    const response = await fetch("/api/queue", { method: "DELETE" });
    const result = await response.json();
    setLoading(false);
    setMessage(response.ok ? `Queue limpiada: ${result.deleted} entrada(s).` : (result.error ?? "No se pudo limpiar la queue."));
  }

  return (
    <div>
      <div className="page-heading">
        <div><h1>Administración</h1><p className="muted">Usuarios, accesos, exportaciones y mantenimiento.</p></div>
        <div className="actions" style={{ marginTop: 0 }}>
          <Link className="btn" href="/reception">Pacientes</Link>
          <a className="btn" href="/api/export/today">Exportar Word</a>
          <a className="btn" href="/api/export/today/pdf">Exportar PDF</a>
          <button className="btn btn-danger" type="button" disabled={loading} onClick={clearQueue}>Limpiar queue</button>
        </div>
      </div>

      {message && <div className={`notice ${message.includes("actualizado") || message.includes("creado") || message.includes("limpiada") ? "success" : "error"}`}>{message}</div>}

      <div className="grid grid-2 reception-grid">
        <section className="card">
          <h2>Nuevo usuario</h2>
          <form onSubmit={createUser}>
            <div className="form-grid">
              <label>Usuario<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></label>
              <label>Nombre visible<input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required /></label>
              <label>Contraseña<input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
              <label>Rol
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                  <option value="RECEPTION">Recepción</option><option value="DOCTOR">Doctor</option><option value="ADMIN">Admin</option>
                </select>
              </label>
            </div>
            <div className="actions"><button className="btn btn-primary" disabled={loading}>Crear usuario</button></div>
          </form>
        </section>

        <section className="card">
          <h2>Roles</h2>
          <p><strong>Recepción:</strong> pacientes, cola, repeticiones y exportaciones.</p>
          <p><strong>Doctor:</strong> puesto de consulta y botón Siguiente.</p>
          <p><strong>Admin:</strong> usuarios, pacientes en supervisión, exportaciones y limpieza de queue.</p>
        </section>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Usuarios</h2>
        <div className="user-list">
          {users.map((user) => (
            <div className="user-row" key={user.id}>
              <div><strong>{user.displayName}</strong><div className="muted">@{user.username}{user.id === currentUserId ? " · vos" : ""}</div></div>
              <select value={user.role} disabled={user.id === currentUserId} onChange={(e) => updateUser(user, { role: e.target.value as Role })}>
                <option value="RECEPTION">Recepción</option><option value="DOCTOR">Doctor</option><option value="ADMIN">Admin</option>
              </select>
              <span className={`badge ${user.active ? "done" : ""}`}>{user.active ? "ACTIVO" : "INACTIVO"}</span>
              <div className="actions row-actions">
                <button className="btn" type="button" onClick={() => renameUser(user)}>Renombrar</button>
                <button className="btn" type="button" onClick={() => changePassword(user)}>Cambiar clave</button>
                <button className="btn" type="button" disabled={user.id === currentUserId} onClick={() => updateUser(user, { active: !user.active })}>{user.active ? "Desactivar" : "Activar"}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
