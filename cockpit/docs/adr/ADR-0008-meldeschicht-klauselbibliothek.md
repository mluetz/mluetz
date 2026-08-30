# ADR-0008: Meldeschicht Welle 4 – Klauselbibliothek Art. 30

- **Status:** Akzeptiert
- **Datum:** 2026-08-30
- **Bezug:** ADR-0005/0006/0007; Auftrag „Meldeschicht", Welle 4; Review v3 P1-03

## Kontext

Review v3 hat die Klauselmatrix (`ContractClause` + Katalog in
`lib/domain/art30.ts`, Abs. 2 lit. a–h und Abs. 3 lit. a–g) eingeführt. Der
Auftrag verlangt eine pflegbare Klauselbibliothek (`ClauseTemplate` mit
Pflichttext DE/EN, Abs. 2 lit. a–i), Bewerter/Bewertungsdatum und
Nachweis je Klauselstatus, einen Lückenbericht (je Vertrag und aggregiert
über CIF-Verträge) mit Maßnahmenverknüpfung sowie die Ablösung der drei
Vertrags-Booleans (`auditRights`, `accessRights`, `incidentReporting`).

## Entscheidungen

1. **`ClauseTemplate` als Datenmodell**, geseedet aus `ART30_CLAUSES`:
   Klausel-ID (key, eindeutig), Fundstelle, Anwendbarkeit (`ALL |
CIF_ONLY`), Pflichttext DE/EN, Sortierung, `active`. Der Text ist eine
   **Arbeitsfassung** (TODO(verify) gegen den Verordnungstext); Textpflege
   ist Datenpflege. Zur Laufzeit ist die DB maßgeblich; `art30.ts` bleibt
   Seed-Quelle und Träger der reinen Funktionen (RAG, Lückenbericht) und
   Rückfallebene, solange keine Templates geladen sind.
2. **Abs. 2 lit. i ergänzt** (Mitwirkung an Sensibilisierungsprogrammen und
   Schulungen zur digitalen Resilienz) — der Auftrag nennt a–i; Wortlaut als
   TODO(verify) markiert. Bestehende Bewertungen bleiben unberührt; die neue
   Klausel erscheint als offen (MISSING), bis sie bewertet ist.
3. **Statuswerte bleiben `FULFILLED | PARTIAL | MISSING | NOT_APPLICABLE`**
   (Bestandsdaten!); das `PRESENT` des Auftrags entspricht `FULFILLED`
   (dokumentierte Zuordnung, keine Datenmigration).
4. **`ContractClause`-Erweiterung:** `assessedAt`, `assessedById`
   (Bewerter, wird beim Speichern der Matrix gesetzt) und `actionId`
   (Verknüpfung einer offenen Lücke mit einer Maßnahme). `Action` selbst
   bleibt unverändert (hängt weiterhin an einem Risiko); verknüpft wird
   eine bestehende Maßnahme.
5. **Lückenbericht als reine Funktion** (`art30GapReport` in `art30.ts`):
   je Vertrag fehlende/teilweise Pflichtklauseln und RAG; aggregiert über
   alle CIF-gestützten Verträge je Klausel die Zahl betroffener Verträge.
   Anzeige auf der Registerseite (Meldeschicht-Drehscheibe); die Matrix je
   Vertrag bleibt auf der Drittparteiseite.
6. **Ablösung der drei Vertrags-Booleans:** abgeleitete Werte aus den
   Klauselstatus (Cockpit-Konvention, im Code dokumentiert):
   `auditRights` ⇐ ART30_3_E, `accessRights` ⇐ ART30_2_D,
   `incidentReporting` ⇐ ART30_2_F (jeweils `FULFILLED`). Update 0010
   materialisiert Bestandswerte als Klauselstatus (nur wo noch keine
   Bewertung existiert) und entfernt die Spalten; die Anzeige leitet ab
   (`deriveContractFlags`). Die Felder an `ThirdParty` (TPRM-Sicht) und
   `CifServiceAssessment.auditRightsInContract` (B_07.01) bleiben bestehen.

## Konsequenzen

- Keine zweite Wahrheit mehr zwischen Booleans und Klauselmatrix.
- Bestands-DBs verlieren keine Information: gesetzte Booleans werden vor dem
  Spaltenabbau in Klauselstatus überführt.
- Die Ableitungszuordnung (Nr. 6) ist fachlich begründet, aber Konvention —
  bei abweichender Hausmeinung ist sie zentral in `art30.ts` änderbar.
