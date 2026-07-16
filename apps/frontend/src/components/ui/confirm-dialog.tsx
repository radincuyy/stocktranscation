"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "@phosphor-icons/react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Tutup dialog"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!busy) onCancel();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 w-full max-w-md rounded-t-[var(--radius-app)] border border-border bg-surface p-5 shadow-xl sm:rounded-[var(--radius-app)] sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Tutup"
            disabled={busy}
            onClick={onCancel}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>
        <p id={descId} className="text-sm leading-relaxed text-muted">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-[var(--radius-app)] border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted disabled:opacity-50 active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={[
              "rounded-[var(--radius-app)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 active:scale-[0.98]",
              danger
                ? "bg-danger hover:opacity-90"
                : "bg-accent hover:bg-accent-hover dark:text-zinc-950",
            ].join(" ")}
          >
            {busy ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
