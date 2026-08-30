"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { classifyIncidentStructured, type ActionResult } from "./incident-actions";
import {
  CLASSIFICATION_CRITERIA,
  EMPTY_MEASUREMENTS,
  deriveIsMajor,
  evaluateCriteria,
  type CriterionResult,
  type IncidentMeasurements,
} from "@/lib/domain/incident-classification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/config";

/**
 * Klassifizierungsassistent (Meldeschicht Welle 6, ADR-0010; zuvor Review v3,
 * P1-04): Die sieben Kriterien der DelVO (EU) 2024/1772 werden als MESSWERTE
 * erfasst; „erfüllt" und „schwerwiegend" werden live abgeleitet (dieselben
 * reinen Funktionen wie serverseitig). Einfrieren macht die Entscheidung
 * unveränderlich.
 */

type NumField = {
  name: keyof IncidentMeasurements;
  de: string;
  en: string;
  unit?: string;
};
type FlagField = { name: keyof IncidentMeasurements; de: string; en: string };

const NUM_FIELDS: Record<string, NumField[]> = {
  CLIENTS_TRANSACTIONS: [
    { name: "clientsAffectedCount", de: "Kunden (Anzahl)", en: "Clients (count)" },
    { name: "clientsAffectedPercent", de: "Kunden (%)", en: "Clients (%)", unit: "%" },
    {
      name: "counterpartsAffectedPercent",
      de: "Gegenparteien (%)",
      en: "Counterparts (%)",
      unit: "%",
    },
    { name: "transactionsCount", de: "Transaktionen (Anzahl)", en: "Transactions (count)" },
    {
      name: "transactionsValueEur",
      de: "Transaktionen (EUR)",
      en: "Transactions (EUR)",
      unit: "EUR",
    },
    {
      name: "transactionsPercentOfDaily",
      de: "Anteil Tagesvolumen (%)",
      en: "Share of daily volume (%)",
      unit: "%",
    },
  ],
  DURATION: [
    { name: "durationHours", de: "Dauer (h)", en: "Duration (h)", unit: "h" },
    {
      name: "serviceDowntimeHours",
      de: "Dienstausfall (h)",
      en: "Service downtime (h)",
      unit: "h",
    },
  ],
  GEO: [
    {
      name: "memberStatesAffected",
      de: "Betroffene Mitgliedstaaten",
      en: "Member states affected",
    },
  ],
  ECONOMIC: [
    {
      name: "economicImpactEur",
      de: "Kosten direkt + indirekt (EUR)",
      en: "Direct + indirect costs (EUR)",
      unit: "EUR",
    },
  ],
};

const FLAG_FIELDS: Record<string, FlagField[]> = {
  REPUTATION: [
    { name: "reputationMediaCoverage", de: "Medienberichte", en: "Media coverage" },
    { name: "reputationComplaints", de: "Beschwerden", en: "Complaints" },
    { name: "reputationClientLoss", de: "Kundenabwanderung", en: "Client loss" },
  ],
  DATA_LOSS: [
    { name: "dataLossAvailability", de: "Verfügbarkeit", en: "Availability" },
    { name: "dataLossIntegrity", de: "Integrität", en: "Integrity" },
    { name: "dataLossConfidentiality", de: "Vertraulichkeit", en: "Confidentiality" },
    { name: "dataLossAuthenticity", de: "Authentizität", en: "Authenticity" },
  ],
  CRITICAL_SERVICES: [
    {
      name: "criticalServicesAffected",
      de: "CIF-gestützte Dienste betroffen",
      en: "CIF-supporting services affected",
    },
  ],
};

