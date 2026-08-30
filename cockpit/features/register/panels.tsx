"use client";

import { useActionState } from "react";
import {
  decideRoiApproval,
  freezeRoiSnapshot,
  markRoiSubmitted,
  requestRoiExportOverride,
  requestRoiSubmission,
  type ActionResult,
} from "./actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

/**
 * Client-Formulare des Meldestand-Workflows (Meldeschicht Welle 3,
 * ADR-0007): Übersteuerungsantrag, Freigabeentscheidung, Einfrieren,
 * Abgabeantrag, Abgabedokumentation. Muster wie snapshot-button.tsx.
 */

function ErrorLine({ state }: { state: ActionResult }) {
  return state.error ? (
    <p role="alert" className="text-sm text-destructive">
      {state.error}
    </p>
  ) : null;
}

export function OverrideRequestForm({ locale }: { locale: Locale }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    requestRoiExportOverride,
    {},
  );
  const de = locale === "de";
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        name="comment"
        required
        minLength={10}
        placeholder={de ? "Begründung der Übersteuerung…" : "Reason for the override…"}
        className="w-72 rounded-md border border-input bg-background px-2 py-1 text-sm"
      />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "…" : de ? "Übersteuerung beantragen" : "Request override"}
      </Button>
      <ErrorLine state={state} />
    </form>
  );
}

export function DecideApprovalForm({ approvalId, locale }: { approvalId: string; locale: Locale }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    decideRoiApproval,
    {},
  );
  const de = locale === "de";
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="approvalId" value={approvalId} />
      <Button
        type="submit"
        name="decision"
        value="APPROVED"
        variant="secondary"
        size="sm"
        disabled={pending}
      >
        {de ? "Genehmigen" : "Approve"}
      </Button>
      <Button
        type="submit"
        name="decision"
        value="REJECTED"
        variant="ghost"
        size="sm"
        disabled={pending}
      >
        {de ? "Ablehnen" : "Reject"}
      </Button>
      <ErrorLine state={state} />
    </form>
  );
}

export function FreezeForm({ snapshotId, locale }: { snapshotId: string; locale: Locale }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    freezeRoiSnapshot,
    {},
  );
  const de = locale === "de";
  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="snapshotId" value={snapshotId} />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "…" : de ? "Einfrieren" : "Freeze"}
      </Button>
      <ErrorLine state={state} />
    </form>
  );
}

export function RequestSubmissionForm({
  snapshotId,
  locale,
}: {
  snapshotId: string;
  locale: Locale;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    requestRoiSubmission,
    {},
  );
  const de = locale === "de";
  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="snapshotId" value={snapshotId} />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "…" : de ? "Abgabe beantragen" : "Request submission"}
      </Button>
      <ErrorLine state={state} />
    </form>
  );
}

export function MarkSubmittedForm({ snapshotId, locale }: { snapshotId: string; locale: Locale }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(markRoiSubmitted, {});
  const de = locale === "de";
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="snapshotId" value={snapshotId} />
      <input
        type="text"
        name="submissionReference"
        required
        placeholder={de ? "Abgabereferenz…" : "Submission reference…"}
        className="w-44 rounded-md border border-input bg-background px-2 py-1 text-sm"
      />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "…" : de ? "Abgabe dokumentieren" : "Record submission"}
      </Button>
      <ErrorLine state={state} />
    </form>
  );
}
