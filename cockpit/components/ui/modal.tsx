"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Leichtgewichtiges, barrierearmes Modal (role="dialog", aria-modal,
 * Schließen über ESC, Backdrop-Klick und Schließen-Button; Fokus wird
 * beim Öffnen auf den Dialog gesetzt und beim Schließen zurückgegeben).
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  closeLabel = "Schließen",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Barrierefreie Beschriftung des Schließen-Buttons (lokalisierbar). */
  closeLabel?: string;
}) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card p-5 text-card-foreground shadow-xl outline-none",
          className,
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold leading-snug">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
