"use client";

import { useEffect } from "react";
import { CheckCircle, WarningCircle, X } from "@phosphor-icons/react";

export type ToastTone = "success" | "error";

export type ToastState = {
  message: string;
  tone: ToastTone;
} | null;

type ToastProps = {
  toast: ToastState;
  onDismiss: () => void;
  durationMs?: number;
};

export function Toast({ toast, onDismiss, durationMs = 3200 }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(t);
  }, [toast, durationMs, onDismiss]);

  if (!toast) return null;

  const success = toast.tone === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-1/2 z-[70] w-[min(100%-2rem,24rem)] -translate-x-1/2"
    >
      <div
        className={[
          "pointer-events-auto flex items-start gap-3 rounded-[var(--radius-app)] border px-4 py-3 shadow-lg",
          success
            ? "border-accent/30 bg-surface text-foreground"
            : "border-danger/30 bg-surface text-foreground",
        ].join(" ")}
      >
        {success ? (
          <CheckCircle
            size={20}
            weight="fill"
            className="mt-0.5 shrink-0 text-accent"
          />
        ) : (
          <WarningCircle
            size={20}
            weight="fill"
            className="mt-0.5 shrink-0 text-danger"
          />
        )}
        <p className="flex-1 text-sm leading-snug">{toast.message}</p>
        <button
          type="button"
          aria-label="Tutup notifikasi"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-muted hover:bg-surface-muted hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
