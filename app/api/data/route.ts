export const runtime = "nodejs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { readAll, readBBox, applySnapshotWrite } from "@/lib/db";
import type { AppData } from "@/lib/types";

const forbid = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function GET(req: NextRequest) {
  const s = getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const bbox = sp.get("bbox"); // "minLng,minLat,maxLng,maxLat"
  try {
    if (bbox) {
      const parts = bbox.split(",").map((x) => Number(x.trim()));
      if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
        return NextResponse.json({ error: "Invalid bbox" }, { status: 400 });
      }
      const minLng = parts[0]!;
      const minLat = parts[1]!;
      const maxLng = parts[2]!;
      const maxLat = parts[3]!;
      const data = await readBBox({ minLat, minLng, maxLat, maxLng });
      return NextResponse.json({ mode: "bbox", bbox, data });
    }
    const data = await readAll();
    return NextResponse.json({ mode: "all", data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Read failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const s = getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowDeletes = s.role === "admin";
  if (s.role === "spectator") return forbid();

  try {
    const body = (await req.json().catch(() => null)) as any;
    const mode = body?.mode === "full" ? "full" : "partial";
    const next: AppData | null = (body?.data && typeof body.data === "object") ? body.data : (body && typeof body === "object" && body.locations ? body : null);
    if (!next) return NextResponse.json({ error: "Bad payload" }, { status: 400 });

    // IMPORTANT for viewport-loading: default is partial snapshot => NO deleteMissing
    await applySnapshotWrite(next, mode === "full" && allowDeletes);

    return NextResponse.json({ ok: true, mode });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
