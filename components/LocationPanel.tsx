"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { Button, Card, H2, Input, Label, Muted, Select, Textarea, Switch, Pill } from "@/components/ui";
import type { AppData, Location, Sign } from "@/lib/types";
import VZSelector from "@/components/VZSelector";

function uid(): string {
  return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`);
}

const DIRS = [
  { v: "both", label: "Beidseitig" },
  { v: "left", label: "Links" },
  { v: "right", label: "Rechts" },
  { v: "start", label: "Beginn" },
  { v: "end", label: "Ende" }
] as const;

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
  const [uploading, setUploading] = useState(false);

  const initial = useMemo(() => ({
    mainCode: "283",
    mainLabel: "Absolutes Haltverbot",
    direction: "both" as const,
    validity: "",
    additionalText: "",
    notes: "",
    confidence: "probable" as const,
    isTemporary: false,
    expiresAt: "",
    imageUrl: "" as string | null
  }), []);
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

  async function uploadImage(file: File) {
    setUploading(true); setMsg("");
    try {
      const fd = new FormData();
      fd.set("file", file);
      const r = await fetch("/api/upload/sign-image", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Upload fehlgeschlagen");
      setDraft((p) => ({ ...p, imageUrl: j.url }));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  }

  function addSign() {
    if (!data) return;
    if (!canCreate) return setMsg("Nur Creator/Admin dürfen erstellen.");
    if (draft.isTemporary && !draft.expiresAt) return setMsg("Bei mobiler Beschilderung bitte ein Ablaufdatum setzen.");

    const now = new Date().toISOString();
    const s: Sign = {
      id: uid(),
      locationId: location.id,
      mainCode: draft.mainCode,
      mainLabel: draft.mainLabel,
      direction: draft.direction,
      validity: draft.validity.trim()?draft.validity.trim():null,
      additional: [],
      additionalText: draft.additionalText.trim()?draft.additionalText.trim():null,
      notes: draft.notes.trim()?draft.notes.trim():null,
      imageUrl: draft.imageUrl ? String(draft.imageUrl) : null,
      confidence: draft.confidence,
      isTemporary: draft.isTemporary,
      expiresAt: draft.isTemporary ? (draft.expiresAt || null) : null,
      state: "active",
      createdAt: now,
      updatedAt: now
    };
    onSave({ ...data, signs: [s, ...data.signs] });
    setDraft({ ...initial, validity: "", notes: "", additionalText: "", isTemporary: false, expiresAt: "", imageUrl: "" });
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
        <Muted className="mt-2">Suche nach Nummer (z.B. VZ 283). Zusatzzeichen als Freitext. Foto optional.</Muted>

        <div className="mt-4 space-y-4">
          <VZSelector
            value={{ code: draft.mainCode, label: draft.mainLabel }}
            disabled={!canCreate}
            onChange={(v) => setDraft((p) => ({ ...p, mainCode: v.code, mainLabel: v.label }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Richtung</Label>
              <Select value={draft.direction} onChange={(e) => setDraft((p) => ({ ...p, direction: e.target.value as any }))} disabled={!canCreate}>
                {DIRS.map((d) => <option key={d.v} value={d.v}>{d.label}</option>)}
              </Select>
            </div>
            <div>
              <Label>Mobil (temporär)</Label>
              <div className="mt-1 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                <span className="text-sm text-zinc-200">aktiv</span>
                <Switch checked={draft.isTemporary} onChange={(v) => setDraft((p) => ({ ...p, isTemporary: v }))} disabled={!canCreate} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Ablaufdatum</Label><Input type="date" value={draft.expiresAt} onChange={(e) => setDraft((p) => ({ ...p, expiresAt: e.target.value }))} disabled={!canCreate || !draft.isTemporary} /></div>
            <div><Label>Gültigkeit</Label><Input value={draft.validity} onChange={(e) => setDraft((p) => ({ ...p, validity: e.target.value }))} disabled={!canCreate} placeholder="Mo–Fr 7–18 Uhr" /></div>
          </div>

          <div><Label>Zusatzzeichen (Freitext)</Label><Input value={draft.additionalText} onChange={(e) => setDraft((p) => ({ ...p, additionalText: e.target.value }))} disabled={!canCreate} placeholder="z.B. Anwohner frei, mit Parkschein, 2h" /></div>
          <div><Label>Notizen</Label><Textarea value={draft.notes} onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))} rows={3} disabled={!canCreate} /></div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Schildfoto (optional)</div>
                <div className="text-xs text-zinc-400">Auf iPhone öffnet sich Kamera/Galerie.</div>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadImage(file);
                }}
                disabled={!canCreate || uploading}
              />
            </div>
            {draft.imageUrl ? (
              <div className="mt-3 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/60">
                <Image src={draft.imageUrl} alt="Schildfoto" width={900} height={600} className="h-40 w-full object-cover" />
              </div>
            ) : null}
          </div>

          <Button onClick={addSign} disabled={!canCreate || uploading}>{uploading ? "Upload..." : "Schild speichern"}</Button>
        </div>
      </Card>

      <Card>
        <H2>Schilder</H2>
        {signs.length === 0 ? <Muted className="mt-2">Keine Schilder am Standort.</Muted> : (
          <div className="mt-3 space-y-3">
            {signs.map((s) => (
              <div key={s.id} className={`rounded-3xl border border-zinc-800 p-4 ${s.state === "expired" ? "bg-zinc-950/20 opacity-80" : "bg-zinc-950/40"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">{s.mainCode} – {s.mainLabel}</div>
                      {s.isTemporary ? <Pill>mobil</Pill> : null}
                      {s.state === "expired" ? <Pill>expired</Pill> : null}
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">
                      Richtung: {DIRS.find(d => d.v === s.direction)?.label ?? s.direction} • Confidence: {s.confidence}
                    </div>
                    {s.expiresAt ? <div className="mt-1 text-xs text-zinc-300">Ablauf: {s.expiresAt}</div> : null}
                    {s.validity ? <div className="mt-1 text-xs text-zinc-300">Gültigkeit: {s.validity}</div> : null}
                    {s.additionalText ? <div className="mt-1 text-xs text-zinc-300">Zusatz: {s.additionalText}</div> : null}
                    {s.notes ? <div className="mt-2 text-sm text-zinc-200">{s.notes}</div> : null}
                    {s.imageUrl ? (
                      <div className="mt-3 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/60">
                        <Image src={s.imageUrl} alt="Schildfoto" width={900} height={600} className="h-36 w-full object-cover" />
                      </div>
                    ) : null}
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
