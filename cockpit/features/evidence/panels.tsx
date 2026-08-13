"use client";

import { useActionState } from "react";
import { createEvidence, reviewEvidence, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import {
  EVIDENCE_CLASSIFICATION_LABELS,
  EVIDENCE_DOC_TYPE_LABELS,
  EVIDENCE_REVIEW_STATUS_LABELS,
} from "./labels";

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

export interface LinkOption {
  id: string;
  label: string;
}

// ---------------- Neuanlage ----------------

export function NewEvidenceForm({
  risks,
  controls,
  thirdParties,
}: {
  risks: LinkOption[];
  controls: LinkOption[];
  thirdParties: LinkOption[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createEvidence, {});
  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Metadaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Titel" htmlFor="ev-title" required>
            <Input id="ev-title" name="title" required minLength={3} maxLength={200} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Dokumentart" htmlFor="ev-docType" required>
              <Select id="ev-docType" name="docType" required defaultValue="">
                <option value="" disabled>
                  Bitte wählen
                </option>
                {Object.entries(EVIDENCE_DOC_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Klassifikation" htmlFor="ev-classification" required>
              <Select id="ev-classification" name="classification" required defaultValue="INTERNAL">
                {Object.entries(EVIDENCE_CLASSIFICATION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field
            label="Link (Speicherort / freigegebener Link)"
            htmlFor="ev-link"
            required
            hint="Es wird nur der Link gespeichert, kein Dokument hochgeladen."
          >
            <Input id="ev-link" name="link" type="url" required placeholder="https://…" />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Gültig bis" htmlFor="ev-validUntil">
              <Input id="ev-validUntil" name="validUntil" type="date" />
            </Field>
            <Field label="Version" htmlFor="ev-version">
              <Input id="ev-version" name="version" defaultValue="1.0" maxLength={20} />
            </Field>
            <Field label="Content-Hash (optional)" htmlFor="ev-hash" hint="Integritätsmerkmal, z. B. SHA-256">
              <Input id="ev-hash" name="contentHash" maxLength={200} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zuordnung (optional)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="Risiko" htmlFor="ev-riskId">
            <Select id="ev-riskId" name="riskId" defaultValue="">
              <option value="">–</option>
              {risks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kontrolle" htmlFor="ev-controlId">
            <Select id="ev-controlId" name="controlId" defaultValue="">
              <option value="">–</option>
              {controls.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Drittpartei" htmlFor="ev-thirdPartyId">
            <Select id="ev-thirdPartyId" name="thirdPartyId" defaultValue="">
              <option value="">–</option>
              {thirdParties.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
        </CardContent>
      </Card>

      <ErrorLine state={state} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Wird angelegt…" : "Nachweis anlegen"}
        </Button>
      </div>
    </form>
  );
}

// ---------------- Review ----------------

export function ReviewEvidenceForm({ evidenceDbId }: { evidenceDbId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(reviewEvidence, {});
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="evidenceId" value={evidenceDbId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Review-Ergebnis" htmlFor="ev-reviewStatus" required>
          <Select id="ev-reviewStatus" name="reviewStatus" required defaultValue="">
            <option value="" disabled>
              Bitte wählen
            </option>
            {(["REVIEWED", "EXPIRED", "REJECTED"] as const).map((k) => (
              <option key={k} value={k}>
                {EVIDENCE_REVIEW_STATUS_LABELS[k]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Kommentar (optional)" htmlFor="ev-review-comment">
          <Textarea id="ev-review-comment" name="comment" rows={2} maxLength={1000} />
        </Field>
      </div>
      <ErrorLine state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Speichern…" : "Review speichern"}
      </Button>
    </form>
  );
}
