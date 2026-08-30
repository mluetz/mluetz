import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Threat Intelligence" };
export const dynamic = "force-dynamic";

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)]!;
}

export default async function ThreatIntelPage() {
  await requirePermission("risk:read");
  const locale = await getLocale();
  const de = locale === "de";

  const alerts = await db.threatIntelAlert.findMany({ orderBy: { receivedAt: "desc" } });
  const hours = alerts
    .filter((a) => a.assessedAt)
    .map((a) => (a.assessedAt!.getTime() - a.receivedAt.getTime()) / 3_600_000);
  const median = percentile(hours, 50);
  const p95 = percentile(hours, 95);
  const unassessed = alerts.filter((a) => !a.assessedAt).length;

  return (
    <div>
      <PageHeader
        title={de ? "Threat Intelligence (Kap. VI, Art. 45)" : "Threat intelligence (Ch. VI, Art. 45)"}
        description={
          de
            ? "Register eingehender Bedrohungsinformationen mit Betroffenheitsanalyse. Kennzahl 'Time to Assess': Median und 95-Perzentil der Zeit von Eingang bis Bewertung."
            : "Register of inbound threat information with impact analysis. KPI 'time to assess': median and 95th percentile from receipt to assessment."
        }
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Threat Intel" }]}
      />

      <div className="mb-4 flex flex-wrap gap-6 rounded-lg border bg-card px-4 py-3 text-sm">
        <span>
          {de ? "Time to Assess (Median)" : "Time to assess (median)"}:{" "}
          <b className="tabular-nums">{median != null ? `${median.toFixed(1)} h` : "–"}</b>
        </span>
        <span>
          95-{de ? "Perzentil" : "percentile"}:{" "}
          <b className="tabular-nums">{p95 != null ? `${p95.toFixed(1)} h` : "–"}</b>
        </span>
        <span>
          {de ? "Unbewertet" : "Unassessed"}:{" "}
          <b className={`tabular-nums ${unassessed > 0 ? "text-status-overdue" : ""}`}>{unassessed}</b>
        </span>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>{de ? "Quelle" : "Source"}</TH>
            <TH>{de ? "Titel" : "Title"}</TH>
            <TH>{de ? "Eingang" : "Received"}</TH>
            <TH>{de ? "Bewertet" : "Assessed"}</TH>
            <TH>{de ? "Relevanz" : "Relevance"}</TH>
            <TH>{de ? "Betroffenheitsanalyse" : "Impact analysis"}</TH>
          </TR>
        </THead>
        <TBody>
          {alerts.map((a) => (
            <TR key={a.id}>
              <TD className="whitespace-nowrap text-xs">{a.source}</TD>
              <TD className="max-w-[300px] truncate font-medium" title={a.title}>
                {a.title}
              </TD>
              <TD className="whitespace-nowrap text-xs tabular-nums">
                {formatDateTime(a.receivedAt)}
              </TD>
              <TD className="whitespace-nowrap text-xs tabular-nums">
                {a.assessedAt ? formatDateTime(a.assessedAt) : "–"}
              </TD>
              <TD>
                {a.relevance ? (
                  <Badge
                    variant={
                      a.relevance === "ACTION_REQUIRED"
                        ? "critical"
                        : a.relevance === "MONITOR"
                          ? "medium"
                          : "low"
                    }
                  >
                    {a.relevance}
                  </Badge>
                ) : (
                  <Badge variant="high">{de ? "offen" : "open"}</Badge>
                )}
              </TD>
              <TD className="max-w-[320px] text-xs">{a.assessment ?? "–"}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
