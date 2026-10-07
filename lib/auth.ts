import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type AppRole = "RECEPTION" | "DOCTOR" | "ADMIN";

const COOKIE_NAME = "consultorio_session";
const SESSION_DAYS = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function homeForRole(role: AppRole) {
  if (role === "DOCTOR") return "/doctor";
  if (role === "ADMIN") return "/admin";
  return "/reception";
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  return { token, expiresAt };
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date() || !session.user.active) return null;
  return session.user;
}

export async function requirePageUser(roles?: AppRole[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role as AppRole)) redirect(homeForRole(user.role as AppRole));
  return user;
}

export async function getApiUser(roles?: AppRole[]) {
  const user = await getCurrentUser();
  if (!user) return { user: null, status: 401 as const, error: "Sesión vencida. Volvé a iniciar sesión." };
  if (roles && !roles.includes(user.role as AppRole)) return { user: null, status: 403 as const, error: "No tenés permiso para esta acción." };
  return { user, status: 200 as const, error: null };
}

export async function deleteCurrentSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export const sessionCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};
