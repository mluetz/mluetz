import { Info } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";

/**
 * Pflicht-Hinweiskasten überall dort, wo Compliance-Status angezeigt oder bearbeitet werden.
 * Der deutsche Text (COMPLIANCE_DISCLAIMER aus lib/domain/enums.ts) bleibt die Referenz;
 * bei locale="en" wird die englische Fassung aus dem Wörterbuch angezeigt.
 */
export function ComplianceDisclaimer({ locale = "de" }: { locale?: Locale }) {
  return (
    <div
      role="note"
      className="mb-4 flex items-start gap-2 rounded-md border border-risk-medium/40 bg-risk-medium/10 p-3 text-xs text-foreground"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-risk-medium" aria-hidden />
      <p>{OPS_MESSAGES[locale].governance.disclaimer}</p>
    </div>
  );
}
