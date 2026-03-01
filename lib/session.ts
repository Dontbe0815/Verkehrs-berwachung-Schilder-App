import crypto from "crypto";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export type Role = "admin" | "creator" | "spectator";
export type Session = { sub: string; role: Role; iat: number; exp: number };

const COOKIE = "vz_session";

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function b64urlToBuf(s: string): Buffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

export function sign(payload: object, secret: string): string {
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const data = `${header}.${body}`;
  const sig = b64url(crypto.createHmac("sha256", secret).update(data).digest());
  return `${data}.${sig}`;
}

export function verify(token: string, secret: string): Session | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, b, s] = parts;
  const data = `${h}.${b}`;
  const expected = b64url(crypto.createHmac("sha256", secret).update(data).digest());
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(s))) return null;

  try {
    const payload = JSON.parse(b64urlToBuf(b).toString("utf-8")) as Session;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string): void {
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
}
export function clearSessionCookie(): void {
  cookies().set(COOKIE, "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
}

export function getSessionFromRequest(req: NextRequest): Session | null {
  const secret = process.env.JWT_SECRET || "";
  if (!secret) return null;
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  return verify(token, secret);
}
export function getSessionFromCookies(): Session | null {
  const secret = process.env.JWT_SECRET || "";
  if (!secret) return null;
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verify(token, secret);
}
