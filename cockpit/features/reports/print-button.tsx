"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import { REPORTS_MESSAGES } from "@/lib/i18n/messages/reports";

/** Öffnet den Browser-Druckdialog (Drucken bzw. „Als PDF speichern"). */
export function PrintButton({ locale }: { locale: Locale }) {
  const t = REPORTS_MESSAGES[locale];
  return (
    <Button type="button" variant="outline" className="no-print" onClick={() => window.print()}>
      <Printer className="h-4 w-4" aria-hidden /> {t.buttons.print}
    </Button>
  );
}
