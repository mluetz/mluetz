import { Info } from "lucide-react";
import { COMPLIANCE_DISCLAIMER } from "@/lib/domain/enums";

/** Pflicht-Hinweiskasten überall dort, wo Compliance-Status angezeigt oder bearbeitet werden. */
export function ComplianceDisclaimer() {
  return (
    <div
      role="note"
      className="mb-4 flex items-start gap-2 rounded-md border border-risk-medium/40 bg-risk-medium/10 p-3 text-xs text-foreground"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-risk-medium" aria-hidden />
      <p>{COMPLIANCE_DISCLAIMER}</p>
    </div>
  );
}
