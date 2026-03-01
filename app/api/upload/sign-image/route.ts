export const runtime = "nodejs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const s = getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role === "spectator") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Bad form data" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const max = 8 * 1024 * 1024;
  if (file.size > max) return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;

  const sb = supabaseAdmin();
  const up = await sb.storage.from("sign-images").upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: false });
  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

  const pub = sb.storage.from("sign-images").getPublicUrl(path);
  return NextResponse.json({ url: pub.data.publicUrl });
}
