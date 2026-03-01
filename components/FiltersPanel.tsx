"use client";
import Image from "next/image";
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
        <Input value={value.q} onChange={(e) => onChange({ ...value, q: e.target.value })} placeholder="283, Straße, Notiz…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Status</Label>
          <Select value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value as any })}>
            <option value="all">Alle</option>
            <option value="active">Aktiv</option>
            <option value="needs_review">Prüfen</option>
            <option value="outdated">Veraltet</option>
          </Select>
        </div>
        <div>
          <Label>Hauptzeichen</Label>
          <Select value={value.signCode} onChange={(e) => onChange({ ...value, signCode: e.target.value })}>
            <option value="all">Alle</option>
            {MAIN_SIGNS.map((s) => <option key={s.code} value={s.code}>{s.code} – {s.label}</option>)}
          </Select>
<div className="mt-2 flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-2">
  <div className="h-10 w-10 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
    <Image src={value.signCode === "all" ? "/vz/283.svg" : `/vz/${value.signCode}.svg`} alt="VZ" width={40} height={40} />
  </div>
  <div className="min-w-0">
    <div className="text-xs font-semibold text-zinc-100">{value.signCode === "all" ? "Alle" : `VZ ${value.signCode}`}</div>
    <div className="text-[11px] text-zinc-400">Schnellwahl unten</div>
  </div>
</div>

<div className="mt-2">
  <div className="text-xs font-semibold text-zinc-300">Schnellwahl (mit Icon)</div>
  <div className="mt-2 grid grid-cols-2 gap-2">
    {MAIN_SIGNS.map((s) => (
      <button
        key={s.code}
        type="button"
        className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-2 text-left hover:bg-zinc-900/70"
        onClick={() => onChange({ ...value, signCode: s.code })}
      >
        <div className="h-10 w-10 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
          <Image src={`/vz/${s.code}.svg`} alt={s.label} width={40} height={40} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-zinc-100">VZ {s.code}</div>
          <div className="truncate text-[11px] text-zinc-400">{s.label}</div>
        </div>
      </button>
    ))}
  </div>
</div>

        </div>
      </div>

      <label className="mt-1 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm">
        <span className="text-zinc-200">Expired anzeigen</span>
        <input type="checkbox" checked={value.includeExpired} onChange={(e) => onChange({ ...value, includeExpired: e.target.checked })} />
      </label>
    </div>
  );
}
