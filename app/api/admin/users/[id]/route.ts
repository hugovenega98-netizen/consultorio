import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const allowedRoles = new Set(["RECEPTION", "DOCTOR", "ADMIN"]);

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getApiUser(["ADMIN"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const body = await request.json();
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Usuario inexistente." }, { status: 404 });

  const displayName = body.displayName === undefined ? target.displayName : String(body.displayName).trim();
  const role = body.role === undefined ? target.role : String(body.role).toUpperCase();
  const active = body.active === undefined ? target.active : Boolean(body.active);
  const password = body.password === undefined ? "" : String(body.password);

  if (!displayName) return NextResponse.json({ error: "El nombre visible es obligatorio." }, { status: 400 });
  if (!allowedRoles.has(role)) return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
  if (password && password.length < 6) return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres." }, { status: 400 });

  if (id === auth.user.id && (!active || role !== "ADMIN")) {
    return NextResponse.json({ error: "No podés desactivar tu propia cuenta ni quitarte el rol ADMIN." }, { status: 400 });
  }

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: {
        displayName,
        role: role as "RECEPTION" | "DOCTOR" | "ADMIN",
        active,
        ...(password ? { passwordHash: hashPassword(password) } : {}),
      },
      select: { id: true, username: true, displayName: true, role: true, active: true, createdAt: true, updatedAt: true },
    });

    if (!active || password) {
      // Password changes and deactivation invalidate every open session for that user.
      await tx.session.deleteMany({ where: { userId: id } });
    }
    return updated;
  });

  return NextResponse.json({ user });
}
