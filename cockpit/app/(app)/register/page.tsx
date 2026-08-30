import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { collectRegisterRecords, validateRegisterRecords } from "@/lib/register/data";
import { concentrationOverChain } from "@/lib/domain/concentration";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Informationsregister" };
export const dynamic = "force-dynamic";

const TEXT = {
  de: {
    title: "Informationsregister (Art. 28 Abs. 3 DORA)",
    description:
      "Register aller vertraglichen Vereinbarungen mit IKT-Drittdienstleistern — Probeeinreichung mit Validierungslauf, Export je ITS-Fassung, Konzentrationsanalyse über die gesamte Subunternehmerkette.",
    crumbOverview: "Overview",
    versionsTitle: "ITS-Fassungen (Mapping als Daten)",
    versionsDesc:
      "Beide kursierenden Bezeichnungsschemata sind als Fassungsdatensätze angelegt. Verbindlich ist allein die DVO (EU) 2024/2956 — vor produktiver Einreichung verifizieren und den Status umstellen. Ein Fassungswechsel ist Datenpflege, kein Refactoring.",
    colVersion: "Fassung",
    colStatus: "Status",
    colMappings: "Feld-Mappings",
    colAction: "Export",
    toVerify: "zu verifizieren",
    verified: "verifiziert",
    exportBtn: "Probeeinreichung (CSV)",
    validationTitle: "Validierungslauf (Probeeinreichung)",
    validationDesc:
      "Pflichtfelder, LEI-Prüfziffern (ISO 17442), Codelisten und Referenzintegrität — Fehlerliste je Datensatz.",
    records: "Datensätze",
    errors: "Fehler",
    warnings: "Warnungen",
    colRef: "Datensatz",
    colKind: "Art",
    colField: "Feld",
    colSeverity: "Schwere",
    colMessage: "Meldung",
    allValid: "Keine Validierungsfehler — das Register ist formal probeeinreichungsfähig.",
    concTitle: "Konzentrationsrisiko über die Kette",
    concDesc:
      "Anzahl gestützter CIF je Anbieter — über die GESAMTE Subunternehmerkette gerechnet, nicht nur über Erstdienstleister. Gemeinsame Kettenglieder mehrerer Anbieter werden zusammengeführt (LEI, sonst Name).",
    colProvider: "Anbieter",
    colCountry: "Land",
    colCif: "Gestützte CIF",
    colChains: "Ketten",
    colDirect: "Bezug",
    direct: "direkt",
    indirect: "mittelbar",
    exportsTitle: "Erzeugte Exporte",
    colTime: "Zeitpunkt",
    colBy: "Ersteller",
    colChecksum: "SHA-256",
    noExports: "Noch keine Exporte erzeugt.",
  },
  en: {
    title: "Register of Information (Art. 28(3) DORA)",
    description:
      "Register of all contractual arrangements with ICT third-party providers — trial submission with validation run, export per ITS version, concentration analysis across the full subcontracting chain.",
    crumbOverview: "Overview",
    versionsTitle: "ITS versions (mapping as data)",
    versionsDesc:
      "Both circulating naming schemes are stored as version records. Only Implementing Regulation (EU) 2024/2956 is authoritative — verify before productive submission and switch the status. A version change is data maintenance, not refactoring.",
    colVersion: "Version",
    colStatus: "Status",
    colMappings: "Field mappings",
    colAction: "Export",
    toVerify: "to verify",
    verified: "verified",
    exportBtn: "Trial submission (CSV)",
    validationTitle: "Validation run (trial submission)",
    validationDesc:
      "Mandatory fields, LEI check digits (ISO 17442), code lists and referential integrity — error list per record.",
    records: "Records",
    errors: "Errors",
    warnings: "Warnings",
    colRef: "Record",
    colKind: "Kind",
    colField: "Field",
    colSeverity: "Severity",
    colMessage: "Message",
    allValid: "No validation errors — the register is formally ready for a trial submission.",
    concTitle: "Concentration risk across the chain",
    concDesc:
      "Number of supported CIFs per provider — computed across the FULL subcontracting chain, not just direct providers. Shared chain links are merged (LEI, else name).",
    colProvider: "Provider",
    colCountry: "Country",
    colCif: "Supported CIFs",
    colChains: "Chains",
    colDirect: "Relation",
    direct: "direct",
    indirect: "indirect",
    exportsTitle: "Generated exports",
    colTime: "Time",
    colBy: "Created by",
    colChecksum: "SHA-256",
    noExports: "No exports generated yet.",
  },
} as const;

