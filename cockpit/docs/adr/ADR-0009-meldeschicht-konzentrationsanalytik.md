# ADR-0009: Meldeschicht Welle 5 – Konzentrationsanalytik

- **Status:** Akzeptiert
- **Datum:** 2026-08-30
- **Bezug:** ADR-0005–0008; Auftrag „Meldeschicht", Welle 5

## Kontext

Mehrstufige Konzentrationsanalytik über den Registerbestand — ausdrücklich
als Auswertung, nicht als neues Datenmodell. Review v3 liefert bereits die
Kettenkonzentration über die Subunternehmerkette
(`lib/domain/concentration.ts`, Registerseite).

## Entscheidungen

1. **Neues Auswertungsmodul `lib/domain/roi-concentration.ts`** (reine
   Funktionen über dem `RoiInput` aus Welle 1/2) mit vier Sichten:
   Exponierung je Dienstleister (CIF-gestützte Verträge/Dienstleistungen,
   betroffene Funktionen, Anteil an allen CIF-Diensten), Kettenkonzentration
   (Subdienstleister unter mehreren unabhängigen Direktanbietern;
   Schlüsselbildung über LEI, sonst normalisierter Name — wie Review v3),
   geografische Konzentration (Speicher-/Verarbeitungsorte je
   Dienstleistung mit Vertragsrückfall, Drittstaatenkennzeichen) und
   CTPP-Exponierung.
2. **CTPP-Stammdatendatei `lib/content/ctpp-list.ts`:** Die amtliche Liste
   der benannten kritischen IKT-Drittdienstleister wird als gepflegte
   Datendatei geführt (Name, LEI, Benennungsdatum, Quelle) und ist
   **bewusst leer ausgeliefert** — die Einträge sind aus der
   ESA-Veröffentlichung zu übernehmen (Leitplanke: keine erfundenen
   Regulierungsfakten). Der Abgleich meldet drei Zustände: nur im Cockpit
   gekennzeichnet, nur auf der Liste, bestätigt (beides).
3. **EU/EWR-Länderliste `lib/content/eea-countries.ts`** als Stammdaten für
   das Drittstaatenkennzeichen (EU-27 + EWR-Staaten, mit Standsdatum);
   Drittstaat = Speicher-/Verarbeitungsort außerhalb dieser Menge.
4. **Darstellung:** neuer Berichtstyp `ROI_CONCENTRATION` in
   `features/reports/` (Tabellen + vorhandene Recharts-Muster); die
   bestehende Kettenkonzentrations-Karte der Registerseite bleibt.

## Konsequenzen

- Kein Schemazuwachs, kein Migrationsskript.
- Die Analytik rechnet auf demselben Datenabzug wie Validierung und Export
  (eine Quelle, keine Abweichungen zwischen Bericht und Meldung).
- Ohne gepflegte CTPP-Liste zeigt der Bericht nur die im Cockpit
  gekennzeichneten CTPPs und weist auf die fehlende Listenpflege hin.
