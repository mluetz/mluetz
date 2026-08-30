"use client";

import { useActionState } from "react";
import { startRunbookExecution, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/config";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";

export function StartRunbookForm({ runbookId, locale }: { runbookId: string; locale: Locale }) {
  const t = TPRM_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    startRunbookExecution,
    {},
  );
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="runbookId" value={runbookId} />
      <Field
        label={t.rb.startForm.contextLabel}
        htmlFor="contextNote"
        hint={t.rb.startForm.contextHint}
      >
        <Textarea id="contextNote" name="contextNote" rows={2} maxLength={2000} />
      </Field>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? t.rb.startForm.starting : t.rb.startForm.submit}
      </Button>
    </form>
  );
}
