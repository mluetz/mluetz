"use client";

import { useActionState } from "react";
import { assessRequirement, type ActionResult } from "./catalog-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select, Textarea } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/config";
import { DORA_MESSAGES } from "@/lib/i18n/messages/dora";

function ResultLine({ state, locale }: { state: ActionResult; locale: Locale }) {
  const t = DORA_MESSAGES[locale];
  return (
    <>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.warning ? (
        <p
          role="status"
          className="rounded-md border border-risk-medium/50 bg-risk-medium/10 p-2 text-sm font-medium text-risk-medium"
        >
          {t.assessment.savedNote(state.warning)}
        </p>
      ) : null}
      {state.ok && !state.warning ? (
        <p className="text-sm text-risk-low">{t.common.saved}</p>
      ) : null}
    </>
  );
}

export function RequirementAssessmentForm({
  requirementId,
  locale = "de",
}: {
  requirementId: string;
  locale?: Locale;
}) {
  const t = DORA_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    assessRequirement,
    {},
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.assessment.title}</CardTitle>
        <CardDescription>{t.assessment.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="requirementId" value={requirementId} />
          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            <Field label={t.assessment.maturityLabel} htmlFor="maturity" required>
              <Select id="maturity" name="maturity" required defaultValue="">
                <option value="" disabled>
                  {t.common.pleaseSelect}
                </option>
                {Object.entries(t.enums.maturity).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.assessment.justificationLabel} htmlFor="justification" required>
              <Textarea id="justification" name="justification" required minLength={10} rows={3} />
            </Field>
          </div>
          <ResultLine state={state} locale={locale} />
          <Button type="submit" disabled={pending}>
            {pending ? t.assessment.saving : t.assessment.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
