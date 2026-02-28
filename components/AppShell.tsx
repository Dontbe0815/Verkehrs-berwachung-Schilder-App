"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { LocationRow, SignRow, ZoneRow, ProfileRow } from "@/types/domain";
import { loadSnapshot, saveSnapshot } from "@/lib/storage";
import { Card, H2, Muted, Button, Pill } from "@/components/ui";
import FiltersPanel, { Filters } from "@/components/FiltersPanel";
import LocationPanel from "@/components/LocationPanel";
import ZonesList from "@/components/ZonesList";
import { ensureProfile } from "@/lib/auth";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type DataState = {
  locations: LocationRow[];
  signs: SignRow[];
  zones: ZoneRow[];
};

export default function AppShell() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [data, setData] = useState<DataState>({ locations: [], signs: [], zones: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [filters, setFilters] = useState<Filters>({
    q: "",
    status: "all",
    signCode: "all",
    olderThanMonths: 0
  });

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"location" | "zones">("location");

  const selectedLocation = useMemo(
    () => data.locations.find((l) => l.id === selectedLocationId) ?? null,
    [data.locations, selectedLocationId]
  );

  const selectedSigns = useMemo(
    () => (selectedLocation ? data.signs.filter((s) => s.location_id === selectedLocation.id) : []),
    [data.signs, selectedLocation]
  );

  const filteredLocations = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - (filters.olderThanMonths || 0));

    return data.locations.filter((loc) => {
      if (filters.status !== "all" && loc.status !== filters.status) return false;

      if (filters.olderThanMonths) {
        if (loc.last_verified_at) {
          const d = new Date(loc.last_verified_at);
          if (!(d < cutoff)) return false;
        } // missing date treated as old
      }

      if (filters.signCode !== "all") {
        const has = data.signs.some((s) => s.location_id === loc.id && s.main_sign_code === filters.signCode);
        if (!has) return false;
      }

      if (q) {
        const inStreet = (loc.street_name ?? "").toLowerCase().includes(q);
        const inSigns = data.signs
          .filter((s) => s.location_id === loc.id)
          .some((s) => (s.main_sign_code + " " + s.main_sign_label + " " + (s.notes ?? "")).toLowerCase().includes(q));
        if (!inStreet && !inSigns) return false;
      }

      return true;
    });
  }, [data.locations, data.signs, filters]);

  async function loadAll() {
    setError("");
    setLoading(true);

    const snap = loadSnapshot();

    try {
      const p = await ensureProfile();
      setProfile((p as any) ?? null);

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id ?? null;

      if (!uid || !p) {
        if (snap) {
          setData({
            locations: (snap.locations as LocationRow[]) ?? [],
            signs: (snap.signs as SignRow[]) ?? [],
            zones: (snap.zones as ZoneRow[]) ?? []
          });
        }
        setLoading(false);
        return;
      }

      if (!(p as any).approved) {
        // Pending: no DB access beyond own profile (RLS will block anyway)
        if (snap) {
          setData({
            locations: (snap.locations as LocationRow[]) ?? [],
            signs: (snap.signs as SignRow[]) ?? [],
            zones: (snap.zones as ZoneRow[]) ?? []
          });
        } else {
          setData({ locations: [], signs: [], zones: [] });
        }
        setLoading(false);
        return;
      }

      const [locRes, signRes, zoneRes] = await Promise.all([
        supabase.from("locations").select("*").order("created_at", { ascending: false }),
        supabase.from("signs").select("*").order("created_at", { ascending: false }),
        supabase.from("zones").select("*").order("created_at", { ascending: false })
      ]);

      if (locRes.error) throw locRes.error;
      if (signRes.error) throw signRes.error;
      if (zoneRes.error) throw zoneRes.error;

      const newData: DataState = {
        locations: (locRes.data ?? []) as LocationRow[],
        signs: (signRes.data ?? []) as SignRow[],
        zones: (zoneRes.data ?? []) as ZoneRow[]
      };
      setData(newData);

      saveSnapshot({
        savedAt: new Date().toISOString(),
        locations: newData.locations,
        signs: newData.signs,
        zones: newData.zones
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
      if (snap) {
        setData({
          locations: (snap.locations as LocationRow[]) ?? [],
          signs: (snap.signs as SignRow[]) ?? [],
          zones: (snap.zones as ZoneRow[]) ?? []
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const approved = !!profile?.approved;

  return (
    <div className="grid min-h-[calc(100vh-56px)] grid-cols-1 lg:grid-cols-[1fr_460px]">
      <div className="relative">
        <MapView
          profile={profile}
          locations={filteredLocations}
          zones={data.zones}
          onSelectLocation={(id) => {
            setSelectedLocationId(id);
            setPanel("location");
          }}
          selectedLocationId={selectedLocationId}
          onDataChanged={() => void loadAll()}
        />
      </div>

      {/* Desktop side panel */}
      <aside className="hidden border-l border-zinc-800 bg-zinc-950/60 p-4 lg:block">
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <H2>Status</H2>
                <Muted className="mt-1">
                  {loading
                    ? "Lade Daten..."
                    : !profile
                    ? "Nicht eingeloggt: Offline-Daten werden ggf. angezeigt."
                    : !approved
                    ? "Dein Konto wartet auf Admin-Freigabe."
                    : "Bereit. Du kannst Standorte, Schilder, Fotos und Zonen verwalten."}
                </Muted>
              </div>
              {profile ? <Pill>{approved ? "Freigeschaltet" : "Gesperrt"}</Pill> : null}
            </div>

            {error ? (
              <div className="mt-3 rounded-2xl border border-rose-800 bg-rose-500/10 p-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <div className="mt-4">
              <FiltersPanel value={filters} onChange={setFilters} disabled={!approved} />
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant={panel === "location" ? "primary" : "ghost"} onClick={() => setPanel("location")}>
                Standort
              </Button>
              <Button variant={panel === "zones" ? "primary" : "ghost"} onClick={() => setPanel("zones")}>
                Zonen
              </Button>
            </div>
          </Card>

          {panel === "location" ? (
            selectedLocation ? (
              <LocationPanel
                userId={profile?.id ?? null}
                approved={approved}
                location={selectedLocation}
                signs={selectedSigns}
                onDataChanged={() => void loadAll()}
              />
            ) : (
              <Card>
                <H2>Keine Auswahl</H2>
                <Muted className="mt-2">Marker anklicken oder „Standort hinzufügen“ nutzen.</Muted>
              </Card>
            )
          ) : (
            <ZonesList approved={approved} zones={data.zones} onDataChanged={() => void loadAll()} />
          )}
        </div>
      </aside>

      {/* Mobile bottom sheet */}
      <MobileSheet
        profile={profile}
        approved={approved}
        loading={loading}
        error={error}
        filters={filters}
        setFilters={setFilters}
        panel={panel}
        setPanel={setPanel}
        selectedLocation={selectedLocation}
        selectedSigns={selectedSigns}
        zones={data.zones}
        onDataChanged={() => void loadAll()}
      />
    </div>
  );
}

function MobileSheet({
  profile,
  approved,
  loading,
  error,
  filters,
  setFilters,
  panel,
  setPanel,
  selectedLocation,
  selectedSigns,
  zones,
  onDataChanged
}: any) {
  const [open, setOpen] = useState(true);

  return (
    <div className="lg:hidden">
      <div className={`fixed bottom-0 left-0 right-0 z-[1200] safe-bottom ${open ? "" : "pointer-events-none"}`}>
        <div className={`mx-auto max-w-xl px-3 pb-3 transition ${open ? "translate-y-0" : "translate-y-[85%]"}`}>
          <div className="rounded-t-3xl border border-zinc-800 bg-zinc-950/85 shadow-soft backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-10 rounded-full bg-zinc-700" />
                {profile ? <Pill>{approved ? "Freigeschaltet" : "Wartet"}</Pill> : <Pill>Offline</Pill>}
              </div>
              <Button variant="ghost" onClick={() => setOpen((v) => !v)}>
                {open ? "Zu" : "Auf"}
              </Button>
            </div>

            <div className="px-4 pb-4">
              <Muted>
                {loading
                  ? "Lade..."
                  : !profile
                  ? "Nicht eingeloggt."
                  : !approved
                  ? "Konto wartet auf Freigabe."
                  : "Bereit."}
              </Muted>

              {error ? (
                <div className="mt-3 rounded-2xl border border-rose-800 bg-rose-500/10 p-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <div className="mt-3">
                <FiltersPanel value={filters} onChange={setFilters} disabled={!approved} />
              </div>

              <div className="mt-3 flex gap-2">
                <Button variant={panel === "location" ? "primary" : "ghost"} onClick={() => setPanel("location")}>
                  Standort
                </Button>
                <Button variant={panel === "zones" ? "primary" : "ghost"} onClick={() => setPanel("zones")}>
                  Zonen
                </Button>
              </div>

              <div className="mt-4">
                {panel === "location" ? (
                  selectedLocation ? (
                    <LocationPanel
                      userId={profile?.id ?? null}
                      approved={approved}
                      location={selectedLocation}
                      signs={selectedSigns}
                      onDataChanged={onDataChanged}
                    />
                  ) : (
                    <Card className="p-3">
                      <H2>Keine Auswahl</H2>
                      <Muted className="mt-1">Marker anklicken oder hinzufügen.</Muted>
                    </Card>
                  )
                ) : (
                  <ZonesList approved={approved} zones={zones} onDataChanged={onDataChanged} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
