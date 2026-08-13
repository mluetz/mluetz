"use client";

import { useActionState } from "react";
import {
  updateActionProgress,
  changeActionStatus,
  escalateAction,
  type ActionResult,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Label } from "@/components/ui/input";
import { ACTION_STATUS, type ActionStatus } from "@/lib/domain/enums";

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

// ---------------- Fortschritt aktualisieren ----------------

export function ProgressForm({
  actionId,
  currentProgress,
}: {
  actionId: string;
  currentProgress: number;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    updateActionProgress,
    {},
  );
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="actionId" value={actionId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Fortschritt (%)" htmlFor="progress" required>
          <Input
            id="progress"
            name="progress"
            type="number"
            min={0}
            max={100}
            step={1}
            required
            defaultValue={currentProgress}
          />
        </Field>
        <Field label="Kommentar (optional)" htmlFor="progress-comment">
          <Input id="progress-comment" name="comment" maxLength={1000} />
        </Field>
      </div>
      <Field
        label="Nachweis / Evidence (optional)"
        htmlFor="progress-evidence"
        hint="Kurzer Verweis auf den Umsetzungsnachweis (Link, Dokument, Ticket …)."
      >
        <Textarea id="progress-evidence" name="evidenceNote" rows={2} maxLength={2000} />
      </Field>
      <ErrorLine state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Speichern…" : "Fortschritt speichern"}
      </Button>
    </form>
  );
}

// ---------------- Statuswechsel ----------------

export function StatusForm({
  actionId,
  currentStatus,
  allowedTargets,
}: {
  actionId: string;
  currentStatus: string;
  allowedTargets: string[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    changeActionStatus,
    {},
  );
  if (allowedTargets.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Keine weiteren Workflow-Übergänge möglich (Status:{" "}
        {ACTION_STATUS[currentStatus as ActionStatus] ?? currentStatus}).
      </p>
    );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="actionId" value={actionId} />
      <div className="min-w-56">
        <Label htmlFor="action-newStatus">Neuer Status</Label>
        <Select id="action-newStatus" name="newStatus" required defaultValue="">
          <option value="" disabled>
            Bitte wählen
          </option>
          {allowedTargets.map((t) => (
            <option key={t} value={t}>
              {ACTION_STATUS[t as ActionStatus] ?? t}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-72 flex-1">
        <Label htmlFor="action-wf-comment">Kommentar / Begründung (Pflicht)</Label>
        <Input id="action-wf-comment" name="comment" required minLength={3} />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Wird ausgeführt…" : "Status ändern"}
      </Button>
      <div className="w-full">
        <ErrorLine state={state} />
      </div>
    </form>
  );
}

// ---------------- Eskalation ----------------

const ESCALATION_LEVELS: Record<number, string> = {
  1: "Stufe 1 – Teamleitung",
  2: "Stufe 2 – Bereich",
  3: "Stufe 3 – Management",
};

export function EscalationForm({
  actionId,
  currentLevel,
}: {
  actionId: string;
  currentLevel: number;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(escalateAction, {});
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="actionId" value={actionId} />
      <p className="text-xs text-muted-foreground">
        Aktuelle Eskalationsstufe: {currentLevel > 0 ? ESCALATION_LEVELS[currentLevel] : "keine"}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Eskalationsstufe" htmlFor="escalationLevel" required>
          <Select id="escalationLevel" name="escalationLevel" required defaultValue="">
            <option value="" disabled>
              Bitte wählen
            </option>
            {[1, 2, 3].map((lvl) => (
              <option key={lvl} value={lvl}>
                {ESCALATION_LEVELS[lvl]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Begründung (Pflicht)" htmlFor="escalation-justification" required>
        <Textarea
          id="escalation-justification"
          name="justification"
          required
          minLength={5}
          rows={2}
          maxLength={2000}
        />
      </Field>
      <ErrorLine state={state} />
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Eskaliere…" : "Eskalieren"}
      </Button>
    </form>
  );
}
