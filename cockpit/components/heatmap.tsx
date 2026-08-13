import Link from "next/link";
import { classify, type RiskThresholds } from "@/lib/domain/risk-calc";
import { IMPACT, LIKELIHOOD, RISK_CLASS } from "@/lib/domain/enums";
import { cn } from "@/lib/utils";

/**
 * 5×5-Risikomatrix. Zellfarbe = Risikoklasse des Zell-Scores (L×I) mit
 * Zähler als Textlabel; Klassenlegende darunter (Farbe nie allein).
 * Zellen verlinken auf das gefilterte Risk Register.
 */
export function RiskHeatmap({
  matrix,
  thresholds,
}: {
  matrix: number[][]; // [likelihood-1][impact-1] = Anzahl
  thresholds: RiskThresholds;
}) {
  const classBg: Record<string, string> = {
    LOW: "bg-risk-low/20 hover:bg-risk-low/35",
    MEDIUM: "bg-risk-medium/20 hover:bg-risk-medium/35",
    HIGH: "bg-risk-high/25 hover:bg-risk-high/40",
    CRITICAL: "bg-risk-critical/25 hover:bg-risk-critical/40",
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-xs" role="grid" aria-label="5×5-Risikomatrix (aktuelle Bewertungen)">
          <thead>
            <tr>
              <th className="p-1 text-left align-bottom font-normal text-muted-foreground" scope="col">
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
                  const count = matrix[l - 1]?.[i - 1] ?? 0;
                  return (
                    <td key={i} className="p-0.5">
                      <Link
                        href={`/risks?klass=${klass}`}
                        className={cn(
                          "flex h-12 flex-col items-center justify-center rounded-md border transition-colors",
                          classBg[klass],
                        )}
                        title={`L${l} × I${i} = ${score} (${RISK_CLASS[klass]}) – ${count} Risiken`}
                      >
                        <span className="text-sm font-semibold">{count || ""}</span>
                        <span className="text-[10px] text-muted-foreground">{score}</span>
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <LegendItem className="bg-risk-low/30" label={`Low (1–${thresholds.lowMax})`} />
        <LegendItem className="bg-risk-medium/30" label={`Medium (${thresholds.lowMax + 1}–${thresholds.mediumMax})`} />
        <LegendItem className="bg-risk-high/30" label={`High (${thresholds.mediumMax + 1}–${thresholds.highMax})`} />
        <LegendItem className="bg-risk-critical/30" label={`Critical (${thresholds.highMax + 1}–25)`} />
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
