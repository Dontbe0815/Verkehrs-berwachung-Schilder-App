"use client";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, H2, Muted, Pill } from "@/components/ui";
import type { AppData, Location, Zone } from "@/lib/types";
import FiltersPanel, { Filters } from "@/components/FiltersPanel";
import LocationPanel from "@/components/LocationPanel";
import ZonesPanel from "@/components/ZonesPanel";
import SettingsPanel from "@/components/SettingsPanel";
import Toast, { type ToastState } from "@/components/Toast";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type Me = { username: string; role: "admin" | "creator" | "spectator" } | null;

export default function AppShell() {
  const [me, setMe] = useState<Me>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<ToastState>({ open: false, message: "" });
const [lastBBox, setLastBBox] = useState<string>("");

function mergeData(current: AppData | null, incoming: AppData): AppData {
  if (!current) return incoming;
  const locMap = new Map(current.locations.map((l) => [l.id, l]));
  for (const l of incoming.locations) locMap.set(l.id, l);
  const signMap = new Map(current.signs.map((s) => [s.id, s]));
  for (const s of incoming.signs) signMap.set(s.id, s);
  const zoneMap = new Map(current.zones.map((z) => [z.id, z]));
  for (const z of incoming.zones) zoneMap.set(z.id, z);
  return { ...current, settings: incoming.settings ?? current.settings, locations: Array.from(locMap.values()), signs: Array.from(signMap.values()), zones: Array.from(zoneMap.values()), updatedAt: new Date().toISOString() };
}

async function fetchBBox(bbox: string) {
  // avoid spamming identical bbox
  if (!bbox || bbox === lastBBox) return;
  setLastBBox(bbox);
  try {
    const res = await fetch(`/api/data?bbox=${encodeURIComponent(bbox)}`, { cache: "no-store" });
    if (!res.ok) return;
    const j = await res.json();
    const incoming = j.data ?? j;
    setData((cur) => mergeData(cur, incoming));
  } catch {
    // ignore transient viewport load errors
  }
}
  const undoRef = (globalThis as any).__vz_undo_ref ?? { prev: null as any, label: "" };
  (globalThis as any).__vz_undo_ref = undoRef;

  const [filters, setFilters] = useState<Filters>({ q: "", status: "all", signCode: "all", includeExpired: false });
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"location" | "zones" | "settings">("location");

  const role = me?.role ?? "spectator";
  const canCreate = role === "admin" || role === "creator";
  const canDelete = role === "admin";

  async function loadAll() {
  setLoading(true); setError("");
  try {
    const [meRes] = await Promise.all([
      fetch("/api/auth/me", { cache:"no-store" })
    ]);
    if (meRes.ok) setMe(await meRes.json());

    // initial viewport around default city (Duisburg) with ~0.25° padding
    const init = { lat: 51.4344, lng: 6.7623, pad: 0.25 };
    const bbox = `${init.lng - init.pad},${init.lat - init.pad},${init.lng + init.pad},${init.lat + init.pad}`;
    const dataRes = await fetch(`/api/data?bbox=${encodeURIComponent(bbox)}`, { cache:"no-store" });
    if (!dataRes.ok) { const j = await dataRes.json().catch(() => ({})); throw new Error(j?.error || "Data load failed"); }
    const j = await dataRes.json();
    setData(j.data ?? j); // backward compatible
    setLastBBox(bbox);
  } catch (e) {
    setError(e instanceof Error ? e.message : "Unbekannter Fehler");
  } finally { setLoading(false); }
}

// Optimistic apply (UI updates immediately) + background sync (debounced)
function apply(next: AppData, opts?: { undoLabel?: string; prev?: AppData }) {
  if (opts?.undoLabel && opts?.prev) {
    undoRef.prev = opts.prev;
    undoRef.label = opts.undoLabel;
    setToast({ open: true, message: `${opts.undoLabel}.`, actionLabel: "Rückgängig", kind: "info", onAction: () => { setData(opts.prev); } });
  }
  setData(next);
}

async function syncToServer(snapshot: AppData) {
  setSyncing(true); setError("");
  try {
    const r = await fetch("/api/data", { method:"PUT", headers:{ "content-type":"application/json" }, body: JSON.stringify(snapshot) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || "Save failed");
    setData(j);
    setToast({ open: true, message: "Gespeichert.", kind: "success" });
  } catch (e) {
    setError(e instanceof Error ? e.message : "Save failed");
    setToast({ open: true, message: "Speichern fehlgeschlagen. Prüfe Verbindung/Env.", kind: "error" });
  } finally {
    setSyncing(false);
  }
}

// Debounce background sync when data changes due to apply()
useEffect(() => {
  if (!data) return;
  if (loading) return;
  if (!canCreate) return;
  const t = setTimeout(() => { void syncToServer(data); }, 900);
  return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [data]);


  
  useEffect(() => { void loadAll(); }, []);

  const settings = data?.settings ?? { defaultCity: "Duisburg", defaultLat: 51.4344, defaultLng: 6.7623, defaultZoom: 12, updatedAt: new Date().toISOString() };
  const locations = data?.locations ?? [];
  const signs = data?.signs ?? [];
  const zones = data?.zones ?? [];

  const filteredLocations = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return locations.filter((loc) => {
      if (filters.status !== "all" && loc.status !== filters.status) return false;

      const locSigns = signs.filter((s) => s.locationId === loc.id);
      const visibleSigns = filters.includeExpired ? locSigns : locSigns.filter((s) => s.state !== "expired");

      if (filters.signCode !== "all") {
        const has = visibleSigns.some((s) => s.mainCode === filters.signCode);
        if (!has) return false;
      }
      if (q) {
        const inStreet = (loc.street ?? "").toLowerCase().includes(q);
        const inSigns = visibleSigns.some((s) => (s.mainCode + " " + s.mainLabel + " " + (s.notes ?? "")).toLowerCase().includes(q));
        if (!inStreet && !inSigns) return false;
      }
      return true;
    });
  }, [locations, signs, filters]);

  const selectedLocation = useMemo(() => locations.find((l) => l.id === selectedLocationId) ?? null, [locations, selectedLocationId]);
  const selectedSigns = useMemo(() => {
    if (!selectedLocation) return [];
    const all = signs.filter((s) => s.locationId === selectedLocation.id);
    return filters.includeExpired ? all : all.filter((s) => s.state !== "expired");
  }, [signs, selectedLocation, filters.includeExpired]);

  if (!data) {
    return <div className="p-4"><Card><H2>Lade…</H2><Muted className="mt-2">Falls das hängen bleibt: Supabase Env Vars prüfen.</Muted></Card></div>;
  }

  return (
    <div className="grid min-h-[calc(100vh-56px)] grid-cols-1 lg:grid-cols-[1fr_460px]">
      <div className="relative">
        <MapView
          settings={settings}
          role={role}
          canCreate={canCreate}
          locations={filteredLocations}
          zones={zones}
          selectedLocationId={selectedLocationId}
          onSelectLocation={(id) => { setSelectedLocationId(id); setPanel("location"); }}
          onCreateLocation={(loc: Location) => { apply({ ...data, locations: [loc, ...data.locations] }); }}
          onCreateZone={(zone: Zone) => { apply({ ...data, zones: [zone, ...data.zones] }); }}
          onViewportChanged={(bbox) => { void fetchBBox(bbox); }}
        />
      </div>

      <aside className="hidden border-l border-zinc-800 bg-zinc-950/60 p-4 lg:block">
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <H2>Status</H2>
                <Muted className="mt-1">{(loading || syncing) ? "Arbeite..." : `Start: ${settings.defaultCity}`}</Muted>
              </div>
              <Pill>{role}</Pill>
            </div>
            {error ? <div className="mt-3 rounded-2xl border border-rose-800 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div> : null}
            <div className="mt-4"><FiltersPanel value={filters} onChange={setFilters} /></div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant={panel === "location" ? "primary" : "ghost"} onClick={() => setPanel("location")}>Standort</Button>
              <Button variant={panel === "zones" ? "primary" : "ghost"} onClick={() => setPanel("zones")}>Zonen</Button>
              <Button variant={panel === "settings" ? "primary" : "ghost"} onClick={() => setPanel("settings")} disabled={role !== "admin"}>Einstellungen</Button>
            </div>
            <Muted className="mt-3 text-xs">Mobile Schilder laufen nach Ablauf automatisch ab (expired).</Muted>
          </Card>

          {panel === "location" ? (
            selectedLocation ? (
              <LocationPanel role={role} canCreate={canCreate} canDelete={canDelete} data={data} location={selectedLocation} signs={selectedSigns} onSave={apply} />
            ) : (
              <Card><H2>Keine Auswahl</H2><Muted className="mt-2">Marker anklicken oder „Standort +“ nutzen.</Muted></Card>
            )
          ) : panel === "zones" ? (
            <ZonesPanel role={role} canDelete={canDelete} data={data} zones={zones} onSave={apply} />
          ) : (
            <SettingsPanel role={role} settings={settings} onSaved={(s) => apply({ ...data, settings: s })} />
          )}
        </div>
      </aside>

      <MobileSheet role={role} canCreate={canCreate} canDelete={canDelete} loading={loading} error={error} filters={filters} setFilters={setFilters} panel={panel} setPanel={setPanel} data={data} selectedLocation={selectedLocation} selectedSigns={selectedSigns} zones={zones} settings={settings} onSave={apply} />
    </div>
  );
}

function MobileSheet(props: any) {
  const [open, setOpen] = useState(true);
  const { role, canCreate, canDelete, loading, error, filters, setFilters, panel, setPanel, data, selectedLocation, selectedSigns, zones, settings, onSave } = props;

  return (
    <div className="lg:hidden">
      <div className={`fixed bottom-0 left-0 right-0 z-[1200] safe-bottom ${open ? "" : "pointer-events-none"}`}>
        <div className={`mx-auto max-w-xl px-3 pb-3 transition ${open ? "translate-y-0" : "translate-y-[85%]"}`}>
          <div className="rounded-t-3xl border border-zinc-800 bg-zinc-950/85 shadow-soft backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-10 rounded-full bg-zinc-700" />
                <Pill>{role}</Pill>
              </div>
              <Button variant="ghost" onClick={() => setOpen((v: boolean) => !v)}>{open ? "Zu" : "Auf"}</Button>
            </div>

            <div className="px-4 pb-4">
              <Muted>{(loading || syncing) ? "Arbeite..." : `Start: ${settings.defaultCity}`}</Muted>
              {error ? <div className="mt-3 rounded-2xl border border-rose-800 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div> : null}
              <div className="mt-3"><FiltersPanel value={filters} onChange={setFilters} /></div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant={panel === "location" ? "primary" : "ghost"} onClick={() => setPanel("location")}>Standort</Button>
                <Button variant={panel === "zones" ? "primary" : "ghost"} onClick={() => setPanel("zones")}>Zonen</Button>
                <Button variant={panel === "settings" ? "primary" : "ghost"} onClick={() => setPanel("settings")} disabled={role !== "admin"}>Einstellungen</Button>
              </div>

              <div className="mt-4">
                {panel === "location" ? (
                  selectedLocation ? (
                    <LocationPanel role={role} canCreate={canCreate} canDelete={canDelete} data={data} location={selectedLocation} signs={selectedSigns} onSave={onSave} />
                  ) : (
                    <Card className="p-3"><H2>Keine Auswahl</H2><Muted className="mt-1">Marker anklicken oder hinzufügen.</Muted></Card>
                  )
                ) : panel === "zones" ? (
                  <ZonesPanel role={role} canDelete={canDelete} data={data} zones={zones} onSave={onSave} />
                ) : (
                  <SettingsPanel role={role} settings={settings} onSaved={(s) => onSave({ ...data, settings: s })} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
