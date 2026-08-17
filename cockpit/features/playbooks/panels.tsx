"use client";

import { useActionState } from "react";
import {
  startPlaybookExecution,
  updatePlaybookExecution,
  closePlaybookExecution,
  type ActionResult,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/input";

export const SEVERITY_LABELS: Record<string, string> = {
  LOW: "Niedrig",
  MEDIUM: "Mittel",
  HIGH: "Hoch",
  CRITICAL: "Kritisch",
};

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

export interface OptionDto {
  id: string;
  label: string;
}

// ---------------- Aktivierung ----------------

export function StartPlaybookForm({
  playbookId,
  risks,
  controls,
  thirdParties,
}: {
  playbookId: string;
  risks: OptionDto[];
  controls: OptionDto[];
  thirdParties: OptionDto[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    startPlaybookExecution,
    {},
  );
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="playbookId" value={playbookId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Severity" htmlFor="severity" required>
          <Select id="severity" name="severity" required defaultValue="">
            <option value="" disabled>
              Bitte wählen
            </option>
            {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Verknüpftes Risiko (optional)" htmlFor="riskId">
          <Select id="riskId" name="riskId" defaultValue="">
            <option value="">– keine Verknüpfung –</option>
            {risks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Verknüpfte Drittpartei (optional)" htmlFor="thirdPartyId">
          <Select id="thirdPartyId" name="thirdPartyId" defaultValue="">
            <option value="">– keine Verknüpfung –</option>
            {thirdParties.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Verknüpfte Kontrolle (optional)" htmlFor="controlId">
          <Select id="controlId" name="controlId" defaultValue="">
            <option value="">– keine Verknüpfung –</option>
            {controls.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Erste Notizen (optional)" htmlFor="pb-notes">
        <Textarea id="pb-notes" name="notes" rows={2} maxLength={4000} />
      </Field>
      <ErrorLine state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Aktiviere…" : "Playbook aktivieren"}
      </Button>
    </form>
  );
}

// ---------------- Notizen / Severity ----------------

export function UpdateExecutionForm({
  executionId,
  severity,
  notes,
}: {
  executionId: string;
  severity: string;
  notes: string | null;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    updatePlaybookExecution,
    {},
  );
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="executionId" value={executionId} />
      <div className="max-w-56">
        <Label htmlFor="upd-severity">Severity</Label>
        <Select id="upd-severity" name="severity" required defaultValue={severity}>
          {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      <Field
        label="Notizen"
        htmlFor="upd-notes"
        hint="Laufende Dokumentation der Lagebeurteilung, Entscheidungen und Maßnahmen. Der Inhalt ersetzt den bisherigen Stand."
      >
        <Textarea
          id="upd-notes"
          name="notes"
          rows={6}
          maxLength={8000}
          defaultValue={notes ?? ""}
        />
      </Field>
      <ErrorLine state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Speichern…" : "Notizen speichern"}
      </Button>
    </form>
  );
}

// ---------------- Abschluss ----------------

export function ClosePlaybookForm({ executionId }: { executionId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    closePlaybookExecution,
    {},
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="executionId" value={executionId} />
      <div className="min-w-56">
        <Label htmlFor="close-outcome">Ergebnis</Label>
        <Select id="close-outcome" name="outcome" required defaultValue="">
          <option value="" disabled>
            Bitte wählen
          </option>
          <option value="CLOSED">Schließen (Abschlusskriterien erfüllt)</option>
          <option value="ABORTED">Abbrechen</option>
        </Select>
      </div>
      <div className="min-w-72 flex-1">
        <Label htmlFor="close-comment">Abschlusskommentar (Pflicht)</Label>
        <Input id="close-comment" name="comment" required minLength={3} maxLength={2000} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Wird gespeichert…" : "Ausführung beenden"}
      </Button>
      <div className="w-full">
        <ErrorLine state={state} />
      </div>
    </form>
  );
}
