"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, ExternalLink, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import { KNOWLEDGE_MESSAGES } from "@/lib/i18n/messages/knowledge";
import type { DoraPillar, GlossaryEntry } from "@/lib/content/dora-knowledge";

/**
 * Interaktive DORA-Wissensbasis:
 * – 5 Kernsäulen als barrierearme Akkordeons (aria-expanded, Tastatur)
 * – [[Begriff]]-Markierungen werden als klickbare Fachbegriffe gerendert,
 *   die ein Erklär-Modal im Bankenkontext öffnen.
 * Inhalte (Säulen, Glossar) kommen sprachabhängig vom Server als Props.
 */

/** Zerlegt einen Absatz in Text- und Glossar-Segmente (auch vom Handbuch genutzt). */
export function renderWithTerms(
  text: string,
  onTerm: (key: string) => void,
  glossary: Record<string, GlossaryEntry>,
  explainTerm: (title: string) => string,
): React.ReactNode[] {
  const parts = text.split(/\[\[(.+?)\]\]/g);
  return parts.map((part, i) => {
    // Ungerade Indizes sind die Capture-Gruppen (= Begriffe)
    if (i % 2 === 1) {
      const known = part in glossary;
      if (!known) return <React.Fragment key={i}>{part}</React.Fragment>;
      return (
        <button
          key={i}
          type="button"
          onClick={() => onTerm(part)}
          className="rounded-sm font-medium text-primary underline decoration-dotted underline-offset-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title={explainTerm(glossary[part]!.title)}
        >
          {part}
        </button>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export interface PillarScore {
  scorePercent: number;
  status: "GREEN" | "YELLOW" | "RED";
  openKnockouts: number;
  chapterKey: string;
}

const SCORE_CLASS: Record<PillarScore["status"], string> = {
  GREEN: "bg-risk-low/15 text-risk-low border-risk-low/40",
  YELLOW: "bg-risk-medium/15 text-risk-medium border-risk-medium/40",
  RED: "bg-risk-critical/15 text-risk-critical border-risk-critical/40",
};

function PillarAccordion({
  pillar,
  index,
  open,
  onToggle,
  onTerm,
  score,
  glossary,
  locale,
}: {
  pillar: DoraPillar;
  index: number;
  open: boolean;
  onToggle: () => void;
  onTerm: (key: string) => void;
  score?: PillarScore;
  glossary: Record<string, GlossaryEntry>;
  locale: Locale;
}) {
  const t = KNOWLEDGE_MESSAGES[locale];
  const panelId = `dora-panel-${pillar.id}`;
  const buttonId = `dora-button-${pillar.id}`;
  const withTerms = (text: string) => renderWithTerms(text, onTerm, glossary, t.modal.explainTerm);
  return (
    <div className="rounded-lg border bg-card">
      <h2>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-lg p-4 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold leading-snug">{pillar.title}</span>
            <span className="block text-xs text-muted-foreground">
              {pillar.chapter} · {pillar.articles}
            </span>
          </span>
          {score ? (
            <span
              className={cn(
                "shrink-0 rounded-md border px-2 py-1 text-[11px] font-semibold",
                SCORE_CLASS[score.status],
              )}
              title={
                score.openKnockouts > 0
                  ? t.pillars.scoreTitleKnockouts(score.openKnockouts)
                  : t.pillars.scoreTitleDefault
              }
            >
              {score.scorePercent} % · {t.pillars.light[score.status]}
              {score.openKnockouts > 0 ? ` · ${score.openKnockouts} KO` : ""}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </h2>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="space-y-4 border-t p-4"
        >
          <div className="space-y-3 text-sm leading-relaxed">
            {pillar.paragraphs.map((p, i) => (
              <p key={i}>{withTerms(p)}</p>
            ))}
          </div>
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" aria-hidden />
              {t.pillars.tasksHeading}
            </p>
            <ul className="space-y-1.5 text-sm">
              {pillar.isrmTasks.map((task, i) => (
                <li key={i} className="flex gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    aria-hidden
                  />
                  <span>{withTerms(task)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">{t.pillars.cockpitLead}</span>
            {score ? (
              <Link
                href={`/dora/requirements?chapter=${score.chapterKey}`}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium transition-colors hover:bg-accent"
              >
                {t.pillars.chapterRequirements}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
            ) : null}
            {pillar.cockpitLinks.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition-colors hover:bg-accent"
              >
                {l.label}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DoraKnowledgeBase({
  scores,
  pillars,
  glossary,
  locale,
}: {
  scores?: Record<string, PillarScore>;
  pillars: DoraPillar[];
  glossary: Record<string, GlossaryEntry>;
  locale: Locale;
}) {
  const t = KNOWLEDGE_MESSAGES[locale];
  const [openId, setOpenId] = React.useState<string | null>(pillars[0]?.id ?? null);
  const [term, setTerm] = React.useState<string | null>(null);
  const entry = term ? glossary[term] : undefined;

  return (
    <div className="space-y-3">
      {pillars.map((pillar, i) => (
        <PillarAccordion
          key={pillar.id}
          pillar={pillar}
          index={i}
          open={openId === pillar.id}
          onToggle={() => setOpenId((cur) => (cur === pillar.id ? null : pillar.id))}
          onTerm={setTerm}
          score={scores?.[pillar.id]}
          glossary={glossary}
          locale={locale}
        />
      ))}

      <Modal
        open={!!entry}
        onClose={() => setTerm(null)}
        title={entry?.title ?? ""}
        closeLabel={t.modal.close}
      >
        <p className="text-sm leading-relaxed">{entry?.definition}</p>
        <p className="mt-4 flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t.modal.footer}
        </p>
      </Modal>
    </div>
  );
}

export function GlossaryIndex({
  glossary,
  locale,
}: {
  glossary: Record<string, GlossaryEntry>;
  locale: Locale;
}) {
  const t = KNOWLEDGE_MESSAGES[locale];
  const [term, setTerm] = React.useState<string | null>(null);
  const entry = term ? glossary[term] : undefined;
  // Dubletten (Flexionsformen) über den Titel zusammenführen
  const unique = new Map<string, string>();
  for (const [key, value] of Object.entries(glossary)) {
    if (!unique.has(value.title)) unique.set(value.title, key);
  }
  const entries = [...unique.entries()].sort(([a], [b]) => a.localeCompare(b, locale));

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {entries.map(([title, key]) => (
          <Badge key={key} variant="outline" className="p-0">
            <button
              type="button"
              onClick={() => setTerm(key)}
              className="rounded-md px-2 py-0.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {title}
            </button>
          </Badge>
        ))}
      </div>
      <Modal
        open={!!entry}
        onClose={() => setTerm(null)}
        title={entry?.title ?? ""}
        closeLabel={t.modal.close}
      >
        <p className="text-sm leading-relaxed">{entry?.definition}</p>
      </Modal>
    </>
  );
}
