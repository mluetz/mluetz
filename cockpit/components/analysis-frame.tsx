"use client";

import { useEffect, useRef } from "react";

/**
 * Bettet ein eigenständiges HTML-Dokument (z. B. eine Marktanalyse aus
 * lib/content/analyses/) per srcDoc-iframe ein. Das Dokument bringt eigene
 * Stile mit und bleibt so vom App-CSS isoliert. Synchronisiert werden:
 * - das Theme: der App-Zustand (Klasse "dark" auf <html>) wird als
 *   data-theme in das Dokument gespiegelt, dessen CSS darauf reagiert;
 * - die Höhe: das iframe wächst mit dem Inhalt, damit die App-Seite
 *   normal scrollt statt eines verschachtelten Scrollbereichs.
 */
export function AnalysisFrame({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;

    const syncTheme = () => {
      const doc = iframe.contentDocument;
      if (!doc?.documentElement) return;
      const dark = document.documentElement.classList.contains("dark");
      doc.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    const syncHeight = () => {
      const body = iframe.contentDocument?.body;
      if (body) iframe.style.height = `${body.scrollHeight}px`;
    };

    let resizeObserver: ResizeObserver | null = null;
    const attach = () => {
      syncTheme();
      syncHeight();
      const body = iframe.contentDocument?.body;
      if (body && !resizeObserver) {
        resizeObserver = new ResizeObserver(syncHeight);
        resizeObserver.observe(body);
      }
    };

    iframe.addEventListener("load", attach);
    attach();

    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      iframe.removeEventListener("load", attach);
      themeObserver.disconnect();
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <iframe
      ref={ref}
      srcDoc={html}
      title={title}
      className="w-full rounded-lg border bg-card"
      style={{ height: "80vh" }}
    />
  );
}
