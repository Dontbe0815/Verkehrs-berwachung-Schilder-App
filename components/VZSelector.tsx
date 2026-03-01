"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { Input, Label, Select } from "@/components/ui";
import { VZ_CATALOG, VZ_CATEGORIES } from "@/lib/vzCatalog";

export default function VZSelector(props: {
  value: { code: string; label: string };
  disabled?: boolean;
  onChange: (next: { code: string; label: string }) => void;
}) {
  const { value, onChange, disabled } = props;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return VZ_CATALOG.filter((v) => {
      if (cat !== "all" && v.category !== cat) return false;
      if (!qq) return true;
      return v.code.toLowerCase().includes(qq) || v.label.toLowerCase().includes(qq) || (`vz ${v.code}`).includes(qq);
    });
  }, [q, cat]);

  const selected = useMemo(() => VZ_CATALOG.find((v) => v.code === value.code) ?? null, [value.code]);

  return (
    <div className="space-y-3">
      <div>
        <Label>Suche (z.B. „283“ oder „Haltverbot“)</Label>
        <Input value={q} onChange={(e) => setQ(e.target.value)} disabled={disabled} placeholder="VZ 283, Parken, Einfahrt…" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Kategorie</Label>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} disabled={disabled}>
            <option value="all">alle</option>
            {VZ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div>
          <Label>Auswahl</Label>
          <Select
            value={value.code}
            onChange={(e) => {
              const it = VZ_CATALOG.find((x) => x.code === e.target.value);
              if (it) onChange({ code: it.code, label: it.label });
            }}
            disabled={disabled}
          >
            {list.map((v) => <option key={v.code} value={v.code}>{v.code} – {v.label}</option>)}
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-3xl border border-zinc-800 bg-zinc-950/40 p-3">
        <div className="h-12 w-12 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60">
          <Image src={(selected?.icon ?? "/vz/283.svg")} alt={selected?.label ?? value.label} width={48} height={48} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-100">{selected?.code ?? value.code} – {selected?.label ?? value.label}</div>
          <div className="text-xs text-zinc-400">Suche auch nach „VZ 283“ möglich.</div>
        </div>
      </div>
    </div>
  );
}
