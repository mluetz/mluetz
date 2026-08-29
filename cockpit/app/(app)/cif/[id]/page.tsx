import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Criterion {
  criterion: string;
  threshold: string;
  actualValue: string;
  met: boolean;
}

const TEXT = {
  de: {
    crumbOverview: "Overview",
    classCritical: "kritisch",
    classImportant: "wichtig",
    spofNote:
      "Single Point of Failure: Diese Funktion hängt an genau einer Drittpartei — Ausfall oder Exit trifft die Funktion unmittelbar.",
    kpiRto: "RTO",
    kpiRpo: "RPO",
    kpiMaxOutage: "Max. tolerierbare Ausfallzeit",
    kpiRecovery: "Wiederanlaufreihenfolge",
    kpiNext: "Nächste Neubewertung",
    assessmentTitle: "Bewertungsverfahren (aktuelle Version)",
    assessmentDesc:
      "Herleitung der Einstufung nach Art. 3 Nr. 22 DORA — Kriterien, Schwellenwerte, Ist-Werte, Begründung und Freigabe.",
    colCriterion: "Kriterium",
    colThreshold: "Schwellenwert",
    colActual: "Ist-Wert",
    colMet: "Erfüllt",
    yes: "ja",
    no: "nein",
    rationale: "Begründung",
    assessedBy: "Bewertet von",
    approvedBy: "Freigegeben von",
    version: "Version",
    noAssessment:
      "Noch kein Bewertungsverfahren dokumentiert — die Einstufung ist damit nicht nachweisfähig (Art. 3 Nr. 22).",
    depsTitle: "Abhängigkeitsgraph",
    depsDesc: "Funktion → Drittparteien → Subdienstleister-Kette; Impact-Toleranz und SPOF-Markierung.",
    providers: "Drittparteien",
    services: "ICT-Services",
    risks: "Verknüpfte Risiken",
    subOf: "Subdienstleister von",
    critical: "kritisch",
    tolerance: "Impact-Toleranzschwelle",
  },
  en: {
    crumbOverview: "Overview",
    classCritical: "critical",
    classImportant: "important",
    spofNote:
      "Single point of failure: this function depends on exactly one third party — an outage or exit hits the function directly.",
    kpiRto: "RTO",
    kpiRpo: "RPO",
    kpiMaxOutage: "Max. tolerable outage",
    kpiRecovery: "Recovery order",
    kpiNext: "Next reassessment",
    assessmentTitle: "Assessment procedure (current version)",
    assessmentDesc:
      "Derivation of the classification per Art. 3(22) DORA — criteria, thresholds, actual values, rationale and approval.",
    colCriterion: "Criterion",
    colThreshold: "Threshold",
    colActual: "Actual",
    colMet: "Met",
    yes: "yes",
    no: "no",
    rationale: "Rationale",
    assessedBy: "Assessed by",
    approvedBy: "Approved by",
    version: "Version",
    noAssessment:
      "No assessment procedure documented yet — the classification is not evidencable (Art. 3(22)).",
    depsTitle: "Dependency graph",
    depsDesc: "Function → third parties → subcontractor chain; impact tolerance and SPOF marking.",
    providers: "Third parties",
    services: "ICT services",
    risks: "Linked risks",
    subOf: "Subcontractor of",
    critical: "critical",
    tolerance: "Impact tolerance threshold",
  },
} as const;

