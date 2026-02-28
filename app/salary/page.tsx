"use client";

import { useMemo, useState } from "react";
import { Card, H2, Input, Label, Muted } from "@/components/ui";

type Rates = { early: number; late: number; weekend: number; holiday: number; };

function parseNum(v: string): number {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function SalaryPage() {
  const [hoursEarly, setHoursEarly] = useState("0");
  const [hoursLate, setHoursLate] = useState("0");
  const [hoursWeekend, setHoursWeekend] = useState("0");
  const [hoursHoliday, setHoursHoliday] = useState("0");
  const [rates, setRates] = useState<Rates>({ early: 1.5, late: 2.0, weekend: 2.5, holiday: 3.0 });

  const totals = useMemo(() => {
    const he = parseNum(hoursEarly), hl = parseNum(hoursLate), hw = parseNum(hoursWeekend), hh = parseNum(hoursHoliday);
    const se = he * rates.early, sl = hl * rates.late, sw = hw * rates.weekend, sh = hh * rates.holiday;
    return { he, hl, hw, hh, se, sl, sw, sh, sum: se + sl + sw + sh };
  }, [hoursEarly, hoursLate, hoursWeekend, hoursHoliday, rates]);

  return (
    <main className="mx-auto max-w-3xl p-4 safe-bottom">
      <Card>
        <H2>Dienst-/Zulagen-Rechner (konfigurierbar)</H2>
        <Muted className="mt-2">
          Praktischer Rechner mit frei einstellbaren Sätzen (kein offizieller TVöD-Rechner).
        </Muted>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><Label>Stunden Frühdienst</Label><Input value={hoursEarly} onChange={(e) => setHoursEarly(e.target.value)} inputMode="decimal" /></div>
          <div><Label>Satz €/h Frühdienst</Label><Input value={String(rates.early)} onChange={(e) => setRates((p) => ({ ...p, early: parseNum(e.target.value) }))} inputMode="decimal" /></div>
          <div><Label>Stunden Spätdienst</Label><Input value={hoursLate} onChange={(e) => setHoursLate(e.target.value)} inputMode="decimal" /></div>
          <div><Label>Satz €/h Spätdienst</Label><Input value={String(rates.late)} onChange={(e) => setRates((p) => ({ ...p, late: parseNum(e.target.value) }))} inputMode="decimal" /></div>
          <div><Label>Stunden Wochenende</Label><Input value={hoursWeekend} onChange={(e) => setHoursWeekend(e.target.value)} inputMode="decimal" /></div>
          <div><Label>Satz €/h Wochenende</Label><Input value={String(rates.weekend)} onChange={(e) => setRates((p) => ({ ...p, weekend: parseNum(e.target.value) }))} inputMode="decimal" /></div>
          <div><Label>Stunden Feiertag</Label><Input value={hoursHoliday} onChange={(e) => setHoursHoliday(e.target.value)} inputMode="decimal" /></div>
          <div><Label>Satz €/h Feiertag</Label><Input value={String(rates.holiday)} onChange={(e) => setRates((p) => ({ ...p, holiday: parseNum(e.target.value) }))} inputMode="decimal" /></div>
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-sm text-zinc-300">Ergebnis</div>
          <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
            <div>Frühdienst: {totals.he}h × {rates.early}€ = {totals.se.toFixed(2)}€</div>
            <div>Spätdienst: {totals.hl}h × {rates.late}€ = {totals.sl.toFixed(2)}€</div>
            <div>Wochenende: {totals.hw}h × {rates.weekend}€ = {totals.sw.toFixed(2)}€</div>
            <div>Feiertag: {totals.hh}h × {rates.holiday}€ = {totals.sh.toFixed(2)}€</div>
            <div className="mt-2 text-base font-semibold">Summe: {totals.sum.toFixed(2)}€</div>
          </div>
        </div>
      </Card>
    </main>
  );
}
