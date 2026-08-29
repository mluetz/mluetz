"use client";

import { useActionState } from "react";
import { classifyIncidentStructured, type ActionResult } from "./incident-actions";
import {
  CLASSIFICATION_CRITERIA,
  type CriterionResult,
} from "@/lib/domain/incident-classification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/config";

/**
 * Klassifizierungsassistent (Review v3, P1-04): strukturierte Kriterien nach
 * Art. 18 / RTS (EU) 2025/301 statt Freitext; "schwerwiegend" wird abgeleitet;
 * Einfrieren macht die Entscheidung unveränderlich.
 */
export function ClassificationAssistant({
  incidentId,
  existing,
  frozenAt,
  aggregatedWith,
  voluntaryThreatNotice,
  canWrite,
  locale,
}: {
  incidentId: string;
  existing: CriterionResult[] | null;
  frozenAt: string | null;
  aggregatedWith: string | null;
  voluntaryThreatNotice: boolean;
  canWrite: boolean;
  locale: Locale;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    classifyIncidentStructured,
    {},
  );
  const de = locale === "de";
  const frozen = frozenAt !== null;
  const editable = canWrite && !frozen;
  const byKey = new Map((existing ?? []).map((r) => [r.key, r]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {de ? "Klassifizierungsassistent (Art. 18 / RTS 2025/301)" : "Classification assistant (Art. 18 / RTS 2025/301)"}
          {frozen ? (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
              {de ? `eingefroren am ${frozenAt}` : `frozen at ${frozenAt}`}
            </span>
          ) : null}
        </CardTitle>
        <CardDescription>
          {de
            ? "Je Kriterium Schwellwert, Ist-Wert, erfüllt j/n und Begründung. „Schwerwiegend“ wird abgeleitet: Kritikalität der Dienste + 1 weiteres Kriterium, oder ≥ 3 Kriterien (vereinfachte RTS-Regel, vor Produktivgang verifizieren). Nach dem Einfrieren ist die Entscheidung unveränderlich."
            : "Per criterion: threshold, actual value, met y/n and rationale. “Major” is derived: criticality of services + 1 more criterion, or ≥ 3 criteria (simplified RTS rule — verify before production). Once frozen, the decision is immutable."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="incidentId" value={incidentId} />
          <div className="space-y-2">
            {CLASSIFICATION_CRITERIA.map((c) => {
              const r = byKey.get(c.key);
              return (
                <div
                  key={c.key}
                  className="grid items-center gap-2 rounded-md border p-2 text-sm md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_70px_minmax(0,1fr)]"
                >
                  <div className="font-medium">{de ? c.de : c.en}</div>
                  <Input
                    name={`crit_${c.key}_threshold`}
                    defaultValue={r?.threshold ?? c.defaultThreshold}
                    disabled={!editable}
                    aria-label="Schwellwert"
                  />
                  <Input
                    name={`crit_${c.key}_actual`}
                    defaultValue={r?.actualValue ?? ""}
                    placeholder={de ? "Ist-Wert" : "Actual"}
                    disabled={!editable}
                  />
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      name={`crit_${c.key}_met`}
                      defaultChecked={r?.met ?? false}
                      disabled={!editable}
                      className="h-4 w-4"
                    />
                    {de ? "erfüllt" : "met"}
                  </label>
                  <Input
                    name={`crit_${c.key}_rationale`}
                    defaultValue={r?.rationale ?? ""}
                    placeholder={de ? "Begründung" : "Rationale"}
                    disabled={!editable}
                  />
                </div>
              );
            })}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              name="aggregatedWith"
              defaultValue={aggregatedWith ?? ""}
              placeholder={
                de
                  ? "Aggregation wiederkehrender Vorfälle (z. B. INC-2026-0007, gleiche Ursache)"
                  : "Aggregation of recurring incidents (e.g. INC-2026-0007, same root cause)"
              }
              disabled={!editable}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="voluntaryThreatNotice"
                defaultChecked={voluntaryThreatNotice}
                disabled={!editable}
                className="h-4 w-4"
              />
              {de
                ? "Freiwillige Meldung erheblicher Cyberbedrohung (Art. 19 Abs. 2)"
                : "Voluntary notification of significant cyber threat (Art. 19(2))"}
            </label>
          </div>
          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          {editable ? (
            <div className="flex gap-2">
              <Button type="submit" name="freeze" value="false" variant="secondary" disabled={pending}>
                {pending ? "…" : de ? "Entwurf speichern" : "Save draft"}
              </Button>
              <Button type="submit" name="freeze" value="true" disabled={pending}>
                {pending
                  ? "…"
                  : de
                    ? "Klassifizieren und einfrieren"
                    : "Classify and freeze"}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
