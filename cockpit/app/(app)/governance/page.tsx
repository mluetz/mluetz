import Link from "next/link";
import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { FRAMEWORKS } from "@/lib/domain/enums";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/server";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";
import { ComplianceDisclaimer } from "@/features/governance/disclaimer";
import { complianceStatusLabel, complianceStatusVariant } from "@/features/governance/status";

export const metadata = { title: "Governance & Compliance" };
export const dynamic = "force-dynamic";

export default async function GovernancePage({
  searchParams,
}: {
  searchParams: Promise<{ framework?: string }>;
}) {
  await requirePermission("compliance:read");
  const locale = await getLocale();
  const m = OPS_MESSAGES[locale];
  const t = m.governance.list;
  const sp = await searchParams;
  const framework = sp.framework && sp.framework in FRAMEWORKS ? sp.framework : undefined;

  const requirements = await db.regulatoryRequirement.findMany({
    where: framework ? { framework } : undefined,
    include: {
      mappings: {
        include: { owner: true, reviewer: true, evidence: true },
        orderBy: { assessedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { refId: "asc" },
  });
  const duties = await db.governanceReportDuty.findMany({ orderBy: { nextDueAt: "asc" } });

  return (
    <div>
      <PageHeader
        title={t.title}
        description={t.description}
        crumbs={[{ label: m.common.overview, href: "/overview" }, { label: t.crumb }]}
      />

      <ComplianceDisclaimer locale={locale} />

      <form
        method="GET"
        className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3"
      >
        <div className="min-w-56">
          <Label htmlFor="f-framework">{t.frameworkLabel}</Label>
          <Select id="f-framework" name="framework" defaultValue={framework ?? ""}>
            <option value="">{m.common.all}</option>
            {Object.entries(m.labels.frameworks).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          {m.common.filter}
        </Button>
        <Link href="/governance">
          <Button type="button" variant="ghost">
            {m.common.reset}
          </Button>
        </Link>
        <span className="text-xs text-muted-foreground">{t.count(requirements.length)}</span>
      </form>

      <Table>
        <THead>
          <TR>
            <TH>{t.refId}</TH>
            <TH>{t.framework}</TH>
            <TH>{t.requirement}</TH>
            <TH>{t.status}</TH>
            <TH>{t.justification}</TH>
            <TH>{t.owner}</TH>
            <TH>{t.reviewer}</TH>
            <TH>{t.evidence}</TH>
            <TH>{t.nextReview}</TH>
          </TR>
        </THead>
        <TBody>
          {requirements.length === 0 ? (
            <TR>
              <TD colSpan={9} className="h-20 text-center text-muted-foreground">
                {t.empty}
              </TD>
            </TR>
          ) : (
            requirements.map((req) => {
              const mapping = req.mappings[0] ?? null;
              return (
                <TR key={req.id}>
                  <TD className="whitespace-nowrap font-medium">
                    <Link href={`/governance/${req.id}`} className="hover:underline">
                      {req.refId}
                    </Link>
                  </TD>
                  <TD className="whitespace-nowrap">
                    {m.labels.frameworks[req.framework] ?? req.framework}
                  </TD>
                  <TD>
                    <Link href={`/governance/${req.id}`} className="hover:underline">
                      {req.title}
                    </Link>
                  </TD>
                  <TD>
                    <Badge variant={complianceStatusVariant(mapping?.status ?? "NOT_ASSESSED")}>
                      {complianceStatusLabel(mapping?.status ?? "NOT_ASSESSED")}
                    </Badge>
                  </TD>
                  <TD className="max-w-72 truncate" title={mapping?.justification ?? undefined}>
                    {mapping?.justification ?? "–"}
                  </TD>
                  <TD className="whitespace-nowrap">{mapping?.owner?.name ?? "–"}</TD>
                  <TD className="whitespace-nowrap">{mapping?.reviewer?.name ?? "–"}</TD>
                  <TD className="whitespace-nowrap">
                    {mapping?.evidence ? (
                      <a
                        href={mapping.evidence.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {mapping.evidence.evidenceId}
                      </a>
                    ) : (
                      "–"
                    )}
                  </TD>
                  <TD className="whitespace-nowrap">{formatDate(mapping?.nextReviewDate)}</TD>
                </TR>
              );
            })
          )}
        </TBody>
      </Table>

      {/* Berichtspflichten-Kalender ggü. Leitungsorgan (Review v3, P2-10) */}
      <h2 className="mb-2 mt-8 text-sm font-semibold">
        {locale === "de"
          ? "Berichtspflichten gegenüber dem Leitungsorgan (Art. 5 Abs. 2, Art. 13 Abs. 5)"
          : "Reporting duties towards the management body (Art. 5(2), Art. 13(5))"}
      </h2>
      <Table>
        <THead>
          <TR>
            <TH>{locale === "de" ? "Pflicht" : "Duty"}</TH>
            <TH>{locale === "de" ? "Rechtsgrundlage" : "Legal basis"}</TH>
            <TH>{locale === "de" ? "Turnus" : "Frequency"}</TH>
            <TH>{locale === "de" ? "Adressat" : "Addressee"}</TH>
            <TH>{locale === "de" ? "Fällig" : "Due"}</TH>
            <TH>{locale === "de" ? "Zuletzt vorgelegt" : "Last presented"}</TH>
            <TH>{locale === "de" ? "Vorlage-Nachweis" : "Evidence"}</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <TBody>
          {duties.map((d) => {
            const overdue = d.nextDueAt != null && d.nextDueAt.getTime() < Date.now();
            return (
              <TR key={d.id}>
                <TD className="max-w-[260px] font-medium">{d.title}</TD>
                <TD className="whitespace-nowrap text-xs">{d.legalBasis}</TD>
                <TD className="whitespace-nowrap text-xs">{d.frequency}</TD>
                <TD className="whitespace-nowrap text-xs">{d.addressee}</TD>
                <TD className="whitespace-nowrap text-xs tabular-nums">
                  {formatDate(d.nextDueAt)}
                </TD>
                <TD className="whitespace-nowrap text-xs tabular-nums">
                  {formatDate(d.lastPresentedAt)}
                </TD>
                <TD className="max-w-[200px] truncate text-xs" title={d.presentationEvidence ?? undefined}>
                  {d.presentationEvidence ?? "–"}
                </TD>
                <TD>
                  <Badge variant={overdue ? "critical" : d.status === "PRESENTED" ? "low" : "medium"}>
                    {overdue ? (locale === "de" ? "überfällig" : "overdue") : d.status}
                  </Badge>
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
