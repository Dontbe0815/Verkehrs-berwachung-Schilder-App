"use client";
import { useMemo, useState } from "react";
import { Button, Card, H2, Input, Label, Muted, Textarea, Switch, Pill } from "@/components/ui";
import VirtualList from "@/components/VirtualList";
import type { AppData, Zone } from "@/lib/types";

const fmtDE = (iso: string | null) => {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
};

export default function ZonesPanel(props: {
  role: "admin" | "creator" | "spectator";
  canDelete: boolean;
  canCreate: boolean;
  data: AppData | null;
  zones: Zone[];
  onSave: (next: AppData) => void;
}) {
  const { role, canDelete, canCreate, data, zones, onSave } = props;
  const [openId, setOpenId] = useState<string | null>(null);

  function deleteZone(id: string) {
    if (!data) return;
    if (!canDelete) return alert("Nur Admin darf Zonen löschen.");
    if (!confirm("Zone löschen?")) return;
    onSave({ ...data, zones: data.zones.filter((z) => z.id !== id) });
  }

  function updateZone(id: string, patch: Partial<Zone>) {
    if (!data) return;
    if (role === "spectator") return alert("Spectator darf nur ansehen.");
    if (!canCreate) return alert("Nur Creator/Admin darf Zonen bearbeiten.");
    onSave({ ...data, zones: data.zones.map((z) => z.id === id ? { ...z, ...patch, updatedAt: new Date().toISOString() } : z) });
  }

  return (
    <Card>
      <H2>Zonen</H2>
      <Muted className="mt-2">Zonen zeichnest du über „Zone +“ auf der Karte. Rechteck ist deaktiviert (nur Polygon).</Muted>

      {zones.length === 0 ? <Muted className="mt-3">Noch keine Zonen.</Muted> : (
            zones.length > 40 ? (
              <div className="mt-4">
                <VirtualList
                  items={zones}
                  itemHeight={120}
                  height={520}
                  renderItem={(z) => (
                    <div className="px-3 py-2">
                      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold">{z.name}</div>
                              {z.isTemporary ? <Pill>mobil</Pill> : null}
                              {z.state === "expired" ? <Pill>expired</Pill> : null}
                            </div>
                            {z.validity ? <div className="mt-1 text-xs text-zinc-300">Gültigkeit: {z.validity}</div> : null}
                            {z.expiresAt ? <div className="mt-1 text-xs text-zinc-300">Ablauf: {fmtDE(z.expiresAt)}</div> : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={() => setOpenId(openId === z.id ? null : z.id)} disabled={role === "spectator"}>
                              {openId === z.id ? "Schließen" : "Bearbeiten"}
                            </Button>
                            <Button variant="ghost" onClick={() => deleteZone(z.id)} disabled={!canDelete}>Löschen</Button>
                          </div>
                        </div>
                        {openId === z.id ? (
                          <div className="mt-3 text-xs text-zinc-400">Details im Bearbeiten-Modus anzeigen.</div>
                        ) : null}
                      </div>
                    </div>
                  )}
                />
              </div>
            ) : (
        <div className="mt-4 space-y-3">
          {zones.map((z) => (
            <div key={z.id} className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold">{z.name}</div>
                    {z.isTemporary ? <Pill>mobil</Pill> : null}
                    {z.state === "expired" ? <Pill>expired</Pill> : null}
                  </div>
                  {z.description ? <div className="mt-1 text-xs text-zinc-400">{z.description}</div> : null}
                  {z.validity ? <div className="mt-2 text-xs text-zinc-300">Gültigkeit: {z.validity}</div> : null}
                  {z.expiresAt ? <div className="mt-1 text-xs text-zinc-300">Ablauf: {fmtDE(z.expiresAt)}</div> : null}
                  {z.rules ? <div className="mt-2 text-sm text-zinc-200 whitespace-pre-wrap">{z.rules}</div> : null}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setOpenId(openId === z.id ? null : z.id)} disabled={role === "spectator"}>
                    {openId === z.id ? "Schließen" : "Bearbeiten"}
                  </Button>
                  <Button variant="ghost" onClick={() => deleteZone(z.id)} disabled={!canDelete}>Löschen</Button>
                </div>
              </div>

              {openId === z.id ? (
                <div className="mt-4 space-y-3 rounded-3xl border border-zinc-800 bg-zinc-950/30 p-4">
                  <div><Label>Name</Label><Input value={z.name} onChange={(e) => updateZone(z.id, { name: e.target.value })} disabled={!canCreate} /></div>
                  <div><Label>Beschreibung</Label><Input value={z.description ?? ""} onChange={(e) => updateZone(z.id, { description: e.target.value.trim()?e.target.value:null })} disabled={!canCreate} /></div>
                  <div><Label>Gültigkeit</Label><Input value={z.validity ?? ""} onChange={(e) => updateZone(z.id, { validity: e.target.value.trim()?e.target.value:null })} disabled={!canCreate} placeholder="Mo–Fr 7–18 Uhr" /></div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Mobil (temporär)</Label>
                      <div className="mt-1 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                        <span className="text-sm text-zinc-200">aktiv</span>
                        <Switch checked={z.isTemporary} onChange={(v) => updateZone(z.id, { isTemporary: v, expiresAt: v ? (z.expiresAt ?? null) : null })} disabled={!canCreate} />
                      </div>
                    </div>
                    <div>
                      <Label>Ablaufdatum</Label>
                      <Input type="date" value={z.expiresAt ?? ""} onChange={(e) => updateZone(z.id, { expiresAt: e.target.value || null })} disabled={!canCreate || !z.isTemporary} />
                      {z.expiresAt ? <div className="mt-1 text-xs text-zinc-400">Anzeige: {fmtDE(z.expiresAt)}</div> : null}
                    </div>
                  </div>

                  <div><Label>Regeln / was gilt in der Zone?</Label><Textarea rows={4} value={z.rules ?? ""} onChange={(e) => updateZone(z.id, { rules: e.target.value.trim()?e.target.value:null })} disabled={!canCreate} /></div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Muted className="mt-4 text-xs">Rollen: Creator darf erstellen/bearbeiten, Admin darf löschen, Spectator nur ansehen.</Muted>
    </Card>
  );
}
