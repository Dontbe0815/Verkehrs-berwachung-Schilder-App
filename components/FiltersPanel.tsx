"use client";
import { Input, Label, Select } from "@/components/ui";
import type { LocationStatus } from "@/lib/types";

export type Filters = { q: string; status: "all" | LocationStatus; signCode: "all" | string; includeExpired: boolean };

const MAIN_SIGNS = [
  { code: "283", label: "Absolutes Haltverbot" },
  { code: "286", label: "Eingeschränktes Haltverbot" },
  { code: "314", label: "Parken" },
  { code: "315", label: "Parken auf Gehwegen" },
  { code: "237", label: "Radweg" },
  { code: "240", label: "Gemeinsamer Geh- und Radweg" },
  { code: "241", label: "Getrennter Geh- und Radweg" }
];

export default function FiltersPanel({ value, onChange }: { value: Filters; onChange: (v: Filters) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Suche</Label>
        <Input value={value.q} onChange={(e) => onChange({ ...value, q: e.target.value })} placeholder="VZ 283, Haltverbot, Straße, Notiz…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Status</Label>
          <Select value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value as any })}>
            <option value="all">alle</option>
            <option value="active">active</option>
            <option value="needs_review">needs_review</option>
            <option value="outdated">outdated</option>
          </Select>
        </div>
        <div>
          <Label>Hauptzeichen</Label>
          <Select value={value.signCode} onChange={(e) => onChange({ ...value, signCode: e.target.value })}>
            <option value="all">alle</option>
            {MAIN_SIGNS.map((s) => <option key={s.code} value={s.code}>{s.code} – {s.label}</option>)}
          </Select>
        </div>
      </div>

      <label className="mt-1 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm">
        <span className="text-zinc-200">Expired anzeigen</span>
        <input type="checkbox" checked={value.includeExpired} onChange={(e) => onChange({ ...value, includeExpired: e.target.checked })} />
      </label>
    </div>
  );
}
