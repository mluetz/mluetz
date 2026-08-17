"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { setLocale } from "@/lib/i18n/actions";
import { cn } from "@/lib/utils";

const ARIA_LABEL: Record<Locale, string> = {
  de: "Sprache wählen",
  en: "Select language",
};

/** Umschalter DE/EN – setzt den Sprach-Cookie und rendert die Seite neu. */
export function LanguageToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function choose(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={ARIA_LABEL[locale]}
      className="flex items-center rounded-md border p-0.5 text-xs font-semibold"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={l === locale}
          disabled={pending}
          className={cn(
            "rounded px-2 py-1 uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            l === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
