"use client";

import { useActionState } from "react";
import { changeFindingStatus, createFinding, type ActionResult } from "./findings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/input";
import { DORA_FINDING_SOURCE, DORA_FINDING_STATUS } from "@/lib/domain/enums";
import { FINDING_SEVERITY_RULES } from "@/lib/domain/dora-scoring";

function ErrorLine({ state }: { state: ActionResult }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  if (state.ok) return <p className="text-sm text-risk-low">Gespeichert.</p>;
  return null;
}

export interface Option {
  id: string;
  label: string;
}

// ---------------- Neues Finding ----------------

export function NewFindingForm({
  requirements,
  actions,
}: {
  requirements: Option[];
  actions: Option[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createFinding, {});
  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Feststellung</CardTitle>
          <CardDescription>
            Reaktions- und Behebungsfrist sowie die Eskalationsstufe werden automatisch aus dem
            Schweregrad abgeleitet (FRWK-DORA-001, Tabelle 24).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Titel" htmlFor="fnd-title" required>
            <Input id="fnd-title" name="title" required minLength={5} maxLength={200} />
          </Field>
          <Field label="Beschreibung" htmlFor="fnd-description" required>
            <Textarea id="fnd-description" name="description" required minLength={10} rows={3} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Quelle" htmlFor="fnd-source" required>
              <Select id="fnd-source" name="source" required defaultValue="">
                <option value="" disabled>
                  Bitte wählen
                </option>
                {Object.entries(DORA_FINDING_SOURCE).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Schweregrad" htmlFor="fnd-severity" required>
              <Select id="fnd-severity" name="severity" required defaultValue="">
                <option value="" disabled>
                  Bitte wählen
                </option>
                {Object.entries(FINDING_SEVERITY_RULES).map(([k, rule]) => (
                  <option key={k} value={k}>
                    {rule.label} – Reaktion {rule.responseDays} Tage, Behebung {rule.remediationDays}{" "}
                    Tage, Eskalation: {rule.escalateTo}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field
            label="Wirksamkeitskriterium"
            htmlFor="fnd-effectiveness"
            hint="Messbares Kriterium für die Wirksamkeitsprüfung – ohne Kriterium kann das Finding nicht geschlossen werden (Kap. 12.1)."
          >
            <Textarea id="fnd-effectiveness" name="effectivenessCriterion" rows={2} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verknüpfung</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="DORA-Anforderung" htmlFor="fnd-requirement">
            <Select id="fnd-requirement" name="requirementId" defaultValue="">
              <option value="">– ohne Anforderungsbezug –</option>
              {requirements.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="CAPA-Maßnahme" htmlFor="fnd-action">
            <Select id="fnd-action" name="actionId" defaultValue="">
              <option value="">– keine Maßnahme verknüpft –</option>
              {actions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
        </CardContent>
      </Card>

      <ErrorLine state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Wird angelegt…" : "Finding anlegen (Status: Offen)"}
      </Button>
    </form>
  );
}

// ---------------- Statuswechsel ----------------

export function FindingStatusForm({
  findingId,
  currentStatus,
  allowedTargets,
  hasEffectivenessCriterion,
}: {
  findingId: string;
  currentStatus: string;
  allowedTargets: string[];
  hasEffectivenessCriterion: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    changeFindingStatus,
    {},
  );
  if (allowedTargets.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Keine weiteren Workflow-Übergänge möglich (Status:{" "}
        {DORA_FINDING_STATUS[currentStatus as keyof typeof DORA_FINDING_STATUS] ?? currentStatus}).
      </p>
    );
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="findingId" value={findingId} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56">
          <Label htmlFor="fnd-newStatus">Neuer Status</Label>
          <Select id="fnd-newStatus" name="newStatus" required defaultValue="">
            <option value="" disabled>
              Bitte wählen
            </option>
            {allowedTargets.map((t) => (
              <option key={t} value={t}>
                {DORA_FINDING_STATUS[t as keyof typeof DORA_FINDING_STATUS] ?? t}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-72 flex-1">
          <Label htmlFor="fnd-wf-comment">Kommentar / Begründung (Pflicht)</Label>
          <Input id="fnd-wf-comment" name="comment" required minLength={3} />
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Wird ausgeführt…" : "Status ändern"}
        </Button>
      </div>
      {!hasEffectivenessCriterion ? (
        <Field
          label="Wirksamkeitskriterium nachtragen"
          htmlFor="fnd-wf-effectiveness"
          hint="Pflicht vor dem Abschluss: Ohne Wirksamkeitskriterium ist der Übergang nach „Geschlossen“ gesperrt (FRWK-DORA-001 Kap. 12.1)."
        >
          <Textarea id="fnd-wf-effectiveness" name="effectivenessCriterion" rows={2} />
        </Field>
      ) : null}
      <ErrorLine state={state} />
    </form>
  );
}
