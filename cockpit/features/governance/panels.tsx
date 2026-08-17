"use client";

import { useActionState } from "react";
import { upsertComplianceMapping, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/config";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";

function ErrorLine({ state, locale }: { state: ActionResult; locale: Locale }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  if (state.ok) return <p className="text-sm text-risk-low">{OPS_MESSAGES[locale].common.saved}</p>;
  return null;
}

export interface EvidenceOption {
  id: string;
  evidenceId: string;
  title: string;
}

/** Bewertungsformular einer regulatorischen Anforderung (Upsert des Compliance-Mappings). */
export function MappingForm({
  requirementId,
  mappingId,
  currentStatus,
  currentJustification,
  currentEvidenceId,
  currentNextReviewDate,
  evidenceOptions,
  locale,
}: {
  requirementId: string;
  mappingId?: string;
  currentStatus?: string;
  currentJustification?: string;
  currentEvidenceId?: string | null;
  currentNextReviewDate?: string | null; // yyyy-mm-dd
  evidenceOptions: EvidenceOption[];
  locale: Locale;
}) {
  const m = OPS_MESSAGES[locale];
  const t = m.governance.panels;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    upsertComplianceMapping,
    {},
  );
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="requirementId" value={requirementId} />
      {mappingId ? <input type="hidden" name="mappingId" value={mappingId} /> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <Field label={t.status} htmlFor="cm-status" required>
          <Select id="cm-status" name="status" required defaultValue={currentStatus ?? ""}>
            <option value="" disabled>
              {m.common.pleaseSelect}
            </option>
            {Object.entries(m.labels.complianceStatus).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.evidence} htmlFor="cm-evidence">
          <Select id="cm-evidence" name="evidenceId" defaultValue={currentEvidenceId ?? ""}>
            <option value="">{t.noEvidenceOption}</option>
            {evidenceOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.evidenceId} – {e.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.nextReview} htmlFor="cm-review">
          <Input
            id="cm-review"
            type="date"
            name="nextReviewDate"
            defaultValue={currentNextReviewDate ?? ""}
          />
        </Field>
      </div>
      <Field label={t.justification} htmlFor="cm-just" required>
        <Textarea
          id="cm-just"
          name="justification"
          required
          minLength={10}
          rows={3}
          defaultValue={currentJustification ?? ""}
        />
      </Field>
      <ErrorLine state={state} locale={locale} />
      <Button type="submit" disabled={pending}>
        {pending ? m.common.saving : t.submit}
      </Button>
    </form>
  );
}
