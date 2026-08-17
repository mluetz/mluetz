"use client";

import { useActionState } from "react";
import { createAction, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/config";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";

interface Option {
  id: string;
  name: string;
}

export function NewActionForm({
  risks,
  owners,
  presetRiskId,
  locale = "de",
}: {
  risks: Option[];
  owners: Option[];
  presetRiskId?: string;
  /** UI-Sprache; optional, solange die aufrufende Seite noch kein locale übergibt. */
  locale?: Locale;
}) {
  const m = OPS_MESSAGES[locale];
  const t = m.actions.form;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.descriptionCard}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label={t.linkedRisk} htmlFor="riskId" required>
            <Select id="riskId" name="riskId" required defaultValue={presetRiskId ?? ""}>
              <option value="" disabled>
                {m.common.pleaseSelect}
              </option>
              {risks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.title} htmlFor="title" required>
            <Input id="title" name="title" required minLength={5} maxLength={200} />
          </Field>
          <Field label={t.description} htmlFor="description" required hint={t.smartHint}>
            <Textarea id="description" name="description" required minLength={10} rows={3} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.planningCard}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label={t.actionOwner} htmlFor="ownerId">
            <Select id="ownerId" name="ownerId" defaultValue="">
              <option value="">{t.assignLater}</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.priority} htmlFor="priority" required>
            <Select id="priority" name="priority" required defaultValue="">
              <option value="" disabled>
                {m.common.pleaseSelect}
              </option>
              {Object.entries(m.labels.priority).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.startDate} htmlFor="startDate">
            <Input id="startDate" name="startDate" type="date" />
          </Field>
          <Field label={t.dueDate} htmlFor="dueDate">
            <Input id="dueDate" name="dueDate" type="date" />
          </Field>
        </CardContent>
      </Card>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? m.common.creating : t.submit}
        </Button>
      </div>
    </form>
  );
}
