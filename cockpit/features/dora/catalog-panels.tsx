"use client";

import { useActionState } from "react";
import { assessRequirement, type ActionResult } from "./catalog-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select, Textarea } from "@/components/ui/input";
import { DORA_MATURITY } from "@/lib/domain/enums";

function ResultLine({ state }: { state: ActionResult }) {
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
          Gespeichert – Hinweis: {state.warning}
        </p>
      ) : null}
      {state.ok && !state.warning ? <p className="text-sm text-risk-low">Gespeichert.</p> : null}
    </>
  );
}

export function RequirementAssessmentForm({ requirementId }: { requirementId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    assessRequirement,
    {},
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Neue Bewertung durchführen</CardTitle>
        <CardDescription>
          Selbsteinschätzung des Reifegrads (0–5) mit Begründung. Ohne gültigen, geprüften Nachweis
          wirkt höchstens Reifegrad 2 (Nachweissperre, FRWK-DORA-001 Kap. 11.1).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="requirementId" value={requirementId} />
          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            <Field label="Reifegrad" htmlFor="maturity" required>
              <Select id="maturity" name="maturity" required defaultValue="">
                <option value="" disabled>
                  Bitte wählen
                </option>
                {Object.entries(DORA_MATURITY).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Begründung der Bewertung" htmlFor="justification" required>
              <Textarea id="justification" name="justification" required minLength={10} rows={3} />
            </Field>
          </div>
          <ResultLine state={state} />
          <Button type="submit" disabled={pending}>
            {pending ? "Speichern…" : "Bewertung speichern"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
