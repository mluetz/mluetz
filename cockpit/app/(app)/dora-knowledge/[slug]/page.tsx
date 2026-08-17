import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { requirePermission } from "@/lib/authz";
import {
  getHandbookNeighbors,
  getHandbookSection,
  HANDBOOK_GROUPS,
} from "@/lib/content/dora-handbook";
import { HandbookSectionBody } from "@/features/dora/handbook-client";
import { PageHeader } from "@/components/page-header";
import { COMPLIANCE_DISCLAIMER } from "@/lib/domain/enums";

export const dynamic = "force-dynamic";

export default async function HandbookSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requirePermission("risk:read");
  const { slug } = await params;
  const section = getHandbookSection(slug);
  if (!section) notFound();

  const group = HANDBOOK_GROUPS.find((g) => g.id === section.groupId);
  const { prev, next } = getHandbookNeighbors(slug);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={`${section.chapter} – ${section.title}`}
        description={`${group?.title ?? "DORA-Handbuch"} · Quelle: FRWK-DORA-001 v1.0 (Gesamtbetrachtung DORA). Markierte Fachbegriffe sind anklickbar, Abbildungen öffnen per Klick eine Großansicht.`}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "DORA Wissensbasis", href: "/dora-knowledge" },
          { label: section.chapter },
        ]}
      />

      <div className="rounded-lg border bg-card p-5">
        <HandbookSectionBody section={section} />
      </div>

      <nav className="mt-4 flex items-stretch justify-between gap-3" aria-label="Kapitelnavigation">
        {prev ? (
          <Link
            href={`/dora-knowledge/${prev.slug}`}
            className="group flex min-w-0 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0">
              <span className="block text-[11px] text-muted-foreground">{prev.chapter}</span>
              <span className="block truncate font-medium">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/dora-knowledge/${next.slug}`}
            className="group flex min-w-0 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-right text-sm transition-colors hover:bg-accent"
          >
            <span className="min-w-0">
              <span className="block text-[11px] text-muted-foreground">{next.chapter}</span>
              <span className="block truncate font-medium">{next.title}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <p className="mt-6 text-xs text-muted-foreground">{COMPLIANCE_DISCLAIMER}</p>
    </div>
  );
}
