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
import type { Locale } from "@/lib/i18n/config";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";

function ErrorLine({ state, locale }: { state: ActionResult; locale: Locale }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  if (state.ok)
    return <p className="text-sm text-risk-low">{TPRM_MESSAGES[locale].common.saved}</p>;
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
  locale,
}: {
  playbookId: string;
  risks: OptionDto[];
  controls: OptionDto[];
  thirdParties: OptionDto[];
  locale: Locale;
}) {
  const t = TPRM_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    startPlaybookExecution,
    {},
  );
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="playbookId" value={playbookId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t.pb.panels.severity} htmlFor="severity" required>
          <Select id="severity" name="severity" required defaultValue="">
            <option value="" disabled>
              {t.common.pleaseSelect}
            </option>
            {Object.entries(t.labels.severity).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.pb.panels.linkedRiskOptional} htmlFor="riskId">
          <Select id="riskId" name="riskId" defaultValue="">
            <option value="">{t.pb.panels.noLink}</option>
            {risks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.pb.panels.linkedThirdPartyOptional} htmlFor="thirdPartyId">
          <Select id="thirdPartyId" name="thirdPartyId" defaultValue="">
            <option value="">{t.pb.panels.noLink}</option>
            {thirdParties.map((tp) => (
              <option key={tp.id} value={tp.id}>
                {tp.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.pb.panels.linkedControlOptional} htmlFor="controlId">
          <Select id="controlId" name="controlId" defaultValue="">
            <option value="">{t.pb.panels.noLink}</option>
            {controls.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={t.pb.panels.initialNotes} htmlFor="pb-notes">
        <Textarea id="pb-notes" name="notes" rows={2} maxLength={4000} />
      </Field>
      <ErrorLine state={state} locale={locale} />
      <Button type="submit" disabled={pending}>
        {pending ? t.pb.panels.activating : t.pb.panels.activate}
      </Button>
    </form>
  );
}

// ---------------- Notizen / Severity ----------------

export function UpdateExecutionForm({
  executionId,
  severity,
  notes,
  locale,
}: {
  executionId: string;
  severity: string;
  notes: string | null;
  locale: Locale;
}) {
  const t = TPRM_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    updatePlaybookExecution,
    {},
  );
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="executionId" value={executionId} />
      <div className="max-w-56">
        <Label htmlFor="upd-severity">{t.pb.panels.severity}</Label>
        <Select id="upd-severity" name="severity" required defaultValue={severity}>
          {Object.entries(t.labels.severity).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      <Field label={t.pb.panels.notes} htmlFor="upd-notes" hint={t.pb.panels.notesHint}>
        <Textarea
          id="upd-notes"
          name="notes"
          rows={6}
          maxLength={8000}
          defaultValue={notes ?? ""}
        />
      </Field>
      <ErrorLine state={state} locale={locale} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? t.common.saving : t.pb.panels.saveNotes}
      </Button>
    </form>
  );
}

// ---------------- Abschluss ----------------

export function ClosePlaybookForm({
  executionId,
  locale,
}: {
  executionId: string;
  locale: Locale;
}) {
  const t = TPRM_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    closePlaybookExecution,
    {},
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="executionId" value={executionId} />
      <div className="min-w-56">
        <Label htmlFor="close-outcome">{t.pb.panels.outcome}</Label>
        <Select id="close-outcome" name="outcome" required defaultValue="">
          <option value="" disabled>
            {t.common.pleaseSelect}
          </option>
          <option value="CLOSED">{t.pb.panels.close}</option>
          <option value="ABORTED">{t.pb.panels.abort}</option>
        </Select>
      </div>
      <div className="min-w-72 flex-1">
        <Label htmlFor="close-comment">{t.pb.panels.closingComment}</Label>
        <Input id="close-comment" name="comment" required minLength={3} maxLength={2000} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t.pb.panels.saving : t.pb.panels.endExecution}
      </Button>
      <div className="w-full">
        <ErrorLine state={state} locale={locale} />
      </div>
    </form>
  );
}
