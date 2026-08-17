"use client";

import { useActionState } from "react";
import { updateStepResult, type ActionResult } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export const STEP_STATUS_LABELS: Record<string, string> = {
  OPEN: "Offen",
  DONE: "Erledigt",
  SKIPPED: "Übersprungen",
  BLOCKED: "Blockiert",
};

function stepStatusVariant(
  status: string,
): "low" | "medium" | "critical" | "secondary" | "outline" {
  switch (status) {
    case "DONE":
      return "low";
    case "SKIPPED":
      return "outline";
    case "BLOCKED":
      return "critical";
    default:
      return "secondary";
  }
}

export interface StepDto {
  id: string;
  sortOrder: number;
  title: string;
  description: string;
  responsibleRole: string;
  isDecisionPoint: boolean;
  requiredEvidence: string | null;
}

export interface StepResultDto {
  status: string;
  comment: string | null;
  completedByName: string | null;
  completedAt: string | null; // vorformatiert (formatDateTime) vom Server
}

export function StepRow({
  executionId,
  step,
  result,
  editable,
}: {
  executionId: string;
  step: StepDto;
  result: StepResultDto | null;
  editable: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(updateStepResult, {});
  const status = result?.status ?? "OPEN";
  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {step.sortOrder}. {step.title}
            {step.isDecisionPoint ? (
              <span className="ml-2 text-xs font-semibold text-risk-medium">
                ◆ Entscheidungspunkt
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">
            {step.description}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Rolle: {step.responsibleRole}
            {step.requiredEvidence ? ` · Erforderlicher Nachweis: ${step.requiredEvidence}` : ""}
          </p>
        </div>
        <Badge variant={stepStatusVariant(status)}>{STEP_STATUS_LABELS[status] ?? status}</Badge>
      </div>

      {result?.comment ? <p className="mt-2 text-sm">Kommentar: {result.comment}</p> : null}
      {result?.completedByName && result.completedAt ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Erledigt von {result.completedByName} am {result.completedAt}
        </p>
      ) : null}

      {editable ? (
        <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3">
          <input type="hidden" name="executionId" value={executionId} />
          <input type="hidden" name="stepId" value={step.id} />
          <div className="min-w-40">
            <Label htmlFor={`status-${step.id}`}>Status</Label>
            <Select id={`status-${step.id}`} name="status" defaultValue={status}>
              {Object.entries(STEP_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-56 flex-1">
            <Label htmlFor={`comment-${step.id}`}>Kommentar</Label>
            <Input
              id={`comment-${step.id}`}
              name="comment"
              maxLength={2000}
              defaultValue={result?.comment ?? ""}
              placeholder="z. B. Ergebnis, Nachweis-Link, Blocker"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            {pending ? "Speichern…" : "Speichern"}
          </Button>
          {state.error ? (
            <p role="alert" className="w-full text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
