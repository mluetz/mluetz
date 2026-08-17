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
  CONTROL_EFFECTIVENESS_PERCENT,
  IMPACT,
  IMPACT_DIMENSIONS,
  LIKELIHOOD,
  RISK_STATUS,
  type RiskStatus,
} from "@/lib/domain/enums";
import type { Locale } from "@/lib/i18n/config";
import { CORE_MESSAGES } from "@/lib/i18n/messages/core";

function ErrorLine({ state, locale }: { state: ActionResult; locale: Locale }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  if (state.ok) return <p className="text-sm text-risk-low">{CORE_MESSAGES[locale].panels.saved}</p>;
  return null;
}

// ---------------- Bewertung ----------------

export function AssessmentForm({ riskId, locale }: { riskId: string; locale: Locale }) {
  const t = CORE_MESSAGES[locale].panels.assessment;
  const tc = CORE_MESSAGES[locale].common;
  const dimensionLabels = CORE_MESSAGES[locale].enums.impactDimensions;
  const effectivenessLabels = CORE_MESSAGES[locale].enums.controlEffectiveness;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(assessRisk, {});
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="riskId" value={riskId} />
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t.likelihood} htmlFor="likelihood" required>
              <Select id="likelihood" name="likelihood" required defaultValue="">
                <option value="" disabled>
                  {tc.pleaseChoose}
                </option>
                {Object.entries(LIKELIHOOD).map(([k, v]) => (
                  <option key={k} value={k}>
                    {k} – {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.impactFallback} htmlFor="impact" required>
              <Select id="impact" name="impact" required defaultValue="">
                <option value="" disabled>
                  {tc.pleaseChoose}
                </option>
                {Object.entries(IMPACT).map(([k, v]) => (
                  <option key={k} value={k}>
                    {k} – {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.controlEffectiveness} htmlFor="controlEffectiveness" required>
              <Select
                id="controlEffectiveness"
                name="controlEffectiveness"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  {tc.pleaseChoose}
                </option>
                {CONTROL_EFFECTIVENESS_PERCENT.map((p) => (
                  <option key={p} value={p}>
                    {effectivenessLabels[p]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <fieldset className="rounded-md border p-3">
            <legend className="px-1 text-xs font-medium text-muted-foreground">
              {t.dimensionsLegend}
            </legend>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Object.keys(IMPACT_DIMENSIONS).map((k) => (
                <div key={k}>
                  <Label htmlFor={`dim_${k}`}>{dimensionLabels[k]}</Label>
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
          <Field label={t.justification} htmlFor="justification" required>
            <Textarea id="justification" name="justification" required minLength={10} rows={3} />
          </Field>
          <ErrorLine state={state} locale={locale} />
          <Button type="submit" disabled={pending}>
            {pending ? t.saving : t.save}
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
  locale,
}: {
  riskId: string;
  currentStatus: string;
  allowedTargets: string[];
  locale: Locale;
}) {
  const t = CORE_MESSAGES[locale].panels.workflow;
  const tc = CORE_MESSAGES[locale].common;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(changeRiskStatus, {});
  if (allowedTargets.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        {t.noTransitions(RISK_STATUS[currentStatus as RiskStatus] ?? currentStatus)}
      </p>
    );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="riskId" value={riskId} />
      <div className="min-w-56">
        <Label htmlFor="newStatus">{t.newStatus}</Label>
        <Select id="newStatus" name="newStatus" required defaultValue="">
          <option value="" disabled>
            {tc.pleaseChoose}
          </option>
          {allowedTargets.map((tgt) => (
            <option key={tgt} value={tgt}>
              {RISK_STATUS[tgt as RiskStatus] ?? tgt}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-72 flex-1">
        <Label htmlFor="wf-comment">{t.comment}</Label>
        <Input id="wf-comment" name="comment" required minLength={3} />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? t.executing : t.changeStatus}
      </Button>
      <div className="w-full">
        <ErrorLine state={state} locale={locale} />
      </div>
    </form>
  );
}

// ---------------- Quality Review ----------------

export function StartReviewButton({ riskId, locale }: { riskId: string; locale: Locale }) {
  const t = CORE_MESSAGES[locale].panels.review;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    startQualityReview,
    {},
  );
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="riskId" value={riskId} />
      <Button type="submit" disabled={pending}>
        {pending ? t.starting : t.start}
      </Button>
      <ErrorLine state={state} locale={locale} />
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
  locale,
}: {
  reviewId: string;
  items: ChecklistItemDto[];
  locale: Locale;
}) {
  const t = CORE_MESSAGES[locale].panels.review;
  const tc = CORE_MESSAGES[locale].common;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    completeQualityReview,
    {},
  );
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="reviewId" value={reviewId} />
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="grid items-center gap-2 rounded-md border p-2 md:grid-cols-[1fr_150px_220px]"
          >
            <span className="text-sm">
              {i + 1}. {item.criterion}
            </span>
            <Select
              name={`item_${item.id}`}
              defaultValue={item.fulfilled === true ? "yes" : item.fulfilled === false ? "no" : ""}
              aria-label={t.itemAria(item.criterion)}
            >
              <option value="">{t.itemOpen}</option>
              <option value="yes">{t.itemFulfilled}</option>
              <option value="no">{t.itemNotFulfilled}</option>
            </Select>
            <Input
              name={`comment_${item.id}`}
              placeholder={t.commentPlaceholder}
              defaultValue={item.comment ?? ""}
              aria-label={t.commentAria(item.criterion)}
            />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label={t.outcome} htmlFor="outcome" required>
          <Select id="outcome" name="outcome" required defaultValue="">
            <option value="" disabled>
              {tc.pleaseChoose}
            </option>
            <option value="APPROVED">{t.outcomeApprove}</option>
            <option value="RETURNED">{t.outcomeReturn}</option>
            <option value="REJECTED">{t.outcomeReject}</option>
          </Select>
        </Field>
        <Field label={t.comments} htmlFor="rev-comments">
          <Input id="rev-comments" name="comments" />
        </Field>
        <Field label={t.rejectionReason} htmlFor="rejectionReason">
          <Input id="rejectionReason" name="rejectionReason" />
        </Field>
      </div>
      <ErrorLine state={state} locale={locale} />
      <Button type="submit" disabled={pending}>
        {pending ? t.saving : t.complete}
      </Button>
    </form>
  );
}

// ---------------- Akzeptanz ----------------

export function AcceptanceRequestForm({ riskId, locale }: { riskId: string; locale: Locale }) {
  const t = CORE_MESSAGES[locale].panels.acceptance;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    requestAcceptance,
    {},
  );
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="riskId" value={riskId} />
      <Field label={t.justification} htmlFor="acc-just" required>
        <Textarea id="acc-just" name="justification" required minLength={10} rows={2} />
      </Field>
      <Field label={t.compensatingControls} htmlFor="acc-comp" required>
        <Textarea id="acc-comp" name="compensatingControls" required minLength={5} rows={2} />
      </Field>
      <ErrorLine state={state} locale={locale} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? t.sending : t.request}
      </Button>
    </form>
  );
}

export function AcceptanceDecisionForm({
  acceptanceId,
  locale,
}: {
  acceptanceId: string;
  locale: Locale;
}) {
  const t = CORE_MESSAGES[locale].panels.acceptance;
  const tc = CORE_MESSAGES[locale].common;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(decideAcceptance, {});
  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/40 p-3"
    >
      <input type="hidden" name="acceptanceId" value={acceptanceId} />
      <div>
        <Label htmlFor={`dec-${acceptanceId}`}>{t.decision}</Label>
        <Select id={`dec-${acceptanceId}`} name="decision" required defaultValue="">
          <option value="" disabled>
            {tc.pleaseChoose}
          </option>
          <option value="APPROVED">{t.approve}</option>
          <option value="REJECTED">{t.reject}</option>
        </Select>
      </div>
      <div>
        <Label htmlFor={`vu-${acceptanceId}`}>{t.validUntil}</Label>
        <Input id={`vu-${acceptanceId}`} type="date" name="validUntil" />
      </div>
      <div className="min-w-64 flex-1">
        <Label htmlFor={`cm-${acceptanceId}`}>{t.comment}</Label>
        <Input id={`cm-${acceptanceId}`} name="comment" required minLength={3} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t.saving : t.decide}
      </Button>
      <div className="w-full">
        <ErrorLine state={state} locale={locale} />
      </div>
    </form>
  );
}

// ---------------- Kommentare ----------------

export function CommentForm({ riskId, locale }: { riskId: string; locale: Locale }) {
  const t = CORE_MESSAGES[locale].panels.comment;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(addRiskComment, {});
  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="riskId" value={riskId} />
      <div className="flex-1">
        <Label htmlFor="comment-body">{t.add}</Label>
        <Input id="comment-body" name="body" required minLength={2} maxLength={2000} />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "…" : t.send}
      </Button>
      <div className="w-full">
        <ErrorLine state={state} locale={locale} />
      </div>
    </form>
  );
}
