"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  changeIncidentStatus,
  classifyIncident,
  createIncident,
  markReportSubmitted,
  type ActionResult,
} from "./incident-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/input";
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

function CheckboxLine({
  name,
  label,
  checked,
  onChange,
  hint,
}: {
  name: string;
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name={name}
          className="h-4 w-4 rounded border-input accent-primary"
          {...(onChange
            ? { checked: checked ?? false, onChange: (e) => onChange(e.target.checked) }
            : {})}
        />
        {label}
      </label>
      {hint ? <p className="ml-6 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

interface Option {
  id: string;
  name: string;
}

// ---------------- Vorfall erfassen ----------------

export function NewIncidentForm({
  criticalFunctions,
  thirdParties,
  locale = "de",
}: {
  criticalFunctions: Option[];
  thirdParties: Option[];
  locale?: Locale;
}) {
  const t = DORA_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createIncident, {});
  const [isMajor, setIsMajor] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.incidentForm.cardTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label={t.incidentForm.titleLabel} htmlFor="title" required>
            <Input id="title" name="title" required minLength={5} maxLength={200} />
          </Field>
          <Field
            label={t.incidentForm.descriptionLabel}
            htmlFor="description"
            required
            hint={t.incidentForm.descriptionHint}
          >
            <Textarea id="description" name="description" required minLength={10} rows={3} />
          </Field>
          <Field
            label={t.incidentForm.awarenessLabel}
            htmlFor="awarenessAt"
            required
            hint={t.incidentForm.awarenessHint}
          >
            <Input id="awarenessAt" name="awarenessAt" type="datetime-local" required />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.incidentForm.classCardTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckboxLine
            name="isMajor"
            label={t.incidentForm.isMajorLabel}
            checked={isMajor}
            onChange={setIsMajor}
            hint={t.incidentForm.isMajorHint}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label={t.incidentForm.classifiedAtLabel}
              htmlFor="classifiedAt"
              required={isMajor}
              hint={
                isMajor
                  ? t.incidentForm.classifiedAtHintMajor
                  : t.incidentForm.classifiedAtHintOptional
              }
            >
              <Input
                id="classifiedAt"
                name="classifiedAt"
                type="datetime-local"
                required={isMajor}
              />
            </Field>
            <Field label={t.incidentForm.classificationNoteLabel} htmlFor="classificationNote">
              <Textarea id="classificationNote" name="classificationNote" rows={2} />
            </Field>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <CheckboxLine
              name="nis2Relevant"
              label={t.incidentForm.nis2Label}
              hint={t.incidentForm.nis2Hint}
            />
            <CheckboxLine
              name="gdprRelevant"
              label={t.incidentForm.gdprLabel}
              hint={t.incidentForm.gdprHint}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.common.linksTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label={t.incidentForm.cifLabel} htmlFor="criticalFunctionId">
            <Select id="criticalFunctionId" name="criticalFunctionId" defaultValue="">
              <option value="">–</option>
              {criticalFunctions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.common.thirdParty} htmlFor="thirdPartyId">
            <Select id="thirdPartyId" name="thirdPartyId" defaultValue="">
              <option value="">–</option>
              {thirdParties.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.name}
                </option>
              ))}
            </Select>
          </Field>
        </CardContent>
      </Card>

      <ErrorLine state={state} locale={locale} />
      <Button type="submit" disabled={pending}>
        {pending ? t.incidentForm.creating : t.incidentForm.submit}
      </Button>
    </form>
  );
}

// ---------------- Nachträgliche Klassifizierung ----------------

export function ClassifyForm({
  incidentId,
  locale = "de",
}: {
  incidentId: string;
  locale?: Locale;
}) {
  const t = DORA_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(classifyIncident, {});
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="incidentId" value={incidentId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label={t.incidentForm.classifiedAtLabel}
          htmlFor="cl-classifiedAt"
          required
          hint={t.incidentForm.classifyHint}
        >
          <Input id="cl-classifiedAt" name="classifiedAt" type="datetime-local" required />
        </Field>
        <Field label={t.incidentForm.classificationNoteLabel} htmlFor="cl-note">
          <Textarea id="cl-note" name="classificationNote" rows={2} />
        </Field>
      </div>
      <CheckboxLine
        name="isMajor"
        label={t.incidentForm.isMajorLabel}
        hint={t.incidentForm.classifyMajorHint}
      />
      <ErrorLine state={state} locale={locale} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? t.incidentForm.saving : t.incidentForm.classifySubmit}
      </Button>
    </form>
  );
}

// ---------------- Meldung dokumentieren (inline je Report-Zeile) ----------------

export function ReportSubmitForm({
  reportId,
  label,
  locale = "de",
}: {
  reportId: string;
  label: string;
  locale?: Locale;
}) {
  const t = DORA_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    markReportSubmitted,
    {},
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="reportId" value={reportId} />
      <div>
        <Label htmlFor={`sub-${reportId}`}>{t.incidentForm.submittedAtLabel}</Label>
        <Input id={`sub-${reportId}`} name="submittedAt" type="datetime-local" />
      </div>
      <div className="min-w-56 flex-1">
        <Label htmlFor={`ref-${reportId}`}>{t.incidentForm.referenceLabel}</Label>
        <Input id={`ref-${reportId}`} name="reference" maxLength={500} />
      </div>
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        disabled={pending}
        aria-label={t.incidentForm.reportSubmitAria(label)}
      >
        {pending ? t.incidentForm.saving : t.incidentForm.reportSubmit}
      </Button>
      <div className="w-full">
        <ErrorLine state={state} locale={locale} />
      </div>
    </form>
  );
}

// ---------------- Statuswechsel ----------------

export function StatusForm({
  incidentId,
  currentStatus,
  allowedTargets,
  locale = "de",
}: {
  incidentId: string;
  currentStatus: string;
  allowedTargets: string[];
  locale?: Locale;
}) {
  const t = DORA_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    changeIncidentStatus,
    {},
  );
  if (allowedTargets.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        {t.workflow.noTransitions(
          t.enums.incidentStatus[currentStatus as keyof typeof t.enums.incidentStatus] ??
            currentStatus,
        )}
      </p>
    );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="incidentId" value={incidentId} />
      <div className="min-w-56">
        <Label htmlFor="inc-newStatus">{t.workflow.newStatus}</Label>
        <Select id="inc-newStatus" name="newStatus" required defaultValue="">
          <option value="" disabled>
            {t.common.pleaseSelect}
          </option>
          {allowedTargets.map((tgt) => (
            <option key={tgt} value={tgt}>
              {t.enums.incidentStatus[tgt as keyof typeof t.enums.incidentStatus] ?? tgt}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-72 flex-1">
        <Label htmlFor="inc-wf-comment">{t.workflow.comment}</Label>
        <Input id="inc-wf-comment" name="comment" required minLength={3} />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? t.workflow.executing : t.workflow.changeStatus}
      </Button>
      <div className="w-full">
        <ErrorLine state={state} locale={locale} />
      </div>
    </form>
  );
}
