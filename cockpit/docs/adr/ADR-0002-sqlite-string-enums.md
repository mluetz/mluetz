# ADR-0002: SQLite für Entwicklung, String-Statuswerte statt DB-Enums

- **Status:** Akzeptiert
- **Datum:** 2026-08-13

## Kontext

Gefordert sind PostgreSQL für Produktion und SQLite als lokale Entwicklungsoption.
Prisma unterstützt native Enums nicht mit dem SQLite-Provider.

## Entscheidung

1. Der Prisma-Provider steht im Repository auf `sqlite` (sofort lauffähig, keine
   Infrastruktur nötig). Für Produktion wird der Provider auf `postgresql` gestellt;
   das Schema ist bewusst Postgres-kompatibel gehalten (keine SQLite-Spezifika).
2. Alle Statuswerte werden als `String` gespeichert. Die gültigen Wertemengen sind
   zentral in `lib/domain/enums.ts` definiert (Single Source of Truth) und werden in
   jeder Server Action per Zod bzw. explizite Übergangstabellen (`RISK_TRANSITIONS`,
   `ACTION_TRANSITIONS`, `TP_TRANSITIONS`) validiert.

## Konsequenzen

- Vorteil: identisches Schema für beide Provider; einfache lokale Einrichtung.
- Nachteil: keine DB-seitige Enum-Integrität → wird durch serverseitige Validierung
  und Tests kompensiert. Bei Postgres-Migration können optional CHECK-Constraints
  ergänzt werden.
