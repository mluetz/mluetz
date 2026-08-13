import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { classify } from "@/lib/domain/risk-calc";
import { getRiskThresholds } from "@/lib/settings";
import { formatDate, formatDateTime, isOverdue } from "@/lib/utils";
import {
  ACCEPTANCE_STATUS,
  RISK_CLASS,
  RISK_STATUS,
  RISK_TRANSITIONS,
  TREATMENT_STRATEGY,
  type RiskStatus,
} from "@/lib/domain/enums";
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
  const { id } = await params;
  const risk = await db.risk.findUnique({
    where: { id },
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
      acceptances: { include: { requestedBy: true, approvedBy: true }, orderBy: { createdAt: "desc" } },
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
              <Badge variant="outline">nicht bewertet</Badge>
            )}
            {aboveAppetite ? (
              <Badge variant="critical">
                <AlertTriangle className="mr-1 h-3 w-3" aria-hidden /> über Risikoappetit ({appetite})
              </Badge>
            ) : null}
          </div>
        }
      />

      {/* KPI-Zeile */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Inherent Risk" value={current ? `${current.inherentScore} (${RISK_CLASS[classify(current.inherentScore, thresholds)]})` : "–"} />
        <Kpi label="Kontrollwirksamkeit" value={current ? `${current.controlEffectiveness} %` : "–"} />
        <Kpi label="Residual Risk" value={current ? `${current.residualScore} (${RISK_CLASS[classify(current.residualScore, thresholds)]})` : "–"} />
        <Kpi label="Zielrisiko / Appetit" value={`${risk.targetScore ?? "–"} / ${appetite}`} />
        <Kpi
          label="Nächstes Review"
          value={risk.nextReviewDate ? formatDate(risk.nextReviewDate) : "–"}
          warn={isOverdue(risk.nextReviewDate) && status !== "CLOSED"}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="assessment">Bewertung</TabsTrigger>
          <TabsTrigger value="actions">Maßnahmen ({risk.actions.length})</TabsTrigger>
          <TabsTrigger value="controls">Kontrollen ({risk.controls.length})</TabsTrigger>
          <TabsTrigger value="review">Quality Review ({risk.qualityReviews.length})</TabsTrigger>
          <TabsTrigger value="acceptance">Akzeptanz ({risk.acceptances.length})</TabsTrigger>
          <TabsTrigger value="history">Historie</TabsTrigger>
        </TabsList>

        {/* ---------- Übersicht ---------- */}
        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Risikobeschreibung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Info label="Ursache" value={risk.cause} />
                <Info label="Risikoereignis" value={risk.riskEvent} />
                <Info label="Mögliche Auswirkungen" value={risk.impactDescription} />
                <div className="grid grid-cols-2 gap-3">
                  <Info label="Bedrohung" value={risk.threat} />
                  <Info label="Schwachstelle" value={risk.vulnerability} />
                </div>
                <Info label="Bestehende Kontrollen (narrativ)" value={risk.existingControls} />
                <div className="grid grid-cols-2 gap-3">
                  <Info
                    label="Behandlungsstrategie"
                    value={
                      risk.treatmentStrategy
                        ? TREATMENT_STRATEGY[risk.treatmentStrategy as keyof typeof TREATMENT_STRATEGY]
                        : "noch nicht festgelegt"
                    }
                  />
                  <Info label="Fälligkeit Behandlung" value={formatDate(risk.dueDate)} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Zuordnung &amp; Governance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Info label="Risikokategorie" value={risk.category.name} />
                  <Info label="Risk Owner" value={risk.riskOwner?.name ?? "⚠ nicht benannt"} />
                  <Info label="Gesellschaft/Bereich" value={risk.ou?.name ?? "–"} />
                  <Info label="Standort" value={risk.location?.name ?? "–"} />
                  <Info label="Erstellt von" value={risk.createdBy.name} />
                  <Info label="Erstellt am" value={formatDate(risk.createdAt)} />
                  <Info label="Letzte Änderung" value={formatDateTime(risk.updatedAt)} />
                  <Info label="Version" value={String(risk.version)} />
                </div>
                <TagList label="Betroffene Assets" items={risk.assets.map((a) => a.name)} />
                <TagList label="Geschäftsprozesse" items={risk.processes.map((p) => p.name)} />
                <TagList label="ICT-Services" items={risk.ictServices.map((s) => s.name)} />
                <TagList
                  label="Kritische / wichtige Funktionen"
                  items={risk.criticalFunctions.map((f) => f.name)}
                />
                <TagList
                  label="Drittparteien"
                  items={risk.thirdParties.map((t) => `${t.tpId} ${t.name}`)}
                />
                <TagList
                  label="Regulatorische Zuordnung"
                  items={risk.regulatoryRequirements.map((r) => `${r.refId} (${r.framework})`)}
                />
              </CardContent>
            </Card>
          </div>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Workflow</CardTitle>
              <CardDescription>
                Jeder Statuswechsel wird mit Benutzer, Zeitstempel und Begründung protokolliert.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canWrite ? (
                <WorkflowPanel riskId={risk.id} currentStatus={risk.status} allowedTargets={allowedTargets} />
              ) : (
                <p className="text-sm text-muted-foreground">Keine Schreibberechtigung.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Bewertung ---------- */}
        <TabsContent value="assessment">
          <div className="space-y-4">
            {canAssess ? <AssessmentForm riskId={risk.id} /> : null}
            <Card>
              <CardHeader>
                <CardTitle>Bewertungshistorie</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <THead>
                    <TR>
                      <TH>Datum</TH>
                      <TH>Bewertet von</TH>
                      <TH>L</TH>
                      <TH>I</TH>
                      <TH>Wirksamkeit</TH>
                      <TH>Inherent</TH>
                      <TH>Residual</TH>
                      <TH>Begründung</TH>
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
                          Noch keine Bewertung vorhanden.
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
              <CardTitle>Zugeordnete Maßnahmen</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>Action ID</TH>
                    <TH>Titel</TH>
                    <TH>Owner</TH>
                    <TH>Priorität</TH>
                    <TH>Fällig</TH>
                    <TH>Status</TH>
                    <TH>Fortschritt</TH>
                  </TR>
                </THead>
                <TBody>
                  {risk.actions.map((a) => (
                    <TR key={a.id}>
                      <TD>
                        <Link href={`/actions/${a.id}`} className="font-mono text-xs text-primary hover:underline">
                          {a.actionId}
                        </Link>
                      </TD>
                      <TD className="max-w-[320px] truncate">{a.title}</TD>
                      <TD className="text-xs">{a.owner?.name ?? "–"}</TD>
                      <TD className="text-xs">{a.priority}</TD>
                      <TD className={`whitespace-nowrap text-xs ${isOverdue(a.dueDate) && !["COMPLETED", "CLOSED"].includes(a.status) ? "font-medium text-risk-high" : ""}`}>
                        {formatDate(a.dueDate)}
                        {isOverdue(a.dueDate) && !["COMPLETED", "CLOSED"].includes(a.status) ? " (überfällig)" : ""}
                      </TD>
                      <TD className="text-xs">{a.status}</TD>
                      <TD className="text-xs">{a.progress} %</TD>
                    </TR>
                  ))}
                  {risk.actions.length === 0 ? (
                    <TR>
                      <TD colSpan={7} className="text-center text-muted-foreground">
                        Keine Maßnahmen zugeordnet.
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
              <CardTitle>Verknüpfte Kontrollen</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>Control ID</TH>
                    <TH>Name</TH>
                    <TH>Typ</TH>
                    <TH>Control Owner</TH>
                    <TH>Design</TH>
                    <TH>Operativ</TH>
                  </TR>
                </THead>
                <TBody>
                  {risk.controls.map(({ control }) => (
                    <TR key={control.id}>
                      <TD>
                        <Link href={`/controls/${control.id}`} className="font-mono text-xs text-primary hover:underline">
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
                        Keine Kontrollen verknüpft.
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
                  <CardTitle>Quality Review</CardTitle>
                  <CardDescription>
                    Unabhängige Prüfung anhand der 13 Kriterien (RB-03). Ersteller dürfen nicht selbst reviewen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StartReviewButton riskId={risk.id} />
                </CardContent>
              </Card>
            ) : null}
            {openReview && canReview ? (
              <Card>
                <CardHeader>
                  <CardTitle>Laufendes Review abschließen</CardTitle>
                  <CardDescription>Reviewer: {openReview.reviewerName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <CompleteReviewForm
                    reviewId={openReview.id}
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
                <CardTitle>Review-Historie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {risk.qualityReviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Noch keine Quality Reviews.</p>
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
                        {r.qualityScore != null ? <span>Qualitätsscore: {r.qualityScore} %</span> : null}
                        <span className="text-xs text-muted-foreground">
                          {r.reviewerName} · gestartet {formatDate(r.startedAt)}
                          {r.completedAt ? ` · abgeschlossen ${formatDate(r.completedAt)}` : ""}
                        </span>
                      </div>
                      {r.comments ? <p className="mt-1">{r.comments}</p> : null}
                      {r.rejectionReason ? (
                        <p className="mt-1 text-destructive">Begründung: {r.rejectionReason}</p>
                      ) : null}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          Checkliste ({r.checklistItems.filter((i) => i.fulfilled === true).length}/
                          {r.checklistItems.length} erfüllt)
                        </summary>
                        <ul className="mt-1 space-y-0.5 text-xs">
                          {r.checklistItems.map((i) => (
                            <li key={i.id}>
                              {i.fulfilled === true ? "✔" : i.fulfilled === false ? "✘" : "○"} {i.criterion}
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
                  <CardTitle>Risikoakzeptanz beantragen</CardTitle>
                  <CardDescription>
                    Akzeptanzen sind stets befristet und erfordern Managementfreigabe (RB-06).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AcceptanceRequestForm riskId={risk.id} />
                </CardContent>
              </Card>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle>Akzeptanzanträge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {risk.acceptances.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Akzeptanzanträge vorhanden.</p>
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
                          {ACCEPTANCE_STATUS[acc.status as keyof typeof ACCEPTANCE_STATUS] ?? acc.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          beantragt von {acc.requestedBy.name} am {formatDate(acc.createdAt)}
                          {acc.approvedBy ? ` · entschieden von ${acc.approvedBy.name}` : ""}
                          {acc.validUntil ? ` · befristet bis ${formatDate(acc.validUntil)}` : ""}
                        </span>
                      </div>
                      <Info label="Begründung" value={acc.justification} />
                      <Info label="Kompensierende Kontrollen" value={acc.compensatingControls} />
                      {canDecideAcc && (acc.status === "REQUESTED" || acc.status === "IN_REVIEW") ? (
                        <AcceptanceDecisionForm acceptanceId={acc.id} />
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
                <CardTitle>Audit Trail (Auszug)</CardTitle>
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
                    <li className="text-muted-foreground">Keine Einträge.</li>
                  ) : null}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Kommentare</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CommentForm riskId={risk.id} />
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

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${warn ? "text-risk-high" : ""}`}>
        {value}
        {warn ? " (überfällig)" : ""}
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
