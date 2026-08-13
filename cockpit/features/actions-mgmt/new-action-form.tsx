"use client";

import { useActionState } from "react";
import { createAction, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PRIORITY } from "@/lib/domain/enums";

interface Option {
  id: string;
  name: string;
}

export function NewActionForm({
  risks,
  owners,
  presetRiskId,
}: {
  risks: Option[];
  owners: Option[];
  presetRiskId?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Maßnahmenbeschreibung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Zugehöriges Risiko" htmlFor="riskId" required>
            <Select id="riskId" name="riskId" required defaultValue={presetRiskId ?? ""}>
              <option value="" disabled>
                Bitte wählen
              </option>
              {risks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Titel der Maßnahme" htmlFor="title" required>
            <Input id="title" name="title" required minLength={5} maxLength={200} />
          </Field>
          <Field
            label="Beschreibung"
            htmlFor="description"
            required
            hint="SMART formulieren: konkret, messbar, terminiert."
          >
            <Textarea id="description" name="description" required minLength={10} rows={3} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zuordnung &amp; Planung</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Action Owner" htmlFor="ownerId">
            <Select id="ownerId" name="ownerId" defaultValue="">
              <option value="">– später zuordnen –</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priorität" htmlFor="priority" required>
            <Select id="priority" name="priority" required defaultValue="">
              <option value="" disabled>
                Bitte wählen
              </option>
              {Object.entries(PRIORITY).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Startdatum" htmlFor="startDate">
            <Input id="startDate" name="startDate" type="date" />
          </Field>
          <Field label="Fälligkeitsdatum" htmlFor="dueDate">
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
          {pending ? "Wird angelegt…" : "Maßnahme anlegen (Status: Planned)"}
        </Button>
      </div>
    </form>
  );
}
