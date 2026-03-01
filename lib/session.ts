import crypto from "crypto";
import type { NextRequest } from "next/server";

export type Role = "admin" | "creator" | "spectator";
export type Session = { sub: string; role: Role; iat: number; exp: number };

export const SESSION_COOKIE = "vz_session";

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

  const h = parts[0];
  const b = parts[1];
  const sig = parts[2];
  if (!h || !b || !sig) return null;

  const data = `${h}.${b}`;
  const expected = b64url(crypto.createHmac("sha256", secret).update(data).digest());

  const a = Buffer.from(expected);
  const c = Buffer.from(sig);
  if (a.length !== c.length) return null;
  if (!crypto.timingSafeEqual(a, c)) return null;

  try {
    const payload = JSON.parse(b64urlToBuf(b).toString("utf-8")) as Session;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: NextRequest): Session | null {
  const secret = process.env.JWT_SECRET || "";
  if (!secret) return null;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verify(token, secret);
}
