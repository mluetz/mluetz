# REUTIB ISMS-Tools — Finding-Register & IRM-Prototyp

Dieses Repository enthält zwei in sich geschlossene HTML-Anwendungen für die Reutter-Group (REUTIB):

| Anwendung | Pfad | Zweck |
|---|---|---|
| **TISAX AL3 Finding-Register** | `index.html` (DE) / `index-en.html` (EN) | Stage-Review-Findings mit VDA-ISA-6.0.3-Control-Verknüpfung |
| **IRM-Prototyp (Incident Response Management)** | `irm/index.html` | Lauffähige Referenz der Umsetzungsempfehlung GDL_010.001 (Freshservice-IRM) |

## IRM-Prototyp (`irm/`)

Prototyp zur Guideline **GDL_010.001 V1.00** („Implementierung des Incident Response Managements
in Freshservice", 01.08.2026; fachliche Grundlage POL_010.001 V3.00 / PROC_010.001 V2.10).
Er dient der fachlichen Erprobung von Feld-, Status- und Fristenmodell **vor** der
Freshservice-Konfiguration und als Abnahme-Referenz („so soll sich das System verhalten").

Abgebildet sind u. a.: die drei Portaleinstiege (Incident / Near Miss / Gefahr im Verzug),
das vollständige Feldmodell nach Anhang A, die Domänen A–J inkl. **geschütztem Bereich E/I**
mit Rollen-Simulation, die **berechnete Gesamtstufe P1–P4** aus S1–S6 (inkl. Vorrangregel
Personengefährdung und Zwangsstufe bei Rückrufverdacht), das Statusmodell mit **blockierenden
Übergängen** und benannten Fehlermeldungen, die **Fristenberechnung ab Kenntniserlangung**
(NIS-2 DE/AT/SK/PL, DSGVO Art. 33/34 u. a.) mit Neuberechnung bei Korrektur,
Genehmigungsschritte (Herabstufung/ISB, Kundeninformation/GL, § 35 BSIG, BCM-Übergabe E3),
Fristenmonitor mit Ampel, Berichte (Lagebild, Klassifizierungsqualität, Gefährdungstrend)
sowie das Aktivitätsprotokoll je Ticket. Ein Testdatenbestand (ein fiktiver Fall je Domäne,
Anhang C) lässt sich per Knopfdruck erzeugen. Details und bewusste Vereinfachungen: Tab
**„Dokumentation"** in der Anwendung.

Datenhaltung ausschließlich lokal im Browser (localStorage) + JSON-Export/-Import — keine
Serverkomponente, kein Ersatz für das Ticketsystem. Aufruf lokal per Doppelklick oder über
GitHub Pages unter `…/irm/`.

---

# TISAX AL3 Finding-Register — REUTIB (Reutter-Group)

Interaktive HTML-Datenbank der Stage-Review-Findings aus dem TISAX-AL3-Projekt der
Reutter-Group (REUTIB). Die Findings sind mit den **Controls des VDA-ISA-6.0.3-Prüfkatalogs**
verknüpft und lassen sich nach Domäne (u. a. **OT**), Modul, Priorität, Standort und Status filtern.

> **Vertraulich** — nur für den internen ISMS- und Audit-Gebrauch der Reutter-Group.

**Zwei Sprachfassungen:** `index.html` (Deutsch) und `index-en.html` (Englisch, vollständig
übersetzte Oberfläche und Inhalte). Beide Seiten sind über den „EN"/„DE"-Umschalter oben rechts
verknüpft. Im Zweifel gilt das deutsche Register.

| | |
|---|---|
| Participant | Reutter Group GmbH |
| ENX Scope-ID | `S9WC6X` · Participant-ID `PMVKRX` |
| Prüfkatalog | VDA ISA 6.0.3 |
| Assessment | AL3 (Vor-Ort) · Labels: Vertraulichkeit + Verfügbarkeit *sehr hoch* |
| Auditor | CIS GmbH, Wien |
| Scope | DE / AT / SK / PL |
| Datenstand | Stage Review 29.04.2026 — 62 Findings (inkl. Katalog-Observations) |

## Aufrufen

Die Anwendung ist eine **einzelne, in sich geschlossene `index.html`** (keine externen
Abhängigkeiten, keine Server nötig, funktioniert offline).

- **Lokal:** `index.html` herunterladen und im Browser öffnen.
- **Über GitHub Pages (empfohlen zum Teilen):** siehe unten — nach Aktivierung erreichbar unter
  `https://<user>.github.io/<repo>/`.

### GitHub Pages aktivieren
Repository → **Settings → Pages → Build and deployment → Source: „GitHub Actions"**.
Der mitgelieferte Workflow (`.github/workflows/pages.yml`) veröffentlicht die Seite dann bei
jedem Push auf den Standard-Branch automatisch.

## Funktionen

- **Volltextsuche** über alle Felder (Finding, Control-Nr., Maßnahme, Verantwortliche …).
- **OT-Schnellfilter** – zeigt mit einem Klick nur OT-relevante Findings (Modul 5 „IT(OT) Security",
  OT/PROD-Verantwortlichkeiten, IEC-62443-Bezug).
- **Filter** nach ISA-Modul, Finding-Typ (Major/Minor NC, Observation), Priorität, Status und Standort.
- **Domänen-Chips** (OT, BCM/Verfügbarkeit, IAM, HR, Supplier, Logging, Datenschutz, Compliance …).
- **Drei Ansichten:** gruppiert nach ISA-Modul, nach Control (Prüfkatalog-Kreuzreferenz) oder als
  Prioritätsliste.
- **Cross-Referenzen:** die abhängigen Findings (Spalte N) sind als anklickbare Chips hinterlegt und
  springen direkt zum verknüpften Finding.
- **Detailtiefe:** je Finding Beschreibung, Gap, Maßnahme, Umsetzungsgegenstand (Spalte M),
  Remediation-Scope (Spalte O), Reifegrad IST→SOLL, Verantwortliche, Frist und Nachweis.
- **Erledigt-Button** je Finding (Haken im Kartenkopf oder Button im Detail) mit
  Abhängigkeits-Logik: die Cross-Referenzen sind kategorisiert (Voraussetzung / nachgelagert /
  Querverweis); beim Erledigen mit offenen Voraussetzungen erscheint eine Warnung, je Finding wird
  der Stand der Voraussetzungen angezeigt („Voraussetzungen erledigt: n/m"). Der Bearbeitungsstand
  wird im Browser gespeichert (DE- und EN-Seite teilen sich denselben Stand), fließt in KPI, Filter
  („✓ Erledigt" / „○ Nicht erledigt") und CSV-Export ein und lässt sich über **„Stand sichern /
  Stand laden"** als JSON-Datei übertragen (z. B. auf ein anderes Gerät oder an Kollegen).
- **CSV-Export** der aktuell gefilterten Findings (inkl. Erledigt-Spalte).
- Hell-/Dunkel-Theme, responsiv, druckfreundlich.

## Daten pflegen & neu erzeugen

Datenquelle ist die Excel-Datei; die `index.html` wird daraus generiert – **nie direkt** im HTML editieren.

```bash
pip install openpyxl
# Quelle in data/ aktualisieren, dann:
python3 tools/generate.py      # erzeugt index.html und data/findings.json
python3 tools/generate_en.py   # erzeugt index-en.html und data/findings_en.json
```

Die englischen Freitexte liegen als Overlay in `data/translations_en.json` (Schlüssel = Excel-Zeile).
Bei neuen oder geänderten Findings die betroffenen Einträge dort nachziehen — fehlt ein Eintrag,
erscheint der deutsche Originaltext auf der englischen Seite.

## Struktur

```
index.html                                  ← deutsche Anwendung (generiert)
index-en.html                               ← englische Anwendung (generiert)
data/
  TISAX_Finding_Register_v3_M_N_O.xlsx       ← Quell-Register (Spalten M/N/O integriert)
  findings.json                              ← extrahierte, angereicherte Daten (generiert)
  findings_en.json                           ← englische Daten (generiert)
  translations_en.json                       ← Übersetzungs-Overlay der Freitexte (gepflegt)
tools/
  generate.py                                ← Extraktion + Tag-/Xref-Ableitung + HTML-Build (DE)
  generate_en.py                             ← englischer Build (UI-Strings + Overlay + Enum-Mapping)
  template.html                              ← gemeinsame HTML-/JS-Vorlage mit Platzhalter /*__DATA__*/
.github/workflows/pages.yml                  ← Auto-Deploy nach GitHub Pages
```
