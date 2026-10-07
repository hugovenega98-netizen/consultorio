import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consultorio · Pacientes y consultas",
  description: "MVP de gestión de pacientes, consultas y cola de atención",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">Consultorio</Link>
          <nav>
            <Link href="/">Cola</Link>
            <Link href="/patients">Pacientes</Link>
            <a href="/api/export/today">Exportar hoy</a>
          </nav>
        </header>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
