import Link from "next/link";
import { ArrowRight, ImageIcon } from "lucide-react";
import { requirePermission } from "@/lib/authz";
import { getDoraOverview } from "@/features/dora/queries";
import { HANDBOOK_GROUPS, HANDBOOK_SECTIONS } from "@/lib/content/dora-handbook";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DoraKnowledgeBase,
  GlossaryIndex,
  type PillarScore,
} from "@/features/dora/knowledge-client";
import { COMPLIANCE_DISCLAIMER } from "@/lib/domain/enums";

export const metadata = { title: "DORA Wissensbasis" };
export const dynamic = "force-dynamic";

/** Zuordnung Wissensbasis-Säule → Katalog-Kapitel (FRWK-DORA-001). */
const PILLAR_CHAPTER: Record<string, string> = {
  "ict-risk": "K2",
  incidents: "K3",
  testing: "K4",
  "third-party": "K5",
  "info-sharing": "K6",
};

/** Die 9 Wirkungsketten des DORA-Regelkreises (FRWK-DORA-001, Kap. 4.1). */
const WIRKUNGSKETTEN = [
  "Kapitel VI liefert externe Bedrohungsinformationen – neue Angriffsvektoren fließen als Eingangsgröße in die Risikobewertung ein.",
  "Kapitel V erweitert den Betrachtungsrahmen über die Unternehmensgrenze hinaus – Provider-Risiken und Vertragslage werden Teil des Risikoregisters.",
  "Kapitel II definiert daraus Test-Scope und Testfrequenz – getestet wird, was risikoseitig relevant ist.",
  "Kapitel IV liefert die Validierung zurück – Testbefunde sind Tatsachen und korrigieren die theoretische Risikobewertung.",
  "Kapitel II stellt für den Ernstfall die Fortführungs- und Wiederanlaufpläne bereit, auf die das Vorfallmanagement zugreift.",
  "Kapitel III führt nach jedem schwerwiegenden Vorfall die Erkenntnisse in das Risikoregister zurück – ohne diesen Rücklauf verliert der Regelkreis seine Lernfähigkeit. ⚠ prüfungsrelevant",
  "Ein Vorfall bei einem Dienstleister löst unmittelbar eine Vertrags- und Exit-Prüfung nach Kapitel V aus.",
  "Erhebliche Cyberbedrohungen können nach Art. 19 Abs. 2 freiwillig gemeldet und in den Informationsaustausch zurückgegeben werden.",
  "Dienstleister kritischer Funktionen sind nach Art. 26 Abs. 3 in die bedrohungsgeleiteten Tests einzubeziehen. ⚠ prüfungsrelevant",
];