export function ClassificationAssistant({
  incidentId,
  existing,
  initialMeasurements,
  frozenAt,
  aggregatedWith,
  voluntaryThreatNotice,
  canWrite,
  locale,
}: {
  incidentId: string;
  existing: CriterionResult[] | null;
  initialMeasurements: IncidentMeasurements | null;
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

  const [m, setM] = useState<IncidentMeasurements>(initialMeasurements ?? EMPTY_MEASUREMENTS);
  const live = useMemo(() => evaluateCriteria(m), [m]);
  const liveByKey = new Map(live.map((r) => [r.key, r]));
  const isMajor = deriveIsMajor(live);

  const setNum = (name: keyof IncidentMeasurements, raw: string) => {
    const v = raw.trim() === "" ? null : Number(raw.replace(",", "."));
    setM((prev) => ({
      ...prev,
      [name]: v !== null && Number.isFinite(v) && v >= 0 ? v : null,
    }));
  };
  const setFlag = (name: keyof IncidentMeasurements, checked: boolean) => {
    setM((prev) => ({ ...prev, [name]: checked }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {de
            ? "Klassifizierungsassistent (Art. 18 / DelVO (EU) 2024/1772)"
            : "Classification assistant (Art. 18 / Del. Reg. (EU) 2024/1772)"}
          {frozen ? (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
              {de ? `eingefroren am ${frozenAt}` : `frozen at ${frozenAt}`}
            </span>
          ) : (
            <span className="ml-2 align-middle">
              <Badge variant={isMajor ? "critical" : "low"}>
                {isMajor
                  ? de
                    ? "schwerwiegend (abgeleitet)"
                    : "major (derived)"
                  : de
                    ? "nicht schwerwiegend (abgeleitet)"
                    : "not major (derived)"}
              </Badge>
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {de
            ? "Die sieben Kriterien werden als Messwerte erfasst; „erfüllt“ wird gegen zentrale Schwellwerte abgeleitet (Arbeitswerte, gegen die DelVO verifizieren). Regel: schwerwiegend, wenn Kritikalität erfüllt und (Datenverlust oder mindestens zwei weitere Kriterien). Nach dem Einfrieren ist die Entscheidung unveränderlich."
            : "The seven criteria are captured as measurements; “met” is derived against central thresholds (working values — verify against the delegated regulation). Rule: major if criticality is met and (data loss or at least two further criteria). Once frozen, the decision is immutable."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="incidentId" value={incidentId} />
          <div className="space-y-2">
            {CLASSIFICATION_CRITERIA.map((c) => {
              const stored = byKey.get(c.key);
              const liveResult = liveByKey.get(c.key);
              const met = editable ? (liveResult?.met ?? false) : (stored?.met ?? false);
              return (
                <div key={c.key} className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{de ? c.de : c.en}</span>
                    <Badge variant={met ? "critical" : "low"}>
                      {met ? (de ? "erfüllt" : "met") : de ? "nicht erfüllt" : "not met"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{c.defaultThreshold}</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    {(NUM_FIELDS[c.key] ?? []).map((f) => (
                      <label key={f.name} className="text-xs">
                        <span className="mb-0.5 block text-muted-foreground">
                          {de ? f.de : f.en}
                        </span>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          name={`m_${f.name}`}
                          defaultValue={(initialMeasurements?.[f.name] as number | null) ?? ""}
                          onChange={(e) => setNum(f.name, e.target.value)}
                          disabled={!editable}
                        />
                      </label>
                    ))}
                    {(FLAG_FIELDS[c.key] ?? []).map((f) => (
                      <label key={f.name} className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          name={`m_${f.name}`}
                          defaultChecked={Boolean(initialMeasurements?.[f.name])}
                          onChange={(e) => setFlag(f.name, e.target.checked)}
                          disabled={!editable}
                          className="h-4 w-4"
                        />
                        {de ? f.de : f.en}
                      </label>
                    ))}
                    <label className="text-xs md:col-span-3">
                      <span className="mb-0.5 block text-muted-foreground">
                        {de ? "Begründung (Pflicht bei erfüllt)" : "Rationale (required when met)"}
                      </span>
                      <Input
                        name={`crit_${c.key}_rationale`}
                        defaultValue={stored?.rationale ?? ""}
                        disabled={!editable}
                      />
                    </label>
                  </div>
                  {!editable && stored ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {de ? "Ist-Wert" : "Actual"}: {stored.actualValue}
                    </p>
                  ) : null}
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
              <Button
                type="submit"
                name="freeze"
                value="false"
                variant="secondary"
                disabled={pending}
              >
                {pending ? "…" : de ? "Entwurf speichern" : "Save draft"}
              </Button>
              <Button type="submit" name="freeze" value="true" disabled={pending}>
                {pending ? "…" : de ? "Klassifizieren und einfrieren" : "Classify and freeze"}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
