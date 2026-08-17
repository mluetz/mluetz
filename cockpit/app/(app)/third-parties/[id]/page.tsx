import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { formatDate, isOverdue } from "@/lib/utils";
import { TP_STATUS, TP_TRANSITIONS, type TpStatus } from "@/lib/domain/enums";
import { PageHeader } from "@/components/page-header";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  DUE_DILIGENCE_LABELS,
  EXIT_STATUS_LABELS,
  EXIT_TEST_RESULT_LABELS,
  SUBSTITUTABILITY_LABELS,
  TP_CRITICALITY_LABELS,
} from "@/features/third-parties/labels";
import {
  ExitStrategyForm,
  TpAssessmentForm,
  TpWorkflowPanel,
} from "@/features/third-parties/panels";
import {
  EVIDENCE_REVIEW_STATUS_LABELS,
  EVIDENCE_DOC_TYPE_LABELS,
} from "@/features/evidence/labels";

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
  const { id } = await params;
  const tp = await db.thirdParty.findUnique({
    where: { id },
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

  const status = tp.status as TpStatus;
  const allowedTargets = (TP_TRANSITIONS[status] ?? []) as string[];
  const reviewOverdue = status !== "EXIT" && isOverdue(tp.nextReviewDate);
  const contractWarnDate = new Date(Date.now() + 180 * DAY_MS);
  const canWrite = hasPermission(user, "thirdparty:write");

  return (
    <div>
      <PageHeader
        title={`${tp.tpId} – ${tp.name}`}
        description={tp.providedService}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Third Parties", href: "/third-parties" },
          { label: tp.tpId },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{TP_STATUS[status] ?? tp.status}</Badge>
            <Badge variant={riskClassVariant(tp.criticality)}>
              {TP_CRITICALITY_LABELS[tp.criticality] ?? tp.criticality}
            </Badge>
            {tp.supportsCriticalFunction ? (
              <Badge variant="high">
                <AlertTriangle className="mr-1 h-3 w-3" aria-hidden /> unterstützt kritische
                Funktion
              </Badge>
            ) : null}
            {tp.concentrationRisk ? <Badge variant="high">Konzentrationsrisiko</Badge> : null}
          </div>
        }
      />

      {/* KPI-Zeile */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Kritikalität" value={TP_CRITICALITY_LABELS[tp.criticality] ?? tp.criticality} />
        <Kpi
          label="Inherent / Residual Score"
          value={`${tp.inherentRiskScore ?? "–"} / ${tp.residualRiskScore ?? "–"}`}
        />
        <Kpi
          label="Due Diligence"
          value={DUE_DILIGENCE_LABELS[tp.dueDiligenceStatus] ?? tp.dueDiligenceStatus}
        />
        <Kpi label="Nächstes Review" value={formatDate(tp.nextReviewDate)} warn={reviewOverdue} />
        <Kpi label="Status" value={TP_STATUS[status] ?? tp.status} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="contracts">Verträge ({tp.contracts.length})</TabsTrigger>
          <TabsTrigger value="subcontractors">
            Subdienstleister ({tp.subcontractors.length})
          </TabsTrigger>
          <TabsTrigger value="exit">Exit-Strategie</TabsTrigger>
          <TabsTrigger value="evidence">Nachweise ({tp.evidence.length})</TabsTrigger>
        </TabsList>

        {/* ---------- Übersicht ---------- */}
        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Stammdaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Info label="Erbrachte Leistung" value={tp.providedService} />
                <div className="grid grid-cols-2 gap-3">
                  <Info
                    label="Business Owner"
                    value={tp.businessOwner?.name ?? "⚠ nicht benannt"}
                  />
                  <Info
                    label="Contract Owner"
                    value={tp.contractOwner?.name ?? "⚠ nicht benannt"}
                  />
                  <Info label="Sitz (Land)" value={tp.registeredCountry} />
                  <Info label="ICT-Service-Kategorie" value={tp.ictServiceCategory} />
                  <Info label="Leistungsstandorte" value={tp.serviceLocations} />
                  <Info label="Datenstandorte" value={tp.dataLocations} />
                </div>
                <Info label="Art der verarbeiteten Informationen" value={tp.informationTypes} />
                <div className="grid grid-cols-2 gap-3">
                  <Info
                    label="Substituierbarkeit"
                    value={SUBSTITUTABILITY_LABELS[tp.substitutability] ?? tp.substitutability}
                  />
                  <Info label="Audit-/Zugangsrechte" value={tp.auditRights ? "Ja" : "Nein"} />
                  <Info
                    label="Incident-Meldepflicht"
                    value={tp.incidentReporting ? "Ja" : "Nein"}
                  />
                  <Info label="Assessment-Datum" value={formatDate(tp.assessmentDate)} />
                </div>
                <Info label="Offene Findings" value={tp.openFindings || "–"} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Verknüpfungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <TagList
                  label="Kritische / wichtige Funktionen"
                  items={tp.criticalFunctions.map((f) => f.name)}
                />
                <TagList
                  label="Bereitgestellte ICT-Services"
                  items={tp.providedIctServices.map((s) => `${s.name} (${s.category})`)}
                />
                <TagList
                  label="Leistungen (Services)"
                  items={tp.services.map((s) =>
                    s.ictService ? `${s.name} → ${s.ictService.name}` : s.name,
                  )}
                />
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Verknüpfte Risiken
                  </p>
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
                    <p className="text-xs text-muted-foreground">Keine Risiken verknüpft.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>TPRM-Workflow</CardTitle>
              <CardDescription>
                Jeder Statuswechsel wird mit Benutzer, Zeitstempel und Begründung protokolliert.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canWrite ? (
                <TpWorkflowPanel
                  thirdPartyId={tp.id}
                  currentStatus={tp.status}
                  allowedTargets={allowedTargets}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Keine Schreibberechtigung.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Assessment ---------- */}
        <TabsContent value="assessment">
          {canWrite ? (
            <TpAssessmentForm
              thirdPartyId={tp.id}
              defaults={{
                criticality: tp.criticality,
                inherentRiskScore: tp.inherentRiskScore,
                residualRiskScore: tp.residualRiskScore,
                dueDiligenceStatus: tp.dueDiligenceStatus,
                substitutability: tp.substitutability,
                concentrationRisk: tp.concentrationRisk,
                supportsCriticalFunction: tp.supportsCriticalFunction,
                nextReviewDate: toDateInput(tp.nextReviewDate),
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Keine Schreibberechtigung für Assessments.
            </p>
          )}
        </TabsContent>

        {/* ---------- Verträge ---------- */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Verträge</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>Titel</TH>
                    <TH>Start</TH>
                    <TH>Ende</TH>
                    <TH>Kündigungsfrist (Tage)</TH>
                    <TH>Audit-/Zugangsrechte</TH>
                    <TH>Incident-Meldepflicht</TH>
                    <TH>Notizen</TH>
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
                              <Badge variant="high">endet &lt; 180 Tage</Badge>
                            </span>
                          ) : null}
                        </TD>
                        <TD className="text-xs">{c.noticePeriodDays ?? "–"}</TD>
                        <TD className="text-xs">
                          {c.auditRights ? "Audit: Ja" : "Audit: Nein"} ·{" "}
                          {c.accessRights ? "Zugang: Ja" : "Zugang: Nein"}
                        </TD>
                        <TD className="text-xs">{c.incidentReporting ? "Ja" : "Nein"}</TD>
                        <TD className="max-w-[240px] text-xs">{c.notes || "–"}</TD>
                      </TR>
                    );
                  })}
                  {tp.contracts.length === 0 ? (
                    <TR>
                      <TD colSpan={7} className="text-center text-muted-foreground">
                        Keine Verträge hinterlegt.
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
              <CardTitle>Subdienstleister (4th Parties)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>Name</TH>
                    <TH>Land</TH>
                    <TH>Leistung</TH>
                    <TH>Kritisch</TH>
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
                          <span className="text-xs font-medium text-risk-high">Ja</span>
                        ) : (
                          <span className="text-xs">Nein</span>
                        )}
                      </TD>
                    </TR>
                  ))}
                  {tp.subcontractors.length === 0 ? (
                    <TR>
                      <TD colSpan={4} className="text-center text-muted-foreground">
                        Keine Subdienstleister hinterlegt.
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
                <CardTitle>Aktuelle Exit-Strategie</CardTitle>
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
                        {EXIT_STATUS_LABELS[tp.exitStrategy.status] ?? tp.exitStrategy.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Exit-Plan:{" "}
                        {tp.exitStrategy.exitPlanExists ? "vorhanden" : "nicht vorhanden"} · letzter
                        Test: {formatDate(tp.exitStrategy.lastTestDate)}
                        {tp.exitStrategy.testResult
                          ? ` (${EXIT_TEST_RESULT_LABELS[tp.exitStrategy.testResult] ?? tp.exitStrategy.testResult})`
                          : ""}
                      </span>
                    </div>
                    <Info label="Zusammenfassung" value={tp.exitStrategy.strategySummary} />
                    <Info
                      label="Substitutionsoptionen"
                      value={tp.exitStrategy.substituteOptions || "–"}
                    />
                  </>
                ) : (
                  <p className="flex items-center gap-2 rounded-md border border-risk-high/40 bg-risk-high/10 p-3 text-sm font-medium text-risk-high">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                    Keine Exit-Strategie dokumentiert – PB-07 aktivieren.
                  </p>
                )}
              </CardContent>
            </Card>
            {canWrite ? (
              <Card>
                <CardHeader>
                  <CardTitle>Exit-Strategie dokumentieren / aktualisieren</CardTitle>
                  <CardDescription>
                    Pflicht für kritische Drittparteien; Exit-Pläne sind regelmäßig zu testen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExitStrategyForm
                    thirdPartyId={tp.id}
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
              <CardTitle>Verknüpfte Nachweise</CardTitle>
              <CardDescription>
                Metadaten- und Linkregister – es werden keine Dokumente gespeichert.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>Evidence ID</TH>
                    <TH>Titel</TH>
                    <TH>Dokumentart</TH>
                    <TH>Owner</TH>
                    <TH>Gültig bis</TH>
                    <TH>Reviewstatus</TH>
                    <TH>Link</TH>
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
                          {EVIDENCE_DOC_TYPE_LABELS[e.docType] ?? e.docType}
                        </TD>
                        <TD className="text-xs">{e.owner?.name ?? "–"}</TD>
                        <TD
                          className={`whitespace-nowrap text-xs ${expired ? "font-medium text-risk-high" : ""}`}
                        >
                          {formatDate(e.validUntil)}
                          {expired ? " (abgelaufen)" : ""}
                        </TD>
                        <TD className="text-xs">
                          {EVIDENCE_REVIEW_STATUS_LABELS[e.reviewStatus] ?? e.reviewStatus}
                        </TD>
                        <TD className="text-xs">
                          <a
                            href={e.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Öffnen
                          </a>
                        </TD>
                      </TR>
                    );
                  })}
                  {tp.evidence.length === 0 ? (
                    <TR>
                      <TD colSpan={7} className="text-center text-muted-foreground">
                        Keine Nachweise verknüpft.
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
