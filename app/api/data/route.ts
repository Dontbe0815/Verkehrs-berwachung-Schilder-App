export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/session";
import { readAll, applySnapshot } from "@/lib/db";
import type { AppData } from "@/lib/types";

const forbid = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function GET() {
  const s = getSessionFromCookies();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = await readAll();
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Read failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const s = getSessionFromCookies();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role === "spectator") return forbid();

  const body = (await req.json().catch(() => null)) as AppData | null;
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  try {
    const allowDeletes = s.role === "admin";
    const saved = await applySnapshot(body, allowDeletes);
    return NextResponse.json(saved);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
