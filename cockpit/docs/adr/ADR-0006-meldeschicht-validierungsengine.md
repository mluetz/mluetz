# ADR-0006: Meldeschicht Welle 2 – Validierungsengine für das Informationsregister

- **Status:** Akzeptiert
- **Datum:** 2026-08-30
- **Bezug:** ADR-0005 (Registermodell); Auftrag „Meldeschicht", Welle 2

## Kontext

Das Register aus Welle 1 muss gegen aufsichtliche Prüfregeln validiert werden
(ESA-Trockenlauf 2024: nur ~6,5 % der Einreichungen bestanden alle Prüfungen;
80 % der Fehler in B_02.02 und B_07.01). Review v3 enthält bereits einen
leichten Validierungslauf (`lib/register/data.ts`), aber ohne Regel-IDs,
ohne REJECT-Stufe und nicht auf dem Welle-1-Modell.

## Entscheidungen

1. **Neue Engine `lib/domain/roi-validation.ts`:** reine, synchrone Funktionen
   über dem `RoiInput` aus `roi-build.ts` (nicht über den gebauten
   Meldebogen-Zeilen) — nur so tragen Befunde die Datensatz-IDs für den
   Sprung zum betroffenen Objekt.
2. **Regelkatalog mit eigenen IDs (`RV-…`),** aufsichtliche Entsprechungen
   (805/806/807) sind als Kommentar vermerkt, nicht als amtliche IDs
   ausgegeben. Schweregrade: `REJECT` (Schlüssel/Duplikate/Referenzen/Zyklen),
   `ERROR` (Pflichtfelder, Formate, Wertelisten), `WARNING` (Plausibilität).
3. **Befundformat:** Regel-ID, Schweregrad, Meldebogen, Datensatzart und -ID,
   fachliche Referenz, Feldname, handlungsleitender Klartext DE/EN (Katalog in
   der Engine; UI wählt nach Locale).
4. **Wertelistenprüfung mit B_99.01-Ausnahme:** ein nicht in der Taxonomie
   enthaltener Code erzeugt keinen Befund, wenn eine entitätsspezifische
   Definition (`field=<pfad>=<code>`) vorliegt — die landet in B_99.01.
5. **Kettenrang-Konvention:** `Subcontractor.rank` behält die
   Review-v3-Semantik (Rang 1 = erste Weitervergabestufe). Im Meldebogen
   B_05.02 ist Rang 1 der direkte Dienstleister; `roi-build` verschiebt
   deshalb beim Aufbau um +1. Die Rangprüfung läuft auf den gespeicherten
   Werten (Wurzelglied Rang 1 ohne parent, lückenlos, zyklenfrei).
6. **GLEIF-Abgleich nur als Schnittstelle** (`LeiStatusProvider`, separater
   asynchroner Lauf `validateLeiStatus`): keine HTTP-Implementierung, keine
   Laufzeitabhängigkeit — der Synology-Betrieb ist nicht zwingend online.
7. **UI:** Die Registerseite (`app/(app)/register`) zeigt die Befunde der
   neuen Engine (Regel-ID, Schweregrad inkl. REJECT, Sprunglink); der alte
   Validierungslauf bleibt vorerst für das Exportprotokoll bestehen und wird
   in Welle 3 abgelöst.
8. **Messbare Abdeckung:** `@vitest/coverage-v8` als devDependency (einzige
   neue Abhängigkeit dieser Welle; nur Messwerkzeug, nicht im Laufzeit-Image).

## Konsequenzen

- Fachliche Prüftiefe liegt bei B_02.02 und B_07.01 (eigene Pflichtfeldregeln
  je Dienstleistung und Bewertung), entsprechend der Fehlerverteilung des
  Trockenlaufs.
- Die exakten Pflichtfeldmengen der ITS bleiben `TODO(verify)`; die Engine
  prüft die im Datenmodell abbildbaren Pflichtangaben.
