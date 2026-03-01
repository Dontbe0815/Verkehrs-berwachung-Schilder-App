export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/session";
import { readSettings, writeSettings } from "@/lib/db";
import type { AppSettings } from "@/lib/types";

export async function GET() {
  const s = getSessionFromCookies();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const settings = await readSettings();
    return NextResponse.json(settings);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Read failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const s = getSessionFromCookies();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as AppSettings | null;
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  try {
    const saved = await writeSettings(body);
    return NextResponse.json(saved);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
