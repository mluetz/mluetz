"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, BookOpen, ExternalLink, Info, OctagonAlert, ZoomIn } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import { KNOWLEDGE_MESSAGES } from "@/lib/i18n/messages/knowledge";
import type { GlossaryEntry } from "@/lib/content/dora-knowledge";
import type {
  HandbookBlock,
  HandbookFigure,
  HandbookSection,
} from "@/lib/content/dora-handbook";
import { renderWithTerms } from "@/features/dora/knowledge-client";

/**
 * Renderer für die Handbuch-Kapitel der DORA-Wissensbasis:
 * Absätze/Listen/Hinweiskästen mit klickbaren [[Fachbegriffen]],
 * Abbildungen aus FRWK-DORA-001 (Klick öffnet Großansicht) und horizontal
 * scrollbare Tabellen. Inhalte und Glossar kommen sprachabhängig als Props.
 */

const CALLOUT_STYLE: Record<
  "info" | "warn" | "danger",
  { border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  info: { border: "border-primary/40 bg-primary/5", icon: Info },
  warn: { border: "border-risk-medium/50 bg-risk-medium/10", icon: AlertTriangle },
  danger: { border: "border-risk-critical/50 bg-risk-critical/10", icon: OctagonAlert },
};

function FigureBlock({
  num,
  figures,
  figureWord,
  zoomTitle,
  onZoom,
}: {
  num: number;
  figures: Record<number, HandbookFigure>;
  figureWord: string;
  zoomTitle: string;
  onZoom: (num: number) => void;
}) {
  const fig = figures[num];
  if (!fig) return null;
  return (
    <figure className="my-4">
      <button
        type="button"
        onClick={() => onZoom(num)}
        title={zoomTitle}
        className="group relative block w-full overflow-hidden rounded-lg border bg-white p-2 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Image
          src={fig.src}
          alt={`${figureWord} ${num}: ${fig.caption}`}
          width={fig.width}
          height={fig.height}
          unoptimized
          className="mx-auto h-auto w-full max-w-3xl"
        />
        <span className="absolute right-3 top-3 rounded-md border bg-card/90 p-1.5 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          <ZoomIn className="h-4 w-4" aria-hidden />
        </span>
      </button>
      <figcaption className="mt-2 text-center text-xs text-muted-foreground">
        <span className="font-semibold">
          {figureWord} {num}:
        </span>{" "}
        {fig.caption}
      </figcaption>
    </figure>
  );
}

function Block({
  block,
  withTerms,
  renderFigure,
}: {
  block: HandbookBlock;
  withTerms: (text: string) => React.ReactNode[];
  renderFigure: (num: number) => React.ReactNode;
}) {
  switch (block.kind) {
    case "p":
      return <p className="text-sm leading-relaxed">{withTerms(block.text)}</p>;
    case "h3":
      return <h3 className="pt-2 text-sm font-semibold">{block.text}</h3>;
    case "list": {
      const items = block.items.map((item, i) => (
        <li key={i} className="flex gap-2">
          {block.ordered ? (
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
              {i + 1}
            </span>
          ) : (
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
          )}
          <span className="text-sm leading-relaxed">{withTerms(item)}</span>
        </li>
      ));
      return block.ordered ? (
        <ol className="space-y-2">{items}</ol>
      ) : (
        <ul className="space-y-1.5">{items}</ul>
      );
    }
    case "figure":
      return <>{renderFigure(block.num)}</>;
    case "table":
      return (
        <div className="my-4">
          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{block.title}</p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  {block.head.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-xs font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri} className="border-b align-top last:border-0 hover:bg-accent/30">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={cn(
                          "px-3 py-2 text-xs leading-relaxed",
                          ci === 0 && "font-medium",
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case "callout": {
      const style = CALLOUT_STYLE[block.tone];
      const Icon = style.icon;
      return (
        <div className={cn("rounded-lg border p-3", style.border)}>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {block.title}
          </p>
          <p className="text-sm leading-relaxed">{withTerms(block.text)}</p>
        </div>
      );
    }
  }
}

export function HandbookSectionBody({
  section,
  glossary,
  figures,
  locale,
}: {
  section: HandbookSection;
  glossary: Record<string, GlossaryEntry>;
  figures: Record<number, HandbookFigure>;
  locale: Locale;
}) {
  const t = KNOWLEDGE_MESSAGES[locale];
  const [term, setTerm] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState<number | null>(null);
  const entry = term ? glossary[term] : undefined;
  const zoomFig = zoom != null ? figures[zoom] : undefined;

  const withTerms = (text: string) =>
    renderWithTerms(text, setTerm, glossary, t.modal.explainTerm);
  const renderFigure = (num: number) => (
    <FigureBlock
      num={num}
      figures={figures}
      figureWord={t.handbook.figure}
      zoomTitle={t.handbook.zoomTitle}
      onZoom={setZoom}
    />
  );

  return (
    <div className="space-y-4">
      {section.blocks.map((block, i) => (
        <Block key={i} block={block} withTerms={withTerms} renderFigure={renderFigure} />
      ))}

      <div className="flex flex-wrap items-center gap-2 border-t pt-4 text-xs">
        <span className="text-muted-foreground">{t.handbook.cockpitLead}</span>
        {section.cockpitLinks.map((l) => (
          <Link
            key={l.href + l.label}
            href={l.href}
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium transition-colors hover:bg-accent"
          >
            {l.label}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </Link>
        ))}
      </div>

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

      <Modal
        open={!!zoomFig}
        onClose={() => setZoom(null)}
        title={zoomFig ? `${t.handbook.figure} ${zoom}: ${zoomFig.caption}` : ""}
        closeLabel={t.modal.close}
        className="max-w-6xl"
      >
        {zoomFig ? (
          <div className="overflow-auto rounded-md bg-white p-2">
            <Image
              src={zoomFig.src}
              alt={`${t.handbook.figure} ${zoom}: ${zoomFig.caption}`}
              width={zoomFig.width}
              height={zoomFig.height}
              unoptimized
              className="mx-auto h-auto w-full"
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
