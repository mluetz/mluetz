"use client";

import { useActionState } from "react";
import { createEvidence, reviewEvidence, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export interface LinkOption {
  id: string;
  label: string;
}

// ---------------- Neuanlage ----------------

export function NewEvidenceForm({
  risks,
  controls,
  thirdParties,
  locale,
}: {
  risks: LinkOption[];
  controls: LinkOption[];
  thirdParties: LinkOption[];
  locale: Locale;
}) {
  const m = OPS_MESSAGES[locale];
  const t = m.evidence.panels;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createEvidence, {});
  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.metadataCard}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label={t.title} htmlFor="ev-title" required>
            <Input id="ev-title" name="title" required minLength={3} maxLength={200} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.docType} htmlFor="ev-docType" required>
              <Select id="ev-docType" name="docType" required defaultValue="">
                <option value="" disabled>
                  {m.common.pleaseSelect}
                </option>
                {Object.entries(m.labels.evidenceDocType).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.classification} htmlFor="ev-classification" required>
              <Select id="ev-classification" name="classification" required defaultValue="INTERNAL">
                {Object.entries(m.labels.evidenceClassification).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label={t.linkField} htmlFor="ev-link" required hint={t.linkHint}>
            <Input id="ev-link" name="link" type="url" required placeholder="https://…" />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t.validUntil} htmlFor="ev-validUntil">
              <Input id="ev-validUntil" name="validUntil" type="date" />
            </Field>
            <Field label={t.version} htmlFor="ev-version">
              <Input id="ev-version" name="version" defaultValue="1.0" maxLength={20} />
            </Field>
            <Field label={t.contentHashOptional} htmlFor="ev-hash" hint={t.contentHashHint}>
              <Input id="ev-hash" name="contentHash" maxLength={200} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.assignmentCard}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label={t.risk} htmlFor="ev-riskId">
            <Select id="ev-riskId" name="riskId" defaultValue="">
              <option value="">–</option>
              {risks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.control} htmlFor="ev-controlId">
            <Select id="ev-controlId" name="controlId" defaultValue="">
              <option value="">–</option>
              {controls.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.thirdParty} htmlFor="ev-thirdPartyId">
            <Select id="ev-thirdPartyId" name="thirdPartyId" defaultValue="">
              <option value="">–</option>
              {thirdParties.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.label}
                </option>
              ))}
            </Select>
          </Field>
        </CardContent>
      </Card>

      <ErrorLine state={state} locale={locale} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? m.common.creating : t.submitCreate}
        </Button>
      </div>
    </form>
  );
}

// ---------------- Review ----------------

export function ReviewEvidenceForm({
  evidenceDbId,
  locale,
}: {
  evidenceDbId: string;
  locale: Locale;
}) {
  const m = OPS_MESSAGES[locale];
  const t = m.evidence.panels;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(reviewEvidence, {});
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="evidenceId" value={evidenceDbId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t.reviewResult} htmlFor="ev-reviewStatus" required>
          <Select id="ev-reviewStatus" name="reviewStatus" required defaultValue="">
            <option value="" disabled>
              {m.common.pleaseSelect}
            </option>
            {(["REVIEWED", "EXPIRED", "REJECTED"] as const).map((k) => (
              <option key={k} value={k}>
                {m.labels.evidenceReviewStatus[k]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={m.common.commentOptional} htmlFor="ev-review-comment">
          <Textarea id="ev-review-comment" name="comment" rows={2} maxLength={1000} />
        </Field>
      </div>
      <ErrorLine state={state} locale={locale} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? m.common.saving : t.submitReview}
      </Button>
    </form>
  );
}
