# REUTIB ISMS-Tools — Finding-Register & IRM-Prototyp

Dieses Repository enthält zwei in sich geschlossene HTML-Anwendungen für die Reutter-Group (REUTIB):

| Anwendung | Pfad | Zweck |
|---|---|---|
| **TISAX AL3 Finding-Register** | `index.html` (DE) / `index-en.html` (EN) | Stage-Review-Findings mit VDA-ISA-6.0.3-Control-Verknüpfung |
| **IRM-Tool V1.20 (Incident Response Management)** | `irm/index.html` + `irm/server/` | Lauffähige Referenz der Umsetzungsempfehlung GDL_010.001 (Freshservice-IRM), mehrbenutzerfähig mit Serverdatenbank |

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

**Zweisprachig DE/EN** (Umschalter oben rechts; interne Werte bleiben kanonisch, beide
Sprachfassungen teilen denselben Datenbestand — der BSI-Gefährdungskatalog, alle Feldbezeichnungen,
Wertelisten und Fehlermeldungen sind übersetzt) und mit **Hell-/Dunkelmodus** (folgt beim ersten
Aufruf der Systemeinstellung, 🌓-Schalter in der Kopfzeile, Wahl wird gespeichert).

### Mehrbenutzerbetrieb mit Serverdatenbank (ab V1.10)

Für den Mehrbenutzerbetrieb bringt das Tool einen eigenen Server mit zentraler Datenbank mit
(`irm/server/server.js`, Node.js ≥ 22, **keine npm-Abhängigkeiten**; Speicher: SQLite über das
eingebaute `node:sqlite`, automatischer Fallback auf eine JSON-Datei):

```bash
node irm/server/server.js                      # Start auf Port 8010
# Umgebung: PORT, IRM_DB (DB-Pfad), IRM_TOKEN (Zugriffstoken, empfohlen!), IRM_CORS
# Oder als Container:  docker build -t reutib-irm -f irm/server/Dockerfile irm
#                      docker run -d -p 8010:8010 -e IRM_TOKEN=geheim -v irm-data:/data reutib-irm
```

Der Server liefert die Anwendung unter `http://<host>:8010/` selbst aus; alle Clients
synchronisieren sich über die REST-API (`/api/…`, atomare Ticketnummern-Vergabe, Änderungs-Polling
alle 8 s, Statusanzeige oben rechts). Beim ersten Zugriff wird der Name für das
Aktivitätsprotokoll abgefragt. Eine Mandantentrennung ist bewusst nicht vorgesehen (Betrieb
ausschließlich für die Reutter-Group). Tickets werden serverseitig nie gelöscht (GDL Kap. 14).

**Wichtig:** GitHub Pages ist statisch und kann den Server nicht ausführen — die Pages-Instanz
unter `…/irm/` läuft daher automatisch im **Einzelplatz-Fallback** (localStorage, Demo/Erprobung).
Für den produktiven Mehrbenutzerbetrieb den Server intern hosten (VM/Container) und **keine echten
Incident-Daten** auf der öffentlichen Pages-Seite erfassen. JSON-Export/-Import überträgt einen
lokalen Stand bei Bedarf auf den Server.

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

## Aufrufen & Zugangsschutz

Der Einstieg ist die **geschützte Eingangsseite `index.html`**: Benutzername + Passwort.
Die beiden Anwendungsseiten sind darin **AES-256-GCM-verschlüsselt eingebettet**; der Schlüssel
wird erst im Browser per PBKDF2-SHA-256 (600.000 Iterationen) aus den Zugangsdaten abgeleitet.
Es ist **kein Passwort und kein Passwort-Hash** im Repository oder auf der veröffentlichten Seite
hinterlegt — ohne die richtigen Zugangsdaten ist der Inhalt reiner Ciphertext. Der Benutzername
ist unabhängig von Groß-/Kleinschreibung; nach dem Entsperren gilt die Sitzung bis zum Schließen
des Tabs oder Klick auf **„Sperren"**.

- **Lokal:** `index.html` herunterladen, im Browser öffnen, anmelden (funktioniert offline).
- **Über GitHub Pages:** nach Aktivierung erreichbar unter `https://<user>.github.io/<repo>/`.
  Der Workflow veröffentlicht **ausschließlich die Eingangsseite** — die Klartext-Apps (`app/`),
  die Excel-Quelle und die JSON-Daten (`data/`) werden nicht mit deployt.

**Zugangsdaten ändern:** `python3 tools/encrypt.py` erneut ausführen (fragt Benutzer + Passwort
interaktiv ab, alternativ Umgebungsvariablen `VAULT_USER`/`VAULT_PASS`), neue `index.html`
committen. Salt und Schlüssel werden dabei neu erzeugt.

### GitHub Pages aktivieren
Repository → **Settings → Pages → Build and deployment → Source: „GitHub Actions"**.
Der mitgelieferte Workflow (`.github/workflows/pages.yml`) veröffentlicht die Seite dann bei
jedem Push auf den Standard-Branch automatisch.

> Hinweis: Client-seitige Verschlüsselung schützt den Inhalt, solange das Passwort stark und
> geheim ist — die veröffentlichte Datei kann offline angegriffen werden. Repository zusätzlich
> **privat** halten.

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
pip install openpyxl cryptography
# Quelle in data/ aktualisieren, dann:
python3 tools/generate.py      # erzeugt app/register-de.html und data/findings.json
python3 tools/generate_en.py   # erzeugt app/register-en.html und data/findings_en.json
python3 tools/encrypt.py       # verschlüsselt beide -> index.html (fragt Zugangsdaten ab)
```

Die englischen Freitexte liegen als Overlay in `data/translations_en.json` (Schlüssel = Excel-Zeile).
Bei neuen oder geänderten Findings die betroffenen Einträge dort nachziehen — fehlt ein Eintrag,
erscheint der deutsche Originaltext auf der englischen Seite.

## Struktur

```
index.html                                  ← geschützte Eingangsseite mit verschlüsselten Apps (generiert; einzige veröffentlichte Datei)
app/
  register-de.html                           ← deutsche Anwendung, Klartext (generiert, nur intern)
  register-en.html                           ← englische Anwendung, Klartext (generiert, nur intern)
data/
  TISAX_Finding_Register_v3_M_N_O.xlsx       ← Quell-Register (Spalten M/N/O integriert)
  findings.json                              ← extrahierte, angereicherte Daten (generiert)
  findings_en.json                           ← englische Daten (generiert)
  translations_en.json                       ← Übersetzungs-Overlay der Freitexte (gepflegt)
tools/
  generate.py                                ← Extraktion + Tag-/Xref-Ableitung + HTML-Build (DE)
  generate_en.py                             ← englischer Build (UI-Strings + Overlay + Enum-Mapping)
  template.html                              ← gemeinsame HTML-/JS-Vorlage mit Platzhalter /*__DATA__*/
  login_template.html                        ← Eingangsseite (Login + Entschlüsselung im Browser)
  encrypt.py                                 ← AES-256-GCM-Verschlüsselung -> index.html (Zugangsdaten nie gespeichert)
.github/workflows/pages.yml                  ← Auto-Deploy nach GitHub Pages (nur index.html)
```