export default async function RegisterPage() {
  await requirePermission("thirdparty:read");
  const locale = await getLocale();
  const t = TEXT[locale];

  const [versions, records, exports, tpsForConc] = await Promise.all([
    db.itsTemplateVersion.findMany({
      include: { _count: { select: { mappings: true } } },
      orderBy: { label: "asc" },
    }),
    collectRegisterRecords(),
    db.registerExport.findMany({
      include: { createdBy: { select: { email: true } }, templateVersion: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.thirdParty.findMany({
      where: { criticalFunctions: { some: {} } },
      include: { criticalFunctions: { select: { id: true } }, subcontractors: true },
    }),
  ]);

  const issues = validateRegisterRecords(records);
  const errors = issues.filter((i) => i.severity === "ERROR");
  const warnings = issues.filter((i) => i.severity === "WARNING");

  const concentration = concentrationOverChain(
    tpsForConc.map((tp) => ({
      tpName: tp.name,
      tpLei: tp.lei,
      tpCountry: tp.registeredCountry,
      cifIds: tp.criticalFunctions.map((c) => c.id),
      chain: tp.subcontractors.map((s) => ({
        name: s.name,
        lei: s.lei,
        country: s.country,
        rank: s.rank,
        providesCifService: s.providesCifService,
      })),
    })),
  );

  return (
    <div>
      <PageHeader
        title={t.title}
        description={t.description}
        crumbs={[{ label: t.crumbOverview, href: "/overview" }, { label: "Register" }]}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t.versionsTitle}</CardTitle>
          <CardDescription>{t.versionsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{t.colVersion}</TH>
                <TH>{t.colStatus}</TH>
                <TH>{t.colMappings}</TH>
                <TH>{t.colAction}</TH>
              </TR>
            </THead>
            <TBody>
              {versions.map((v) => (
                <TR key={v.id}>
                  <TD className="font-medium">{v.label}</TD>
                  <TD>
                    <Badge variant={v.status === "VERIFIED" ? "low" : "high"}>
                      {v.status === "VERIFIED" ? t.verified : t.toVerify}
                    </Badge>
                  </TD>
                  <TD className="tabular-nums">{v._count.mappings}</TD>
                  <TD>
                    <a href={`/api/register-export?version=${v.id}`}>
                      <Button size="sm" variant="secondary" type="button">
                        {t.exportBtn}
                      </Button>
                    </a>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            {t.validationTitle}{" "}
            <span className="ml-2 align-middle text-sm font-normal text-muted-foreground tabular-nums">
              {t.records}: {records.length} · {t.errors}: {errors.length} · {t.warnings}:{" "}
              {warnings.length}
            </span>
          </CardTitle>
          <CardDescription>{t.validationDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.allValid}</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t.colRef}</TH>
                  <TH>{t.colKind}</TH>
                  <TH>{t.colField}</TH>
                  <TH>{t.colSeverity}</TH>
                  <TH>{t.colMessage}</TH>
                </TR>
              </THead>
              <TBody>
                {issues.map((i, n) => (
                  <TR key={n}>
                    <TD className="whitespace-nowrap font-medium tabular-nums">{i.ref}</TD>
                    <TD>{i.kind}</TD>
                    <TD className="whitespace-nowrap">{i.field}</TD>
                    <TD>
                      <Badge variant={i.severity === "ERROR" ? "critical" : "medium"}>
                        {i.severity}
                      </Badge>
                    </TD>
                    <TD>{i.message}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t.concTitle}</CardTitle>
          <CardDescription>{t.concDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{t.colProvider}</TH>
                <TH>{t.colCountry}</TH>
                <TH>{t.colCif}</TH>
                <TH>{t.colChains}</TH>
                <TH>{t.colDirect}</TH>
              </TR>
            </THead>
            <TBody>
              {concentration.map((p) => (
                <TR key={p.key}>
                  <TD className="font-medium">{p.name}</TD>
                  <TD>{p.country}</TD>
                  <TD>
                    <Badge variant={p.cifCount >= 3 ? "critical" : p.cifCount === 2 ? "high" : "low"}>
                      {p.cifCount}
                    </Badge>
                  </TD>
                  <TD className="tabular-nums">{p.chains}</TD>
                  <TD className="text-sm text-muted-foreground">
                    {p.direct ? t.direct : t.indirect}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.exportsTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noExports}</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t.colTime}</TH>
                  <TH>{t.colVersion}</TH>
                  <TH>{t.colBy}</TH>
                  <TH>{t.records}</TH>
                  <TH>{t.errors}</TH>
                  <TH>{t.colChecksum}</TH>
                </TR>
              </THead>
              <TBody>
                {exports.map((e) => (
                  <TR key={e.id}>
                    <TD className="whitespace-nowrap tabular-nums">{formatDateTime(e.createdAt)}</TD>
                    <TD>{e.templateVersion.label}</TD>
                    <TD>{e.createdBy.email}</TD>
                    <TD className="tabular-nums">{e.recordCount}</TD>
                    <TD className="tabular-nums">{e.errorCount}</TD>
                    <TD className="font-mono text-xs">{e.checksum.slice(0, 16)}…</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
