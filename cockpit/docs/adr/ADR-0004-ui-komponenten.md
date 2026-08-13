# ADR-0004: Handgeführte shadcn-artige UI-Komponenten statt shadcn/ui-CLI

- **Status:** Akzeptiert
- **Datum:** 2026-08-13

## Kontext

Gefordert sind Tailwind CSS und shadcn/ui. shadcn/ui ist keine Bibliothek, sondern
ein Generator, der Komponenten (auf Radix-Basis) ins Projekt kopiert.

## Entscheidung

Die benötigten Komponenten (`Button`, `Card`, `Badge`, `Input/Select/Textarea`,
`Table`, `Tabs`) werden im shadcn-Stil direkt unter `components/ui/` gepflegt –
gleiche Design-Tokens (CSS-Variablen `--background`, `--primary`, … mit
Hell-/Dunkel-Varianten), gleiche API-Konventionen (`cn()`-Merge via
clsx + tailwind-merge). Auf Radix-Primitives wird zunächst verzichtet; Tabs sind
barrierearm (ARIA-Rollen) selbst implementiert.

Formulare nutzen Server Actions mit `useActionState` und serverseitiger
Zod-Validierung; React Hook Form bleibt für komplexe, hochinteraktive Formulare
als spätere Ergänzung vorgesehen.

## Konsequenzen

- Weniger Abhängigkeiten, volle Kontrolle, identisches Look-and-Feel zu shadcn/ui;
  spätere Übernahme originaler shadcn-Komponenten ist ohne Bruch möglich (gleiche
  Token-Struktur).
- Komplexe Overlay-Komponenten (Dialog, Combobox) sind bewusst noch nicht enthalten;
  kritische Aktionen nutzen stattdessen explizite Formulare mit Pflichtbegründung.
