import { notFound } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/server";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";
import { ComplianceDisclaimer } from "@/features/governance/disclaimer";
import { MappingForm } from "@/features/governance/panels";
import { complianceStatusLabel, complianceStatusVariant } from "@/features/governance/status";

export const metadata = { title: "Regulatorische Anforderung" };
export const dynamic = "force-dynamic";

export default async function RequirementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("compliance:read");
  const locale = await getLocale();
  const m = OPS_MESSAGES[locale];
  const t = m.governance.detail;
  const { id } = await params;

  const requirement = await db.regulatoryRequirement.findUnique({
    where: { id },
    include: {
      mappings: {
        include: { owner: true, reviewer: true, evidence: true },
        orderBy: { assessedAt: "desc" },
      },
    },
  });
  if (!requirement) notFound();

  const mapping = requirement.mappings[0] ?? null;
  const canWrite = hasPermission(user, "compliance:write");
  const evidenceOptions = canWrite
    ? await db.evidence.findMany({
        select: { id: true, evidenceId: true, title: true },
        orderBy: { evidenceId: "asc" },
      })
    : [];
  const history = await db.auditLog.findMany({
    where: { action: "COMPLIANCE_CHANGE", entityId: requirement.id },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  const frameworkLabel = m.labels.frameworks[requirement.framework] ?? requirement.framework;

  return (
    <div>
      <PageHeader
        title={`${requirement.refId} – ${requirement.title}`}
        description={t.description(frameworkLabel, requirement.reference)}
        crumbs={[
          { label: m.common.overview, href: "/overview" },
          { label: m.governance.list.crumb, href: "/governance" },
          { label: requirement.refId },
        ]}
      />

      <ComplianceDisclaimer locale={locale} />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t.requirementCard}</CardTitle>
            <CardDescription>
              {frameworkLabel} · {requirement.reference}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{requirement.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.currentCard}</CardTitle>
            <CardDescription>{t.currentCardDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {mapping ? (
              <dl className="grid gap-x-6 gap-y-2 md:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">{t.status}</dt>
                  <dd>
                    <Badge variant={complianceStatusVariant(mapping.status)}>
                      {complianceStatusLabel(mapping.status)}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.assessedAt}</dt>
                  <dd>{formatDateTime(mapping.assessedAt)}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-xs text-muted-foreground">{t.justification}</dt>
                  <dd>{mapping.justification}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.owner}</dt>
                  <dd>{mapping.owner?.name ?? "–"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.reviewer}</dt>
                  <dd>{mapping.reviewer?.name ?? "–"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.evidence}</dt>
                  <dd>
                    {mapping.evidence ? (
                      <a
                        href={mapping.evidence.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {mapping.evidence.evidenceId} – {mapping.evidence.title}
                      </a>
                    ) : (
                      "–"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.nextReview}</dt>
                  <dd>{formatDate(mapping.nextReviewDate)}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground">{t.noAssessment}</p>
            )}
          </CardContent>
        </Card>

        {canWrite ? (
          <Card>
            <CardHeader>
              <CardTitle>{t.assessmentCard(mapping != null)}</CardTitle>
              <CardDescription>{t.assessmentCardDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <MappingForm
                requirementId={requirement.id}
                mappingId={mapping?.id}
                currentStatus={mapping?.status}
                currentJustification={mapping?.justification}
                currentEvidenceId={mapping?.evidenceId}
                currentNextReviewDate={
                  mapping?.nextReviewDate ? mapping.nextReviewDate.toISOString().slice(0, 10) : null
                }
                evidenceOptions={evidenceOptions}
                locale={locale}
              />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>{t.historyCard}</CardTitle>
            <CardDescription>{t.historyCardDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noHistory}</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>{t.timestamp}</TH>
                    <TH>{t.user}</TH>
                    <TH>{t.oldValue}</TH>
                    <TH>{t.newValue}</TH>
                    <TH>{t.comment}</TH>
                  </TR>
                </THead>
                <TBody>
                  {history.map((h) => (
                    <TR key={h.id}>
                      <TD className="whitespace-nowrap">{formatDateTime(h.timestamp)}</TD>
                      <TD className="whitespace-nowrap">{h.userEmail}</TD>
                      <TD>
                        {h.oldValue ? (
                          <Badge variant={complianceStatusVariant(h.oldValue)}>
                            {complianceStatusLabel(h.oldValue)}
                          </Badge>
                        ) : (
                          "–"
                        )}
                      </TD>
                      <TD>
                        {h.newValue ? (
                          <Badge variant={complianceStatusVariant(h.newValue)}>
                            {complianceStatusLabel(h.newValue)}
                          </Badge>
                        ) : (
                          "–"
                        )}
                      </TD>
                      <TD className="max-w-96 truncate" title={h.comment ?? undefined}>
                        {h.comment ?? "–"}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
