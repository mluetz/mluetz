"use client";

import { useActionState } from "react";
import { recordControlTest, updateControl, type ActionResult } from "./actions";
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

// ---------------- Neuer Kontrolltest ----------------

export function ControlTestForm({ controlId, locale }: { controlId: string; locale: Locale }) {
  const m = OPS_MESSAGES[locale];
  const t = m.controls.panels;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    recordControlTest,
    {},
  );
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="controlId" value={controlId} />
      <div className="grid gap-4 md:grid-cols-3">
        <Field label={t.testResult} htmlFor="testResult" required>
          <Select id="testResult" name="testResult" required defaultValue="">
            <option value="" disabled>
              {m.common.pleaseSelect}
            </option>
            {Object.entries(m.labels.testResult).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.designEffectiveness} htmlFor="designEffectiveness" required>
          <Select id="designEffectiveness" name="designEffectiveness" required defaultValue="">
            <option value="" disabled>
              {m.common.pleaseSelect}
            </option>
            {Object.entries(m.labels.effectiveness).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.operatingEffectiveness} htmlFor="operatingEffectiveness" required>
          <Select
            id="operatingEffectiveness"
            name="operatingEffectiveness"
            required
            defaultValue=""
          >
            <option value="" disabled>
              {m.common.pleaseSelect}
            </option>
            {Object.entries(m.labels.effectiveness).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={t.findingsOptional} htmlFor="findings">
        <Textarea id="findings" name="findings" rows={2} maxLength={4000} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t.evidenceOptional} htmlFor="test-evidence" hint={t.evidenceHint}>
          <Input id="test-evidence" name="evidenceNote" maxLength={2000} />
        </Field>
        <Field label={t.nextTestOptional} htmlFor="nextTestDate">
          <Input id="nextTestDate" name="nextTestDate" type="date" />
        </Field>
      </div>
      <ErrorLine state={state} locale={locale} />
      <Button type="submit" disabled={pending}>
        {pending ? m.common.saving : t.submitTest}
      </Button>
    </form>
  );
}

// ---------------- Kontrolle bearbeiten ----------------

interface Option {
  id: string;
  name: string;
}

export function UpdateControlForm({
  controlId,
  defaults,
  owners,
  locale,
}: {
  controlId: string;
  defaults: {
    name: string;
    objective: string;
    description: string;
    frequency: string;
    ownerId: string | null;
  };
  owners: Option[];
  locale: Locale;
}) {
  const m = OPS_MESSAGES[locale];
  const t = m.controls.panels;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(updateControl, {});
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="controlId" value={controlId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t.name} htmlFor="ctl-name" required>
          <Input
            id="ctl-name"
            name="name"
            required
            minLength={3}
            maxLength={200}
            defaultValue={defaults.name}
          />
        </Field>
        <Field label={t.controlOwner} htmlFor="ctl-owner">
          <Select id="ctl-owner" name="ownerId" defaultValue={defaults.ownerId ?? ""}>
            <option value="">{t.noOwnerOption}</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={t.objective} htmlFor="ctl-objective" required>
        <Textarea
          id="ctl-objective"
          name="objective"
          required
          minLength={5}
          rows={2}
          maxLength={2000}
          defaultValue={defaults.objective}
        />
      </Field>
      <Field label={t.description} htmlFor="ctl-description" required>
        <Textarea
          id="ctl-description"
          name="description"
          required
          minLength={5}
          rows={3}
          maxLength={4000}
          defaultValue={defaults.description}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t.frequency} htmlFor="ctl-frequency" required>
          <Select id="ctl-frequency" name="frequency" required defaultValue={defaults.frequency}>
            {Object.entries(m.labels.frequency).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <ErrorLine state={state} locale={locale} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? m.common.saving : t.saveControl}
      </Button>
    </form>
  );
}
