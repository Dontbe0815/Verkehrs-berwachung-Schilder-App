"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui";

export type ToastState = { open: boolean; message: string; actionLabel?: string; onAction?: () => void; kind?: "info" | "success" | "error" };

export default function Toast(props: { state: ToastState; onClose: () => void; timeoutMs?: number }) {
  const { state, onClose, timeoutMs = 4200 } = props;

  useEffect(() => {
    if (!state.open) return;
    const t = setTimeout(() => onClose(), timeoutMs);
    return () => clearTimeout(t);
  }, [state.open, timeoutMs, onClose]);

  if (!state.open) return null;

  const tone =
    state.kind === "error"
      ? "border-rose-800 bg-rose-500/10 text-rose-100"
      : state.kind === "success"
      ? "border-emerald-800 bg-emerald-500/10 text-emerald-100"
      : "border-zinc-700 bg-zinc-950/80 text-zinc-100";

  return (
    <div className="fixed bottom-3 left-0 right-0 z-[2000] px-3 safe-bottom">
      <div className={`mx-auto max-w-xl rounded-3xl border ${tone} shadow-soft backdrop-blur`}>
        <div className="flex items-center justify-between gap-3 p-3">
          <div className="text-sm">{state.message}</div>
          <div className="flex items-center gap-2">
            {state.actionLabel && state.onAction ? (
              <Button variant="ghost" onClick={() => { state.onAction?.(); onClose(); }}>{state.actionLabel}</Button>
            ) : null}
            <Button variant="ghost" onClick={onClose}>OK</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
