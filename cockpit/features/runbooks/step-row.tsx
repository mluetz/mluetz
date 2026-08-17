"use client";

import { useActionState } from "react";
import { updateStepResult, type ActionResult } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/config";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";

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
  locale,
}: {
  executionId: string;
  step: StepDto;
  result: StepResultDto | null;
  editable: boolean;
  locale: Locale;
}) {
  const t = TPRM_MESSAGES[locale];
  const sr = t.rb.stepRow;
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
                {sr.decisionPoint}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">
            {step.description}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {sr.role}: {step.responsibleRole}
            {step.requiredEvidence ? ` · ${sr.requiredEvidence}: ${step.requiredEvidence}` : ""}
          </p>
        </div>
        <Badge variant={stepStatusVariant(status)}>{t.labels.stepStatus[status] ?? status}</Badge>
      </div>

      {result?.comment ? (
        <p className="mt-2 text-sm">
          {sr.commentPrefix}: {result.comment}
        </p>
      ) : null}
      {result?.completedByName && result.completedAt ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {sr.completedBy(result.completedByName, result.completedAt)}
        </p>
      ) : null}

      {editable ? (
        <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3">
          <input type="hidden" name="executionId" value={executionId} />
          <input type="hidden" name="stepId" value={step.id} />
          <div className="min-w-40">
            <Label htmlFor={`status-${step.id}`}>{sr.status}</Label>
            <Select id={`status-${step.id}`} name="status" defaultValue={status}>
              {Object.entries(t.labels.stepStatus).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-56 flex-1">
            <Label htmlFor={`comment-${step.id}`}>{sr.comment}</Label>
            <Input
              id={`comment-${step.id}`}
              name="comment"
              maxLength={2000}
              defaultValue={result?.comment ?? ""}
              placeholder={sr.commentPlaceholder}
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            {pending ? t.common.saving : t.common.save}
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
