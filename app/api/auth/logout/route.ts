import { NextRequest, NextResponse } from "next/server";
import { deleteCurrentSession, sessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await deleteCurrentSession();
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(sessionCookie.name, "", { ...sessionCookie.options, expires: new Date(0) });
  return response;
}
