"use client";

import { useActionState } from "react";
import {
  assessRisk,
  changeRiskStatus,
  startQualityReview,
  completeQualityReview,
  requestAcceptance,
  decideAcceptance,
  addRiskComment,
  type ActionResult,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Select, Textarea, Label } from "@/components/ui/input";
import {
  CONTROL_EFFECTIVENESS_LABELS,
  CONTROL_EFFECTIVENESS_PERCENT,
  IMPACT,
  IMPACT_DIMENSIONS,
  LIKELIHOOD,
  RISK_STATUS,
  type RiskStatus,
} from "@/lib/domain/enums";

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

// ---------------- Bewertung ----------------

export function AssessmentForm({ riskId }: { riskId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(assessRisk, {});
  return (
    <Card>
      <CardHeader>
        <CardTitle>Neue Bewertung durchführen</CardTitle>
        <CardDescription>
          Inherent = Likelihood × Impact; Residual wird aus der Kontrollwirksamkeit abgeleitet
          (Methodik: docs/governance/risk-methodology.md). Der Impact ergibt sich aus dem Maximum
          der bewerteten Dimensionen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="riskId" value={riskId} />
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Eintrittswahrscheinlichkeit" htmlFor="likelihood" required>
              <Select id="likelihood" name="likelihood" required defaultValue="">
                <option value="" disabled>
                  Bitte wählen
                </option>
                {Object.entries(LIKELIHOOD).map(([k, v]) => (
                  <option key={k} value={k}>
                    {k} – {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Auswirkung (Fallback ohne Dimensionen)" htmlFor="impact" required>
              <Select id="impact" name="impact" required defaultValue="">
                <option value="" disabled>
                  Bitte wählen
                </option>
                {Object.entries(IMPACT).map(([k, v]) => (
                  <option key={k} value={k}>
                    {k} – {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Kontrollwirksamkeit" htmlFor="controlEffectiveness" required>
              <Select id="controlEffectiveness" name="controlEffectiveness" required defaultValue="">
                <option value="" disabled>
                  Bitte wählen
                </option>
                {CONTROL_EFFECTIVENESS_PERCENT.map((p) => (
                  <option key={p} value={p}>
                    {CONTROL_EFFECTIVENESS_LABELS[p]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <fieldset className="rounded-md border p-3">
            <legend className="px-1 text-xs font-medium text-muted-foreground">
              Auswirkung je Dimension (1–5, optional; Maximum bestimmt den Impact)
            </legend>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Object.entries(IMPACT_DIMENSIONS).map(([k, label]) => (
                <div key={k}>
                  <Label htmlFor={`dim_${k}`}>{label}</Label>
                  <Select id={`dim_${k}`} name={`dim_${k}`} defaultValue="">
                    <option value="">–</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </fieldset>
          <Field label="Begründung der Bewertung" htmlFor="justification" required>
            <Textarea id="justification" name="justification" required minLength={10} rows={3} />
          </Field>
          <ErrorLine state={state} />
          <Button type="submit" disabled={pending}>
            {pending ? "Speichern…" : "Bewertung speichern"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------- Workflow / Statuswechsel ----------------

export function WorkflowPanel({
  riskId,
  currentStatus,
  allowedTargets,
}: {
  riskId: string;
  currentStatus: string;
  allowedTargets: string[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(changeRiskStatus, {});
  if (allowedTargets.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Keine weiteren Workflow-Übergänge möglich (Status:{" "}
        {RISK_STATUS[currentStatus as RiskStatus] ?? currentStatus}).
      </p>
    );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="riskId" value={riskId} />
      <div className="min-w-56">
        <Label htmlFor="newStatus">Neuer Status</Label>
        <Select id="newStatus" name="newStatus" required defaultValue="">
          <option value="" disabled>
            Bitte wählen
          </option>
          {allowedTargets.map((t) => (
            <option key={t} value={t}>
              {RISK_STATUS[t as RiskStatus] ?? t}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-72 flex-1">
        <Label htmlFor="wf-comment">Kommentar / Begründung (Pflicht)</Label>
        <Input id="wf-comment" name="comment" required minLength={3} />
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

// ---------------- Quality Review ----------------

export function StartReviewButton({ riskId }: { riskId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(startQualityReview, {});
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="riskId" value={riskId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Starte…" : "Quality Review starten"}
      </Button>
      <ErrorLine state={state} />
    </form>
  );
}

export interface ChecklistItemDto {
  id: string;
  criterion: string;
  fulfilled: boolean | null;
  comment: string | null;
}

export function CompleteReviewForm({
  reviewId,
  items,
}: {
  reviewId: string;
  items: ChecklistItemDto[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    completeQualityReview,
    {},
  );
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="reviewId" value={reviewId} />
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.id} className="grid items-center gap-2 rounded-md border p-2 md:grid-cols-[1fr_150px_220px]">
            <span className="text-sm">
              {i + 1}. {item.criterion}
            </span>
            <Select
              name={`item_${item.id}`}
              defaultValue={item.fulfilled === true ? "yes" : item.fulfilled === false ? "no" : ""}
              aria-label={`Bewertung: ${item.criterion}`}
            >
              <option value="">offen</option>
              <option value="yes">erfüllt</option>
              <option value="no">nicht erfüllt</option>
            </Select>
            <Input
              name={`comment_${item.id}`}
              placeholder="Kommentar (optional)"
              defaultValue={item.comment ?? ""}
              aria-label={`Kommentar: ${item.criterion}`}
            />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Ergebnis" htmlFor="outcome" required>
          <Select id="outcome" name="outcome" required defaultValue="">
            <option value="" disabled>
              Bitte wählen
            </option>
            <option value="APPROVED">Freigeben</option>
            <option value="RETURNED">Zur Nachbearbeitung zurückgeben</option>
            <option value="REJECTED">Ablehnen</option>
          </Select>
        </Field>
        <Field label="Review-Kommentar" htmlFor="rev-comments">
          <Input id="rev-comments" name="comments" />
        </Field>
        <Field label="Begründung bei Rückgabe/Ablehnung" htmlFor="rejectionReason">
          <Input id="rejectionReason" name="rejectionReason" />
        </Field>
      </div>
      <ErrorLine state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Speichern…" : "Review abschließen (Vier-Augen-Prinzip)"}
      </Button>
    </form>
  );
}

// ---------------- Akzeptanz ----------------

export function AcceptanceRequestForm({ riskId }: { riskId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(requestAcceptance, {});
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="riskId" value={riskId} />
      <Field label="Begründung des Akzeptanzantrags" htmlFor="acc-just" required>
        <Textarea id="acc-just" name="justification" required minLength={10} rows={2} />
      </Field>
      <Field label="Kompensierende Kontrollen" htmlFor="acc-comp" required>
        <Textarea id="acc-comp" name="compensatingControls" required minLength={5} rows={2} />
      </Field>
      <ErrorLine state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Sende…" : "Risikoakzeptanz beantragen"}
      </Button>
    </form>
  );
}

export function AcceptanceDecisionForm({ acceptanceId }: { acceptanceId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(decideAcceptance, {});
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/40 p-3">
      <input type="hidden" name="acceptanceId" value={acceptanceId} />
      <div>
        <Label htmlFor={`dec-${acceptanceId}`}>Entscheidung</Label>
        <Select id={`dec-${acceptanceId}`} name="decision" required defaultValue="">
          <option value="" disabled>
            Bitte wählen
          </option>
          <option value="APPROVED">Genehmigen (befristet)</option>
          <option value="REJECTED">Ablehnen</option>
        </Select>
      </div>
      <div>
        <Label htmlFor={`vu-${acceptanceId}`}>Befristet bis</Label>
        <Input id={`vu-${acceptanceId}`} type="date" name="validUntil" />
      </div>
      <div className="min-w-64 flex-1">
        <Label htmlFor={`cm-${acceptanceId}`}>Kommentar (Pflicht)</Label>
        <Input id={`cm-${acceptanceId}`} name="comment" required minLength={3} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Speichern…" : "Entscheiden"}
      </Button>
      <div className="w-full">
        <ErrorLine state={state} />
      </div>
    </form>
  );
}

// ---------------- Kommentare ----------------

export function CommentForm({ riskId }: { riskId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(addRiskComment, {});
  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="riskId" value={riskId} />
      <div className="flex-1">
        <Label htmlFor="comment-body">Kommentar hinzufügen</Label>
        <Input id="comment-body" name="body" required minLength={2} maxLength={2000} />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "…" : "Senden"}
      </Button>
      <div className="w-full">
        <ErrorLine state={state} />
      </div>
    </form>
  );
}
