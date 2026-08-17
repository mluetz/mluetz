"use client";

import { useActionState } from "react";
import {
  updateActionProgress,
  changeActionStatus,
  escalateAction,
  type ActionResult,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Label } from "@/components/ui/input";
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

// ---------------- Fortschritt aktualisieren ----------------

export function ProgressForm({
  actionId,
  currentProgress,
  locale,
}: {
  actionId: string;
  currentProgress: number;
  locale: Locale;
}) {
  const m = OPS_MESSAGES[locale];
  const t = m.actions.panels;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    updateActionProgress,
    {},
  );
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="actionId" value={actionId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t.progressLabel} htmlFor="progress" required>
          <Input
            id="progress"
            name="progress"
            type="number"
            min={0}
            max={100}
            step={1}
            required
            defaultValue={currentProgress}
          />
        </Field>
        <Field label={m.common.commentOptional} htmlFor="progress-comment">
          <Input id="progress-comment" name="comment" maxLength={1000} />
        </Field>
      </div>
      <Field label={t.evidenceOptional} htmlFor="progress-evidence" hint={t.evidenceHint}>
        <Textarea id="progress-evidence" name="evidenceNote" rows={2} maxLength={2000} />
      </Field>
      <ErrorLine state={state} locale={locale} />
      <Button type="submit" disabled={pending}>
        {pending ? m.common.saving : t.saveProgress}
      </Button>
    </form>
  );
}

// ---------------- Statuswechsel ----------------

export function StatusForm({
  actionId,
  currentStatus,
  allowedTargets,
  locale,
}: {
  actionId: string;
  currentStatus: string;
  allowedTargets: string[];
  locale: Locale;
}) {
  const m = OPS_MESSAGES[locale];
  const t = m.actions.panels;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    changeActionStatus,
    {},
  );
  if (allowedTargets.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        {t.noTransitions(m.labels.actionStatus[currentStatus] ?? currentStatus)}
      </p>
    );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="actionId" value={actionId} />
      <div className="min-w-56">
        <Label htmlFor="action-newStatus">{t.newStatus}</Label>
        <Select id="action-newStatus" name="newStatus" required defaultValue="">
          <option value="" disabled>
            {m.common.pleaseSelect}
          </option>
          {allowedTargets.map((target) => (
            <option key={target} value={target}>
              {m.labels.actionStatus[target] ?? target}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-72 flex-1">
        <Label htmlFor="action-wf-comment">{t.workflowComment}</Label>
        <Input id="action-wf-comment" name="comment" required minLength={3} />
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

// ---------------- Eskalation ----------------

export function EscalationForm({
  actionId,
  currentLevel,
  locale,
}: {
  actionId: string;
  currentLevel: number;
  locale: Locale;
}) {
  const m = OPS_MESSAGES[locale];
  const t = m.actions.panels;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(escalateAction, {});
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="actionId" value={actionId} />
      <p className="text-xs text-muted-foreground">
        {t.currentEscalation(
          currentLevel > 0
            ? (m.labels.escalationLevels[currentLevel] ?? String(currentLevel))
            : m.common.none,
        )}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t.escalationLevel} htmlFor="escalationLevel" required>
          <Select id="escalationLevel" name="escalationLevel" required defaultValue="">
            <option value="" disabled>
              {m.common.pleaseSelect}
            </option>
            {[1, 2, 3].map((lvl) => (
              <option key={lvl} value={lvl}>
                {m.labels.escalationLevels[lvl]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={t.justification} htmlFor="escalation-justification" required>
        <Textarea
          id="escalation-justification"
          name="justification"
          required
          minLength={5}
          rows={2}
          maxLength={2000}
        />
      </Field>
      <ErrorLine state={state} locale={locale} />
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? t.escalating : t.escalate}
      </Button>
    </form>
  );
}
