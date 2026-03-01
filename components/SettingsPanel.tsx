"use client";
import { useEffect, useState } from "react";
import { Button, Card, H2, Input, Label, Muted } from "@/components/ui";
import type { AppSettings } from "@/lib/types";

export default function SettingsPanel({ role, settings, onSaved }: { role: "admin" | "creator" | "spectator"; settings: AppSettings; onSaved: (s: AppSettings) => void }) {
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => setDraft(settings), [settings]);

  async function save() {
    setMsg("");
    try {
      const r = await fetch("/api/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Save failed");
      onSaved(j);
      setMsg("Gespeichert.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <Card>
      <H2>Einstellungen</H2>
      <Muted className="mt-2">Nur Admin. Start-Zoom auf die Default-Stadt.</Muted>

      {msg ? <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3 text-sm text-zinc-200">{msg}</div> : null}

      <div className="mt-4 space-y-3">
        <div><Label>Default Stadt (Name)</Label><Input value={draft.defaultCity} onChange={(e) => setDraft({ ...draft, defaultCity: e.target.value })} disabled={role !== "admin"} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Lat</Label><Input value={String(draft.defaultLat)} onChange={(e) => setDraft({ ...draft, defaultLat: Number(e.target.value) })} disabled={role !== "admin"} /></div>
          <div><Label>Lng</Label><Input value={String(draft.defaultLng)} onChange={(e) => setDraft({ ...draft, defaultLng: Number(e.target.value) })} disabled={role !== "admin"} /></div>
        </div>
        <div><Label>Zoom</Label><Input value={String(draft.defaultZoom)} onChange={(e) => setDraft({ ...draft, defaultZoom: Number(e.target.value) })} disabled={role !== "admin"} /></div>
        <Button onClick={() => void save()} disabled={role !== "admin"}>Speichern</Button>
        <Muted className="text-xs">Default Duisburg: 51.4344 / 6.7623 / Zoom 12</Muted>
      </div>
    </Card>
  );
}
