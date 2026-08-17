import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { hasPermission, requirePermission } from "@/lib/authz";
import { effectiveMaturity, FINDING_SEVERITY_RULES } from "@/lib/domain/dora-scoring";
import { DORA_FINDING_STATUS, DORA_MATURITY } from "@/lib/domain/enums";
import { EVIDENCE_REVIEW_STATUS_LABELS } from "@/features/evidence/labels";
import { formatDate, isOverdue } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { RequirementAssessmentForm } from "@/features/dora/catalog-panels";

export const dynamic = "force-dynamic";

function evidenceIsValid(e: { validUntil: Date | null; reviewStatus: string }): boolean {
  return e.reviewStatus === "REVIEWED" && (!e.validUntil || !isOverdue(e.validUntil));
}

export default async function DoraRequirementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("compliance:read");
  const { id } = await params;
  const requirement = await db.doraRequirement.findUnique({
    where: { id },
    include: {
      chapter: true,
      assessments: { orderBy: { assessedAt: "desc" }, include: { assessor: true } },
      evidence: { orderBy: { createdAt: "desc" } },
      findings: { orderBy: { detectedAt: "desc" } },
    },
  });
  if (!requirement) notFound();

  const current = requirement.assessments.find((a) => a.isCurrent) ?? null;
  const maturity = current?.maturity ?? null;
  const hasValidEvidence = requirement.evidence.some(evidenceIsValid);
  const eff = effectiveMaturity(maturity, hasValidEvidence);
  const evidenceCapped = maturity !== null && eff < maturity;
  const isOpenKnockout = requirement.knockout && eff < 3;
  const openFindings = requirement.findings.filter((f) => f.status !== "CLOSED").length;
  const canAssess = hasPermission(user, "dora:assess");

  const crosswalk = [
    { label: "ISO/IEC 27001", value: requirement.cwIso27001 },
    { label: "ISO 22301", value: requirement.cwIso22301 },
    { label: "NIS-2 / BSIG", value: requirement.cwNis2Bsig },
    { label: "RTS/ITS", value: requirement.cwRtsIts },
  ];
  const linkedProcesses = requirement.linkedProcesses
    ? requirement.linkedProcesses.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div>
      <PageHeader
        title={`${requirement.reqId} – ${requirement.title}`}
        description={`Kapitel ${requirement.chapter.roman} – ${requirement.chapter.title} · ${requirement.article}`}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "DORA", href: "/dora" },
          { label: "Anforderungen", href: "/dora/requirements" },
          { label: requirement.reqId },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={requirement.bindingness === "MUSS" ? "secondary" : "outline"}>
              {requirement.bindingness}
            </Badge>
            {requirement.knockout ? (
              <Badge variant={isOpenKnockout ? "critical" : "outline"}>
                {isOpenKnockout ? "KO offen" : "KO erfüllt"}
              </Badge>
            ) : null}
            {evidenceCapped ? <Badge variant="high">Nachweissperre aktiv</Badge> : null}
          </div>
        }
      />

      {/* KPI-Zeile */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi
          label="Reifegrad (roh)"
          value={
            maturity !== null
              ? (DORA_MATURITY[maturity as keyof typeof DORA_MATURITY] ?? String(maturity))
              : "nicht bewertet"
          }
        />
        <Kpi
          label="Reifegrad (wirksam)"
          value={evidenceCapped ? `${eff} (Nachweissperre)` : String(eff)}
          warn={evidenceCapped}
        />
        <Kpi
          label="Verbindlichkeit / Gewicht"
          value={`${requirement.bindingness} · Gewicht ${requirement.weight}`}
        />
        <Kpi
          label="KO-Status"
          value={
            requirement.knockout
              ? isOpenKnockout
                ? "Knockout offen"
                : "Knockout erfüllt"
              : "keine KO-Anforderung"
          }
          warn={isOpenKnockout}
        />
        <Kpi label="Offene Findings" value={String(openFindings)} warn={openFindings > 0} />
      </div>

      {/* Hinweis-Box: Scoring-Formel */}
      <div className="mb-4 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Scoring-Kurzerklärung (FRWK-DORA-001 Kap. 11)</p>
        <p className="mt-1">
          Score = wirksamer Reifegrad (0–5) × Gewicht (MUSS = 3, SOLL = 2, KANN = 1). Nachweissperre:
          Ohne gültigen, geprüften Nachweis wirkt höchstens Reifegrad 2. Knockout-Übersteuerung: Eine
          KO-Anforderung mit wirksamem Reifegrad &lt; 3 setzt den Kapitelstatus auf ROT – unabhängig
          vom Kapitel-Score.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Anforderungstext</CardTitle>
            <CardDescription>
              {requirement.article} · Owner-Rolle: {requirement.ownerRole}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="whitespace-pre-wrap">{requirement.requirementText}</p>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Geforderter Nachweis</p>
              <p className="whitespace-pre-wrap">{requirement.evidenceSpec}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crosswalk</CardTitle>
            <CardDescription>
              Zuordnung zu weiteren Rahmenwerken (FRWK-DORA-001 Kap. 10)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>ISO/IEC 27001</TH>
                  <TH>ISO 22301</TH>
                  <TH>NIS-2/BSIG</TH>
                  <TH>RTS/ITS</TH>
                </TR>
              </THead>
              <TBody>
                <TR>
                  {crosswalk.map((c) => (
                    <TD key={c.label} className="text-xs">
                      {c.value ?? "–"}
                    </TD>
                  ))}
                </TR>
              </TBody>
            </Table>
            <div className="mt-4">
              <p className="text-[11px] font-medium text-muted-foreground">Verknüpfte Prozesse</p>
              {linkedProcesses.length ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {linkedProcesses.map((code) => (
                    <Link key={code} href={code.startsWith("PB") ? "/playbooks" : "/runbooks"}>
                      <Badge variant="outline" className="hover:bg-accent">
                        {code}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">–</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Verknüpfte Nachweise ({requirement.evidence.length})</CardTitle>
          <CardDescription>
            Gültig = Reviewstatus „Reviewt“ und Gültig-bis-Datum nicht überschritten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Evidence ID</TH>
                <TH>Titel</TH>
                <TH>Gültig bis</TH>
                <TH>Reviewstatus</TH>
                <TH>Wirksam für Scoring</TH>
              </TR>
            </THead>
            <TBody>
              {requirement.evidence.map((e) => (
                <TR key={e.id}>
                  <TD>
                    <Link
                      href={`/evidence/${e.id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {e.evidenceId}
                    </Link>
                  </TD>
                  <TD className="max-w-[320px] truncate text-xs">{e.title}</TD>
                  <TD
                    className={`whitespace-nowrap text-xs ${
                      e.validUntil && isOverdue(e.validUntil) ? "font-medium text-risk-high" : ""
                    }`}
                  >
                    {formatDate(e.validUntil)}
                    {e.validUntil && isOverdue(e.validUntil) ? " (abgelaufen)" : ""}
                  </TD>
                  <TD className="text-xs">
                    {EVIDENCE_REVIEW_STATUS_LABELS[e.reviewStatus] ?? e.reviewStatus}
                  </TD>
                  <TD className="text-xs">
                    {evidenceIsValid(e) ? (
                      <span className="text-risk-low">✓ gültig</span>
                    ) : (
                      <span className="text-risk-high">✗ nicht wirksam</span>
                    )}
                  </TD>
                </TR>
              ))}
              {requirement.evidence.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center text-muted-foreground">
                    Keine Nachweise verknüpft – Nachweissperre begrenzt den wirksamen Reifegrad auf 2.
                  </TD>
                </TR>
              ) : null}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Findings ({requirement.findings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Finding-ID</TH>
                <TH>Titel</TH>
                <TH>Schweregrad</TH>
                <TH>Behebung fällig</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {requirement.findings.map((f) => {
                const overdue = isOverdue(f.remediationDueAt) && f.status !== "CLOSED";
                return (
                  <TR key={f.id}>
                    <TD>
                      <Link
                        href={`/dora/findings/${f.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {f.findingId}
                      </Link>
                    </TD>
                    <TD className="max-w-[320px] truncate text-xs">{f.title}</TD>
                    <TD>
                      <Badge variant={riskClassVariant(f.severity)}>
                        {FINDING_SEVERITY_RULES[f.severity]?.label ?? f.severity}
                      </Badge>
                    </TD>
                    <TD className={`whitespace-nowrap text-xs ${overdue ? "font-medium text-risk-critical" : ""}`}>
                      {formatDate(f.remediationDueAt)}
                      {overdue ? " (überfällig)" : ""}
                    </TD>
                    <TD className="text-xs">
                      {DORA_FINDING_STATUS[f.status as keyof typeof DORA_FINDING_STATUS] ?? f.status}
                    </TD>
                  </TR>
                );
              })}
              {requirement.findings.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center text-muted-foreground">
                    Keine Findings zu dieser Anforderung.
                  </TD>
                </TR>
              ) : null}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-4 space-y-4">
        {canAssess ? <RequirementAssessmentForm requirementId={requirement.id} /> : null}
        <Card>
          <CardHeader>
            <CardTitle>Bewertungshistorie</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Datum</TH>
                  <TH>Assessor</TH>
                  <TH>Reifegrad</TH>
                  <TH>Begründung</TH>
                </TR>
              </THead>
              <TBody>
                {requirement.assessments.map((a) => (
                  <TR key={a.id} className={a.isCurrent ? "bg-accent/40" : undefined}>
                    <TD className="whitespace-nowrap text-xs">
                      {formatDate(a.assessedAt)}
                      {a.isCurrent ? (
                        <span className="ml-1 text-[11px] font-medium text-primary">(aktuell)</span>
                      ) : null}
                    </TD>
                    <TD className="text-xs">{a.assessor.name}</TD>
                    <TD className="text-xs font-medium">
                      {DORA_MATURITY[a.maturity as keyof typeof DORA_MATURITY] ?? a.maturity}
                    </TD>
                    <TD className="max-w-[420px] text-xs">{a.justification}</TD>
                  </TR>
                ))}
                {requirement.assessments.length === 0 ? (
                  <TR>
                    <TD colSpan={4} className="text-center text-muted-foreground">
                      Noch keine Bewertung vorhanden.
                    </TD>
                  </TR>
                ) : null}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${warn ? "text-risk-high" : ""}`}>{value}</p>
    </div>
  );
}
