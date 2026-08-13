"use client";

import { useActionState } from "react";
import { upsertComplianceMapping, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { COMPLIANCE_STATUS } from "@/lib/domain/enums";

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
}: {
  requirementId: string;
  mappingId?: string;
  currentStatus?: string;
  currentJustification?: string;
  currentEvidenceId?: string | null;
  currentNextReviewDate?: string | null; // yyyy-mm-dd
  evidenceOptions: EvidenceOption[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    upsertComplianceMapping,
    {},
  );
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="requirementId" value={requirementId} />
      {mappingId ? <input type="hidden" name="mappingId" value={mappingId} /> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Umsetzungsstatus" htmlFor="cm-status" required>
          <Select id="cm-status" name="status" required defaultValue={currentStatus ?? ""}>
            <option value="" disabled>
              Bitte wählen
            </option>
            {Object.entries(COMPLIANCE_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nachweis (Evidence)" htmlFor="cm-evidence">
          <Select id="cm-evidence" name="evidenceId" defaultValue={currentEvidenceId ?? ""}>
            <option value="">– kein Nachweis –</option>
            {evidenceOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.evidenceId} – {e.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nächstes Review" htmlFor="cm-review">
          <Input
            id="cm-review"
            type="date"
            name="nextReviewDate"
            defaultValue={currentNextReviewDate ?? ""}
          />
        </Field>
      </div>
      <Field label="Begründung der Einstufung" htmlFor="cm-just" required>
        <Textarea
          id="cm-just"
          name="justification"
          required
          minLength={10}
          rows={3}
          defaultValue={currentJustification ?? ""}
        />
      </Field>
      <ErrorLine state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Speichern…" : "Bewertung speichern"}
      </Button>
    </form>
  );
}
