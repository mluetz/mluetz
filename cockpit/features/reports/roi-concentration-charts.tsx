"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Locale } from "@/lib/i18n/config";

/**
 * Diagramme der Konzentrationsanalytik (Meldeschicht Welle 5, ADR-0009 Nr. 4).
 * Muster wie features/dashboard/charts.tsx: eine Kennzahl je Achse, Farben
 * über CSS-Token; Drittstaaten werden über die Warnfarbe hervorgehoben.
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

export function ProviderExposureChart({
  data,
  locale = "de",
}: {
  data: Array<{ tpId: string; cifServices: number }>;
  locale?: Locale;
}) {
  if (data.length === 0) return null;
  const label = locale === "de" ? "CIF-Dienstleistungen" : "CIF services";
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="tpId" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsl(var(--muted))" }} />
          <Bar
            dataKey="cifServices"
            name={label}
            fill="hsl(var(--primary))"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GeoConcentrationChart({
  data,
  locale = "de",
}: {
  data: Array<{ country: string; storageServices: number; isThirdCountry: boolean }>;
  locale?: Locale;
}) {
  if (data.length === 0) return null;
  const label = locale === "de" ? "Speicherort (Dienste)" : "Storage location (services)";
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="country" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsl(var(--muted))" }} />
          <Bar dataKey="storageServices" name={label} radius={[3, 3, 0, 0]}>
            {data.map((d) => (
              <Cell
                key={d.country}
                fill={d.isThirdCountry ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
