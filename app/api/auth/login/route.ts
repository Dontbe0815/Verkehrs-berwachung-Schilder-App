export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { validateLogin } from "@/lib/users";
import { sign, setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  const secret = process.env.JWT_SECRET || "";
  if (!secret) return NextResponse.json({ error: "JWT_SECRET missing" }, { status: 500 });

  const body = await req.json().catch(() => null) as { username?: string; password?: string } | null;
  const username = (body?.username || "").trim();
  const password = body?.password || "";

  const v = validateLogin(username, password);
  if (!v.ok || !v.role) return NextResponse.json({ error: "Ungültige Zugangsdaten" }, { status: 401 });

  const now = Math.floor(Date.now() / 1000);
  const token = sign({ sub: username, role: v.role, iat: now, exp: now + 60 * 60 * 24 * 30 }, secret);
  setSessionCookie(token);
  return NextResponse.json({ ok: true, role: v.role });
}
