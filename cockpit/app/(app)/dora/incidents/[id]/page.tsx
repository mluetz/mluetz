import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { formatDateTime } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/server";
import { DORA_MESSAGES, formatRemaining } from "@/lib/i18n/messages/dora";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DeadlineMonitor,
  INCIDENT_TRANSITIONS,
  type IncidentStatus,
} from "@/features/dora/deadline-monitor";
import { ClassifyForm, ReportSubmitForm, StatusForm } from "@/features/dora/incident-panels";
import { ClassificationAssistant } from "@/features/dora/classification-assistant";
import { parseMeasurements, type CriterionResult } from "@/lib/domain/incident-classification";

export const dynamic = "force-dynamic";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("incident:read");
  const locale = await getLocale();
  const t = DORA_MESSAGES[locale];
  const { id } = await params;
  // Unternehmensart der Register führenden Einheit für die
  // entitätstypabhängigen Fristenuhren (Meldeschicht Welle 6, ADR-0010 Nr. 5)
  const maintainerSetting = await db.appSetting.findUnique({
    where: { key: "roi.maintainerEntityId" },
  });
  const maintainer = maintainerSetting
    ? await db.reportingEntity.findUnique({ where: { id: maintainerSetting.value } })
    : await db.reportingEntity.findFirst({ where: { parentId: null } });
  const entityCategory = maintainer?.entityType ?? null;
  const incident = await db.incident.findFirst({
    where: { OR: [{ id }, { incidentId: id }] },
    include: {
      criticalFunction: true,
      thirdParty: true,
      createdBy: true,
      reports: { orderBy: { dueAt: "asc" } },
      classification: true,
    },
  });
  if (!incident) notFound();

  const now = new Date();
  const status = incident.status as IncidentStatus;
  const allowedTargets = (INCIDENT_TRANSITIONS[status] ?? []) as string[];
  const openReports = incident.reports.filter((r) => !r.submittedAt);
  const overdueReports = openReports.filter((r) => r.dueAt.getTime() < now.getTime());
  const canWrite = hasPermission(user, "incident:write");

  const auditEntries = await db.auditLog.findMany({
    where: { entityType: "Incident", entityId: incident.id },
    orderBy: { timestamp: "desc" },
    take: 50,
    include: { user: true },
  });

  return (
    <div>
      <PageHeader
        title={`${incident.incidentId} – ${incident.title}`}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Incidents", href: "/dora/incidents" },
          { label: incident.incidentId },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {incident.isMajor ? (
              <Badge variant="critical">{t.incidentDetail.majorBadge}</Badge>
            ) : incident.classifiedAt ? (
              <Badge variant="outline">{t.incidentDetail.notMajorBadge}</Badge>
            ) : (
              <Badge variant="medium">{t.incidentDetail.classificationPending}</Badge>
            )}
            <Badge variant="secondary">{t.enums.incidentStatus[status] ?? incident.status}</Badge>
            {incident.nis2Relevant ? <Badge variant="outline">NIS-2/BSIG</Badge> : null}
            {incident.gdprRelevant ? (
              <Badge variant="outline">{t.incidentDetail.gdprBadge}</Badge>
            ) : null}
          </div>
        }
      />

      {/* KPI-Zeile */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={t.incidentDetail.kpiAwareness} value={formatDateTime(incident.awarenessAt)} />
        <Kpi
          label={t.incidentDetail.kpiClassification}
          value={
            incident.classifiedAt ? formatDateTime(incident.classifiedAt) : t.incidentDetail.pending
          }
          warn={!incident.classifiedAt && incident.status !== "CLOSED"}
        />
        <Kpi label={t.incidentDetail.kpiOpenReports} value={String(openReports.length)} />
        <Kpi
          label={t.incidentDetail.kpiOverdueReports}
          value={String(overdueReports.length)}
          warn={overdueReports.length > 0}
        />
      </div>

      {/* Meldefristen-Monitor prominent */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t.incidentDetail.monitorTitle}</CardTitle>
          <CardDescription>{t.incidentDetail.monitorDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <DeadlineMonitor
            incident={incident}
            reports={incident.reports}
            locale={locale}
            entityCategory={entityCategory}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.incidentDetail.descriptionTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info label={t.incidentDetail.incidentDescription} value={incident.description} />
            <Info
              label={t.incidentDetail.classificationNote}
              value={incident.classificationNote ?? "–"}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.common.linksTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info
                label={t.incidentDetail.cifLabel}
                value={incident.criticalFunction?.name ?? "–"}
              />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  {t.common.thirdParty}
                </p>
                {incident.thirdParty ? (
                  <Link
                    href={`/third-parties/${incident.thirdParty.id}`}
                    className="text-primary hover:underline"
                  >
                    {incident.thirdParty.tpId} {incident.thirdParty.name}
                  </Link>
                ) : (
                  <p>–</p>
                )}
              </div>
              <Info label={t.incidentDetail.createdBy} value={incident.createdBy.name} />
              <Info label={t.incidentDetail.createdAt} value={formatDateTime(incident.createdAt)} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                {t.incidentDetail.processRefs}
              </p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                <Link href="/runbooks" className="rounded-full border px-2.5 py-1 hover:bg-accent">
                  {t.incidentDetail.rb21}
                </Link>
                <Link href="/playbooks" className="rounded-full border px-2.5 py-1 hover:bg-accent">
                  {t.incidentDetail.pb06}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offene Meldungen dokumentieren */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t.incidentDetail.reportsTitle}</CardTitle>
          <CardDescription>{t.incidentDetail.reportsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {openReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.incidentDetail.noOpenReports}</p>
          ) : (
            openReports.map((r) => {
              const label = t.enums.reportLabels[r.reportType] ?? r.reportType;
              const overdue = r.dueAt.getTime() < now.getTime();
              return (
                <div key={r.id} className="rounded-md border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{label}</span>
                    <span
                      className={`text-xs ${overdue ? "font-medium text-risk-critical" : "text-muted-foreground"}`}
                    >
                      {t.incidentDetail.dueAt(formatDateTime(r.dueAt))}
                      {overdue ? ` · ${formatRemaining(locale, r.dueAt, now)}` : ""}
                    </span>
                  </div>
                  {canWrite ? (
                    <ReportSubmitForm reportId={r.id} label={label} locale={locale} />
                  ) : (
                    <p className="text-xs text-muted-foreground">{t.common.noWritePermission}</p>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Strukturierter Klassifizierungsassistent (Review v3, P1-04) */}
      <div className="mt-4">
        <ClassificationAssistant
          incidentId={incident.id}
          existing={
            incident.classification
              ? (JSON.parse(incident.classification.criteria) as CriterionResult[])
              : null
          }
          initialMeasurements={parseMeasurements(incident.classification?.measurements ?? null)}
          frozenAt={incident.classification?.frozenAt?.toISOString().slice(0, 16) ?? null}
          aggregatedWith={incident.classification?.aggregatedWith ?? null}
          voluntaryThreatNotice={incident.classification?.voluntaryThreatNotice ?? false}
          canWrite={canWrite}
          locale={locale}
        />
      </div>

      {/* Nachträgliche Klassifizierung (Alt-Formular, nur solange keine
          strukturierte Klassifizierung existiert) */}
      {!incident.classifiedAt && !incident.classification && canWrite ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>{t.incidentDetail.classifyTitle}</CardTitle>
            <CardDescription>{t.incidentDetail.classifyDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <ClassifyForm incidentId={incident.id} locale={locale} />
          </CardContent>
        </Card>
      ) : null}

      {/* Workflow */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t.incidentDetail.workflowTitle}</CardTitle>
          <CardDescription>{t.incidentDetail.workflowDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {canWrite ? (
            <StatusForm
              incidentId={incident.id}
              currentStatus={incident.status}
              allowedTargets={allowedTargets}
              locale={locale}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t.common.noWritePermission}</p>
          )}
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t.common.auditTrail}</CardTitle>
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
              <li className="text-muted-foreground">{t.common.noEntries}</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${warn ? "text-risk-critical" : ""}`}>{value}</p>
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
