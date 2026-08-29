import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { classify } from "@/lib/domain/risk-calc";
import { getRiskThresholds } from "@/lib/settings";
import { formatDate, formatDateTime, isOverdue } from "@/lib/utils";
import { RISK_CLASS, RISK_STATUS, RISK_TRANSITIONS, type RiskStatus } from "@/lib/domain/enums";
import { getLocale } from "@/lib/i18n/server";
import { CORE_MESSAGES } from "@/lib/i18n/messages/core";
import { PageHeader } from "@/components/page-header";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  AcceptanceDecisionForm,
  AcceptanceRequestForm,
  AssessmentForm,
  CommentForm,
  CompleteReviewForm,
  StartReviewButton,
  WorkflowPanel,
} from "@/features/risks/panels";

export const dynamic = "force-dynamic";

export default async function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("risk:read");
  const locale = await getLocale();
  const t = CORE_MESSAGES[locale].riskDetail;
  const tEnums = CORE_MESSAGES[locale].enums;
  const { id } = await params;
  const risk = await db.risk.findFirst({
    where: { OR: [{ id }, { riskId: id }] },
    include: {
      category: true,
      riskOwner: true,
      createdBy: true,
      ou: true,
      location: true,
      assets: true,
      processes: true,
      ictServices: true,
      criticalFunctions: true,
      thirdParties: true,
      regulatoryRequirements: true,
      controls: { include: { control: { include: { owner: true } } } },
      assessments: {
        orderBy: { assessedAt: "desc" },
        include: { assessor: true, dimensionScores: true },
      },
      actions: { include: { owner: true }, orderBy: { dueDate: "asc" } },
      acceptances: {
        include: { requestedBy: true, approvedBy: true },
        orderBy: { createdAt: "desc" },
      },
      qualityReviews: {
        orderBy: { startedAt: "desc" },
        include: { checklistItems: { orderBy: { sortOrder: "asc" } } },
      },
      evidence: true,
      comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!risk) notFound();

  const thresholds = await getRiskThresholds();
  const current = risk.assessments.find((a) => a.isCurrent) ?? null;
  const appetite = risk.appetiteOverride ?? risk.category.appetiteThreshold;
  const aboveAppetite = current ? current.residualScore > appetite : false;
  const status = risk.status as RiskStatus;
  const allowedTargets = (RISK_TRANSITIONS[status] ?? []) as string[];
  const openReview = risk.qualityReviews.find((r) => !r.completedAt) ?? null;
  const auditEntries = await db.auditLog.findMany({
    where: { entityType: { in: ["Risk", "QualityReview", "RiskAcceptance"] }, entityId: risk.id },
    orderBy: { timestamp: "desc" },
    take: 50,
    include: { user: true },
  });

  const canWrite = hasPermission(user, "risk:write");
  const canAssess = hasPermission(user, "risk:assess");
  const canReview = hasPermission(user, "risk:review");
  const canRequestAcc = hasPermission(user, "acceptance:request");
  const canDecideAcc = hasPermission(user, "acceptance:approve");

  return (
    <div>
      <PageHeader
        title={`${risk.riskId} – ${risk.title}`}
        description={risk.description}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Risks", href: "/risks" },
          { label: risk.riskId },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{RISK_STATUS[status] ?? risk.status}</Badge>
            {current ? (
              <Badge variant={riskClassVariant(classify(current.residualScore, thresholds))}>
                Residual {current.residualScore} ·{" "}
                {RISK_CLASS[classify(current.residualScore, thresholds)]}
              </Badge>
            ) : (
              <Badge variant="outline">{t.notAssessed}</Badge>
            )}
            {aboveAppetite ? (
              <Badge variant="critical">
                <AlertTriangle className="mr-1 h-3 w-3" aria-hidden />{" "}
                {t.aboveAppetiteBadge(appetite)}
              </Badge>
            ) : null}
          </div>
        }
      />

      {/* KPI-Zeile */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi
          label={t.kpi.inherent}
          value={
            current
              ? `${current.inherentScore} (${RISK_CLASS[classify(current.inherentScore, thresholds)]})`
              : "–"
          }
        />
        <Kpi
          label={t.kpi.controlEffectiveness}
          value={current ? `${current.controlEffectiveness} %` : "–"}
        />
        <Kpi
          label={t.kpi.residual}
          value={
            current
              ? `${current.residualScore} (${RISK_CLASS[classify(current.residualScore, thresholds)]})`
              : "–"
          }
        />
        <Kpi label={t.kpi.target} value={`${risk.targetScore ?? "–"} / ${appetite}`} />
        <Kpi
          label={t.kpi.nextReview}
          value={risk.nextReviewDate ? formatDate(risk.nextReviewDate) : "–"}
          warn={isOverdue(risk.nextReviewDate) && status !== "CLOSED"}
          overdueSuffix={t.kpi.overdueSuffix}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">{t.tabs.overview}</TabsTrigger>
          <TabsTrigger value="assessment">{t.tabs.assessment}</TabsTrigger>
          <TabsTrigger value="actions">
            {t.tabs.actions} ({risk.actions.length})
          </TabsTrigger>
          <TabsTrigger value="controls">
            {t.tabs.controls} ({risk.controls.length})
          </TabsTrigger>
          <TabsTrigger value="review">
            {t.tabs.review} ({risk.qualityReviews.length})
          </TabsTrigger>
          <TabsTrigger value="acceptance">
            {t.tabs.acceptance} ({risk.acceptances.length})
          </TabsTrigger>
          <TabsTrigger value="history">{t.tabs.history}</TabsTrigger>
        </TabsList>

        {/* ---------- Übersicht ---------- */}
        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t.overview.descriptionTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Info label={t.overview.cause} value={risk.cause} />
                <Info label={t.overview.riskEvent} value={risk.riskEvent} />
                <Info label={t.overview.impactDescription} value={risk.impactDescription} />
                <div className="grid grid-cols-2 gap-3">
                  <Info label={t.overview.threat} value={risk.threat} />
                  <Info label={t.overview.vulnerability} value={risk.vulnerability} />
                </div>
                <Info label={t.overview.existingControls} value={risk.existingControls} />
                <div className="grid grid-cols-2 gap-3">
                  <Info
                    label={t.overview.treatmentStrategy}
                    value={
                      risk.treatmentStrategy
                        ? (tEnums.treatmentStrategy[risk.treatmentStrategy] ??
                          risk.treatmentStrategy)
                        : t.overview.treatmentNotSet
                    }
                  />
                  <Info label={t.overview.treatmentDue} value={formatDate(risk.dueDate)} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t.overview.governanceTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Info label={t.overview.category} value={risk.category.name} />
                  <Info
                    label={t.overview.owner}
                    value={risk.riskOwner?.name ?? t.overview.ownerMissing}
                  />
                  <Info label={t.overview.ou} value={risk.ou?.name ?? "–"} />
                  <Info label={t.overview.location} value={risk.location?.name ?? "–"} />
                  <Info label={t.overview.createdBy} value={risk.createdBy.name} />
                  <Info label={t.overview.createdAt} value={formatDate(risk.createdAt)} />
                  <Info label={t.overview.updatedAt} value={formatDateTime(risk.updatedAt)} />
                  <Info label={t.overview.version} value={String(risk.version)} />
                </div>
                <TagList label={t.overview.assets} items={risk.assets.map((a) => a.name)} />
                <TagList label={t.overview.processes} items={risk.processes.map((p) => p.name)} />
                <TagList
                  label={t.overview.ictServices}
                  items={risk.ictServices.map((s) => s.name)}
                />
                <TagList
                  label={t.overview.criticalFunctions}
                  items={risk.criticalFunctions.map((f) => f.name)}
                />
                <TagList
                  label={t.overview.thirdParties}
                  items={risk.thirdParties.map((tp) => `${tp.tpId} ${tp.name}`)}
                />
                <TagList
                  label={t.overview.regulatory}
                  items={risk.regulatoryRequirements.map((r) => `${r.refId} (${r.framework})`)}
                />
              </CardContent>
            </Card>
          </div>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{t.overview.workflowTitle}</CardTitle>
              <CardDescription>{t.overview.workflowDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {canWrite ? (
                <WorkflowPanel
                  riskId={risk.id}
                  currentStatus={risk.status}
                  allowedTargets={allowedTargets}
                  locale={locale}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{t.overview.noWritePermission}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Bewertung ---------- */}
        <TabsContent value="assessment">
          <div className="space-y-4">
            {canAssess ? <AssessmentForm riskId={risk.id} locale={locale} /> : null}
            <Card>
              <CardHeader>
                <CardTitle>{t.assessment.historyTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <THead>
                    <TR>
                      <TH>{t.assessment.date}</TH>
                      <TH>{t.assessment.assessedBy}</TH>
                      <TH>L</TH>
                      <TH>I</TH>
                      <TH>{t.assessment.effectiveness}</TH>
                      <TH>{t.assessment.inherent}</TH>
                      <TH>{t.assessment.residual}</TH>
                      <TH>{t.assessment.justification}</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {risk.assessments.map((a) => (
                      <TR key={a.id} className={a.isCurrent ? "bg-accent/40" : undefined}>
                        <TD className="whitespace-nowrap text-xs">{formatDate(a.assessedAt)}</TD>
                        <TD className="text-xs">{a.assessor.name}</TD>
                        <TD>{a.likelihood}</TD>
                        <TD>{a.impact}</TD>
                        <TD>{a.controlEffectiveness} %</TD>
                        <TD>
                          <Badge variant={riskClassVariant(classify(a.inherentScore, thresholds))}>
                            {a.inherentScore}
                          </Badge>
                        </TD>
                        <TD>
                          <Badge variant={riskClassVariant(classify(a.residualScore, thresholds))}>
                            {a.residualScore}
                          </Badge>
                        </TD>
                        <TD className="max-w-[360px] text-xs">{a.justification}</TD>
                      </TR>
                    ))}
                    {risk.assessments.length === 0 ? (
                      <TR>
                        <TD colSpan={8} className="text-center text-muted-foreground">
                          {t.assessment.empty}
                        </TD>
                      </TR>
                    ) : null}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- Maßnahmen ---------- */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>{t.actions.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>{t.actions.actionId}</TH>
                    <TH>{t.actions.colTitle}</TH>
                    <TH>{t.actions.owner}</TH>
                    <TH>{t.actions.priority}</TH>
                    <TH>{t.actions.due}</TH>
                    <TH>{t.actions.status}</TH>
                    <TH>{t.actions.progress}</TH>
                  </TR>
                </THead>
                <TBody>
                  {risk.actions.map((a) => (
                    <TR key={a.id}>
                      <TD>
                        <Link
                          href={`/actions/${a.id}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {a.actionId}
                        </Link>
                      </TD>
                      <TD className="max-w-[320px] truncate">{a.title}</TD>
                      <TD className="text-xs">{a.owner?.name ?? "–"}</TD>
                      <TD className="text-xs">{a.priority}</TD>
                      <TD
                        className={`whitespace-nowrap text-xs ${isOverdue(a.dueDate) && !["COMPLETED", "CLOSED"].includes(a.status) ? "font-medium text-risk-high" : ""}`}
                      >
                        {formatDate(a.dueDate)}
                        {isOverdue(a.dueDate) && !["COMPLETED", "CLOSED"].includes(a.status)
                          ? t.actions.overdueSuffix
                          : ""}
                      </TD>
                      <TD className="text-xs">{a.status}</TD>
                      <TD className="text-xs">{a.progress} %</TD>
                    </TR>
                  ))}
                  {risk.actions.length === 0 ? (
                    <TR>
                      <TD colSpan={7} className="text-center text-muted-foreground">
                        {t.actions.empty}
                      </TD>
                    </TR>
                  ) : null}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Kontrollen ---------- */}
        <TabsContent value="controls">
          <Card>
            <CardHeader>
              <CardTitle>{t.controls.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>{t.controls.controlId}</TH>
                    <TH>{t.controls.name}</TH>
                    <TH>{t.controls.type}</TH>
                    <TH>{t.controls.owner}</TH>
                    <TH>{t.controls.design}</TH>
                    <TH>{t.controls.operating}</TH>
                  </TR>
                </THead>
                <TBody>
                  {risk.controls.map(({ control }) => (
                    <TR key={control.id}>
                      <TD>
                        <Link
                          href={`/controls/${control.id}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {control.controlId}
                        </Link>
                      </TD>
                      <TD>{control.name}</TD>
                      <TD className="text-xs">{control.controlType}</TD>
                      <TD className="text-xs">{control.owner?.name ?? "–"}</TD>
                      <TD className="text-xs">{control.designEffectiveness}</TD>
                      <TD className="text-xs">{control.operatingEffectiveness}</TD>
                    </TR>
                  ))}
                  {risk.controls.length === 0 ? (
                    <TR>
                      <TD colSpan={6} className="text-center text-muted-foreground">
                        {t.controls.empty}
                      </TD>
                    </TR>
                  ) : null}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Quality Review ---------- */}
        <TabsContent value="review">
          <div className="space-y-4">
            {canReview && !openReview && risk.status === "QUALITY_REVIEW" ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t.review.title}</CardTitle>
                  <CardDescription>{t.review.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <StartReviewButton riskId={risk.id} locale={locale} />
                </CardContent>
              </Card>
            ) : null}
            {openReview && canReview ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t.review.completeTitle}</CardTitle>
                  <CardDescription>{t.review.reviewer(openReview.reviewerName)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <CompleteReviewForm
                    reviewId={openReview.id}
                    locale={locale}
                    items={openReview.checklistItems.map((i) => ({
                      id: i.id,
                      criterion: i.criterion,
                      fulfilled: i.fulfilled,
                      comment: i.comment,
                    }))}
                  />
                </CardContent>
              </Card>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle>{t.review.historyTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {risk.qualityReviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.review.empty}</p>
                ) : (
                  risk.qualityReviews.map((r) => (
                    <div key={r.id} className="rounded-md border p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            r.outcome === "APPROVED"
                              ? "low"
                              : r.outcome === "IN_PROGRESS"
                                ? "secondary"
                                : r.outcome === "RETURNED"
                                  ? "medium"
                                  : "critical"
                          }
                        >
                          {r.outcome}
                        </Badge>
                        {r.qualityScore != null ? (
                          <span>{t.review.qualityScore(r.qualityScore)}</span>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {r.reviewerName} · {t.review.startedAt(formatDate(r.startedAt))}
                          {r.completedAt ? t.review.completedAt(formatDate(r.completedAt)) : ""}
                        </span>
                      </div>
                      {r.comments ? <p className="mt-1">{r.comments}</p> : null}
                      {r.rejectionReason ? (
                        <p className="mt-1 text-destructive">
                          {t.review.rejectionReason(r.rejectionReason)}
                        </p>
                      ) : null}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          {t.review.checklistSummary(
                            r.checklistItems.filter((i) => i.fulfilled === true).length,
                            r.checklistItems.length,
                          )}
                        </summary>
                        <ul className="mt-1 space-y-0.5 text-xs">
                          {r.checklistItems.map((i) => (
                            <li key={i.id}>
                              {i.fulfilled === true ? "✔" : i.fulfilled === false ? "✘" : "○"}{" "}
                              {i.criterion}
                              {i.comment ? ` – ${i.comment}` : ""}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- Akzeptanz ---------- */}
        <TabsContent value="acceptance">
          <div className="space-y-4">
            {canRequestAcc ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t.acceptance.requestTitle}</CardTitle>
                  <CardDescription>{t.acceptance.requestDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <AcceptanceRequestForm riskId={risk.id} locale={locale} />
                </CardContent>
              </Card>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle>{t.acceptance.listTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {risk.acceptances.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.acceptance.empty}</p>
                ) : (
                  risk.acceptances.map((acc) => (
                    <div key={acc.id} className="space-y-2 rounded-md border p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            acc.status === "APPROVED"
                              ? "low"
                              : acc.status === "REQUESTED" || acc.status === "IN_REVIEW"
                                ? "medium"
                                : "critical"
                          }
                        >
                          {tEnums.acceptanceStatus[acc.status] ?? acc.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {t.acceptance.requestedBy(
                            acc.requestedBy.name,
                            formatDate(acc.createdAt),
                          )}
                          {acc.approvedBy ? t.acceptance.decidedBy(acc.approvedBy.name) : ""}
                          {acc.validUntil
                            ? t.acceptance.validUntil(formatDate(acc.validUntil))
                            : ""}
                        </span>
                      </div>
                      <Info label={t.acceptance.justification} value={acc.justification} />
                      <Info
                        label={t.acceptance.compensatingControls}
                        value={acc.compensatingControls}
                      />
                      {canDecideAcc &&
                      (acc.status === "REQUESTED" || acc.status === "IN_REVIEW") ? (
                        <AcceptanceDecisionForm acceptanceId={acc.id} locale={locale} />
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- Historie ---------- */}
        <TabsContent value="history">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t.history.auditTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs">
                  {auditEntries.map((e) => (
                    <li key={e.id} className="rounded-md border p-2">
                      <span className="font-medium">{e.action}</span>{" "}
                      {e.field ? (
                        <span>
                          {e.field}: {e.oldValue ?? "–"} → {e.newValue ?? "–"}
                        </span>
                      ) : null}
                      <div className="text-muted-foreground">
                        {e.user?.name ?? e.userEmail} · {formatDateTime(e.timestamp)}
                        {e.comment ? ` · ${e.comment}` : ""}
                      </div>
                    </li>
                  ))}
                  {auditEntries.length === 0 ? (
                    <li className="text-muted-foreground">{t.history.noEntries}</li>
                  ) : null}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t.history.commentsTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CommentForm riskId={risk.id} locale={locale} />
                <ul className="space-y-2 text-sm">
                  {risk.comments.map((c) => (
                    <li key={c.id} className="rounded-md border p-2">
                      <p>{c.body}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.author.name} · {formatDateTime(c.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({
  label,
  value,
  warn,
  overdueSuffix,
}: {
  label: string;
  value: string;
  warn?: boolean;
  overdueSuffix?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${warn ? "text-risk-high" : ""}`}>
        {value}
        {warn ? (overdueSuffix ?? " (überfällig)") : ""}
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
