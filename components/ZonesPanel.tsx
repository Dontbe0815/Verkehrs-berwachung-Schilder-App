"use client";
import { Button, Card, H2, Muted } from "@/components/ui";
import type { AppData, Zone } from "@/lib/types";

export default function ZonesPanel(props: { role: "admin" | "creator" | "spectator"; canDelete: boolean; data: AppData | null; zones: Zone[]; onSave: (next: AppData) => void }) {
  const { canDelete, data, zones, onSave } = props;

  function deleteZone(id: string) {
    if (!data) return;
    if (!canDelete) return alert("Nur Admin darf Zonen löschen.");
    if (!confirm("Zone löschen?")) return;
    onSave({ ...data, zones: data.zones.filter((z) => z.id !== id) });
  }

  return (
    <Card>
      <H2>Zonen</H2>
      <Muted className="mt-2">Zonen zeichnest du über „Zone +“ auf der Karte.</Muted>

      {zones.length === 0 ? <Muted className="mt-3">Noch keine Zonen.</Muted> : (
        <div className="mt-4 space-y-3">
          {zones.map((z) => (
            <div key={z.id} className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{z.name}</div>
                  {z.description ? <div className="mt-1 text-xs text-zinc-400">{z.description}</div> : null}
                  {z.rules ? <div className="mt-2 text-sm text-zinc-200">{z.rules}</div> : null}
                </div>
                <Button variant="ghost" onClick={() => deleteZone(z.id)} disabled={!canDelete}>Löschen</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Muted className="mt-4 text-xs">Rollen: Creator darf erstellen, Admin darf löschen, Spectator nur ansehen.</Muted>
    </Card>
  );
}
