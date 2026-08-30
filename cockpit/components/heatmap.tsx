"use client";

import * as React from "react";
import Link from "next/link";
import { classify, type RiskThresholds } from "@/lib/domain/risk-calc";
import { IMPACT, LIKELIHOOD, RISK_CLASS } from "@/lib/domain/enums";
import { cn } from "@/lib/utils";

/**
 * 5×5-Risikomatrix (Redesign Welle 4, D-03):
 * - nur die ANZAHL in der Zelle; Zell-Score in Tooltip und Legende
 * - leere Zellen vollständig entsättigt, belegte mit dünner Kontur
 * - Umschalter Inherent ↔ Residual (Residual: L unverändert, wirksames
 *   Impact aus dem Residual-Score zurückgerechnet — zeigt, was die
 *   Kontrollen leisten; dokumentierte Näherung)
 * - Kürzel L/M/H/C zusätzlich zur Farbe (D-11)
 */
export function RiskHeatmap({
  matrix,
  matrixResidual,
  thresholds,
  methodologyLabel,
}: {
  matrix: number[][];
  matrixResidual?: number[][];
  thresholds: RiskThresholds;
  methodologyLabel?: string;
}) {
  const [view, setView] = React.useState<"inherent" | "residual">(
    matrixResidual ? "residual" : "inherent",
  );
  const active = view === "residual" && matrixResidual ? matrixResidual : matrix;

  const classBg: Record<string, string> = {
    LOW: "bg-risk-low/20 hover:bg-risk-low/35 border-risk-low/40",
    MEDIUM: "bg-risk-medium/20 hover:bg-risk-medium/35 border-risk-medium/40",
    HIGH: "bg-risk-high/25 hover:bg-risk-high/40 border-risk-high/50",
    CRITICAL: "bg-risk-critical/25 hover:bg-risk-critical/40 border-risk-critical/60",
  };

  return (
    <div>
      {matrixResidual ? (
        <div className="mb-2 inline-flex overflow-hidden rounded-md border">
          {(["inherent", "residual"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold transition-colors",
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "inherent" ? "Inhärent" : "Residual"}
            </button>
          ))}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-center text-xs"
          role="grid"
          aria-label={`5×5-Risikomatrix (${view === "residual" ? "residual" : "inhärent"})`}
        >
          <thead>
            <tr>
              <th
                className="p-1 text-left align-bottom font-normal text-muted-foreground"
                scope="col"
              >
                Likelihood ↓ / Impact →
              </th>
              {[1, 2, 3, 4, 5].map((i) => (
                <th key={i} className="p-1 font-medium" scope="col">
                  {i}
                  <span className="block font-normal text-muted-foreground">
                    {IMPACT[i as keyof typeof IMPACT]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[5, 4, 3, 2, 1].map((l) => (
              <tr key={l}>
                <th className="p-1 text-left font-medium" scope="row">
                  {l}
                  <span className="block font-normal text-muted-foreground">
                    {LIKELIHOOD[l as keyof typeof LIKELIHOOD]}
                  </span>
                </th>
                {[1, 2, 3, 4, 5].map((i) => {
                  const score = l * i;
                  const klass = classify(score, thresholds);
                  const count = active[l - 1]?.[i - 1] ?? 0;
                  const empty = count === 0;
                  return (
                    <td key={i} className="p-0.5">
                      <Link
                        href={`/risks?klass=${klass}`}
                        className={cn(
                          "flex h-12 items-center justify-center rounded-md border transition-colors",
                          empty
                            ? "border-transparent bg-muted/40 text-transparent"
                            : classBg[klass],
                        )}
                        title={`L${l} × I${i} = ${score} (${RISK_CLASS[klass]}) – ${count} Risiken`}
                        tabIndex={empty ? -1 : 0}
                        aria-hidden={empty}
                      >
                        <span className="text-base font-bold tabular-nums">
                          {empty ? "·" : count}
                        </span>
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendItem className="bg-risk-low/30" label={`L · Low (Score 1–${thresholds.lowMax})`} />
        <LegendItem
          className="bg-risk-medium/30"
          label={`M · Medium (${thresholds.lowMax + 1}–${thresholds.mediumMax})`}
        />
        <LegendItem
          className="bg-risk-high/30"
          label={`H · High (${thresholds.mediumMax + 1}–${thresholds.highMax})`}
        />
        <LegendItem
          className="bg-risk-critical/30"
          label={`C · Critical (${thresholds.highMax + 1}–25)`}
        />
        {methodologyLabel ? <span className="ml-auto">{methodologyLabel}</span> : null}
      </div>
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-3 w-3 rounded-sm border", className)} aria-hidden />
      {label}
    </span>
  );
}
