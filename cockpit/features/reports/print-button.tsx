"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Öffnet den Browser-Druckdialog (Drucken bzw. „Als PDF speichern"). */
export function PrintButton() {
  return (
    <Button type="button" variant="outline" className="no-print" onClick={() => window.print()}>
      <Printer className="h-4 w-4" aria-hidden /> Drucken / PDF
    </Button>
  );
}
