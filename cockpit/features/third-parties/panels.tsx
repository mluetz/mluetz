"use client";

import { useActionState } from "react";
import {
  changeTpStatus,
  createThirdParty,
  updateTpAssessment,
  upsertExitStrategy,
  type ActionResult,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Select, Textarea, Label } from "@/components/ui/input";
import { TP_STATUS, type TpStatus } from "@/lib/domain/enums";
import {
  DUE_DILIGENCE_LABELS,
  EXIT_STATUS_LABELS,
  EXIT_TEST_RESULT_LABELS,
  SUBSTITUTABILITY_LABELS,
  TP_CRITICALITY_LABELS,
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

// ---------------- Workflow / Statuswechsel ----------------

export function TpWorkflowPanel({
  thirdPartyId,
  currentStatus,
  allowedTargets,
}: {
  thirdPartyId: string;
  currentStatus: string;
  allowedTargets: string[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(changeTpStatus, {});
  if (allowedTargets.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Keine weiteren Workflow-Übergänge möglich (Status:{" "}
        {TP_STATUS[currentStatus as TpStatus] ?? currentStatus}).
      </p>
    );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="thirdPartyId" value={thirdPartyId} />
      <div className="min-w-56">
        <Label htmlFor="tp-newStatus">Neuer Status</Label>
        <Select id="tp-newStatus" name="newStatus" required defaultValue="">
          <option value="" disabled>
            Bitte wählen
          </option>
          {allowedTargets.map((t) => (
            <option key={t} value={t}>
              {TP_STATUS[t as TpStatus] ?? t}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-72 flex-1">
        <Label htmlFor="tp-wf-comment">Kommentar / Begründung (Pflicht)</Label>
        <Input id="tp-wf-comment" name="comment" required minLength={3} />
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

// ---------------- Assessment ----------------

export interface TpAssessmentDefaults {
  criticality: string;
  inherentRiskScore: number | null;
  residualRiskScore: number | null;
  dueDiligenceStatus: string;
  substitutability: string;
  concentrationRisk: boolean;
  supportsCriticalFunction: boolean;
  /** yyyy-mm-dd oder "" */
  nextReviewDate: string;
}

export function TpAssessmentForm({
  thirdPartyId,
  defaults,
}: {
  thirdPartyId: string;
  defaults: TpAssessmentDefaults;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    updateTpAssessment,
    {},
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment aktualisieren</CardTitle>
        <CardDescription>
          Kritikalität, Risiko-Scores (1–25) und Due-Diligence-Status; das Assessment-Datum wird
          automatisch auf heute gesetzt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="thirdPartyId" value={thirdPartyId} />
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Kritikalität" htmlFor="tp-criticality" required>
              <Select
                id="tp-criticality"
                name="criticality"
                required
                defaultValue={defaults.criticality === "NOT_ASSESSED" ? "" : defaults.criticality}
              >
                <option value="" disabled>
                  Bitte wählen
                </option>
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((k) => (
                  <option key={k} value={k}>
                    {TP_CRITICALITY_LABELS[k]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Inherent Risk Score (1–25)" htmlFor="tp-inherent" required>
              <Input
                id="tp-inherent"
                name="inherentRiskScore"
                type="number"
                min={1}
                max={25}
                required
                defaultValue={defaults.inherentRiskScore ?? ""}
              />
            </Field>
            <Field label="Residual Risk Score (1–25)" htmlFor="tp-residual" required>
              <Input
                id="tp-residual"
                name="residualRiskScore"
                type="number"
                min={1}
                max={25}
                required
                defaultValue={defaults.residualRiskScore ?? ""}
              />
            </Field>
            <Field label="Due-Diligence-Status" htmlFor="tp-dd" required>
              <Select
                id="tp-dd"
                name="dueDiligenceStatus"
                required
                defaultValue={defaults.dueDiligenceStatus}
              >
                {Object.entries(DUE_DILIGENCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Substituierbarkeit" htmlFor="tp-subst" required>
              <Select
                id="tp-subst"
                name="substitutability"
                required
                defaultValue={defaults.substitutability}
              >
                {Object.entries(SUBSTITUTABILITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nächstes Review" htmlFor="tp-nextReview" required>
              <Input
                id="tp-nextReview"
                name="nextReviewDate"
                type="date"
                required
                defaultValue={defaults.nextReviewDate}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="concentrationRisk"
                defaultChecked={defaults.concentrationRisk}
                className="h-4 w-4"
              />
              Konzentrationsrisiko
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="supportsCriticalFunction"
                defaultChecked={defaults.supportsCriticalFunction}
                className="h-4 w-4"
              />
              Unterstützt kritische / wichtige Funktion
            </label>
          </div>
          <ErrorLine state={state} />
          <Button type="submit" disabled={pending}>
            {pending ? "Speichern…" : "Assessment speichern"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------- Exit-Strategie ----------------

export interface ExitStrategyDefaults {
  strategySummary: string;
  exitPlanExists: boolean;
  /** yyyy-mm-dd oder "" */
  lastTestDate: string;
  testResult: string;
  substituteOptions: string;
  status: string;
}

export function ExitStrategyForm({
  thirdPartyId,
  defaults,
}: {
  thirdPartyId: string;
  defaults: ExitStrategyDefaults | null;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    upsertExitStrategy,
    {},
  );
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="thirdPartyId" value={thirdPartyId} />
      <Field label="Zusammenfassung der Exit-Strategie" htmlFor="exit-summary" required>
        <Textarea
          id="exit-summary"
          name="strategySummary"
          required
          minLength={5}
          rows={3}
          defaultValue={defaults?.strategySummary ?? ""}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Status" htmlFor="exit-status" required>
          <Select
            id="exit-status"
            name="status"
            required
            defaultValue={defaults?.status ?? "MISSING"}
          >
            {Object.entries(EXIT_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Letzter Test" htmlFor="exit-lastTest">
          <Input
            id="exit-lastTest"
            name="lastTestDate"
            type="date"
            defaultValue={defaults?.lastTestDate ?? ""}
          />
        </Field>
        <Field label="Testergebnis" htmlFor="exit-testResult">
          <Select id="exit-testResult" name="testResult" defaultValue={defaults?.testResult ?? ""}>
            <option value="">–</option>
            {Object.entries(EXIT_TEST_RESULT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Substitutionsoptionen (alternative Anbieter / Insourcing)" htmlFor="exit-subst">
        <Textarea
          id="exit-subst"
          name="substituteOptions"
          rows={2}
          defaultValue={defaults?.substituteOptions ?? ""}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="exitPlanExists"
          defaultChecked={defaults?.exitPlanExists ?? false}
          className="h-4 w-4"
        />
        Dokumentierter Exit-Plan vorhanden
      </label>
      <ErrorLine state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Speichern…" : "Exit-Strategie speichern"}
      </Button>
    </form>
  );
}

// ---------------- Neuanlage ----------------

export function NewThirdPartyForm() {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createThirdParty, {});
  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Stammdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name der Drittpartei" htmlFor="tp-name" required>
              <Input id="tp-name" name="name" required minLength={2} maxLength={200} />
            </Field>
            <Field label="Sitz (Land)" htmlFor="tp-country" required>
              <Input id="tp-country" name="registeredCountry" required minLength={2} />
            </Field>
          </div>
          <Field label="Erbrachte Leistung" htmlFor="tp-service" required>
            <Textarea id="tp-service" name="providedService" required minLength={2} rows={2} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Leistungsstandorte" htmlFor="tp-serviceLoc" required>
              <Input id="tp-serviceLoc" name="serviceLocations" required minLength={2} />
            </Field>
            <Field label="Datenstandorte" htmlFor="tp-dataLoc" required>
              <Input id="tp-dataLoc" name="dataLocations" required minLength={2} />
            </Field>
            <Field
              label="Art der verarbeiteten Informationen"
              htmlFor="tp-infoTypes"
              required
              hint="z. B. personenbezogene Daten, Vertragsdaten, Konfigurationsdaten"
            >
              <Input id="tp-infoTypes" name="informationTypes" required minLength={2} />
            </Field>
            <Field
              label="ICT-Service-Kategorie"
              htmlFor="tp-ictCat"
              required
              hint="z. B. CLOUD_HOSTING, NETWORK, SAAS, DATA_CENTER"
            >
              <Input id="tp-ictCat" name="ictServiceCategory" required minLength={2} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Wird angelegt…" : "Drittpartei anlegen (Status: Initial Screening)"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Nach der Anlage: Kritikalitätsbewertung und Due Diligence im TPRM-Workflow durchführen
        (Initial Screening → Kritikalitätsbewertung → Due Diligence → …).
      </p>
    </form>
  );
}
