"use client";

import { supabase } from "@/lib/supabaseClient";
import type { ZoneRow } from "@/types/domain";
import { Button, Card, H2, Muted } from "@/components/ui";

export default function ZonesList({
  zones,
  approved,
  onDataChanged
}: {
  zones: ZoneRow[];
  approved: boolean;
  onDataChanged: () => void;
}) {
  async function remove(id: string) {
    if (!approved) return;
    if (!confirm("Zone wirklich löschen?")) return;
    const { error } = await supabase.from("zones").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    onDataChanged();
  }

  return (
    <Card>
      <H2>Zonen</H2>
      <Muted className="mt-2">Zonen zeichnest du über „Zone zeichnen“ auf der Karte.</Muted>

      {zones.length === 0 ? (
        <Muted className="mt-3">Noch keine Zonen.</Muted>
      ) : (
        <div className="mt-4 space-y-3">
          {zones.map((z) => (
            <div key={z.id} className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{z.name}</div>
                  {z.description ? <div className="mt-1 text-xs text-zinc-400">{z.description}</div> : null}
                  {z.special_rules ? <div className="mt-2 text-sm text-zinc-200">{z.special_rules}</div> : null}
                </div>
                <Button variant="ghost" onClick={() => void remove(z.id)} disabled={!approved}>
                  Löschen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
