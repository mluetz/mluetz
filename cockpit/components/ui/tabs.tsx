"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Leichtgewichtige, barrierearme Tabs (Rolle tablist/tab/tabpanel).
 *
 * Tab-Zustand in der URL (Review v3, P3-04): ?tab=<value> wird beim Laden
 * gelesen und bei jedem Wechsel per history.replaceState gespiegelt —
 * Deep-Links, Druck und Screenshot-Nachweise treffen damit den richtigen
 * Tab. Bewusst ohne useSearchParams, damit keine Suspense-Grenze nötig ist;
 * SSR rendert defaultValue, der Client korrigiert unmittelbar nach Mount.
 */

const TabsContext = React.createContext<{
  value: string;
  setValue: (v: string) => void;
}>({ value: "", setValue: () => {} });

export function Tabs({
  defaultValue,
  children,
  className,
  urlParam = "tab",
}: {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
  /** Query-Parameter für den Tab-Zustand; null deaktiviert die URL-Kopplung. */
  urlParam?: string | null;
}) {
  const [value, setValueState] = React.useState(defaultValue);

  React.useEffect(() => {
    if (!urlParam) return;
    const fromUrl = new URLSearchParams(window.location.search).get(urlParam);
    if (fromUrl) setValueState(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlParam]);

  const setValue = React.useCallback(
    (v: string) => {
      setValueState(v);
      if (!urlParam) return;
      const url = new URL(window.location.href);
      url.searchParams.set(urlParam, v);
      window.history.replaceState(window.history.state, "", url);
    },
    [urlParam],
  );

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-card text-foreground shadow-sm" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" className="mt-3">
      {children}
    </div>
  );
}
