"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button, Pill } from "@/components/ui";
import type { ProfileRow } from "@/types/domain";
import { ensureProfile } from "@/lib/auth";

export default function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange(async (_event, session) => {
      setEmail(session?.user?.email ?? null);
      const p = await ensureProfile();
      setProfile((p as any) ?? null);
    });

    (async () => {
      const { data } = await supabase.auth.getSession();
      setEmail(data.session?.user?.email ?? null);
      const p = await ensureProfile();
      setProfile((p as any) ?? null);
    })().catch(() => undefined);

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => sub.data.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  const badge = profile
    ? profile.approved
      ? profile.role === "admin"
        ? "Admin"
        : "Freigeschaltet"
      : "Wartet auf Freigabe"
    : null;

  return (
    <header className="safe-top sticky top-0 z-50 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm font-semibold text-zinc-100">
          Verkehrszeichen-Karte
        </Link>
        <Link href="/salary" className="hidden text-sm text-zinc-300 hover:text-white sm:block">
          Zulagen
        </Link>
        {profile?.role === "admin" ? (
          <Link href="/admin" className="hidden text-sm text-zinc-300 hover:text-white sm:block">
            Admin
          </Link>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {badge ? <Pill>{badge}</Pill> : null}
        {email ? (
          <>
            <div className="hidden text-xs text-zinc-400 md:block">{email}</div>
            <Button variant="ghost" onClick={() => void logout()}>
              Logout
            </Button>
          </>
        ) : (
          <Link href="/auth">
            <Button variant="ghost">Login</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
