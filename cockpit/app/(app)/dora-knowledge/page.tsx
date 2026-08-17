import Link from "next/link";
import { ArrowRight, ImageIcon } from "lucide-react";
import { requirePermission } from "@/lib/authz";
import { getDoraOverview } from "@/features/dora/queries";
import { getLocale } from "@/lib/i18n/server";
import { KNOWLEDGE_MESSAGES } from "@/lib/i18n/messages/knowledge";
import { getHandbookContent, getKnowledgeContent } from "@/lib/content/knowledge-locale";
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

export default async function DoraKnowledgePage() {
  await requirePermission("risk:read");
  const locale = await getLocale();
  const t = KNOWLEDGE_MESSAGES[locale];
  const { pillars, glossary, wirkungsketten } = getKnowledgeContent(locale);
  const handbook = getHandbookContent(locale);
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
        title={t.page.title}
        description={t.page.description}
        crumbs={[
          { label: t.page.crumbOverview, href: "/overview" },
          { label: t.page.crumbSelf },
        ]}
      />

      <div className="mb-4 rounded-lg border bg-accent/40 p-3 text-xs">
        <p>
          <span className="font-semibold">{t.page.bannerLead}</span> DORA Resilience Index{" "}
          <span className="font-semibold">{overview.index.indexPercent} %</span>,{" "}
          {overview.index.totalOpenKnockouts} {t.page.bannerKnockouts} –{" "}
          <Link href="/dora" className="text-primary underline">
            {t.page.bannerDashboard}
          </Link>{" "}
          ·{" "}
          <Link href="/dora/requirements" className="text-primary underline">
            {t.page.bannerCatalog}
          </Link>{" "}
          ·{" "}
          <Link href="/reports/DORA_READINESS" className="text-primary underline">
            {t.page.bannerReport}
          </Link>
        </p>
      </div>

      <DoraKnowledgeBase scores={scores} pillars={pillars} glossary={glossary} locale={locale} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t.page.handbookTitle}</CardTitle>
          <CardDescription>{t.page.handbookDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {handbook.groups.map((group) => (
            <section key={group.id}>
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <p className="mb-2 text-xs text-muted-foreground">{group.description}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {handbook.sections
                  .filter((s) => s.groupId === group.id)
                  .map((s) => (
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
                              title={t.page.figureBadgeTitle(s.figures.length)}
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
                        {t.page.chapter9Label}
                      </span>
                      <ArrowRight
                        className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </span>
                    <span className="mt-0.5 text-sm font-medium leading-snug">
                      {t.page.chapter9Title}
                    </span>
                    <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t.page.chapter9Text}
                    </span>
                  </Link>
                ) : null}
              </div>
            </section>
          ))}
          <p className="text-xs text-muted-foreground">{t.page.excludedNote}</p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t.page.chainsTitle}</CardTitle>
          <CardDescription>{t.page.chainsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            {wirkungsketten.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t.page.glossaryTitle}</CardTitle>
          <CardDescription>{t.page.glossaryDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <GlossaryIndex glossary={glossary} locale={locale} />
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">{COMPLIANCE_DISCLAIMER}</p>
    </div>
  );
}
