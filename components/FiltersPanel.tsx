"use client";

import { MAIN_SIGNS, LocationStatus } from "@/types/domain";
import { Input, Label, Select } from "@/components/ui";

export type Filters = {
  q: string;
  status: "all" | LocationStatus;
  signCode: "all" | string;
  olderThanMonths: number;
};

export default function FiltersPanel({
  value,
  onChange,
  disabled = false
}: {
  value: Filters;
  onChange: (v: Filters) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Suche</Label>
        <Input
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          placeholder="283, Neudorf, Ladezone…"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Status</Label>
          <Select
            value={value.status}
            onChange={(e) => onChange({ ...value, status: e.target.value as Filters["status"] })}
            disabled={disabled}
          >
            <option value="all">alle</option>
            <option value="active">active</option>
            <option value="needs_review">needs_review</option>
            <option value="outdated">outdated</option>
          </Select>
        </div>

        <div>
          <Label>Hauptzeichen</Label>
          <Select value={value.signCode} onChange={(e) => onChange({ ...value, signCode: e.target.value })} disabled={disabled}>
            <option value="all">alle</option>
            {MAIN_SIGNS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} – {s.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label>Prüfung älter als (Monate)</Label>
        <Input
          type="number"
          min={0}
          value={String(value.olderThanMonths)}
          onChange={(e) => onChange({ ...value, olderThanMonths: Math.max(0, Number(e.target.value || 0)) })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
