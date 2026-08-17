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
import type { Locale } from "@/lib/i18n/config";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";

function ErrorLine({ state, locale }: { state: ActionResult; locale: Locale }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  if (state.ok)
    return <p className="text-sm text-risk-low">{TPRM_MESSAGES[locale].common.saved}</p>;
  return null;
}

// ---------------- Workflow / Statuswechsel ----------------

export function TpWorkflowPanel({
  thirdPartyId,
  currentStatus,
  allowedTargets,
  locale,
}: {
  thirdPartyId: string;
  currentStatus: string;
  allowedTargets: string[];
  locale: Locale;
}) {
  const t = TPRM_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(changeTpStatus, {});
  if (allowedTargets.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        {t.tp.workflow.noTransitions(t.labels.tpStatus[currentStatus] ?? currentStatus)}
      </p>
    );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="thirdPartyId" value={thirdPartyId} />
      <div className="min-w-56">
        <Label htmlFor="tp-newStatus">{t.tp.workflow.newStatus}</Label>
        <Select id="tp-newStatus" name="newStatus" required defaultValue="">
          <option value="" disabled>
            {t.common.pleaseSelect}
          </option>
          {allowedTargets.map((tgt) => (
            <option key={tgt} value={tgt}>
              {t.labels.tpStatus[tgt] ?? tgt}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-72 flex-1">
        <Label htmlFor="tp-wf-comment">{t.tp.workflow.commentRequired}</Label>
        <Input id="tp-wf-comment" name="comment" required minLength={3} />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? t.tp.workflow.executing : t.tp.workflow.changeStatus}
      </Button>
      <div className="w-full">
        <ErrorLine state={state} locale={locale} />
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
  locale,
}: {
  thirdPartyId: string;
  defaults: TpAssessmentDefaults;
  locale: Locale;
}) {
  const t = TPRM_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    updateTpAssessment,
    {},
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.tp.assessment.title}</CardTitle>
        <CardDescription>{t.tp.assessment.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="thirdPartyId" value={thirdPartyId} />
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t.tp.assessment.criticality} htmlFor="tp-criticality" required>
              <Select
                id="tp-criticality"
                name="criticality"
                required
                defaultValue={defaults.criticality === "NOT_ASSESSED" ? "" : defaults.criticality}
              >
                <option value="" disabled>
                  {t.common.pleaseSelect}
                </option>
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((k) => (
                  <option key={k} value={k}>
                    {t.labels.tpCriticality[k]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.tp.assessment.inherentScore} htmlFor="tp-inherent" required>
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
            <Field label={t.tp.assessment.residualScore} htmlFor="tp-residual" required>
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
            <Field label={t.tp.assessment.dueDiligenceStatus} htmlFor="tp-dd" required>
              <Select
                id="tp-dd"
                name="dueDiligenceStatus"
                required
                defaultValue={defaults.dueDiligenceStatus}
              >
                {Object.entries(t.labels.dueDiligence).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.tp.assessment.substitutability} htmlFor="tp-subst" required>
              <Select
                id="tp-subst"
                name="substitutability"
                required
                defaultValue={defaults.substitutability}
              >
                {Object.entries(t.labels.substitutability).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.tp.assessment.nextReview} htmlFor="tp-nextReview" required>
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
              {t.tp.assessment.concentrationRisk}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="supportsCriticalFunction"
                defaultChecked={defaults.supportsCriticalFunction}
                className="h-4 w-4"
              />
              {t.tp.assessment.supportsCriticalFunction}
            </label>
          </div>
          <ErrorLine state={state} locale={locale} />
          <Button type="submit" disabled={pending}>
            {pending ? t.common.saving : t.tp.assessment.submit}
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
  locale,
}: {
  thirdPartyId: string;
  defaults: ExitStrategyDefaults | null;
  locale: Locale;
}) {
  const t = TPRM_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    upsertExitStrategy,
    {},
  );
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="thirdPartyId" value={thirdPartyId} />
      <Field label={t.tp.exitForm.summary} htmlFor="exit-summary" required>
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
        <Field label={t.tp.exitForm.status} htmlFor="exit-status" required>
          <Select
            id="exit-status"
            name="status"
            required
            defaultValue={defaults?.status ?? "MISSING"}
          >
            {Object.entries(t.labels.exitStatus).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.tp.exitForm.lastTest} htmlFor="exit-lastTest">
          <Input
            id="exit-lastTest"
            name="lastTestDate"
            type="date"
            defaultValue={defaults?.lastTestDate ?? ""}
          />
        </Field>
        <Field label={t.tp.exitForm.testResult} htmlFor="exit-testResult">
          <Select id="exit-testResult" name="testResult" defaultValue={defaults?.testResult ?? ""}>
            <option value="">–</option>
            {Object.entries(t.labels.exitTestResult).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={t.tp.exitForm.substituteOptions} htmlFor="exit-subst">
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
        {t.tp.exitForm.exitPlanExists}
      </label>
      <ErrorLine state={state} locale={locale} />
      <Button type="submit" disabled={pending}>
        {pending ? t.common.saving : t.tp.exitForm.submit}
      </Button>
    </form>
  );
}

// ---------------- Neuanlage ----------------

export function NewThirdPartyForm({ locale }: { locale: Locale }) {
  const t = TPRM_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createThirdParty, {});
  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.tp.form.masterData}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.tp.form.name} htmlFor="tp-name" required>
              <Input id="tp-name" name="name" required minLength={2} maxLength={200} />
            </Field>
            <Field label={t.tp.form.country} htmlFor="tp-country" required>
              <Input id="tp-country" name="registeredCountry" required minLength={2} />
            </Field>
          </div>
          <Field label={t.tp.form.providedService} htmlFor="tp-service" required>
            <Textarea id="tp-service" name="providedService" required minLength={2} rows={2} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.tp.form.serviceLocations} htmlFor="tp-serviceLoc" required>
              <Input id="tp-serviceLoc" name="serviceLocations" required minLength={2} />
            </Field>
            <Field label={t.tp.form.dataLocations} htmlFor="tp-dataLoc" required>
              <Input id="tp-dataLoc" name="dataLocations" required minLength={2} />
            </Field>
            <Field
              label={t.tp.form.informationTypes}
              htmlFor="tp-infoTypes"
              required
              hint={t.tp.form.informationTypesHint}
            >
              <Input id="tp-infoTypes" name="informationTypes" required minLength={2} />
            </Field>
            <Field
              label={t.tp.form.ictServiceCategory}
              htmlFor="tp-ictCat"
              required
              hint={t.tp.form.ictServiceCategoryHint}
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
          {pending ? t.tp.form.creating : t.tp.form.submit}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t.tp.form.afterCreateNote}</p>
    </form>
  );
}
