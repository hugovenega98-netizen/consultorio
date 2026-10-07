import { redirect } from "next/navigation";
import { getCurrentUser, homeForRole, type AppRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role as AppRole));

  const { error } = await searchParams;

  return (
    <div className="login-wrap">
      <section className="card login-card">
        <div className="login-mark">C</div>
        <h1>Consultorio</h1>
        <p className="muted">Ingresá con el usuario correspondiente a tu puesto.</p>
        {error && <div className="notice error">Usuario o contraseña incorrectos.</div>}
        <form action="/api/auth/login" method="post">
          <label>Usuario
            <input name="username" autoComplete="username" required autoFocus />
          </label>
          <label style={{ marginTop: 14 }}>Contraseña
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="btn btn-primary btn-large" style={{ marginTop: 18 }} type="submit">INGRESAR</button>
        </form>
      </section>
    </div>
  );
}
