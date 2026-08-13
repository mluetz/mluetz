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

  return (
    <div>
      <PageHeader
        title="Governance & Compliance"
        description="Regulatorische Anforderungen und deren dokumentierter Umsetzungsstand"
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Governance" }]}
      />

      <ComplianceDisclaimer />

      <form method="GET" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
        <div className="min-w-56">
          <Label htmlFor="f-framework">Framework</Label>
          <Select id="f-framework" name="framework" defaultValue={framework ?? ""}>
            <option value="">Alle</option>
            {Object.entries(FRAMEWORKS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filtern
        </Button>
        <Link href="/governance">
          <Button type="button" variant="ghost">
            Zurücksetzen
          </Button>
        </Link>
        <span className="text-xs text-muted-foreground">
          {requirements.length} Anforderung{requirements.length === 1 ? "" : "en"}
        </span>
      </form>

      <Table>
        <THead>
          <TR>
            <TH>Ref-ID</TH>
            <TH>Framework</TH>
            <TH>Anforderung</TH>
            <TH>Status</TH>
            <TH>Begründung</TH>
            <TH>Owner</TH>
            <TH>Reviewer</TH>
            <TH>Nachweis</TH>
            <TH>Nächstes Review</TH>
          </TR>
        </THead>
        <TBody>
          {requirements.length === 0 ? (
            <TR>
              <TD colSpan={9} className="h-20 text-center text-muted-foreground">
                Keine Anforderungen gefunden.
              </TD>
            </TR>
          ) : (
            requirements.map((req) => {
              const m = req.mappings[0] ?? null;
              return (
                <TR key={req.id}>
                  <TD className="whitespace-nowrap font-medium">
                    <Link href={`/governance/${req.id}`} className="hover:underline">
                      {req.refId}
                    </Link>
                  </TD>
                  <TD className="whitespace-nowrap">
                    {FRAMEWORKS[req.framework as keyof typeof FRAMEWORKS] ?? req.framework}
                  </TD>
                  <TD>
                    <Link href={`/governance/${req.id}`} className="hover:underline">
                      {req.title}
                    </Link>
                  </TD>
                  <TD>
                    <Badge variant={complianceStatusVariant(m?.status ?? "NOT_ASSESSED")}>
                      {complianceStatusLabel(m?.status ?? "NOT_ASSESSED")}
                    </Badge>
                  </TD>
                  <TD className="max-w-72 truncate" title={m?.justification ?? undefined}>
                    {m?.justification ?? "–"}
                  </TD>
                  <TD className="whitespace-nowrap">{m?.owner?.name ?? "–"}</TD>
                  <TD className="whitespace-nowrap">{m?.reviewer?.name ?? "–"}</TD>
                  <TD className="whitespace-nowrap">
                    {m?.evidence ? (
                      <a
                        href={m.evidence.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {m.evidence.evidenceId}
                      </a>
                    ) : (
                      "–"
                    )}
                  </TD>
                  <TD className="whitespace-nowrap">{formatDate(m?.nextReviewDate)}</TD>
                </TR>
              );
            })
          )}
        </TBody>
      </Table>
    </div>
  );
}
