import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedRoles = new Set(["RECEPTION", "DOCTOR", "ADMIN"]);

export async function GET() {
  const auth = await getApiUser(["ADMIN"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
    select: { id: true, username: true, displayName: true, role: true, active: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json({ users, currentUserId: auth.user.id });
}

export async function POST(request: NextRequest) {
  const auth = await getApiUser(["ADMIN"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const username = String(body.username ?? "").trim().toLowerCase();
  const displayName = String(body.displayName ?? "").trim();
  const password = String(body.password ?? "");
  const role = String(body.role ?? "").toUpperCase();

  if (!/^[a-z0-9._-]{3,40}$/.test(username)) return NextResponse.json({ error: "Usuario inválido. Usá al menos 3 caracteres sin espacios." }, { status: 400 });
  if (!displayName) return NextResponse.json({ error: "El nombre visible es obligatorio." }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  if (!allowedRoles.has(role)) return NextResponse.json({ error: "Rol inválido." }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: "Ese nombre de usuario ya existe." }, { status: 409 });

  const user = await prisma.user.create({
    data: { username, displayName, passwordHash: hashPassword(password), role: role as "RECEPTION" | "DOCTOR" | "ADMIN" },
    select: { id: true, username: true, displayName: true, role: true, active: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json({ user }, { status: 201 });
}
