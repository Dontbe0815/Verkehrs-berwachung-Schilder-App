"use client";
import { useMemo, useState } from "react";
import { Button, Card, H2, Input, Label, Muted, Select, Textarea, Switch, Pill } from "@/components/ui";
import type { AppData, Location, Sign, SignDirection } from "@/lib/types";

function uid(): string {
  return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`);
}

const MAIN_SIGNS = [
  { code: "283", label: "Absolutes Haltverbot" },
  { code: "286", label: "Eingeschränktes Haltverbot" },
  { code: "314", label: "Parken" },
  { code: "315", label: "Parken auf Gehwegen" },
  { code: "237", label: "Radweg" },
  { code: "240", label: "Gemeinsamer Geh- und Radweg" },
  { code: "241", label: "Getrennter Geh- und Radweg" }
];

export default function LocationPanel(props: {
  role: "admin" | "creator" | "spectator";
  canCreate: boolean;
  canDelete: boolean;
  data: AppData | null;
  location: Location;
  signs: Sign[];
  onSave: (next: AppData) => void;
}) {
  const { role, canCreate, canDelete, data, location, signs, onSave } = props;
  const [street, setStreet] = useState(location.street ?? "");
  const [status, setStatus] = useState(location.status);
  const [lastVerified, setLastVerified] = useState(location.lastVerified ?? "");
  const [msg, setMsg] = useState("");

  const initial = useMemo(() => {
    const f = MAIN_SIGNS[0]!;
    return {
      mainCode: f.code,
      mainLabel: f.label,
      direction: "both" as SignDirection,
      validity: "",
      additionalText: "[]",
      notes: "",
      confidence: "probable" as const,
      isTemporary: false,
      expiresAt: ""
    };
  }, []);
  const [draft, setDraft] = useState(initial);

  function requireWrite(): boolean {
    if (!data) return false;
    if (role === "spectator") { setMsg("Spectator darf nur ansehen."); return false; }
    return true;
  }

  function saveLocation() {
    if (!requireWrite() || !data) return;
    const nextLoc: Location = { ...location, street: street.trim()?street.trim():null, status, lastVerified: lastVerified || null };
    onSave({ ...data, locations: data.locations.map((l) => l.id === location.id ? nextLoc : l) });
    setMsg("");
  }

  function deleteLocation() {
    if (!requireWrite() || !data) return;
    if (!canDelete) return setMsg("Nur Admin darf löschen.");
    if (!confirm("Standort wirklich löschen?")) return;
    onSave({ ...data, locations: data.locations.filter((l) => l.id !== location.id), signs: data.signs.filter((s) => s.locationId !== location.id) });
  }

  function pickMain(code: string) {
    const f = MAIN_SIGNS.find((x) => x.code === code);
    setDraft((p) => ({ ...p, mainCode: code, mainLabel: f ? f.label : p.mainLabel }));
  }

  function addSign() {
    if (!data) return;
    if (!canCreate) return setMsg("Nur Creator/Admin dürfen erstellen.");

    let additional: string[] = [];
    try {
      const a = draft.additionalText.trim() ? JSON.parse(draft.additionalText) : [];
      if (!Array.isArray(a)) throw new Error("Zusatzzeichen muss JSON-Array sein");
      additional = a.map(String);
    } catch (e) {
      return setMsg(e instanceof Error ? e.message : "Ungültiges JSON");
    }

    if (draft.isTemporary && !draft.expiresAt) return setMsg("Bei mobiler Beschilderung bitte ein Ablaufdatum setzen.");

    const now = new Date().toISOString();
    const s: Sign = {
      id: uid(),
      locationId: location.id,
      mainCode: draft.mainCode,
      mainLabel: draft.mainLabel,
      direction: draft.direction,
      validity: draft.validity.trim()?draft.validity.trim():null,
      additional,
      notes: draft.notes.trim()?draft.notes.trim():null,
      confidence: draft.confidence,
      isTemporary: draft.isTemporary,
      expiresAt: draft.isTemporary ? (draft.expiresAt || null) : null,
      state: "active",
      createdAt: now,
      updatedAt: now
    };
    onSave({ ...data, signs: [s, ...data.signs] });
    setDraft({ ...initial, validity: "", notes: "", additionalText: "[]", isTemporary: false, expiresAt: "" });
    setMsg("");
  }

  function deleteSign(id: string) {
    if (!requireWrite() || !data) return;
    if (!canDelete) return setMsg("Nur Admin darf Schilder löschen.");
    if (!confirm("Schild löschen?")) return;
    onSave({ ...data, signs: data.signs.filter((s) => s.id !== id) });
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <H2>Standort</H2>
            <div className="mt-1 text-xs text-zinc-400">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</div>
          </div>
          <Button variant="danger" onClick={deleteLocation} disabled={!canDelete}>Löschen</Button>
        </div>

        {msg ? <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3 text-sm text-zinc-200">{msg}</div> : null}

        <div className="mt-4 space-y-3">
          <div><Label>Straße/Notiz</Label><Input value={street} onChange={(e) => setStreet(e.target.value)} disabled={role === "spectator"} /></div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as any)} disabled={role === "spectator"}>
                <option value="needs_review">needs_review</option>
                <option value="active">active</option>
                <option value="outdated">outdated</option>
              </Select>
            </div>
            <div>
              <Label>Zuletzt geprüft</Label>
              <Input type="date" value={lastVerified} onChange={(e) => setLastVerified(e.target.value)} disabled={role === "spectator"} />
            </div>
          </div>

          <Button onClick={saveLocation} disabled={role === "spectator"}>Standort speichern</Button>
        </div>
      </Card>

      <Card>
        <H2>Neues Schild</H2>
        <Muted className="mt-2">Creator/Admin: erstellen. Admin: löschen. Mobile Schilder laufen automatisch ab.</Muted>
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Hauptzeichen</Label>
              <Select value={draft.mainCode} onChange={(e) => pickMain(e.target.value)} disabled={!canCreate}>
                {MAIN_SIGNS.map((s) => <option key={s.code} value={s.code}>{s.code} – {s.label}</option>)}
              </Select>
            </div>
            <div>
              <Label>Richtung</Label>
              <Select value={draft.direction} onChange={(e) => setDraft((p) => ({ ...p, direction: e.target.value as any }))} disabled={!canCreate}>
                <option value="both">both</option><option value="left">left</option><option value="right">right</option><option value="start">start</option><option value="end">end</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mobil (temporär)</Label>
              <div className="mt-1 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                <span className="text-sm text-zinc-200">aktiv</span>
                <Switch checked={draft.isTemporary} onChange={(v) => setDraft((p) => ({ ...p, isTemporary: v }))} disabled={!canCreate} />
              </div>
            </div>
            <div>
              <Label>Ablaufdatum</Label>
              <Input type="date" value={draft.expiresAt} onChange={(e) => setDraft((p) => ({ ...p, expiresAt: e.target.value }))} disabled={!canCreate || !draft.isTemporary} />
            </div>
          </div>

          <div><Label>Gültigkeit</Label><Input value={draft.validity} onChange={(e) => setDraft((p) => ({ ...p, validity: e.target.value }))} disabled={!canCreate} placeholder="Mo-Fr 7-18 Uhr" /></div>
          <div><Label>Zusatzzeichen (JSON Array)</Label><Input value={draft.additionalText} onChange={(e) => setDraft((p) => ({ ...p, additionalText: e.target.value }))} disabled={!canCreate} /></div>
          <div><Label>Notizen</Label><Textarea value={draft.notes} onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))} rows={3} disabled={!canCreate} /></div>

          <Button onClick={addSign} disabled={!canCreate}>Schild speichern</Button>
        </div>
      </Card>

      <Card>
        <H2>Schilder</H2>
        {signs.length === 0 ? <Muted className="mt-2">Keine Schilder am Standort.</Muted> : (
          <div className="mt-3 space-y-3">
            {signs.map((s) => (
              <div key={s.id} className={`rounded-3xl border border-zinc-800 p-4 ${s.state === "expired" ? "bg-zinc-950/20 opacity-80" : "bg-zinc-950/40"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">{s.mainCode} – {s.mainLabel}</div>
                      {s.isTemporary ? <Pill>mobil</Pill> : null}
                      {s.state === "expired" ? <Pill>expired</Pill> : null}
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">Richtung: {s.direction} • Confidence: {s.confidence}</div>
                    {s.expiresAt ? <div className="mt-1 text-xs text-zinc-300">Ablauf: {s.expiresAt}</div> : null}
                    {s.validity ? <div className="mt-1 text-xs text-zinc-300">Gültigkeit: {s.validity}</div> : null}
                    {s.notes ? <div className="mt-2 text-sm text-zinc-200">{s.notes}</div> : null}
                  </div>
                  <Button variant="ghost" onClick={() => deleteSign(s.id)} disabled={!canDelete}>Löschen</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
