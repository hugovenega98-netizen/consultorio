import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consultorio · Pacientes y consultas",
  description: "Gestión de pacientes, consultas, repeticiones y cola de atención",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="es">
      <body>
        {user && (
          <header className="topbar">
            <Link href={user.role === "DOCTOR" ? "/doctor" : "/reception"} className="brand">Consultorio</Link>
            <nav>
              {user.role === "RECEPTION" && (
                <>
                  <Link href="/reception">Pacientes</Link>
                  <Link href="/reception/repetitions">Repeticiones</Link>
                  <a href="/api/export/today">Exportar hoy</a>
                </>
              )}
              {user.role === "DOCTOR" && <Link href="/doctor">Consulta</Link>}
              <span className="role-pill">{user.role === "DOCTOR" ? "Doctor" : "Recepción"}</span>
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
