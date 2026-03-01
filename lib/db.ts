import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { AppData, Location, Sign, Zone, AppSettings } from "@/lib/types";

const DUISBURG: AppSettings = {
  defaultCity: "Duisburg",
  defaultLat: 51.4344,
  defaultLng: 6.7623,
  defaultZoom: 12,
  updatedAt: new Date().toISOString()
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function isPastDate(isoDate: string): boolean {
  // isoDate: YYYY-MM-DD
  return isoDate < todayISO();
}

export async function readSettings(): Promise<AppSettings> {
  const sb = supabaseAdmin();
  const res = await sb.from("app_settings").select("*").eq("id", 1).maybeSingle();
  if (res.error) throw new Error(res.error.message);
  if (!res.data) return DUISBURG;
  return {
    defaultCity: res.data.default_city,
    defaultLat: res.data.default_lat,
    defaultLng: res.data.default_lng,
    defaultZoom: res.data.default_zoom,
    updatedAt: res.data.updated_at
  };
}

export async function writeSettings(next: AppSettings): Promise<AppSettings> {
  const sb = supabaseAdmin();
  const row = {
    id: 1,
    default_city: next.defaultCity,
    default_lat: next.defaultLat,
    default_lng: next.defaultLng,
    default_zoom: next.defaultZoom,
    updated_at: new Date().toISOString()
  };
  const res = await sb.from("app_settings").upsert(row, { onConflict: "id" }).select("*").maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return {
    defaultCity: res.data!.default_city,
    defaultLat: res.data!.default_lat,
    defaultLng: res.data!.default_lng,
    defaultZoom: res.data!.default_zoom,
    updatedAt: res.data!.updated_at
  };
}

async function autoExpireMobileSigns(): Promise<void> {
  const sb = supabaseAdmin();
  // Find mobile signs that have expired but are still marked active.
  const res = await sb
    .from("signs")
    .select("id, expires_at, is_temporary, state")
    .eq("is_temporary", true)
    .eq("state", "active");
  if (res.error) throw new Error(res.error.message);

  const toExpire = (res.data ?? [])
    .filter((r: any) => r.expires_at && isPastDate(String(r.expires_at)))
    .map((r: any) => r.id);

  if (toExpire.length === 0) return;

  const upd = await sb
    .from("signs")
    .update({ state: "expired", updated_at: new Date().toISOString() })
    .in("id", toExpire);

  if (upd.error) throw new Error(upd.error.message);
}

export async function readAll(): Promise<AppData> {
  const sb = supabaseAdmin();

  // Ensure expired mobile signs flip automatically.
  await autoExpireMobileSigns().catch(() => undefined);

  const [settings, locRes, signRes, zoneRes] = await Promise.all([
    readSettings(),
    sb.from("locations").select("*").order("updated_at", { ascending: false }),
    sb.from("signs").select("*").order("updated_at", { ascending: false }),
    sb.from("zones").select("*").order("updated_at", { ascending: false })
  ]);

  if (locRes.error) throw new Error(locRes.error.message);
  if (signRes.error) throw new Error(signRes.error.message);
  if (zoneRes.error) throw new Error(zoneRes.error.message);

  const locations: Location[] = (locRes.data ?? []).map((r: any) => ({
    id: r.id,
    lat: r.lat,
    lng: r.lng,
    street: r.street,
    status: r.status,
    lastVerified: r.last_verified ? String(r.last_verified) : null
  }));

  const signs: Sign[] = (signRes.data ?? []).map((r: any) => ({
    id: r.id,
    locationId: r.location_id,
    mainCode: r.main_code,
    mainLabel: r.main_label,
    direction: r.direction,
    validity: r.validity,
    additional: Array.isArray(r.additional) ? r.additional : [],
    notes: r.notes,
    confidence: r.confidence,
    isTemporary: Boolean(r.is_temporary),
    expiresAt: r.expires_at ? String(r.expires_at) : null,
    state: (r.state === "expired" ? "expired" : "active"),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));

  const zones: Zone[] = (zoneRes.data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    rules: r.rules,
    geojson: r.geojson,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));

  return { version: 1, updatedAt: new Date().toISOString(), settings, locations, signs, zones };
}

async function upsertLocations(locations: Location[]) {
  const sb = supabaseAdmin();
  const rows = locations.map((l) => ({
    id: l.id,
    lat: l.lat,
    lng: l.lng,
    street: l.street,
    status: l.status,
    last_verified: l.lastVerified,
    updated_at: new Date().toISOString()
  }));
  const res = await sb.from("locations").upsert(rows, { onConflict: "id" });
  if (res.error) throw new Error(res.error.message);
}

async function upsertSigns(signs: Sign[]) {
  const sb = supabaseAdmin();
  const rows = signs.map((s) => ({
    id: s.id,
    location_id: s.locationId,
    main_code: s.mainCode,
    main_label: s.mainLabel,
    direction: s.direction,
    validity: s.validity,
    additional: s.additional,
    notes: s.notes,
    confidence: s.confidence,
    is_temporary: s.isTemporary,
    expires_at: s.expiresAt,
    state: s.state,
    updated_at: new Date().toISOString()
  }));
  const res = await sb.from("signs").upsert(rows, { onConflict: "id" });
  if (res.error) throw new Error(res.error.message);
}

async function upsertZones(zones: Zone[]) {
  const sb = supabaseAdmin();
  const rows = zones.map((z) => ({
    id: z.id,
    name: z.name,
    description: z.description,
    rules: z.rules,
    geojson: z.geojson,
    updated_at: new Date().toISOString()
  }));
  const res = await sb.from("zones").upsert(rows, { onConflict: "id" });
  if (res.error) throw new Error(res.error.message);
}

async function deleteMissing(table: "locations" | "signs" | "zones", keepIds: string[]) {
  const sb = supabaseAdmin();
  if (keepIds.length === 0) {
    const res = await sb.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (res.error) throw new Error(res.error.message);
    return;
  }
  const res = await sb.from(table).delete().not("id", "in", `(${keepIds.join(",")})`);
  if (res.error) throw new Error(res.error.message);
}

export async function applySnapshot(next: AppData, allowDeletes: boolean): Promise<AppData> {
  // Settings can be updated independently elsewhere; we accept it here too.
  await writeSettings(next.settings).catch(() => undefined);

  // Upsert first to satisfy FKs (locations before signs)
  await upsertLocations(next.locations);
  await upsertZones(next.zones);
  await upsertSigns(next.signs);

  if (allowDeletes) {
    await deleteMissing("signs", next.signs.map((s) => `'${s.id}'`));
    await deleteMissing("zones", next.zones.map((z) => `'${z.id}'`));
    await deleteMissing("locations", next.locations.map((l) => `'${l.id}'`));
  }

  return readAll();
}
