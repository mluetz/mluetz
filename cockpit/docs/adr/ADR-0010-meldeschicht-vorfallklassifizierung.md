# ADR-0010: Meldeschicht Welle 6 – Vorfallklassifizierung vervollständigen

- **Status:** Akzeptiert
- **Datum:** 2026-08-30
- **Bezug:** ADR-0005–0009; Auftrag „Meldeschicht", Welle 6; Review v3 P1-04

## Kontext

Review v3 erfasst die Klassifizierungskriterien als acht Zeilen mit
Freitext-Istwert und Häkchen „erfüllt" und leitet „schwerwiegend" nach einer
vereinfachten Regel ab. Der Auftrag verlangt die **sieben Kriterien der
Delegierten Verordnung (EU) 2024/1772 als Messwerte**, die Major-Regel als
reine Funktion (Kritikalität UND (Datenverlust ODER mindestens zwei weitere
Kriterien)), die Aggregation wiederkehrender Vorfälle über sechs Monate und
entitätstypabhängige Fristenuhren.

## Entscheidungen

1. **Sieben Kriterien statt acht:** Kunden/Gegenparteien/Transaktionen sind
   in der DelVO EIN Kriterium; der Katalog wird auf die sieben Schlüssel
   `CLIENTS_TRANSACTIONS | REPUTATION | DURATION | GEO | DATA_LOSS |
CRITICAL_SERVICES | ECONOMIC` umgestellt. Bestandsdaten mit den alten
   Schlüsseln `CLIENTS`/`TRANSACTIONS` bleiben lesbar; `deriveIsMajor`
   normalisiert Altschlüssel auf das Sammelkriterium.
2. **Messwerte statt Häkchen:** `IncidentMeasurements` erfasst je Kriterium
   Zahlenwerte (Kunden absolut/relativ, Gegenparteien relativ, Transaktionen
   Anzahl/Wert/Anteil, Dauer und Dienstausfall in Stunden, betroffene
   Mitgliedstaaten, wirtschaftliche Auswirkung in EUR) bzw. benannte
   Indikatoren (Reputation; Datenverlust je Schutzziel Verfügbarkeit/
   Integrität/Vertraulichkeit/Authentizität; CIF-Betroffenheit).
   `evaluateCriteria(messwerte)` leitet „erfüllt" gegen Schwellwerte ab —
   die Schwellwerte sind **Arbeitswerte mit TODO(verify)** gegen die DelVO
   (EU) 2024/1772 und zentral konfigurierbar (`CLASSIFICATION_THRESHOLDS`).
   Die Messwerte werden zusätzlich roh persistiert
   (`IncidentClassification.measurements`, Update 0011) — Neubewertung bei
   Schwellwertänderung ohne Datenverlust.
3. **Major-Regel exakt nach Auftrag:** schwerwiegend ⇔ Kritikalität erfüllt
   UND (Datenverlust erfüllt ODER mindestens zwei weitere Kriterien
   erfüllt). Ersetzt die vereinfachte Review-v3-Regel; Tests angepasst.
4. **Aggregation wiederkehrender Vorfälle** (`aggregateRecurring`): Vorfälle
   gleicher Ursache innerhalb von sechs Monaten (Gruppierung durch die
   Anwender über `aggregatedWith`) werden kumuliert — Zählwerte summiert,
   Indikatoren verodert, Dauer summiert, geografische Ausbreitung maximiert —
   und gegen dieselben Kriterien bewertet; Ergebnis ist ein aggregierter
   schwerwiegender Vorfall. Vereinfachung der RTS-Art.-8-Abs.-2-Logik,
   TODO(verify).
5. **Entitätstypabhängige Fristenuhren:** Fällt die Frist der DORA-Erst-
   oder Zwischenmeldung auf ein Wochenende, verschiebt sie sich auf den
   nächsten Arbeitstag 12:00 UTC — **nicht** für Kreditinstitute, zentrale
   Gegenparteien, Handelsplatzbetreiber und NIS-2-relevante Einheiten
   (`workingDayShiftApplies`). Ohne Angabe des Entitätstyps bleibt das
   bisherige Verhalten (keine Verschiebung). Feiertagskalender bewusst
   nicht abgebildet (TODO(verify), dokumentierte Vereinfachung).
   Der Entitätstyp kommt aus der Register führenden Einheit
   (`ReportingEntity.entityType`, Welle 1).

## Konsequenzen

- Der Klassifizierungsassistent erfasst Zahlen statt Freitext; „erfüllt"
  wird angezeigt, nicht angeklickt. Eingefrorene Bestandsklassifizierungen
  bleiben unverändert lesbar.
- Schwellwertpflege ist eine zentrale Codeänderung mit Testabdeckung, keine
  UI-Wanderung durch alle Vorfälle.
