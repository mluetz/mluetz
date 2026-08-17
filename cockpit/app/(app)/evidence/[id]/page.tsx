import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { formatDate, formatDateTime, isOverdue } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  EVIDENCE_CLASSIFICATION_LABELS,
  EVIDENCE_DOC_TYPE_LABELS,
  EVIDENCE_REVIEW_STATUS_LABELS,
} from "@/features/evidence/labels";
import { ReviewEvidenceForm } from "@/features/evidence/panels";

export const dynamic = "force-dynamic";

export default async function EvidenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("evidence:read");
  const { id } = await params;
  const evidence = await db.evidence.findUnique({
    where: { id },
    include: {
      owner: true,
      reviewer: true,
      risk: { select: { id: true, riskId: true, title: true } },
      control: { select: { id: true, controlId: true, name: true } },
      thirdParty: { select: { id: true, tpId: true, name: true } },
    },
  });
  if (!evidence) notFound();

  const expired = isOverdue(evidence.validUntil);
  const canWrite = hasPermission(user, "evidence:write");

  return (
    <div>
      <PageHeader
        title={`${evidence.evidenceId} – ${evidence.title}`}
        description="Metadaten- und Linkregister – es werden keine Dokumente gespeichert."
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Nachweise", href: "/evidence" },
          { label: evidence.evidenceId },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                evidence.reviewStatus === "REVIEWED"
                  ? "low"
                  : evidence.reviewStatus === "NOT_REVIEWED"
                    ? "secondary"
                    : evidence.reviewStatus === "EXPIRED"
                      ? "high"
                      : "critical"
              }
            >
              {EVIDENCE_REVIEW_STATUS_LABELS[evidence.reviewStatus] ?? evidence.reviewStatus}
            </Badge>
            {expired ? <Badge variant="high">Gültigkeit abgelaufen</Badge> : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Metadaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info
                label="Dokumentart"
                value={EVIDENCE_DOC_TYPE_LABELS[evidence.docType] ?? evidence.docType}
              />
              <Info
                label="Klassifikation"
                value={
                  EVIDENCE_CLASSIFICATION_LABELS[evidence.classification] ?? evidence.classification
                }
              />
              <Info label="Owner" value={evidence.owner?.name ?? "–"} />
              <Info label="Version" value={evidence.version} />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Gültig bis</p>
                <p className={expired ? "font-medium text-risk-high" : ""}>
                  {formatDate(evidence.validUntil)}
                  {expired ? " (abgelaufen)" : ""}
                </p>
              </div>
              <Info label="Erstellt am" value={formatDateTime(evidence.createdAt)} />
              <Info
                label="Reviewstatus"
                value={
                  EVIDENCE_REVIEW_STATUS_LABELS[evidence.reviewStatus] ?? evidence.reviewStatus
                }
              />
              <Info label="Reviewer" value={evidence.reviewer?.name ?? "–"} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Link (Speicherort)</p>
              <a
                href={evidence.link}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-primary hover:underline"
              >
                {evidence.link}
              </a>
            </div>
            <Info label="Content-Hash" value={evidence.contentHash || "–"} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verknüpfungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Risiko</p>
                {evidence.risk ? (
                  <Link
                    href={`/risks/${evidence.risk.id}`}
                    className="text-primary hover:underline"
                  >
                    <span className="font-mono text-xs">{evidence.risk.riskId}</span> –{" "}
                    {evidence.risk.title}
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground">–</p>
                )}
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Kontrolle</p>
                {evidence.control ? (
                  <Link
                    href={`/controls/${evidence.control.id}`}
                    className="text-primary hover:underline"
                  >
                    <span className="font-mono text-xs">{evidence.control.controlId}</span> –{" "}
                    {evidence.control.name}
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground">–</p>
                )}
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Drittpartei</p>
                {evidence.thirdParty ? (
                  <Link
                    href={`/third-parties/${evidence.thirdParty.id}`}
                    className="text-primary hover:underline"
                  >
                    <span className="font-mono text-xs">{evidence.thirdParty.tpId}</span> –{" "}
                    {evidence.thirdParty.name}
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground">–</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review</CardTitle>
              <CardDescription>
                Das Review-Ergebnis wird mit Reviewer und Zeitstempel im Audit Trail protokolliert.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canWrite ? (
                <ReviewEvidenceForm evidenceDbId={evidence.id} />
              ) : (
                <p className="text-sm text-muted-foreground">Keine Schreibberechtigung.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
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
