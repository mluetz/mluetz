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
import { INCIDENT_STATUS } from "@/lib/domain/enums";

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
}: {
  criticalFunctions: Option[];
  thirdParties: Option[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createIncident, {});
  const [isMajor, setIsMajor] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Vorfallsbeschreibung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Titel" htmlFor="title" required>
            <Input id="title" name="title" required minLength={5} maxLength={200} />
          </Field>
          <Field
            label="Beschreibung"
            htmlFor="description"
            required
            hint="Was ist passiert? Betroffene Dienste, Kundenzahl, Datenverlust, wirtschaftliche Auswirkung."
          >
            <Textarea id="description" name="description" required minLength={10} rows={3} />
          </Field>
          <Field
            label="Kenntniserlangung"
            htmlFor="awarenessAt"
            required
            hint="Startpunkt aller Fristen; darf nicht in der Zukunft liegen."
          >
            <Input id="awarenessAt" name="awarenessAt" type="datetime-local" required />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Klassifizierung &amp; parallele Pflichtenstränge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckboxLine
            name="isMajor"
            label="Schwerwiegender Vorfall i. S. v. Art. 18 DORA"
            checked={isMajor}
            onChange={setIsMajor}
            hint="Startet die DORA-Meldekette (Erst-, Zwischen- und Abschlussmeldung)."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Klassifizierungszeitpunkt"
              htmlFor="classifiedAt"
              required={isMajor}
              hint={
                isMajor
                  ? "Pflicht bei schwerwiegenden Vorfällen; nicht vor der Kenntniserlangung."
                  : "Optional; nicht vor der Kenntniserlangung."
              }
            >
              <Input
                id="classifiedAt"
                name="classifiedAt"
                type="datetime-local"
                required={isMajor}
              />
            </Field>
            <Field label="Klassifizierungsnotiz" htmlFor="classificationNote">
              <Textarea id="classificationNote" name="classificationNote" rows={2} />
            </Field>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <CheckboxLine
              name="nis2Relevant"
              label="NIS-2-/BSIG-relevant"
              hint="Frühwarnung 24 h, Meldung 72 h, Abschlussbericht 1 Monat."
            />
            <CheckboxLine
              name="gdprRelevant"
              label="DSGVO-relevant (personenbezogene Daten)"
              hint="Meldung nach Art. 33 DSGVO binnen 72 h."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verknüpfungen</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Kritische / wichtige Funktion" htmlFor="criticalFunctionId">
            <Select id="criticalFunctionId" name="criticalFunctionId" defaultValue="">
              <option value="">–</option>
              {criticalFunctions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Drittpartei" htmlFor="thirdPartyId">
            <Select id="thirdPartyId" name="thirdPartyId" defaultValue="">
              <option value="">–</option>
              {thirdParties.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
        </CardContent>
      </Card>

      <ErrorLine state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Wird angelegt…" : "Vorfall anlegen"}
      </Button>
    </form>
  );
}

// ---------------- Nachträgliche Klassifizierung ----------------

export function ClassifyForm({ incidentId }: { incidentId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(classifyIncident, {});
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="incidentId" value={incidentId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Klassifizierungszeitpunkt"
          htmlFor="cl-classifiedAt"
          required
          hint="Nicht vor der Kenntniserlangung."
        >
          <Input id="cl-classifiedAt" name="classifiedAt" type="datetime-local" required />
        </Field>
        <Field label="Klassifizierungsnotiz" htmlFor="cl-note">
          <Textarea id="cl-note" name="classificationNote" rows={2} />
        </Field>
      </div>
      <CheckboxLine
        name="isMajor"
        label="Schwerwiegender Vorfall i. S. v. Art. 18 DORA"
        hint="Bei Aktivierung werden fehlende DORA-Meldefristen automatisch berechnet und angelegt."
      />
      <ErrorLine state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Speichern…" : "Klassifizierung dokumentieren"}
      </Button>
    </form>
  );
}

// ---------------- Meldung dokumentieren (inline je Report-Zeile) ----------------

export function ReportSubmitForm({ reportId, label }: { reportId: string; label: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    markReportSubmitted,
    {},
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="reportId" value={reportId} />
      <div>
        <Label htmlFor={`sub-${reportId}`}>Abgegeben am (leer = jetzt)</Label>
        <Input id={`sub-${reportId}`} name="submittedAt" type="datetime-local" />
      </div>
      <div className="min-w-56 flex-1">
        <Label htmlFor={`ref-${reportId}`}>Referenz (z. B. MVP-Portal-ID)</Label>
        <Input id={`ref-${reportId}`} name="reference" maxLength={500} />
      </div>
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        disabled={pending}
        aria-label={`${label} dokumentieren`}
      >
        {pending ? "Speichern…" : "Meldung dokumentieren"}
      </Button>
      <div className="w-full">
        <ErrorLine state={state} />
      </div>
    </form>
  );
}

// ---------------- Statuswechsel ----------------

export function StatusForm({
  incidentId,
  currentStatus,
  allowedTargets,
}: {
  incidentId: string;
  currentStatus: string;
  allowedTargets: string[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    changeIncidentStatus,
    {},
  );
  if (allowedTargets.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Keine weiteren Workflow-Übergänge möglich (Status:{" "}
        {INCIDENT_STATUS[currentStatus as keyof typeof INCIDENT_STATUS] ?? currentStatus}).
      </p>
    );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="incidentId" value={incidentId} />
      <div className="min-w-56">
        <Label htmlFor="inc-newStatus">Neuer Status</Label>
        <Select id="inc-newStatus" name="newStatus" required defaultValue="">
          <option value="" disabled>
            Bitte wählen
          </option>
          {allowedTargets.map((t) => (
            <option key={t} value={t}>
              {INCIDENT_STATUS[t as keyof typeof INCIDENT_STATUS] ?? t}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-72 flex-1">
        <Label htmlFor="inc-wf-comment">Kommentar / Begründung (Pflicht)</Label>
        <Input id="inc-wf-comment" name="comment" required minLength={3} />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Wird ausgeführt…" : "Status ändern"}
      </Button>
      <div className="w-full">
        <ErrorLine state={state} />
      </div>
    </form>
  );
}
