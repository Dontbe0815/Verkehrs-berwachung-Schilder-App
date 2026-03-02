"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, H2, Input, Label, Muted, Select, Textarea, Switch, Pill } from "@/components/ui";
import VirtualList from "@/components/VirtualList";
import { isoToDE } from "@/lib/date";
import type { AppData, Location, Sign } from "@/lib/types";

export default function LocationPanel(props: {
  role: "admin" | "creator" | "spectator";
  canDelete: boolean;
  location: Location;
  signs: Sign[];
  data: AppData;
  onSave: (next: AppData) => void;
}) {
  const { role, canDelete, location, signs, data, onSave } = props;

  const [lastVerified, setLastVerified] = useState(location.lastVerified ?? "");

  useEffect(() => {
    setLastVerified(location.lastVerified ?? "");
  }, [location.lastVerified]);

  function deleteSign(id: string) {
    if (!canDelete) return;
    onSave({
      ...data,
      signs: data.signs.filter((s) => s.id !== id),
    });
  }

  return (
    <Card>
      <H2>Standort</H2>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Breitengrad</Label>
          <Input value={location.lat} disabled />
        </div>
        <div>
          <Label>Längengrad</Label>
          <Input value={location.lng} disabled />
        </div>
      </div>

      <div className="mt-4">
        <Label>Zuletzt geprüft</Label>
        <Input
          type="date"
          value={lastVerified}
          onChange={(e) => setLastVerified(e.target.value)}
          disabled={role === "spectator"}
        />
        <div className="mt-1 text-xs text-zinc-400">
          Anzeige: {isoToDE(lastVerified)} (TT.MM.JJJJ)
        </div>
      </div>

      <H2 className="mt-6">Schilder</H2>

      {(signs ?? []).length === 0 ? (
        <Muted className="mt-2">Keine Schilder am Standort.</Muted>
      ) : (signs ?? []).length > 40 ? (
        <div className="mt-3">
          <VirtualList
            items={signs ?? []}
            itemHeight={92}
            height={520}
            renderItem={(s) => (
              <div className="px-3 py-2">
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {s.mainCode} – {s.mainLabel}
                      </div>
                      <div className="mt-1 text-xs text-zinc-400 truncate">
                        Richtung: {s.direction} • Confidence: {s.confidence}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.isTemporary ? <Pill>mobil</Pill> : null}
                      {s.state === "expired" ? <Pill>expired</Pill> : null}
                      <Button
                        variant="ghost"
                        onClick={() => deleteSign(s.id)}
                        disabled={!canDelete}
                      >
                        Löschen
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {(signs ?? []).map((s) => (
            <div
              key={s.id}
              className={`rounded-3xl border border-zinc-800 p-4 ${
                s.state === "expired"
                  ? "bg-zinc-950/20 opacity-80"
                  : "bg-zinc-950/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    {s.mainCode} – {s.mainLabel}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Richtung: {s.direction} • Confidence: {s.confidence}
                  </div>
                  {s.expiresAt ? (
                    <div className="mt-1 text-xs text-zinc-300">
                      Ablauf: {isoToDE(s.expiresAt)}
                    </div>
                  ) : null}
                  {s.validity ? (
                    <div className="mt-1 text-xs text-zinc-300">
                      Gültigkeit: {s.validity}
                    </div>
                  ) : null}
                  {s.notes ? (
                    <div className="mt-2 text-sm text-zinc-200 whitespace-pre-wrap">
                      {s.notes}
                    </div>
                  ) : null}
                </div>

                <Button
                  variant="ghost"
                  onClick={() => deleteSign(s.id)}
                  disabled={!canDelete}
                >
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
