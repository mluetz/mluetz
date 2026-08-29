"use client";

import { useActionState } from "react";
import { createPeriodSnapshot, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

export function SnapshotButton({ locale }: { locale: Locale }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createPeriodSnapshot,
    {},
  );
  const de = locale === "de";
  return (
    <form action={formAction} className="flex items-center gap-3">
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending
          ? "…"
          : de
            ? "Monatsabschluss-Snapshot erzeugen"
            : "Create month-end snapshot"}
      </Button>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
