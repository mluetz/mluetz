import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { getLocale } from "@/lib/i18n/server";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";
import { formatDate, isOverdue } from "@/lib/utils";
import { TP_TRANSITIONS, type TpStatus } from "@/lib/domain/enums";
import { PageHeader } from "@/components/page-header";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  ExitStrategyForm,
  TpAssessmentForm,
  TpCifLinkForm,
  TpWorkflowPanel,
} from "@/features/third-parties/panels";

export const dynamic = "force-dynamic";

const DAY_MS = 86400000;

function toDateInput(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export default async function ThirdPartyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("thirdparty:read");
  const locale = await getLocale();
  const t = TPRM_MESSAGES[locale];
  const { id } = await params;
  // Sprechende IDs zusätzlich zur CUID auflösen (Review v3, P3-03).
  const tp = await db.thirdParty.findFirst({
    where: { OR: [{ id }, { tpId: id }] },
    include: {
      businessOwner: true,
      contractOwner: true,
      services: { include: { ictService: true } },
      subcontractors: { orderBy: { name: "asc" } },
      contracts: { orderBy: { startDate: "asc" } },
      exitStrategy: true,
      providedIctServices: true,
      criticalFunctions: true,
      risks: { select: { id: true, riskId: true, title: true, status: true } },
      evidence: { include: { owner: true }, orderBy: { evidenceId: "asc" } },
    },
  });
  if (!tp) notFound();

  const allCfs = await db.criticalFunction.findMany({
    select: { id: true, cfId: true, name: true, isCritical: true },
    orderBy: { cfId: "asc" },
  });

  const status = tp.status as TpStatus;
  const allowedTargets = (TP_TRANSITIONS[status] ?? []) as string[];
  const reviewOverdue = status !== "EXIT" && isOverdue(tp.nextReviewDate);
  const contractWarnDate = new Date(Date.now() + 180 * DAY_MS);
  const canWrite = hasPermission(user, "thirdparty:write");
  const d = t.tp.detail;
  const yesNo = (v: boolean) => (v ? t.common.yes : t.common.no);

  return (
    <div>
      <PageHeader
        title={`${tp.tpId} – ${tp.name}`}
        description={tp.providedService}
        crumbs={[
          { label: t.tp.list.crumbOverview, href: "/overview" },
          { label: t.tp.list.crumbThirdParties, href: "/third-parties" },
          { label: tp.tpId },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t.labels.tpStatus[status] ?? tp.status}</Badge>
            <Badge variant={riskClassVariant(tp.criticality)}>
              {t.labels.tpCriticality[tp.criticality] ?? tp.criticality}
            </Badge>
            {tp.criticalFunctions.length > 0 ? (
              <Badge variant="high">
                <AlertTriangle className="mr-1 h-3 w-3" aria-hidden /> {d.supportsCriticalFunction}{" "}
                ({tp.criticalFunctions.length})
              </Badge>
            ) : null}
            {tp.concentrationRisk ? <Badge variant="high">{d.concentrationRisk}</Badge> : null}
          </div>
        }
      />

      {/* KPI-Zeile */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi
          label={d.kpiCriticality}
          value={t.labels.tpCriticality[tp.criticality] ?? tp.criticality}
        />
        <Kpi
          label={d.kpiScores}
          value={`${tp.inherentRiskScore ?? "–"} / ${tp.residualRiskScore ?? "–"}`}
        />
        <Kpi
          label={d.kpiDueDiligence}
          value={t.labels.dueDiligence[tp.dueDiligenceStatus] ?? tp.dueDiligenceStatus}
        />
        <Kpi
          label={d.kpiNextReview}
          value={formatDate(tp.nextReviewDate)}
          warn={reviewOverdue}
          warnSuffix={t.common.overdueSuffix}
        />
        <Kpi label={d.kpiStatus} value={t.labels.tpStatus[status] ?? tp.status} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">{d.tabOverview}</TabsTrigger>
          <TabsTrigger value="assessment">{d.tabAssessment}</TabsTrigger>
          <TabsTrigger value="contracts">
            {d.tabContracts} ({tp.contracts.length})
          </TabsTrigger>
          <TabsTrigger value="subcontractors">
            {d.tabSubcontractors} ({tp.subcontractors.length})
          </TabsTrigger>
          <TabsTrigger value="exit">{d.tabExit}</TabsTrigger>
          <TabsTrigger value="evidence">
            {d.tabEvidence} ({tp.evidence.length})
          </TabsTrigger>
        </TabsList>

        {/* ---------- Übersicht ---------- */}
        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{d.masterData}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Info label={d.providedService} value={tp.providedService} />
                <div className="grid grid-cols-2 gap-3">
                  <Info label={d.businessOwner} value={tp.businessOwner?.name ?? d.notAssigned} />
                  <Info label={d.contractOwner} value={tp.contractOwner?.name ?? d.notAssigned} />
                  <Info label={d.country} value={tp.registeredCountry} />
                  <Info label={d.ictServiceCategory} value={tp.ictServiceCategory} />
                  <Info label={d.serviceLocations} value={tp.serviceLocations} />
                  <Info label={d.dataLocations} value={tp.dataLocations} />
                </div>
                <Info label={d.informationTypes} value={tp.informationTypes} />
                <div className="grid grid-cols-2 gap-3">
                  <Info
                    label={d.substitutability}
                    value={t.labels.substitutability[tp.substitutability] ?? tp.substitutability}
                  />
                  <Info label={d.auditAccessRights} value={yesNo(tp.auditRights)} />
                  <Info label={d.incidentReporting} value={yesNo(tp.incidentReporting)} />
                  <Info label={d.assessmentDate} value={formatDate(tp.assessmentDate)} />
                </div>
                <Info label={d.openFindings} value={tp.openFindings || "–"} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{d.links}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <TagList
                  label={d.criticalFunctions}
                  items={tp.criticalFunctions.map((f) => f.name)}
                />
                <TagList
                  label={d.providedIctServices}
                  items={tp.providedIctServices.map((s) => `${s.name} (${s.category})`)}
                />
                <TagList
                  label={d.services}
                  items={tp.services.map((s) =>
                    s.ictService ? `${s.name} → ${s.ictService.name}` : s.name,
                  )}
                />
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">{d.linkedRisks}</p>
                  {tp.risks.length ? (
                    <ul className="mt-0.5 space-y-1">
                      {tp.risks.map((r) => (
                        <li key={r.id}>
                          <Link href={`/risks/${r.id}`} className="text-primary hover:underline">
                            <span className="font-mono text-xs">{r.riskId}</span> – {r.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">{d.noRisksLinked}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{d.workflowTitle}</CardTitle>
              <CardDescription>{d.workflowDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {canWrite ? (
                <TpWorkflowPanel
                  thirdPartyId={tp.id}
                  currentStatus={tp.status}
                  allowedTargets={allowedTargets}
                  locale={locale}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{d.noWritePermission}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Assessment ---------- */}
        <TabsContent value="assessment">
          {canWrite ? (
            <div className="space-y-4">
              <TpAssessmentForm
                thirdPartyId={tp.id}
                locale={locale}
                defaults={{
                  criticality: tp.criticality,
                  inherentRiskScore: tp.inherentRiskScore,
                  residualRiskScore: tp.residualRiskScore,
                  dueDiligenceStatus: tp.dueDiligenceStatus,
                  substitutability: tp.substitutability,
                  concentrationRisk: tp.concentrationRisk,
                  nextReviewDate: toDateInput(tp.nextReviewDate),
                }}
              />
              <TpCifLinkForm
                thirdPartyId={tp.id}
                allCfs={allCfs}
                linkedCfIds={tp.criticalFunctions.map((c) => c.id)}
                locale={locale}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{d.noWritePermissionAssessment}</p>
          )}
        </TabsContent>

        {/* ---------- Verträge ---------- */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>{d.contractsTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>{d.contractTitle}</TH>
                    <TH>{d.contractStart}</TH>
                    <TH>{d.contractEnd}</TH>
                    <TH>{d.noticePeriodDays}</TH>
                    <TH>{d.auditAccessRights}</TH>
                    <TH>{d.incidentReporting}</TH>
                    <TH>{d.contractNotes}</TH>
                  </TR>
                </THead>
                <TBody>
                  {tp.contracts.map((c) => {
                    const expiring = c.endDate != null && c.endDate < contractWarnDate;
                    return (
                      <TR key={c.id}>
                        <TD className="max-w-[260px] truncate font-medium">{c.title}</TD>
                        <TD className="whitespace-nowrap text-xs">{formatDate(c.startDate)}</TD>
                        <TD
                          className={`whitespace-nowrap text-xs ${expiring ? "font-medium text-risk-high" : ""}`}
                        >
                          {formatDate(c.endDate)}
                          {expiring ? (
                            <span className="ml-1">
                              <Badge variant="high">{d.endsWithin180}</Badge>
                            </span>
                          ) : null}
                        </TD>
                        <TD className="text-xs">{c.noticePeriodDays ?? "–"}</TD>
                        <TD className="text-xs">
                          {d.auditPrefix}: {yesNo(c.auditRights)} · {d.accessPrefix}:{" "}
                          {yesNo(c.accessRights)}
                        </TD>
                        <TD className="text-xs">{yesNo(c.incidentReporting)}</TD>
                        <TD className="max-w-[240px] text-xs">{c.notes || "–"}</TD>
                      </TR>
                    );
                  })}
                  {tp.contracts.length === 0 ? (
                    <TR>
                      <TD colSpan={7} className="text-center text-muted-foreground">
                        {d.noContracts}
                      </TD>
                    </TR>
                  ) : null}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Subdienstleister ---------- */}
        <TabsContent value="subcontractors">
          <Card>
            <CardHeader>
              <CardTitle>{d.subcontractorsTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>{d.subName}</TH>
                    <TH>{d.subCountry}</TH>
                    <TH>{d.subService}</TH>
                    <TH>{d.subCritical}</TH>
                  </TR>
                </THead>
                <TBody>
                  {tp.subcontractors.map((s) => (
                    <TR key={s.id}>
                      <TD className="font-medium">{s.name}</TD>
                      <TD className="text-xs">{s.country}</TD>
                      <TD className="max-w-[320px] text-xs">{s.service}</TD>
                      <TD>
                        {s.critical ? (
                          <span className="text-xs font-medium text-risk-high">{t.common.yes}</span>
                        ) : (
                          <span className="text-xs">{t.common.no}</span>
                        )}
                      </TD>
                    </TR>
                  ))}
                  {tp.subcontractors.length === 0 ? (
                    <TR>
                      <TD colSpan={4} className="text-center text-muted-foreground">
                        {d.noSubcontractors}
                      </TD>
                    </TR>
                  ) : null}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Exit-Strategie ---------- */}
        <TabsContent value="exit">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{d.currentExitStrategy}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {tp.exitStrategy ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          tp.exitStrategy.status === "TESTED"
                            ? "low"
                            : tp.exitStrategy.status === "APPROVED"
                              ? "medium"
                              : tp.exitStrategy.status === "DRAFT"
                                ? "high"
                                : "critical"
                        }
                      >
                        {t.labels.exitStatus[tp.exitStrategy.status] ?? tp.exitStrategy.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {d.exitPlanLabel}:{" "}
                        {tp.exitStrategy.exitPlanExists ? d.exitPlanExists : d.exitPlanMissing} ·{" "}
                        {d.lastTest}: {formatDate(tp.exitStrategy.lastTestDate)}
                        {tp.exitStrategy.testResult
                          ? ` (${t.labels.exitTestResult[tp.exitStrategy.testResult] ?? tp.exitStrategy.testResult})`
                          : ""}
                      </span>
                    </div>
                    <Info label={d.exitSummary} value={tp.exitStrategy.strategySummary} />
                    <Info
                      label={d.substituteOptions}
                      value={tp.exitStrategy.substituteOptions || "–"}
                    />
                  </>
                ) : (
                  <p className="flex items-center gap-2 rounded-md border border-risk-high/40 bg-risk-high/10 p-3 text-sm font-medium text-risk-high">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                    {d.noExitStrategy}
                  </p>
                )}
              </CardContent>
            </Card>
            {canWrite ? (
              <Card>
                <CardHeader>
                  <CardTitle>{d.exitFormTitle}</CardTitle>
                  <CardDescription>{d.exitFormDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ExitStrategyForm
                    thirdPartyId={tp.id}
                    locale={locale}
                    defaults={
                      tp.exitStrategy
                        ? {
                            strategySummary: tp.exitStrategy.strategySummary,
                            exitPlanExists: tp.exitStrategy.exitPlanExists,
                            lastTestDate: toDateInput(tp.exitStrategy.lastTestDate),
                            testResult: tp.exitStrategy.testResult ?? "",
                            substituteOptions: tp.exitStrategy.substituteOptions ?? "",
                            status: tp.exitStrategy.status,
                          }
                        : null
                    }
                  />
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>

        {/* ---------- Nachweise ---------- */}
        <TabsContent value="evidence">
          <Card>
            <CardHeader>
              <CardTitle>{d.linkedEvidence}</CardTitle>
              <CardDescription>{d.evidenceDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>{d.evidenceId}</TH>
                    <TH>{d.evidenceTitle}</TH>
                    <TH>{d.evidenceDocType}</TH>
                    <TH>{d.evidenceOwner}</TH>
                    <TH>{d.evidenceValidUntil}</TH>
                    <TH>{d.evidenceReviewStatus}</TH>
                    <TH>{d.evidenceLink}</TH>
                  </TR>
                </THead>
                <TBody>
                  {tp.evidence.map((e) => {
                    const expired = isOverdue(e.validUntil);
                    return (
                      <TR key={e.id}>
                        <TD>
                          <Link
                            href={`/evidence/${e.id}`}
                            className="font-mono text-xs text-primary hover:underline"
                          >
                            {e.evidenceId}
                          </Link>
                        </TD>
                        <TD className="max-w-[260px] truncate">{e.title}</TD>
                        <TD className="text-xs">
                          {t.labels.evidenceDocType[e.docType] ?? e.docType}
                        </TD>
                        <TD className="text-xs">{e.owner?.name ?? "–"}</TD>
                        <TD
                          className={`whitespace-nowrap text-xs ${expired ? "font-medium text-risk-high" : ""}`}
                        >
                          {formatDate(e.validUntil)}
                          {expired ? d.expiredSuffix : ""}
                        </TD>
                        <TD className="text-xs">
                          {t.labels.evidenceReviewStatus[e.reviewStatus] ?? e.reviewStatus}
                        </TD>
                        <TD className="text-xs">
                          <a
                            href={e.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {t.common.open}
                          </a>
                        </TD>
                      </TR>
                    );
                  })}
                  {tp.evidence.length === 0 ? (
                    <TR>
                      <TD colSpan={7} className="text-center text-muted-foreground">
                        {d.noEvidence}
                      </TD>
                    </TR>
                  ) : null}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({
  label,
  value,
  warn,
  warnSuffix,
}: {
  label: string;
  value: string;
  warn?: boolean;
  warnSuffix?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${warn ? "text-risk-high" : ""}`}>
        {value}
        {warn ? (warnSuffix ?? "") : ""}
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function TagList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      {items.length ? (
        <div className="mt-0.5 flex flex-wrap gap-1">
          {items.map((i) => (
            <Badge key={i} variant="outline">
              {i}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">–</p>
      )}
    </div>
  );
}
