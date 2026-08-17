import Link from "next/link";
import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatDate, isOverdue } from "@/lib/utils";
import { RISK_STATUS, TP_STATUS, type RiskStatus, type TpStatus } from "@/lib/domain/enums";
import { EFFECTIVENESS_RATING } from "@/lib/domain/enums";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata = { title: "Assessments" };
export const dynamic = "force-dynamic";

const HORIZON_DAYS = 30;

export default async function AssessmentsPage() {
  await requirePermission("risk:read");
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

  return (
    <div>
      <PageHeader
        title="Assessments"
        description={`Fällige und überfällige Reviews und Tests innerhalb der nächsten ${HORIZON_DAYS} Tage`}
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Assessments" }]}
      />

      <div className="space-y-4">
        {/* ---------- Risiko-Reviews ---------- */}
        <Card>
          <CardHeader>
            <CardTitle>Fällige Risiko-Reviews ({risks.length})</CardTitle>
            <CardDescription>
              Risiken mit nächstem Review-Termin in weniger als {HORIZON_DAYS} Tagen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Risk ID</TH>
                  <TH>Titel</TH>
                  <TH>Status</TH>
                  <TH>Risk Owner</TH>
                  <TH>Nächstes Review</TH>
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
                      <DueDate date={r.nextReviewDate} />
                    </TD>
                  </TR>
                ))}
                {risks.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="text-center text-muted-foreground">
                      Keine fälligen Risiko-Reviews.
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
            <CardTitle>Fällige Kontrolltests ({controls.length})</CardTitle>
            <CardDescription>
              Kontrollen mit nächstem Testtermin in weniger als {HORIZON_DAYS} Tagen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Control ID</TH>
                  <TH>Name</TH>
                  <TH>Owner</TH>
                  <TH>Operative Wirksamkeit</TH>
                  <TH>Nächster Test</TH>
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
                      {EFFECTIVENESS_RATING[
                        c.operatingEffectiveness as keyof typeof EFFECTIVENESS_RATING
                      ] ?? c.operatingEffectiveness}
                    </TD>
                    <TD className="whitespace-nowrap text-xs">
                      <DueDate date={c.nextTestDate} />
                    </TD>
                  </TR>
                ))}
                {controls.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="text-center text-muted-foreground">
                      Keine fälligen Kontrolltests.
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
            <CardTitle>Fällige Third-Party-Reviews ({thirdParties.length})</CardTitle>
            <CardDescription>
              Drittparteien mit nächstem Review-Termin in weniger als {HORIZON_DAYS} Tagen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>TP ID</TH>
                  <TH>Name</TH>
                  <TH>Business Owner</TH>
                  <TH>Status</TH>
                  <TH>Kritikalität</TH>
                  <TH>Nächstes Review</TH>
                </TR>
              </THead>
              <TBody>
                {thirdParties.map((t) => (
                  <TR key={t.id}>
                    <TD>
                      <Link
                        href={`/third-parties/${t.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {t.tpId}
                      </Link>
                    </TD>
                    <TD className="max-w-[280px] truncate">{t.name}</TD>
                    <TD className="text-xs">{t.businessOwner?.name ?? "–"}</TD>
                    <TD className="text-xs">{TP_STATUS[t.status as TpStatus] ?? t.status}</TD>
                    <TD className="text-xs">{t.criticality}</TD>
                    <TD className="whitespace-nowrap text-xs">
                      <DueDate date={t.nextReviewDate} />
                    </TD>
                  </TR>
                ))}
                {thirdParties.length === 0 ? (
                  <TR>
                    <TD colSpan={6} className="text-center text-muted-foreground">
                      Keine fälligen Third-Party-Reviews.
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

function DueDate({ date }: { date: Date | null }) {
  const overdue = isOverdue(date);
  return (
    <span className={overdue ? "font-medium text-risk-high" : ""}>
      {formatDate(date)}
      {overdue ? (
        <Badge variant="high" className="ml-2">
          überfällig
        </Badge>
      ) : null}
    </span>
  );
}
