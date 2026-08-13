import { notFound } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { FRAMEWORKS } from "@/lib/domain/enums";
import { formatDate, formatDateTime } from "@/lib/utils";
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

  return (
    <div>
      <PageHeader
        title={`${requirement.refId} – ${requirement.title}`}
        description={`${FRAMEWORKS[requirement.framework as keyof typeof FRAMEWORKS] ?? requirement.framework} · Referenz: ${requirement.reference}`}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Governance", href: "/governance" },
          { label: requirement.refId },
        ]}
      />

      <ComplianceDisclaimer />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Anforderung</CardTitle>
            <CardDescription>
              {FRAMEWORKS[requirement.framework as keyof typeof FRAMEWORKS] ?? requirement.framework}{" "}
              · {requirement.reference}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{requirement.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktueller Umsetzungsstand</CardTitle>
            <CardDescription>
              Dokumentierte Selbsteinschätzung – kein automatisches Compliance-Urteil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {mapping ? (
              <dl className="grid gap-x-6 gap-y-2 md:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd>
                    <Badge variant={complianceStatusVariant(mapping.status)}>
                      {complianceStatusLabel(mapping.status)}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Bewertet am</dt>
                  <dd>{formatDateTime(mapping.assessedAt)}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-xs text-muted-foreground">Begründung</dt>
                  <dd>{mapping.justification}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Owner</dt>
                  <dd>{mapping.owner?.name ?? "–"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Reviewer</dt>
                  <dd>{mapping.reviewer?.name ?? "–"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Nachweis</dt>
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
                  <dt className="text-xs text-muted-foreground">Nächstes Review</dt>
                  <dd>{formatDate(mapping.nextReviewDate)}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground">
                Für diese Anforderung liegt noch keine Bewertung vor (Status: Not Assessed).
              </p>
            )}
          </CardContent>
        </Card>

        {canWrite ? (
          <Card>
            <CardHeader>
              <CardTitle>Bewertung {mapping ? "aktualisieren" : "erfassen"}</CardTitle>
              <CardDescription>
                Statusänderungen werden mit altem und neuem Wert im Audit Trail protokolliert.
              </CardDescription>
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
              />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Historie (Audit Trail)</CardTitle>
            <CardDescription>
              Alle Statusänderungen dieser Anforderung (append-only, nicht editierbar).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Änderungen protokolliert.</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Zeitpunkt</TH>
                    <TH>Benutzer</TH>
                    <TH>Alt</TH>
                    <TH>Neu</TH>
                    <TH>Kommentar</TH>
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
