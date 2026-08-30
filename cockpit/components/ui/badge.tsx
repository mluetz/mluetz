import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "low" | "medium" | "high" | "critical";

const variants: Record<Variant, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "text-foreground",
  // Risikoklassen: Farbe + Text, nie Farbe allein
  low: "border-transparent bg-risk-low/15 text-risk-low dark:bg-risk-low/20",
  medium: "border-transparent bg-risk-medium/15 text-risk-medium dark:bg-risk-medium/20",
  high: "border-transparent bg-risk-high/15 text-risk-high dark:bg-risk-high/20",
  critical: "border-transparent bg-risk-critical/15 text-risk-critical dark:bg-risk-critical/20",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

/** Mappt Risikoklasse auf Badge-Variante. */
export function riskClassVariant(riskClass: string): Variant {
  switch (riskClass) {
    case "LOW":
      return "low";
    case "MEDIUM":
      return "medium";
    case "HIGH":
      return "high";
    case "CRITICAL":
      return "critical";
    default:
      return "secondary";
  }
}
