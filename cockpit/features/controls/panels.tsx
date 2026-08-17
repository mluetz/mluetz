"use client";

import { useActionState } from "react";
import { recordControlTest, updateControl, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { EFFECTIVENESS_RATING } from "@/lib/domain/enums";
import { FREQUENCY_LABELS, TEST_RESULT_LABELS } from "./labels";

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

// ---------------- Neuer Kontrolltest ----------------

export function ControlTestForm({ controlId }: { controlId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    recordControlTest,
    {},
  );
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="controlId" value={controlId} />
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Testergebnis" htmlFor="testResult" required>
          <Select id="testResult" name="testResult" required defaultValue="">
            <option value="" disabled>
              Bitte wählen
            </option>
            {Object.entries(TEST_RESULT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Design-Wirksamkeit" htmlFor="designEffectiveness" required>
          <Select id="designEffectiveness" name="designEffectiveness" required defaultValue="">
            <option value="" disabled>
              Bitte wählen
            </option>
            {Object.entries(EFFECTIVENESS_RATING).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Operative Wirksamkeit" htmlFor="operatingEffectiveness" required>
          <Select
            id="operatingEffectiveness"
            name="operatingEffectiveness"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Bitte wählen
            </option>
            {Object.entries(EFFECTIVENESS_RATING).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Feststellungen / Findings (optional)" htmlFor="findings">
        <Textarea id="findings" name="findings" rows={2} maxLength={4000} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Nachweis / Evidence (optional)"
          htmlFor="test-evidence"
          hint="Verweis auf Testdokumentation (Link, Ticket, Report …)."
        >
          <Input id="test-evidence" name="evidenceNote" maxLength={2000} />
        </Field>
        <Field label="Nächster Test (optional)" htmlFor="nextTestDate">
          <Input id="nextTestDate" name="nextTestDate" type="date" />
        </Field>
      </div>
      <ErrorLine state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Speichern…" : "Kontrolltest erfassen"}
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
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(updateControl, {});
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="controlId" value={controlId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" htmlFor="ctl-name" required>
          <Input
            id="ctl-name"
            name="name"
            required
            minLength={3}
            maxLength={200}
            defaultValue={defaults.name}
          />
        </Field>
        <Field label="Control Owner" htmlFor="ctl-owner">
          <Select id="ctl-owner" name="ownerId" defaultValue={defaults.ownerId ?? ""}>
            <option value="">– kein Owner –</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Kontrollziel" htmlFor="ctl-objective" required>
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
      <Field label="Beschreibung" htmlFor="ctl-description" required>
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
        <Field label="Frequenz" htmlFor="ctl-frequency" required>
          <Select id="ctl-frequency" name="frequency" required defaultValue={defaults.frequency}>
            {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <ErrorLine state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Speichern…" : "Kontrolle speichern"}
      </Button>
    </form>
  );
}
