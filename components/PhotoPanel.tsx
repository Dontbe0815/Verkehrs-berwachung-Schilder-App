"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { PhotoRow, PhotoType } from "@/types/domain";
import { Button, Input, Label, Muted, Select } from "@/components/ui";

const DEFAULT_BUCKET = "sign-photos";

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default function PhotoPanel({
  approved,
  userId,
  signId,
  onDataChanged
}: {
  approved: boolean;
  userId: string | null;
  signId: string;
  onDataChanged: () => void;
}) {
  const BUCKET = process.env.NEXT_PUBLIC_PHOTO_BUCKET || DEFAULT_BUCKET;

  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [type, setType] = useState<PhotoType>("closeup");
  const [file, setFile] = useState<File | null>(null);

  const photoUrls = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return [];
    return photos.map((p) => ({
      id: p.id,
      url: `${base}/storage/v1/object/public/${BUCKET}/${p.image_path}`,
      type: p.type
    }));
  }, [photos, BUCKET]);

  async function loadPhotos() {
    setMsg("");
    const { data, error } = await supabase.from("photos").select("*").eq("sign_id", signId).order("uploaded_at", { ascending: false });
    if (error) {
      setMsg(error.message);
      return;
    }
    setPhotos((data ?? []) as PhotoRow[]);
  }

  useEffect(() => {
    void loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signId]);

  async function upload() {
    if (!approved || !userId) {
      setMsg("Nicht freigeschaltet.");
      return;
    }
    if (!file) {
      setMsg("Bitte Datei auswählen.");
      return;
    }

    setBusy(true);
    setMsg("");

    try {
      const path = `${userId}/${signId}/${Date.now()}_${safeFileName(file.name)}`;
      const up = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: false });
      if (up.error) throw up.error;

      const { error } = await supabase.from("photos").insert({
        owner_id: userId,
        sign_id: signId,
        image_path: path,
        type
      });
      if (error) throw error;

      setFile(null);
      const input = document.getElementById(`file_${signId}`) as HTMLInputElement | null;
      if (input) input.value = "";
      await loadPhotos();
      onDataChanged();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(p: PhotoRow) {
    if (!approved || !userId) {
      setMsg("Nicht freigeschaltet.");
      return;
    }
    if (!confirm("Foto wirklich löschen?")) return;

    setBusy(true);
    setMsg("");

    try {
      const del = await supabase.storage.from(BUCKET).remove([p.image_path]);
      if (del.error) throw del.error;

      const { error } = await supabase.from("photos").delete().eq("id", p.id);
      if (error) throw error;

      await loadPhotos();
      onDataChanged();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Löschen fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-zinc-100">Fotos</div>

      {msg ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-2 text-xs text-zinc-200">{msg}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <Label>Typ</Label>
          <Select value={type} onChange={(e) => setType(e.target.value as PhotoType)} disabled={busy || !approved}>
            <option value="closeup">closeup</option>
            <option value="overview">overview</option>
          </Select>
        </div>
        <div>
          <Label>Datei</Label>
          <Input id={`file_${signId}`} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={busy || !approved} />
        </div>
      </div>

      <Button onClick={() => void upload()} disabled={busy || !file || !approved}>
        {busy ? "Upload..." : "Foto hochladen"}
      </Button>

      {photoUrls.length === 0 ? (
        <Muted>Noch keine Fotos.</Muted>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {photoUrls.map((p) => {
            const row = photos.find((x) => x.id === p.id);
            return (
              <div key={p.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="Foto" className="h-32 w-full rounded-xl object-cover" loading="lazy" />
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-zinc-400">{p.type}</div>
                  <Button variant="ghost" onClick={() => row && void removePhoto(row)} disabled={busy || !approved}>
                    Löschen
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Muted className="text-xs">
        Empfehlung: Public-Bucket für schnellen Start. Für Private Bucket: Signed URLs + Storage Policies (später).
      </Muted>
    </div>
  );
}
