"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, H2, Muted, Button, Input, Label, Select, Pill } from "@/components/ui";
import type { ProfileRow } from "@/types/domain";
import { ensureProfile } from "@/lib/auth";

export default function AdminPage() {
  const [me, setMe] = useState<ProfileRow | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const pending = useMemo(() => profiles.filter((p) => !p.approved), [profiles]);

  async function load() {
    setMsg("");
    const p = await ensureProfile();
    setMe((p as any) ?? null);

    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) {
      setMsg(error.message);
      return;
    }
    setProfiles((data ?? []) as ProfileRow[]);
  }

  useEffect(() => {
    void load();
  }, []);

  async function setApproved(id: string, approved: boolean) {
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("profiles").update({ approved, updated_at: new Date().toISOString() }).eq("id", id);
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    await load();
  }

  async function setRole(id: string, role: "admin" | "user") {
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("profiles").update({ role, updated_at: new Date().toISOString() }).eq("id", id);
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    await load();
  }

  if (!me) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <Card>
          <H2>Admin</H2>
          <Muted className="mt-2">Bitte einloggen.</Muted>
        </Card>
      </main>
    );
  }

  if (me.role !== "admin") {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <Card>
          <H2>Admin</H2>
          <Muted className="mt-2">Kein Zugriff. Du bist nicht als Admin markiert.</Muted>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <H2>Admin: Nutzerfreigabe</H2>
            <Muted className="mt-1">Hier kannst du registrierte Nutzer freigeben oder sperren.</Muted>
          </div>
          <Pill>{pending.length} offen</Pill>
        </div>

        {msg ? (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3 text-sm text-zinc-200">
            {msg}
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {profiles.map((p) => (
            <div key={p.id} className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-[220px]">
                  <div className="text-sm font-semibold text-zinc-100">{p.email}</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Rolle: {p.role} • Status: {p.approved ? "freigegeben" : "gesperrt"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={p.approved ? "ghost" : "primary"}
                    onClick={() => void setApproved(p.id, true)}
                    disabled={busy}
                  >
                    Freigeben
                  </Button>
                  <Button
                    variant={p.approved ? "danger" : "ghost"}
                    onClick={() => void setApproved(p.id, false)}
                    disabled={busy}
                  >
                    Sperren
                  </Button>

                  <Select
                    value={p.role}
                    onChange={(e) => void setRole(p.id, e.target.value as "admin" | "user")}
                    disabled={busy}
                    className="min-w-[140px]"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950/30 p-4">
          <div className="text-sm font-semibold text-zinc-100">Wichtig (Bootstrap)</div>
          <Muted className="mt-1">
            Du musst deine Admin-E-Mail vor dem ersten Login in <code className="text-zinc-200">admin_whitelist</code> eintragen
            (siehe <code className="text-zinc-200">supabase/schema.sql</code>). Danach kannst du hier alles steuern.
          </Muted>
        </div>
      </Card>
    </main>
  );
}