export default async function CifDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("thirdparty:read");
  const locale = await getLocale();
  const t = TEXT[locale];
  const { id } = await params;

  const cf = await db.criticalFunction.findFirst({
    where: { OR: [{ id }, { cfId: id }] },
    include: {
      owner: { select: { name: true } },
      assessments: {
        where: { isCurrent: true },
        take: 1,
        include: {
          assessedBy: { select: { name: true } },
          approvedBy: { select: { name: true } },
        },
      },
      thirdParties: {
        include: {
          subcontractors: true,
          exitStrategy: { select: { status: true } },
        },
        orderBy: { tpId: "asc" },
      },
      ictServices: { select: { id: true, name: true, category: true } },
      risks: { select: { id: true, riskId: true, title: true, status: true } },
    },
  });
  if (!cf) notFound();

  const current = cf.assessments[0] ?? null;
  let criteria: Criterion[] = [];
  if (current) {
    try {
      criteria = JSON.parse(current.criteria) as Criterion[];
    } catch {
      criteria = [];
    }
  }
  const isSpof = cf.isCritical && cf.thirdParties.length === 1;

  return (
    <div>
      <PageHeader
        title={`${cf.cfId} – ${cf.name}`}
        description={cf.description}
        crumbs={[
          { label: t.crumbOverview, href: "/overview" },
          { label: "CIF", href: "/cif" },
          { label: cf.cfId },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={cf.isCritical ? "critical" : "medium"}>
              {cf.isCritical ? t.classCritical : t.classImportant}
            </Badge>
            {isSpof ? <Badge variant="high">SPOF</Badge> : null}
          </div>
        }
      />

      {isSpof ? (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          {t.spofNote}
        </p>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label={t.kpiRto} value={cf.rtoHours != null ? `${cf.rtoHours} h` : "–"} />
        <Kpi label={t.kpiRpo} value={cf.rpoHours != null ? `${cf.rpoHours} h` : "–"} />
        <Kpi
          label={t.kpiMaxOutage}
          value={cf.maxTolerableOutageHours != null ? `${cf.maxTolerableOutageHours} h` : "–"}
        />
        <Kpi label={t.kpiRecovery} value={cf.recoveryOrder != null ? `#${cf.recoveryOrder}` : "–"} />
        <Kpi label={t.kpiNext} value={formatDate(cf.nextAssessmentDate)} />
      </div>

      {/* Bewertungsverfahren */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t.assessmentTitle}</CardTitle>
          <CardDescription>{t.assessmentDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {current ? (
            <div className="space-y-4">
              <Table>
                <THead>
                  <TR>
                    <TH>{t.colCriterion}</TH>
                    <TH>{t.colThreshold}</TH>
                    <TH>{t.colActual}</TH>
                    <TH>{t.colMet}</TH>
                  </TR>
                </THead>
                <TBody>
                  {criteria.map((c, i) => (
                    <TR key={i}>
                      <TD>{c.criterion}</TD>
                      <TD>{c.threshold}</TD>
                      <TD>{c.actualValue}</TD>
                      <TD>
                        <Badge variant={c.met ? "high" : "low"}>{c.met ? t.yes : t.no}</Badge>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t.rationale}
                  </p>
                  <p>{current.rationale}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t.version} {current.version}
                  </p>
                  <p>
                    {t.assessedBy}: {current.assessedBy?.name ?? "–"} ·{" "}
                    {formatDate(current.assessedAt)}
                  </p>
                  <p>
                    {t.approvedBy}: {current.approvedBy?.name ?? "–"} ·{" "}
                    {formatDate(current.approvedAt)}
                  </p>
                  {cf.impactTolerance ? (
                    <p>
                      {t.tolerance}: {cf.impactTolerance}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-destructive">{t.noAssessment}</p>
          )}
        </CardContent>
      </Card>

      {/* Abhängigkeitsgraph */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t.depsTitle}</CardTitle>
          <CardDescription>{t.depsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {cf.thirdParties.map((tp) => (
            <div key={tp.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/third-parties/${tp.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {tp.tpId} – {tp.name}
                </Link>
                <Badge variant="secondary">{tp.registeredCountry}</Badge>
                {cf.thirdParties.length === 1 ? <Badge variant="high">SPOF</Badge> : null}
                <span className="text-xs text-muted-foreground">
                  Exit: {tp.exitStrategy?.status ?? "–"}
                </span>
              </div>
              {tp.subcontractors.length > 0 ? (
                <ul className="mt-2 space-y-1 border-l pl-4 text-sm">
                  {tp.subcontractors.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-2">
                      <span>{s.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.country} · {s.service}
                      </span>
                      {s.critical ? <Badge variant="high">{t.critical}</Badge> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.services}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {cf.ictServices.map((s) => (
                <li key={s.id}>
                  {s.name} <span className="text-xs text-muted-foreground">({s.category})</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.risks}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {cf.risks.map((r) => (
                <li key={r.id}>
                  <Link href={`/risks/${r.id}`} className="text-primary hover:underline">
                    {r.riskId}
                  </Link>{" "}
                  {r.title}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
