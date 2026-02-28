"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type {
  ConfidenceLevel,
  LocationRow,
  LocationStatus,
  SignDirection,
  SignRow
} from "@/types/domain";
import { MAIN_SIGNS } from "@/types/domain";
import { Button, Card, H2, Input, Label, Muted, Select, Textarea } from "@/components/ui";
import PhotoPanel from "@/components/PhotoPanel";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  userId: string | null;
  approved: boolean;
  location: LocationRow;
  signs: SignRow[];
  onDataChanged: () => void;
};

export default function LocationPanel({ userId, approved, location, signs, onDataChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const [streetName, setStreetName] = useState(location.street_name ?? "");
  const [status, setStatus] = useState<LocationStatus>(location.status);
  const [lastVerified, setLastVerified] = useState<string>(location.last_verified_at ?? "");

  const initialNewSign = useMemo(() => {
    const first = MAIN_SIGNS[0]!;
    return {
      main_sign_code: first.code,
      main_sign_label: first.label,
      direction: "both" as SignDirection,
      validity_text: "",
      additional_signs_text: "[]",
      notes: "",
      confidence_level: "probable" as ConfidenceLevel
    };
  }, []);

  const [newSign, setNewSign] = useState(initialNewSign);

  function requireOk(): boolean {
    if (!approved || !userId) {
      setMsg("Konto nicht freigeschaltet. Bitte Admin-Freigabe abwarten.");
      return false;
    }
    return true;
  }

  async function saveLocation() {
    if (!requireOk()) return;
    setBusy(true);
    setMsg("");

    const payload = {
      street_name: streetName.trim() ? streetName.trim() : null,
      status,
      last_verified_at: lastVerified || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from("locations").update(payload).eq("id", location.id);
    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }
    onDataChanged();
  }

  async function deleteLocation() {
    if (!requireOk()) return;
    if (!confirm("Standort wirklich löschen? Alle Schilder/Fotos werden entfernt.")) return;
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("locations").delete().eq("id", location.id);
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    onDataChanged();
  }

  function pickMainSign(code: string) {
    const found = MAIN_SIGNS.find((s) => s.code === code);
    setNewSign((p) => ({
      ...p,
      main_sign_code: code,
      main_sign_label: found ? found.label : p.main_sign_label
    }));
  }

  async function createSign() {
    if (!requireOk()) return;
    setBusy(true);
    setMsg("");

    let additional: unknown[] = [];
    try {
      additional = newSign.additional_signs_text.trim()
        ? (JSON.parse(newSign.additional_signs_text) as unknown[])
        : [];
      if (!Array.isArray(additional)) throw new Error("additional_signs muss ein JSON-Array sein.");
    } catch (e) {
      setBusy(false);
      setMsg(e instanceof Error ? e.message : "Ungültiges JSON bei Zusatzzeichen.");
      return;
    }

    const payload = {
      owner_id: userId,
      location_id: location.id,
      main_sign_code: newSign.main_sign_code,
      main_sign_label: newSign.main_sign_label,
      direction: newSign.direction,
      validity_text: newSign.validity_text.trim() ? newSign.validity_text.trim() : null,
      additional_signs: additional,
      notes: newSign.notes.trim() ? newSign.notes.trim() : null,
      confidence_level: newSign.confidence_level,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from("signs").insert(payload);
    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setNewSign({ ...initialNewSign, validity_text: "", notes: "", additional_signs_text: "[]" });
    onDataChanged();
  }

  async function deleteSign(id: string) {
    if (!requireOk()) return;
    if (!confirm("Schild wirklich löschen?")) return;
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("signs").delete().eq("id", id);
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    onDataChanged();
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <H2>Standort</H2>
            <div className="mt-1 text-xs text-zinc-400">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </div>
          </div>
          <Button variant="danger" onClick={() => void deleteLocation()} disabled={busy || !approved}>
            Löschen
          </Button>
        </div>

        {msg ? (
          <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3 text-sm text-zinc-200">
            {msg}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          <div>
            <Label>Straße/Notiz</Label>
            <Input value={streetName} onChange={(e) => setStreetName(e.target.value)} disabled={!approved} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as LocationStatus)} disabled={!approved}>
                <option value="needs_review">needs_review</option>
                <option value="active">active</option>
                <option value="outdated">outdated</option>
              </Select>
            </div>
            <div>
              <Label>Zuletzt geprüft</Label>
              <Input type="date" value={lastVerified} onChange={(e) => setLastVerified(e.target.value)} disabled={!approved} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => void saveLocation()} disabled={busy || !approved}>
              {busy ? "Speichere..." : "Standort speichern"}
            </Button>
            <Button variant="ghost" onClick={() => setLastVerified(today())} disabled={busy || !approved}>
              Heute
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <H2>Neues Schild</H2>
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Hauptzeichen</Label>
              <Select value={newSign.main_sign_code} onChange={(e) => pickMainSign(e.target.value)} disabled={!approved}>
                {MAIN_SIGNS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} – {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Richtung</Label>
              <Select
                value={newSign.direction}
                onChange={(e) => setNewSign((p) => ({ ...p, direction: e.target.value as SignDirection }))}
                disabled={!approved}
              >
                <option value="both">both</option>
                <option value="left">left</option>
                <option value="right">right</option>
                <option value="start">start</option>
                <option value="end">end</option>
              </Select>
            </div>
          </div>

          <div>
            <Label>Gültigkeit</Label>
            <Input
              value={newSign.validity_text}
              onChange={(e) => setNewSign((p) => ({ ...p, validity_text: e.target.value }))}
              placeholder="Mo-Fr 7-18 Uhr"
              disabled={!approved}
            />
          </div>

          <div>
            <Label>Zusatzzeichen (JSON Array)</Label>
            <Input
              value={newSign.additional_signs_text}
              onChange={(e) => setNewSign((p) => ({ ...p, additional_signs_text: e.target.value }))}
              placeholder='["Anwohner frei","Ladezone"]'
              disabled={!approved}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Confidence</Label>
              <Select
                value={newSign.confidence_level}
                onChange={(e) => setNewSign((p) => ({ ...p, confidence_level: e.target.value as ConfidenceLevel }))}
                disabled={!approved}
              >
                <option value="confirmed">confirmed</option>
                <option value="probable">probable</option>
                <option value="unclear">unclear</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => void createSign()} disabled={busy || !approved}>
                Schild speichern
              </Button>
            </div>
          </div>

          <div>
            <Label>Notizen</Label>
            <Textarea value={newSign.notes} onChange={(e) => setNewSign((p) => ({ ...p, notes: e.target.value }))} rows={3} disabled={!approved} />
          </div>

          <Muted>Zusatzzeichen werden als JSON gespeichert (später als Tags möglich).</Muted>
        </div>
      </Card>

      <Card>
        <H2>Schilder</H2>
        {signs.length === 0 ? (
          <Muted className="mt-2">Noch keine Schilder.</Muted>
        ) : (
          <div className="mt-3 space-y-3">
            {signs.map((s) => (
              <div key={s.id} className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {s.main_sign_code} – {s.main_sign_label}
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">
                      Richtung: {s.direction} • Confidence: {s.confidence_level}
                    </div>
                    {s.validity_text ? <div className="mt-1 text-xs text-zinc-300">Gültigkeit: {s.validity_text}</div> : null}
                    {s.notes ? <div className="mt-2 text-sm text-zinc-200">{s.notes}</div> : null}
                  </div>
                  <Button variant="ghost" onClick={() => void deleteSign(s.id)} disabled={busy || !approved}>
                    Löschen
                  </Button>
                </div>

                <div className="mt-4">
                  <PhotoPanel approved={approved} userId={userId} signId={s.id} onDataChanged={onDataChanged} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
