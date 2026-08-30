"use client";

import { useActionState } from "react";
import { changeFindingStatus, createFinding, type ActionResult } from "./findings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/input";
import { FINDING_SEVERITY_RULES } from "@/lib/domain/dora-scoring";
import type { Locale } from "@/lib/i18n/config";
import { DORA_MESSAGES } from "@/lib/i18n/messages/dora";

function ErrorLine({ state, locale }: { state: ActionResult; locale: Locale }) {
  const t = DORA_MESSAGES[locale];
  if (state.error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  if (state.ok) return <p className="text-sm text-risk-low">{t.common.saved}</p>;
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
  locale = "de",
}: {
  requirements: Option[];
  actions: Option[];
  locale?: Locale;
}) {
  const t = DORA_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createFinding, {});
  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.findingForm.cardTitle}</CardTitle>
          <CardDescription>{t.findingForm.cardDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label={t.findingForm.titleLabel} htmlFor="fnd-title" required>
            <Input id="fnd-title" name="title" required minLength={5} maxLength={200} />
          </Field>
          <Field label={t.findingForm.descriptionLabel} htmlFor="fnd-description" required>
            <Textarea id="fnd-description" name="description" required minLength={10} rows={3} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.findingForm.sourceLabel} htmlFor="fnd-source" required>
              <Select id="fnd-source" name="source" required defaultValue="">
                <option value="" disabled>
                  {t.common.pleaseSelect}
                </option>
                {Object.entries(t.enums.findingSource).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.findingForm.severityLabel} htmlFor="fnd-severity" required>
              <Select id="fnd-severity" name="severity" required defaultValue="">
                <option value="" disabled>
                  {t.common.pleaseSelect}
                </option>
                {Object.entries(FINDING_SEVERITY_RULES).map(([k, rule]) => (
                  <option key={k} value={k}>
                    {t.findingForm.severityOption(
                      t.enums.severity[k] ?? rule.label,
                      rule.responseDays,
                      rule.remediationDays,
                      t.enums.escalation[rule.escalateTo] ?? rule.escalateTo,
                    )}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field
            label={t.findingForm.effectivenessLabel}
            htmlFor="fnd-effectiveness"
            hint={t.findingForm.effectivenessHint}
          >
            <Textarea id="fnd-effectiveness" name="effectivenessCriterion" rows={2} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.findingForm.linkCardTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label={t.findingForm.requirementLabel} htmlFor="fnd-requirement">
            <Select id="fnd-requirement" name="requirementId" defaultValue="">
              <option value="">{t.findingForm.noRequirementOption}</option>
              {requirements.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.findingForm.actionLabel} htmlFor="fnd-action">
            <Select id="fnd-action" name="actionId" defaultValue="">
              <option value="">{t.findingForm.noActionOption}</option>
              {actions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
        </CardContent>
      </Card>

      <ErrorLine state={state} locale={locale} />
      <Button type="submit" disabled={pending}>
        {pending ? t.findingForm.creating : t.findingForm.submit}
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
  locale = "de",
}: {
  findingId: string;
  currentStatus: string;
  allowedTargets: string[];
  hasEffectivenessCriterion: boolean;
  locale?: Locale;
}) {
  const t = DORA_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    changeFindingStatus,
    {},
  );
  if (allowedTargets.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        {t.workflow.noTransitions(
          t.enums.findingStatus[currentStatus as keyof typeof t.enums.findingStatus] ??
            currentStatus,
        )}
      </p>
    );
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="findingId" value={findingId} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56">
          <Label htmlFor="fnd-newStatus">{t.workflow.newStatus}</Label>
          <Select id="fnd-newStatus" name="newStatus" required defaultValue="">
            <option value="" disabled>
              {t.common.pleaseSelect}
            </option>
            {allowedTargets.map((tgt) => (
              <option key={tgt} value={tgt}>
                {t.enums.findingStatus[tgt as keyof typeof t.enums.findingStatus] ?? tgt}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-72 flex-1">
          <Label htmlFor="fnd-wf-comment">{t.workflow.comment}</Label>
          <Input id="fnd-wf-comment" name="comment" required minLength={3} />
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? t.workflow.executing : t.workflow.changeStatus}
        </Button>
      </div>
      {!hasEffectivenessCriterion ? (
        <Field
          label={t.findingForm.addEffectiveness}
          htmlFor="fnd-wf-effectiveness"
          hint={t.findingForm.addEffectivenessHint}
        >
          <Textarea id="fnd-wf-effectiveness" name="effectivenessCriterion" rows={2} />
        </Field>
      ) : null}
      <ErrorLine state={state} locale={locale} />
    </form>
  );
}
