import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, homeForRole, type AppRole } from "@/lib/auth";
import { GlobalPatientSearch } from "@/components/GlobalPatientSearch";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consultorio · Pacientes y consultas",
  description: "Gestión de pacientes, consultas, repeticiones y cola de atención",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const role = user?.role as AppRole | undefined;

  return (
    <html lang="es">
      <body>
        {user && role && (
          <header className="topbar">
            <Link href={homeForRole(role)} className="brand">Consultorio</Link>
            {(role === "RECEPTION" || role === "ADMIN") && <GlobalPatientSearch />}
            <nav>
              {role === "RECEPTION" && (
                <>
                  <Link href="/reception">Pacientes</Link>
                  <Link href="/reception/repetitions">Repeticiones</Link>
                  <a href="/api/export/today">Word</a>
                  <a href="/api/export/today/pdf">PDF</a>
                </>
              )}
              {role === "DOCTOR" && <Link href="/doctor">Consulta</Link>}
              {role === "ADMIN" && (
                <>
                  <Link href="/admin">Admin</Link>
                  <Link href="/reception">Pacientes</Link>
                  <Link href="/reception/repetitions">Repeticiones</Link>
                  <a href="/api/export/today">Word</a>
                  <a href="/api/export/today/pdf">PDF</a>
                </>
              )}
              <span className="role-pill">{role === "DOCTOR" ? "Doctor" : role === "ADMIN" ? "Admin" : "Recepción"}</span>
              <form action="/api/auth/logout" method="post">
                <button className="link-button" type="submit">Salir</button>
              </form>
            </nav>
          </header>
        )}
        <main className={user ? "shell" : "shell shell-login"}>{children}</main>
      </body>
    </html>
  );
}
