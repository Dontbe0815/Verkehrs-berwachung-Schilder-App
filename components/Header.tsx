"use client";
import { useEffect, useState } from "react";
import { Button, Pill } from "@/components/ui";

type Me = { username: string; role: "admin" | "creator" | "spectator" } | null;

export default function Header() {
  const [me, setMe] = useState<Me>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then(setMe).catch(() => setMe(null));
    if (typeof window !== "undefined" && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="safe-top sticky top-0 z-50 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="text-sm font-semibold text-zinc-100">VZ-Karte</div>
        {me ? <Pill>{me.role}</Pill> : null}
      </div>
      <div className="flex items-center gap-2">
        {me ? <div className="hidden text-xs text-zinc-400 sm:block">{me.username}</div> : null}
        <Button variant="ghost" onClick={() => void logout()}>Logout</Button>
      </div>
    </header>
  );
}
