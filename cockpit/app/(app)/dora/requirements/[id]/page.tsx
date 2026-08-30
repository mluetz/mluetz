import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { hasPermission, requirePermission } from "@/lib/authz";
import { effectiveMaturity } from "@/lib/domain/dora-scoring";
import { formatDate, isOverdue } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/server";
import { DORA_MESSAGES } from "@/lib/i18n/messages/dora";
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
  const locale = await getLocale();
  const t = DORA_MESSAGES[locale];
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
    ? requirement.linkedProcesses
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const bindingnessLabel =
    t.enums.bindingness[requirement.bindingness as keyof typeof t.enums.bindingness] ??
    requirement.bindingness;

  return (
    <div>
      <PageHeader
        title={`${requirement.reqId} – ${requirement.title}`}
        description={t.requirement.description(
          requirement.chapter.roman,
          requirement.chapter.title,
          requirement.article,
        )}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "DORA", href: "/dora" },
          { label: t.catalog.crumbRequirements, href: "/dora/requirements" },
          { label: requirement.reqId },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={requirement.bindingness === "MUSS" ? "secondary" : "outline"}>
              {bindingnessLabel}
            </Badge>
            {requirement.knockout ? (
              <Badge variant={isOpenKnockout ? "critical" : "outline"}>
                {isOpenKnockout ? t.requirement.koOpen : t.requirement.koMet}
              </Badge>
            ) : null}
            {evidenceCapped ? (
              <Badge variant="high">{t.requirement.evidenceLockActive}</Badge>
            ) : null}
          </div>
        }
      />

      {/* KPI-Zeile */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi
          label={t.requirement.kpiRawMaturity}
          value={
            maturity !== null
              ? (t.enums.maturity[maturity as keyof typeof t.enums.maturity] ?? String(maturity))
              : t.requirement.notAssessed
          }
        />
        <Kpi
          label={t.requirement.kpiEffMaturity}
          value={evidenceCapped ? t.requirement.effCapped(eff) : String(eff)}
          warn={evidenceCapped}
        />
        <Kpi
          label={t.requirement.kpiBindingnessWeight}
          value={t.requirement.bindWeightValue(bindingnessLabel, requirement.weight)}
        />
        <Kpi
          label={t.requirement.kpiKoStatus}
          value={
            requirement.knockout
              ? isOpenKnockout
                ? t.requirement.koStatusOpen
                : t.requirement.koStatusMet
              : t.requirement.koStatusNone
          }
          warn={isOpenKnockout}
        />
        <Kpi
          label={t.requirement.kpiOpenFindings}
          value={String(openFindings)}
          warn={openFindings > 0}
        />
      </div>

      {/* Hinweis-Box: Scoring-Formel */}
      <div className="mb-4 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{t.requirement.scoringTitle}</p>
        <p className="mt-1">{t.requirement.scoringText}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.requirement.reqTextTitle}</CardTitle>
            <CardDescription>
              {t.requirement.reqTextDesc(requirement.article, requirement.ownerRole)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="whitespace-pre-wrap">{requirement.requirementText}</p>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                {t.requirement.requiredEvidence}
              </p>
              <p className="whitespace-pre-wrap">{requirement.evidenceSpec}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.requirement.crosswalkTitle}</CardTitle>
            <CardDescription>{t.requirement.crosswalkDesc}</CardDescription>
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
              <p className="text-[11px] font-medium text-muted-foreground">
                {t.requirement.linkedProcesses}
              </p>
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
          <CardTitle>{t.requirement.evidenceTitle(requirement.evidence.length)}</CardTitle>
          <CardDescription>{t.requirement.evidenceDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{t.requirement.thEvidenceId}</TH>
                <TH>{t.requirement.thTitle}</TH>
                <TH>{t.requirement.thValidUntil}</TH>
                <TH>{t.requirement.thReviewStatus}</TH>
                <TH>{t.requirement.thEffective}</TH>
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
                    {e.validUntil && isOverdue(e.validUntil) ? t.requirement.expiredSuffix : ""}
                  </TD>
                  <TD className="text-xs">
                    {t.enums.evidenceReviewStatus[e.reviewStatus] ?? e.reviewStatus}
                  </TD>
                  <TD className="text-xs">
                    {evidenceIsValid(e) ? (
                      <span className="text-risk-low">{t.requirement.evidenceEffective}</span>
                    ) : (
                      <span className="text-risk-high">{t.requirement.evidenceNotEffective}</span>
                    )}
                  </TD>
                </TR>
              ))}
              {requirement.evidence.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center text-muted-foreground">
                    {t.requirement.evidenceEmpty}
                  </TD>
                </TR>
              ) : null}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t.requirement.findingsTitle(requirement.findings.length)}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{t.requirement.thFindingId}</TH>
                <TH>{t.requirement.thTitle}</TH>
                <TH>{t.requirement.thSeverity}</TH>
                <TH>{t.requirement.thRemediationDue}</TH>
                <TH>{t.requirement.thStatus}</TH>
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
                        {t.enums.severity[f.severity] ?? f.severity}
                      </Badge>
                    </TD>
                    <TD
                      className={`whitespace-nowrap text-xs ${overdue ? "font-medium text-risk-critical" : ""}`}
                    >
                      {formatDate(f.remediationDueAt)}
                      {overdue ? t.common.overdueSuffix : ""}
                    </TD>
                    <TD className="text-xs">
                      {t.enums.findingStatus[f.status as keyof typeof t.enums.findingStatus] ??
                        f.status}
                    </TD>
                  </TR>
                );
              })}
              {requirement.findings.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center text-muted-foreground">
                    {t.requirement.findingsEmpty}
                  </TD>
                </TR>
              ) : null}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-4 space-y-4">
        {canAssess ? (
          <RequirementAssessmentForm requirementId={requirement.id} locale={locale} />
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>{t.requirement.historyTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>{t.requirement.thDate}</TH>
                  <TH>{t.requirement.thAssessor}</TH>
                  <TH>{t.requirement.thMaturity}</TH>
                  <TH>{t.requirement.thJustification}</TH>
                </TR>
              </THead>
              <TBody>
                {requirement.assessments.map((a) => (
                  <TR key={a.id} className={a.isCurrent ? "bg-accent/40" : undefined}>
                    <TD className="whitespace-nowrap text-xs">
                      {formatDate(a.assessedAt)}
                      {a.isCurrent ? (
                        <span className="ml-1 text-[11px] font-medium text-primary">
                          {t.requirement.current}
                        </span>
                      ) : null}
                    </TD>
                    <TD className="text-xs">{a.assessor.name}</TD>
                    <TD className="text-xs font-medium">
                      {t.enums.maturity[a.maturity as keyof typeof t.enums.maturity] ?? a.maturity}
                    </TD>
                    <TD className="max-w-[420px] text-xs">{a.justification}</TD>
                  </TR>
                ))}
                {requirement.assessments.length === 0 ? (
                  <TR>
                    <TD colSpan={4} className="text-center text-muted-foreground">
                      {t.requirement.historyEmpty}
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
