import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { formatDate, formatDateTime, isOverdue } from "@/lib/utils";
import { RISK_STATUS, type RiskStatus } from "@/lib/domain/enums";
import { effectivenessVariant, testResultVariant } from "@/features/controls/labels";
import { getLocale } from "@/lib/i18n/server";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ControlTestForm, UpdateControlForm } from "@/features/controls/panels";

export const dynamic = "force-dynamic";

export default async function ControlDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("control:read");
  const locale = await getLocale();
  const m = OPS_MESSAGES[locale];
  const t = m.controls.detail;
  const { id } = await params;
  const control = await db.control.findFirst({
    where: { OR: [{ id }, { controlId: id }] },
    include: {
      owner: true,
      assets: true,
      processes: true,
      regulatoryRequirements: true,
      risks: { include: { risk: { include: { riskOwner: true } } } },
      assessments: { include: { testedBy: true }, orderBy: { testDate: "desc" } },
    },
  });
  if (!control) notFound();

  const canTest = hasPermission(user, "control:test");
  const canWrite = hasPermission(user, "control:write");
  const testOverdue = isOverdue(control.nextTestDate);

  const owners = canWrite
    ? await db.user.findMany({
        where: {
          active: true,
          roles: { some: { role: { key: { in: ["CONTROL_OWNER", "ICT_RISK_MANAGER", "ISO"] } } } },
        },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div>
      <PageHeader
        title={`${control.controlId} – ${control.name}`}
        description={control.objective}
        crumbs={[
          { label: m.common.overview, href: "/overview" },
          { label: m.controls.list.crumb, href: "/controls" },
          { label: control.controlId },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={effectivenessVariant(control.designEffectiveness)}>
              {t.designBadge(
                m.labels.effectiveness[control.designEffectiveness] ?? control.designEffectiveness,
              )}
            </Badge>
            <Badge variant={effectivenessVariant(control.operatingEffectiveness)}>
              {t.operatingBadge(
                m.labels.effectiveness[control.operatingEffectiveness] ??
                  control.operatingEffectiveness,
              )}
            </Badge>
            {testOverdue ? <Badge variant="high">{t.testOverdue}</Badge> : null}
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">{t.tabOverview}</TabsTrigger>
          <TabsTrigger value="risks">{t.tabRisks(control.risks.length)}</TabsTrigger>
          <TabsTrigger value="tests">{t.tabTests(control.assessments.length)}</TabsTrigger>
          {canTest ? <TabsTrigger value="newtest">{t.tabNewTest}</TabsTrigger> : null}
        </TabsList>

        {/* ---------- Übersicht ---------- */}
        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t.descriptionCard}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Info label={t.objective} value={control.objective} />
                <Info label={t.descriptionLabel} value={control.description} />
                <div className="grid grid-cols-2 gap-3">
                  <Info
                    label={t.typeLabel}
                    value={m.labels.controlType[control.controlType] ?? control.controlType}
                  />
                  <Info
                    label={t.automationLabel}
                    value={m.labels.automation[control.automation] ?? control.automation}
                  />
                  <Info
                    label={t.frequencyLabel}
                    value={m.labels.frequency[control.frequency] ?? control.frequency}
                  />
                  <Info
                    label={t.controlOwner}
                    value={control.owner?.name ?? m.common.ownerNotNamed}
                  />
                  <Info
                    label={t.nextTest}
                    value={`${formatDate(control.nextTestDate)}${testOverdue ? m.common.overdueSuffix : ""}`}
                  />
                  <Info label={m.common.lastModified} value={formatDateTime(control.updatedAt)} />
                </div>
                <TagList
                  label={t.regulatoryMappings}
                  items={control.regulatoryRequirements.map((r) => `${r.refId} (${r.framework})`)}
                />
                <TagList label={t.affectedAssets} items={control.assets.map((a) => a.name)} />
                <TagList label={t.affectedProcesses} items={control.processes.map((p) => p.name)} />
              </CardContent>
            </Card>
            {canWrite ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t.editCard}</CardTitle>
                  <CardDescription>{t.editCardDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <UpdateControlForm
                    controlId={control.id}
                    defaults={{
                      name: control.name,
                      objective: control.objective,
                      description: control.description,
                      frequency: control.frequency,
                      ownerId: control.ownerId,
                    }}
                    owners={owners.map((o) => ({ id: o.id, name: o.name }))}
                    locale={locale}
                  />
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>

        {/* ---------- Verknüpfte Risiken ---------- */}
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle>{t.linkedRisksCard}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>{t.riskId}</TH>
                    <TH>{t.riskTitle}</TH>
                    <TH>{t.riskStatus}</TH>
                    <TH>{t.riskOwner}</TH>
                  </TR>
                </THead>
                <TBody>
                  {control.risks.map(({ risk }) => (
                    <TR key={risk.id}>
                      <TD>
                        <Link
                          href={`/risks/${risk.id}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {risk.riskId}
                        </Link>
                      </TD>
                      <TD className="max-w-[360px] truncate">{risk.title}</TD>
                      <TD className="text-xs">
                        {RISK_STATUS[risk.status as RiskStatus] ?? risk.status}
                      </TD>
                      <TD className="text-xs">{risk.riskOwner?.name ?? "–"}</TD>
                    </TR>
                  ))}
                  {control.risks.length === 0 ? (
                    <TR>
                      <TD colSpan={4} className="text-center text-muted-foreground">
                        {t.noRisksLinked}
                      </TD>
                    </TR>
                  ) : null}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Testhistorie ---------- */}
        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>{t.testHistoryCard}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>{t.testDate}</TH>
                    <TH>{t.tester}</TH>
                    <TH>{t.testResult}</TH>
                    <TH>{t.design}</TH>
                    <TH>{t.operating}</TH>
                    <TH>{t.findings}</TH>
                  </TR>
                </THead>
                <TBody>
                  {control.assessments.map((a) => (
                    <TR key={a.id}>
                      <TD className="whitespace-nowrap text-xs">{formatDate(a.testDate)}</TD>
                      <TD className="text-xs">{a.testedBy.name}</TD>
                      <TD>
                        <Badge variant={testResultVariant(a.testResult)}>
                          {m.labels.testResult[a.testResult] ?? a.testResult}
                        </Badge>
                      </TD>
                      <TD className="text-xs">
                        {m.labels.effectiveness[a.designEffectiveness] ?? a.designEffectiveness}
                      </TD>
                      <TD className="text-xs">
                        {m.labels.effectiveness[a.operatingEffectiveness] ??
                          a.operatingEffectiveness}
                      </TD>
                      <TD className="max-w-[320px] text-xs">{a.findings ?? "–"}</TD>
                    </TR>
                  ))}
                  {control.assessments.length === 0 ? (
                    <TR>
                      <TD colSpan={6} className="text-center text-muted-foreground">
                        {t.noTests}
                      </TD>
                    </TR>
                  ) : null}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Neuer Test ---------- */}
        {canTest ? (
          <TabsContent value="newtest">
            <Card>
              <CardHeader>
                <CardTitle>{t.newTestCard}</CardTitle>
                <CardDescription>{t.newTestCardDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <ControlTestForm controlId={control.id} locale={locale} />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
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
