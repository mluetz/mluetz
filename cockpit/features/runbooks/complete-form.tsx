"use client";

import { useActionState } from "react";
import { completeExecution, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/config";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";

export function CompleteExecutionForm({
  executionId,
  locale,
}: {
  executionId: string;
  locale: Locale;
}) {
  const t = TPRM_MESSAGES[locale];
  const cf = t.rb.completeForm;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    completeExecution,
    {},
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="executionId" value={executionId} />
      <div className="min-w-56">
        <Label htmlFor="outcome">{cf.outcome}</Label>
        <Select id="outcome" name="outcome" required defaultValue="">
          <option value="" disabled>
            {t.common.pleaseSelect}
          </option>
          <option value="COMPLETED">{cf.completeSuccessfully}</option>
          <option value="ABORTED">{cf.abort}</option>
        </Select>
      </div>
      <div className="min-w-72 flex-1">
        <Label htmlFor="complete-comment">{cf.commentLabel}</Label>
        <Input id="complete-comment" name="comment" maxLength={2000} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? cf.saving : cf.submit}
      </Button>
      <div className="w-full">
        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {state.ok ? <p className="text-sm text-risk-low">{t.common.saved}</p> : null}
      </div>
    </form>
  );
}