export default async function DoraKnowledgePage() {
  await requirePermission("risk:read");
  const overview = await getDoraOverview();

  const scores: Record<string, PillarScore> = {};
  for (const [pillarId, chapterKey] of Object.entries(PILLAR_CHAPTER)) {
    const ch = overview.chapters.find((c) => c.key === chapterKey);
    if (ch) {
      scores[pillarId] = {
        chapterKey,
        scorePercent: ch.result.scorePercent,
        status: ch.result.status,
        openKnockouts: ch.result.openKnockouts.length,
      };
    }
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="DORA ISRM Wissensbasis"
        description="Die fünf Kernsäulen der Verordnung (EU) 2022/2554 und das vollständige Handbuch der Gesamtbetrachtung FRWK-DORA-001 (Kapitel 1–15) – aufbereitet für das Informationssicherheits-Risikomanagement einer Bank. Markierte Fachbegriffe sind anklickbar; jede Säule zeigt den eigenen Umsetzungsstand aus dem Anforderungskatalog."
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "DORA Wissensbasis" }]}
      />

      <div className="mb-4 rounded-lg border bg-accent/40 p-3 text-xs">
        <p>
          <span className="font-semibold">Eigener Umsetzungsstand:</span> DORA Resilience Index{" "}
          <span className="font-semibold">{overview.index.indexPercent} %</span>,{" "}
          {overview.index.totalOpenKnockouts} offene Knockouts –{" "}
          <Link href="/dora" className="text-primary underline">
            zum DORA-Compliance-Dashboard
          </Link>{" "}
          ·{" "}
          <Link href="/dora/requirements" className="text-primary underline">
            Anforderungskatalog (133)
          </Link>{" "}
          ·{" "}
          <Link href="/reports/DORA_READINESS" className="text-primary underline">
            DORA-Readiness-Report
          </Link>
        </p>
      </div>

      <DoraKnowledgeBase scores={scores} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Das vollständige Handbuch (FRWK-DORA-001)</CardTitle>
          <CardDescription>
            Die Gesamtbetrachtung als navigierbares Handbuch: Kapitel 1–8 und 10–15 in fünf
            thematischen Teilen, inklusive aller Original-Abbildungen und Tabellen des Dokuments.
            Kapitel 9 (Anforderungskatalog) ist nicht als Text abgebildet, sondern als interaktives
            Modul umgesetzt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {HANDBOOK_GROUPS.map((group) => (
            <section key={group.id}>
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <p className="mb-2 text-xs text-muted-foreground">{group.description}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {HANDBOOK_SECTIONS.filter((s) => s.groupId === group.id).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/dora-knowledge/${s.slug}`}
                    className="group flex flex-col rounded-lg border p-3 transition-colors hover:border-primary/50 hover:bg-accent/40"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {s.chapter}
                      </span>
                      <span className="flex items-center gap-2">
                        {s.figures.length > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            title={`${s.figures.length} Abbildung(en) aus dem Originaldokument`}
                          >
                            <ImageIcon className="h-3 w-3" aria-hidden />
                            {s.figures.length}
                          </span>
                        ) : null}
                        <ArrowRight
                          className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </span>
                    </span>
                    <span className="mt-0.5 text-sm font-medium leading-snug">{s.title}</span>
                    <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {s.summary}
                    </span>
                  </Link>
                ))}
                {group.id === "steuerung" ? (
                  <Link
                    href="/dora/requirements"
                    className="group flex flex-col rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 transition-colors hover:border-primary/60 hover:bg-primary/10"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                        Kap. 9
                      </span>
                      <ArrowRight
                        className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </span>
                    <span className="mt-0.5 text-sm font-medium leading-snug">
                      Anforderungskatalog – als interaktives Modul
                    </span>
                    <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Die 133 Anforderungen der Kapitel II–VI sind nicht als Text, sondern
                      vollständig bewertbar im Katalog umgesetzt – mit Reifegrad, Nachweisen,
                      Crosswalk und Knockout-Logik.
                    </span>
                  </Link>
                ) : null}
              </div>
            </section>
          ))}
          <p className="text-xs text-muted-foreground">
            Nicht Teil der Wissensbasis: Kap. 16 (Umsetzungsfahrplan) und Kap. 17 (Anhang) – sie
            betreffen die Projekt- und Dokumentensteuerung des Rahmenwerks.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Der DORA-Regelkreis: 9 Wirkungsketten</CardTitle>
          <CardDescription>
            DORA ist als Regelkreis konstruiert – eine Schwäche in einem Kapitel wirkt unmittelbar
            auf die anderen. Kapitel II ist die zentrale Steuerungsinstanz (FRWK-DORA-001, Kap. 4).
            Die Ketten 6 und 9 erzeugen in Prüfungen am häufigsten Feststellungen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            {WIRKUNGSKETTEN.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Glossar – alle Fachbegriffe</CardTitle>
          <CardDescription>
            Alphabetischer Schnellzugriff auf alle in den Texten erklärten Begriffe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GlossaryIndex />
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">{COMPLIANCE_DISCLAIMER}</p>
    </div>
  );
}
