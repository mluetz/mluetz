"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import { REPORTS_MESSAGES } from "@/lib/i18n/messages/reports";
import { createReport, type ActionResult } from "./actions";

/** „Als Report speichern": legt einen Report-Snapshot-Datensatz an (Berechtigung report:create). */
export function SaveReportButton({
  reportType,
  title,
  locale,
}: {
  reportType: string;
  title: string;
  locale: Locale;
}) {
  const t = REPORTS_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createReport, {});
  return (
    <form action={formAction} className="no-print inline-flex flex-col items-end gap-1">
      <input type="hidden" name="reportType" value={reportType} />
      <input type="hidden" name="title" value={title} />
      <Button type="submit" disabled={pending}>
        <Save className="h-4 w-4" aria-hidden />
        {pending ? t.buttons.saving : t.buttons.save}
      </Button>
      {state.error ? (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.ok ? <p className="text-xs text-risk-low">{t.buttons.saved}</p> : null}
    </form>
  );
}
