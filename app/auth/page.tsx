"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button, Card, H2, Input, Label, Muted, Pill } from "@/components/ui";
import { ensureProfile } from "@/lib/auth";
import type { ProfileRow } from "@/types/domain";

type Mode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    setMsg("");
  }, [mode]);

  async function refreshProfile() {
    const p = await ensureProfile();
    setProfile((p as any) ?? null);
  }

  async function submit() {
    setBusy(true);
    setMsg("");

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Registrierung OK. Bitte ggf. E-Mail bestätigen, dann einloggen.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await refreshProfile();
        window.location.href = "/";
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg p-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <H2>{mode === "login" ? "Login" : "Registrieren"}</H2>
          {profile ? <Pill>{profile.approved ? (profile.role === "admin" ? "Admin" : "Freigeschaltet") : "Wartet auf Freigabe"}</Pill> : null}
        </div>

        <Muted className="mt-2">
          Neue Nutzer werden nach Registrierung zunächst <span className="text-zinc-200">gesperrt</span> und müssen vom Admin freigegeben werden.
        </Muted>

        {msg ? (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3 text-sm text-zinc-200">
            {msg}
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <div>
            <Label>E-Mail</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.de" />
          </div>
          <div>
            <Label>Passwort</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => void submit()} disabled={busy || !email || !password}>
              {busy ? "Bitte warten..." : (mode === "login" ? "Einloggen" : "Registrieren")}
            </Button>
            <Button variant="ghost" onClick={() => setMode(mode === "login" ? "register" : "login")} disabled={busy}>
              {mode === "login" ? "Neues Konto" : "Zum Login"}
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
