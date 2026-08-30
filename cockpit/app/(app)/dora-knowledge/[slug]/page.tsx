import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { requirePermission } from "@/lib/authz";
import { getLocale } from "@/lib/i18n/server";
import { KNOWLEDGE_MESSAGES } from "@/lib/i18n/messages/knowledge";
import { getHandbookContent, getKnowledgeContent } from "@/lib/content/knowledge-locale";
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
  const locale = await getLocale();
  const t = KNOWLEDGE_MESSAGES[locale];
  const { glossary } = getKnowledgeContent(locale);
  const handbook = getHandbookContent(locale);

  const index = handbook.sections.findIndex((s) => s.slug === slug);
  if (index < 0) notFound();
  const section = handbook.sections[index]!;
  const prev = index > 0 ? handbook.sections[index - 1] : undefined;
  const next = index < handbook.sections.length - 1 ? handbook.sections[index + 1] : undefined;

  const group = handbook.groups.find((g) => g.id === section.groupId);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={`${section.chapter} – ${section.title}`}
        description={t.handbook.sourceNote(group?.title ?? t.handbook.fallbackGroup)}
        crumbs={[
          { label: t.page.crumbOverview, href: "/overview" },
          { label: t.page.crumbSelf, href: "/dora-knowledge" },
          { label: section.chapter },
        ]}
      />

      <div className="rounded-lg border bg-card p-5">
        <HandbookSectionBody
          section={section}
          glossary={glossary}
          figures={handbook.figures}
          locale={locale}
        />
      </div>

      <nav
        className="mt-4 flex items-stretch justify-between gap-3"
        aria-label={t.handbook.navAria}
      >
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
