# ADR-0007: Meldeschicht Welle 3 – Export und Meldestand

- **Status:** Akzeptiert
- **Datum:** 2026-08-30
- **Bezug:** ADR-0005/0006; Auftrag „Meldeschicht", Welle 3

## Kontext

Das validierte Register muss als Meldepaket (ZIP mit einer CSV je Meldebogen,
Metadaten, Prüfbericht) exportiert und als unveränderlicher Meldestand
(`RoiSnapshot`) historisiert werden; die Abgabe braucht ein Vier-Augen-Prinzip
und einen Differenzbericht gegen den Vorstand.

## Entscheidungen

1. **ZIP mit Bordmitteln:** eigener, minimaler Store-only-ZIP-Writer
   (`lib/domain/zip.ts`, CRC-32 über `node:zlib.crc32`) statt einer neuen
   Abhängigkeit. CSV-Dateien sind klein; Kompression ist verzichtbar,
   Nachvollziehbarkeit nicht.
2. **Paketkonvention** (`lib/domain/roi-export.ts`, reine Funktionen):
   `report/B_xx.yy.csv` je Meldebogen (UTF-8, `;`-getrennt, feste
   Spaltenreihenfolge aus dem Registeraufbau), `META-INF/report.json`
   (Taxonomieversion, Stichtag, Meldeebene, LEI der meldenden Einheit,
   Prüfsumme) und `META-INF/filing-indicators.csv` (je Meldebogen belegt /
   nicht belegt). TODO(verify): verbindliche xBRL-CSV-Dateinamens- und
   Ordnerkonvention der EBA-Filing-Rules; die Konvention ist bewusst in einer
   Funktion gekapselt und ohne Codeänderung an anderer Stelle umstellbar.
3. **Prüfexport als CSV** (`pruefbericht.csv` im Paket und einzeln), keine
   XLSX-Abhängigkeit: jede Zeile ein Befund auf Feldebene (Regel-ID,
   Schweregrad, Meldebogen, Datensatz, Feld, Klartext).
4. **Exportsperre:** Befunde der Stufe `REJECT` blockieren den Paketexport.
   Übersteuerung nur über einen entschiedenen `Approval`-Satz
   (`approvalType = "ROI_EXPORT_OVERRIDE"`, Vier-Augen: Antragsteller ≠
   Genehmiger, wird beim Export verbraucht) mit Audit-Trail-Eintrag.
5. **Meldestand:** Jeder Paketexport erzeugt einen `RoiSnapshot`
   (Status `DRAFT`, JSON-Abzug + SHA-256). `FROZEN` friert den Stand ein,
   `SUBMITTED` dokumentiert die manuelle Abgabe (Referenz, Zeitpunkt,
   Vier-Augen über `Approval` `approvalType = "ROI_SUBMISSION"` mit
   `roiSnapshotId`-Bezug). Es gibt keine Update-Pfade für `payload`/
   `checksum`; Statuswechsel nur vorwärts.
6. **Differenzbericht** (`lib/domain/roi-diff.ts`, reine Funktionen):
   Vergleich zweier Snapshot-Payloads je Meldebogen (neu / geändert /
   entfallen) über fachliche Zeilenschlüssel; angezeigt auf der
   Registerseite gegen den jeweils vorherigen Stand.
7. **Seed-Vervollständigung:** Damit aus dem Seed ein Paket entsteht, das die
   eigene Validierung besteht (Abnahme), erhalten alle Verträge mindestens
   eine IKT-Dienstleistung und alle Dienstleister eine Kennung.
8. **Approval-Erweiterung:** `Approval.roiSnapshotId` (nullable, FK) —
   einzige Schemaänderung dieser Welle (Update 0009).

## Konsequenzen

- Der Review-v3-Export (`/api/register-export`, ItsFieldMapping-CSV) bleibt
  als Feld-Mapping-Probeexport bestehen; das Meldepaket der Welle 3 ist der
  neue Weg zur Einreichungsvorbereitung.
- Ein Wechsel auf die verbindliche xBRL-CSV-Konvention ist eine lokale
  Änderung in `roi-export.ts` plus Taxonomie-Datenpflege.
