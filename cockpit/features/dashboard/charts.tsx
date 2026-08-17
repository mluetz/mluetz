"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Locale } from "@/lib/i18n/config";
import { CORE_MESSAGES } from "@/lib/i18n/messages/core";

/**
 * Diagramme (Recharts). Eine Kennzahl je Achse, einfarbige Marken über
 * CSS-Token (hell/dunkel), Identität über Achsenbeschriftung statt Farbe.
 */

const AXIS_TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" } as const;
const GRID_STROKE = "hsl(var(--border))";
const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--foreground))",
} as const;

export function ResidualTrendChart({
  data,
  locale = "de",
}: {
  data: Array<{ month: string; avgResidual: number; count: number }>;
  locale?: Locale;
}) {
  const t = CORE_MESSAGES[locale].charts;
  if (data.length === 0)
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{t.noAssessmentData}</p>
    );
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: GRID_STROKE }}
        />
        <YAxis domain={[0, 25]} tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number | string, name) => [
            value,
            name === "avgResidual" ? t.avgResidual : t.assessments,
          ]}
          labelFormatter={(l) => t.monthLabel(String(l))}
        />
        <Line
          type="monotone"
          dataKey="avgResidual"
          name="avgResidual"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3, fill: "hsl(var(--primary))" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CountBarChart({
  data,
  height = 220,
  locale = "de",
}: {
  data: Array<{ name: string; count: number }>;
  height?: number;
  locale?: Locale;
}) {
  const t = CORE_MESSAGES[locale].charts;
  if (data.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">{t.noData}</p>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 40 }}>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: GRID_STROKE }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number | string) => [v, t.risks]} />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
