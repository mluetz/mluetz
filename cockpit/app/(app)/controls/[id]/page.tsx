import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { formatDate, formatDateTime, isOverdue } from "@/lib/utils";
import { EFFECTIVENESS_RATING, RISK_STATUS, type RiskStatus } from "@/lib/domain/enums";
import {
  AUTOMATION_LABELS,
  CONTROL_TYPE_LABELS,
  FREQUENCY_LABELS,
  TEST_RESULT_LABELS,
  effectivenessVariant,
  testResultVariant,
} from "@/features/controls/labels";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ControlTestForm, UpdateControlForm } from "@/features/controls/panels";

export const dynamic = "force-dynamic";

export default async function ControlDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("control:read");
  const { id } = await params;
  const control = await db.control.findUnique({
    where: { id },
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
          { label: "Overview", href: "/overview" },
          { label: "Controls", href: "/controls" },
          { label: control.controlId },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={effectivenessVariant(control.designEffectiveness)}>
              Design:{" "}
              {EFFECTIVENESS_RATING[
                control.designEffectiveness as keyof typeof EFFECTIVENESS_RATING
              ] ?? control.designEffectiveness}
            </Badge>
            <Badge variant={effectivenessVariant(control.operatingEffectiveness)}>
              Operativ:{" "}
              {EFFECTIVENESS_RATING[
                control.operatingEffectiveness as keyof typeof EFFECTIVENESS_RATING
              ] ?? control.operatingEffectiveness}
            </Badge>
            {testOverdue ? <Badge variant="high">Test überfällig</Badge> : null}
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="risks">Verknüpfte Risiken ({control.risks.length})</TabsTrigger>
          <TabsTrigger value="tests">Testhistorie ({control.assessments.length})</TabsTrigger>
          {canTest ? <TabsTrigger value="newtest">Neuer Test</TabsTrigger> : null}
        </TabsList>

        {/* ---------- Übersicht ---------- */}
        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Kontrollbeschreibung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Info label="Kontrollziel" value={control.objective} />
                <Info label="Beschreibung" value={control.description} />
                <div className="grid grid-cols-2 gap-3">
                  <Info
                    label="Typ"
                    value={
                      CONTROL_TYPE_LABELS[
                        control.controlType as keyof typeof CONTROL_TYPE_LABELS
                      ] ?? control.controlType
                    }
                  />
                  <Info
                    label="Automatisierung"
                    value={
                      AUTOMATION_LABELS[control.automation as keyof typeof AUTOMATION_LABELS] ??
                      control.automation
                    }
                  />
                  <Info
                    label="Frequenz"
                    value={
                      FREQUENCY_LABELS[control.frequency as keyof typeof FREQUENCY_LABELS] ??
                      control.frequency
                    }
                  />
                  <Info label="Control Owner" value={control.owner?.name ?? "⚠ nicht benannt"} />
                  <Info
                    label="Nächster Test"
                    value={`${formatDate(control.nextTestDate)}${testOverdue ? " (überfällig)" : ""}`}
                  />
                  <Info label="Letzte Änderung" value={formatDateTime(control.updatedAt)} />
                </div>
                <TagList
                  label="Regulatorische Mappings"
                  items={control.regulatoryRequirements.map((r) => `${r.refId} (${r.framework})`)}
                />
                <TagList label="Betroffene Assets" items={control.assets.map((a) => a.name)} />
                <TagList
                  label="Betroffene Geschäftsprozesse"
                  items={control.processes.map((p) => p.name)}
                />
              </CardContent>
            </Card>
            {canWrite ? (
              <Card>
                <CardHeader>
                  <CardTitle>Kontrolle bearbeiten</CardTitle>
                  <CardDescription>Änderungen werden im Audit Trail protokolliert.</CardDescription>
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
              <CardTitle>Verknüpfte Risiken</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>Risk ID</TH>
                    <TH>Titel</TH>
                    <TH>Status</TH>
                    <TH>Risk Owner</TH>
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
                        Keine Risiken verknüpft.
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
              <CardTitle>Testhistorie</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>Datum</TH>
                    <TH>Tester</TH>
                    <TH>Ergebnis</TH>
                    <TH>Design</TH>
                    <TH>Operativ</TH>
                    <TH>Findings</TH>
                  </TR>
                </THead>
                <TBody>
                  {control.assessments.map((a) => (
                    <TR key={a.id}>
                      <TD className="whitespace-nowrap text-xs">{formatDate(a.testDate)}</TD>
                      <TD className="text-xs">{a.testedBy.name}</TD>
                      <TD>
                        <Badge variant={testResultVariant(a.testResult)}>
                          {TEST_RESULT_LABELS[a.testResult as keyof typeof TEST_RESULT_LABELS] ??
                            a.testResult}
                        </Badge>
                      </TD>
                      <TD className="text-xs">
                        {EFFECTIVENESS_RATING[
                          a.designEffectiveness as keyof typeof EFFECTIVENESS_RATING
                        ] ?? a.designEffectiveness}
                      </TD>
                      <TD className="text-xs">
                        {EFFECTIVENESS_RATING[
                          a.operatingEffectiveness as keyof typeof EFFECTIVENESS_RATING
                        ] ?? a.operatingEffectiveness}
                      </TD>
                      <TD className="max-w-[320px] text-xs">{a.findings ?? "–"}</TD>
                    </TR>
                  ))}
                  {control.assessments.length === 0 ? (
                    <TR>
                      <TD colSpan={6} className="text-center text-muted-foreground">
                        Noch keine Kontrolltests dokumentiert.
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
                <CardTitle>Neuen Kontrolltest erfassen</CardTitle>
                <CardDescription>
                  Der Test aktualisiert die Design- und operative Wirksamkeit der Kontrolle und wird
                  im Audit Trail protokolliert.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ControlTestForm controlId={control.id} />
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
