"use client";
import { useMemo, useState } from "react";
import { Button, Card, H2, Input, Label, Muted } from "@/components/ui";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const next = useMemo(() => {
    if (typeof window === "undefined") return "/";
    const u = new URL(window.location.href);
    return u.searchParams.get("next") || "/";
  }, []);

  async function submit() {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/auth/login", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ username, password }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Login fehlgeschlagen");
      window.location.href = next;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Login fehlgeschlagen");
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-md p-4 safe-bottom">
      <Card>
        <H2>Login</H2>
        <Muted className="mt-2">Keine Registrierung. 3 feste Accounts: admin / creator / spectator (Passwort per Env).</Muted>

        {msg ? <div className="mt-4 rounded-2xl border border-rose-800 bg-rose-500/10 p-3 text-sm text-rose-200">{msg}</div> : null}

        <div className="mt-6 space-y-3">
          <div><Label>Username</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></div>
          <div><Label>Passwort</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" /></div>
          <Button onClick={() => void submit()} disabled={busy || !username || !password}>{busy ? "..." : "Einloggen"}</Button>
        </div>

        <Muted className="mt-4 text-xs">Default-Stadt: Duisburg. Admin kann sie in den Einstellungen ändern.</Muted>
      </Card>
    </main>
  );
}
