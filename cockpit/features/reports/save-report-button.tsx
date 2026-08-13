"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createReport, type ActionResult } from "./actions";

/** „Als Report speichern": legt einen Report-Snapshot-Datensatz an (Berechtigung report:create). */
export function SaveReportButton({ reportType, title }: { reportType: string; title: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createReport, {});
  return (
    <form action={formAction} className="no-print inline-flex flex-col items-end gap-1">
      <input type="hidden" name="reportType" value={reportType} />
      <input type="hidden" name="title" value={title} />
      <Button type="submit" disabled={pending}>
        <Save className="h-4 w-4" aria-hidden />
        {pending ? "Speichern…" : "Als Report speichern"}
      </Button>
      {state.error ? (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.ok ? <p className="text-xs text-risk-low">Report gespeichert.</p> : null}
    </form>
  );
}
