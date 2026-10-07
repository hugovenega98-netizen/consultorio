import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, sessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
  }

  const { token, expiresAt } = await createSession(user.id);
  const destination = user.role === "DOCTOR" ? "/doctor" : "/reception";
  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.cookies.set(sessionCookie.name, token, { ...sessionCookie.options, expires: expiresAt });
  return response;
}
