import Link from "next/link";
import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatDate, isOverdue } from "@/lib/utils";
import { RISK_STATUS, type RiskStatus } from "@/lib/domain/enums";
import { getLocale } from "@/lib/i18n/server";
import { CORE_MESSAGES } from "@/lib/i18n/messages/core";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata = { title: "Assessments" };
export const dynamic = "force-dynamic";

const HORIZON_DAYS = 30;

export default async function AssessmentsPage() {
  await requirePermission("risk:read");
  const locale = await getLocale();
  const t = CORE_MESSAGES[locale].assessments;
  const tEnums = CORE_MESSAGES[locale].enums;
  const horizon = new Date(Date.now() + HORIZON_DAYS * 86400000);

  const [risks, controls, thirdParties] = await Promise.all([
    db.risk.findMany({
      where: {
        nextReviewDate: { not: null, lt: horizon },
        status: { notIn: ["CLOSED", "REJECTED", "DRAFT"] },
      },
      include: { riskOwner: { select: { name: true } } },
      orderBy: { nextReviewDate: "asc" },
    }),
    db.control.findMany({
      where: { nextTestDate: { not: null, lt: horizon } },
      include: { owner: { select: { name: true } } },
      orderBy: { nextTestDate: "asc" },
    }),
    db.thirdParty.findMany({
      where: { nextReviewDate: { not: null, lt: horizon } },
      include: { businessOwner: { select: { name: true } } },
      orderBy: { nextReviewDate: "asc" },
    }),
  ]);

  const overdueLabel = t.overdue;

  return (
    <div>
      <PageHeader
        title={t.title}
        description={t.description(HORIZON_DAYS)}
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Assessments" }]}
      />

      <div className="space-y-4">
        {/* ---------- Risiko-Reviews ---------- */}
        <Card>
          <CardHeader>
            <CardTitle>{t.riskReviews.title(risks.length)}</CardTitle>
            <CardDescription>{t.riskReviews.description(HORIZON_DAYS)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>{t.riskReviews.riskId}</TH>
                  <TH>{t.riskReviews.colTitle}</TH>
                  <TH>{t.riskReviews.status}</TH>
                  <TH>{t.riskReviews.owner}</TH>
                  <TH>{t.riskReviews.nextReview}</TH>
                </TR>
              </THead>
              <TBody>
                {risks.map((r) => (
                  <TR key={r.id}>
                    <TD>
                      <Link
                        href={`/risks/${r.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {r.riskId}
                      </Link>
                    </TD>
                    <TD className="max-w-[360px] truncate">{r.title}</TD>
                    <TD className="text-xs">{RISK_STATUS[r.status as RiskStatus] ?? r.status}</TD>
                    <TD className="text-xs">{r.riskOwner?.name ?? "–"}</TD>
                    <TD className="whitespace-nowrap text-xs">
                      <DueDate date={r.nextReviewDate} overdueLabel={overdueLabel} />
                    </TD>
                  </TR>
                ))}
                {risks.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="text-center text-muted-foreground">
                      {t.riskReviews.empty}
                    </TD>
                  </TR>
                ) : null}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {/* ---------- Kontrolltests ---------- */}
        <Card>
          <CardHeader>
            <CardTitle>{t.controlTests.title(controls.length)}</CardTitle>
            <CardDescription>{t.controlTests.description(HORIZON_DAYS)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>{t.controlTests.controlId}</TH>
                  <TH>{t.controlTests.name}</TH>
                  <TH>{t.controlTests.owner}</TH>
                  <TH>{t.controlTests.operatingEffectiveness}</TH>
                  <TH>{t.controlTests.nextTest}</TH>
                </TR>
              </THead>
              <TBody>
                {controls.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <Link
                        href={`/controls/${c.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {c.controlId}
                      </Link>
                    </TD>
                    <TD className="max-w-[360px] truncate">{c.name}</TD>
                    <TD className="text-xs">{c.owner?.name ?? "–"}</TD>
                    <TD className="text-xs">
                      {tEnums.effectivenessRating[c.operatingEffectiveness] ??
                        c.operatingEffectiveness}
                    </TD>
                    <TD className="whitespace-nowrap text-xs">
                      <DueDate date={c.nextTestDate} overdueLabel={overdueLabel} />
                    </TD>
                  </TR>
                ))}
                {controls.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="text-center text-muted-foreground">
                      {t.controlTests.empty}
                    </TD>
                  </TR>
                ) : null}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {/* ---------- Third-Party-Reviews ---------- */}
        <Card>
          <CardHeader>
            <CardTitle>{t.tpReviews.title(thirdParties.length)}</CardTitle>
            <CardDescription>{t.tpReviews.description(HORIZON_DAYS)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>{t.tpReviews.tpId}</TH>
                  <TH>{t.tpReviews.name}</TH>
                  <TH>{t.tpReviews.businessOwner}</TH>
                  <TH>{t.tpReviews.status}</TH>
                  <TH>{t.tpReviews.criticality}</TH>
                  <TH>{t.tpReviews.nextReview}</TH>
                </TR>
              </THead>
              <TBody>
                {thirdParties.map((tp) => (
                  <TR key={tp.id}>
                    <TD>
                      <Link
                        href={`/third-parties/${tp.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {tp.tpId}
                      </Link>
                    </TD>
                    <TD className="max-w-[280px] truncate">{tp.name}</TD>
                    <TD className="text-xs">{tp.businessOwner?.name ?? "–"}</TD>
                    <TD className="text-xs">{tEnums.tpStatus[tp.status] ?? tp.status}</TD>
                    <TD className="text-xs">{tp.criticality}</TD>
                    <TD className="whitespace-nowrap text-xs">
                      <DueDate date={tp.nextReviewDate} overdueLabel={overdueLabel} />
                    </TD>
                  </TR>
                ))}
                {thirdParties.length === 0 ? (
                  <TR>
                    <TD colSpan={6} className="text-center text-muted-foreground">
                      {t.tpReviews.empty}
                    </TD>
                  </TR>
                ) : null}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DueDate({ date, overdueLabel }: { date: Date | null; overdueLabel: string }) {
  const overdue = isOverdue(date);
  return (
    <span className={overdue ? "font-medium text-risk-high" : ""}>
      {formatDate(date)}
      {overdue ? (
        <Badge variant="high" className="ml-2">
          {overdueLabel}
        </Badge>
      ) : null}
    </span>
  );
}
