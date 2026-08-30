# Review v3: 3rd Party ICT & Information Security Risk Management Cockpit

**Dokument-ID:** REV-TPRM-COCKPIT-003
**Gegenstand:** Web-Applikation „ICT & TPRM Cockpit" (http://192.168.178.97:3001/), Demo-/Synthetikdatenstand
**Prüfmaßstab:** VO (EU) 2022/2554 (DORA) Kap. II–VI, delegierte Rechtsakte (RTS/ITS), eigenes Rahmenwerk FRWK-DORA-001, ISO/IEC 27001:2022, ISO/IEC 27036
**Stand:** 29.08.2026 · ersetzt REV-TPRM-COCKPIT-002
**Codebasis:** GitHub `mluetz/mluetz`, PR #52, Commit `ef885d5`, Verzeichnis `cockpit/` — **alle Befunde dieses Dokuments sind gegen den Quellcode verifiziert** (Fundstellen als Datei:Zeile)
**Betriebsmodell (bestätigt):** heute Referenzimplementierung, später produktiver Einsatz möglich → Architekturvorgabe in Abschnitt 3.1

---

## 0. Was sich gegenüber v2 geändert hat

| Änderung | Grund |
|---|---|
| Alle Befunde gegen den Quellcode verifiziert | v2 stützte sich nur auf die Oberfläche; mehrere Befunde waren zu korrigieren |
| B-4 (Audit Trail) wesentlich entschärft und neu gefasst | Die Abdeckung ist deutlich breiter als aus der UI erkennbar — die echte Lücke ist kleiner, aber real (Contract, Manipulationsschutz, Methodik) |
| S-02/S-03 korrigiert | Serverseitige Autorisierung ist durchgängig implementiert; Demo-Login ist bereits per Umgebungsvariable gekapselt |
| Bug-Kandidaten (Abschnitt 10) → verifizierte Befunde mit Ursache im Code | Je Punkt: bestätigt / teilweise / nicht bestätigt, mit Fundstelle und Fix-Richtung |
| Abschnitt 7 zum vollständigen Redesign-Konzept ausgebaut | Entscheidung: kein Flickwerk, sondern Neufassung von Layout, Navigation, Seitenarchitektur und Designsystem; Mockup-Datei als verbindliche Referenz |
| Umsetzungswellen angepasst | Bereits Erledigtes entfernt, Redesign als eigene Welle mit Spezifikation |

---

## 1. Gesamteinschätzung (nach Code-Sicht angehoben)

Das Cockpit ist deutlich weiter als ein übliches Risk-Register — und der Code ist an mehreren Stellen besser als das reine UI-Review vermuten ließ:

- **Regelkreis statt Listen:** Risk → Control → Action → Evidence → Finding/CAPA → Report ist durchgängig verknüpft; Kapitel-Scoring mit Knockout-Übersteuerung und Nachweissperre ist methodisch sauber.
- **Serverseitige Autorisierung ist real:** `lib/authz.ts` erzwingt RBAC in Server Actions und geschützten Seiten (`requireUser`/`requirePermission`/`assertPermission`, Zeilen 22–41) — nicht nur UI-Ausblendung.
- **Audit Trail ist append-only konzipiert** (`lib/audit.ts:4–8`, bewusst keine Update-/Delete-Funktionen) und trägt bereits Feldhistorie-Felder (`field`, `oldValue`, `newValue`, Zeilen 33–35).
- **Designsystem-Grundlage existiert:** semantische Tokens in `app/globals.css` (`--risk-low` … `--risk-critical`, helle und dunkle Palette getrennt definiert), null Inline-Hexwerte in Komponenten und Features.
- **Meldefristen-Monitor, 23 Runbooks / 17 Playbooks, Wissensbasis mit 133 Anforderungen** — unverändert tragfähig.

Die Befunde sind daher keine Grundsatzkritik, sondern die Lücke zwischen „sehr gutem Steuerungswerkzeug" und „aufsichtsfestem Nachweissystem".

---

## 2. Die vier klassischen Bruchstellen — jetzt code-verifiziert

Diese vier Punkte sind die Stellen, an denen selbstgebaute TPRM-Cockpits in Prüfungen regelmäßig scheitern. Nach Code-Sicht: **B-1 und B-3 voll bestätigt, B-2 halb bestätigt, B-4 in wesentlichen Teilen zu korrigieren.**

### B-1 — Feld-Mapping auf die ITS-Meldebögen fehlt · **BESTÄTIGT**
Eine Suche über Schema, Features und Routen findet weder `ItsTemplateVersion` noch ein Mapping-Objekt noch Meldebogen-Bezüge (`B_01.*`/`RT.01.*`) — das Modul existiert nicht, weder als Tabelle noch als Code. Ohne explizites, versioniertes Mapping **Cockpit-Feld → ITS-Feld-ID** ist kein prüfbarer und kein einreichungsfähiger Export möglich. Die KPI „Verträge im Register" (`features/dora/queries.ts`) misst den Bestand, nicht die Meldefähigkeit.

**Konsequenz:** Das Informationsregister ist das einzige DORA-Artefakt mit jährlicher, formatvalidierter Einreichungspflicht. Fehlt das Mapping, ist die zentrale Pflicht des Kapitels V außerhalb des Werkzeugs — und FND-2026-0003 („Validierungsfehler bei der Probeeinreichung") kann im Tool nicht geschlossen werden. **Umsetzung:** P1-01 / Abschnitt 3.1.

### B-2 — CIF-Einstufung: Entität existiert, Bewertungsverfahren fehlt, zwei Wahrheiten · **TEILWEISE BESTÄTIGT**
Anders als in v2 angenommen existiert eine Entität `CriticalFunction` (`prisma/schema.prisma:141–151`) mit n:m-Relationen zu Risk, IctService, ThirdParty und Incident. Sie ist aber rudimentär: kein Eigentümer, kein Bewertungsverfahren, kein RTO/RPO, keine Versionierung. Und daneben steht das Boolean `supportsCriticalFunction` auf ThirdParty (`schema.prisma:424`) — **zwei Wahrheiten im Datenmodell**, und genau daran bricht die Oberfläche:

**Verifizierte Ursache des schwersten Einzelbefunds:** KRI-K5-04 „Max. CIF-Abhängigkeit je Provider" zählt die Relation (`features/dora/queries.ts:206–214`), der Seed verbindet CriticalFunctions aber nur mit IctService (`prisma/seed.ts:646`) und Risk (`seed.ts:1885`) — **nie mit ThirdParty**. Das Boolean wird separat gesetzt (`seed.ts:524`). Ergebnis: 7 Drittparteien „kritisch" laut Flag, Relation leer, KRI = 0 mit grünem Haken (`ok: maxCifPerProvider <= 2`, `queries.ts:257`) — ein falsches Entlastungssignal an das Leitungsorgan. Der TP-001-Widerspruch (Kopf „unterstützt kritische Funktion", Feld „–") hat dieselbe Ursache: Kopf liest das Flag, Feld die Relation. **Umsetzung:** P1-02.

### B-3 — Subunternehmerkette einstufig statt rekursiv · **BESTÄTIGT**
`model Subcontractor` (`schema.prisma:469–477`) ist eine flache Liste: `name, country, service, critical` — kein Kettenrang, keine Selbstreferenz, kein Leistungsanteil, kein Kennzeichen, welches Kettenglied den CIF-Dienst **tatsächlich erbringt**. Damit ist RISK-2026-0012 im Tool nicht bearbeitbar, und die Konzentrationsrechnung endet beim Erstdienstleister — genau dort, wo das reale Konzentrationsrisiko erst beginnt. **Umsetzung:** P2-06.

### B-4 — Änderungshistorie: breiter als angenommen, aber drei echte Lücken · **KORRIGIERT**
Die v2-Behauptung „ThirdParty, Action, Incident, Finding werden nicht protokolliert" ist **falsch**: Der Code auditiert ThirdParty, Incident, Action, DoraFinding, Evidence, Control, Risk, RiskAcceptance, QualityReview, ExitStrategy, Report, RiskCategory, AppSetting, User u. a. (grep über `entityType:`-Aufrufe in `features/**`), und die Incident-Detailseite fragt den Trail korrekt ab (`app/(app)/dora/incidents/[id]/page.tsx:43–47`). Der leere Auszug im Demo-Stand ist ein **Daten-, kein Code-Befund**: „implementiert, Seed enthält keine Änderungsereignisse".

Die **echten** Lücken:
1. **Contract wird nirgends auditiert** — kein einziger `entityType: "Contract"`-Aufruf. Vertragsänderungen sind aber der Kern der laufenden Überwachung nach Art. 28 Abs. 1.
2. **Kein Manipulationsschutz:** append-only ist Konvention (`lib/audit.ts:4–8`), nicht Technik — keine Hash-Verkettung, kein Integritätscheck, kein signierter Export, keine definierte Aufbewahrung.
3. **Methodik ohne Versionierung:** Änderungen an Schwellwerten/Appetit werden zwar als `RiskCategory`/`AppSetting` protokolliert, aber Bewertungen referenzieren keine Methodikversion — rückwirkende Verschiebungen des Risikobilds bleiben rechnerisch unsichtbar (P1-06).

**Umsetzung:** P1-05 (fokussiert auf diese drei Punkte statt auf Breitenausbau).

---

## 3. Priorität 1 — auditkritisch

### 3.1 P1-01 — Informationsregister nach Art. 28 Abs. 3 / ITS (EU) 2024/2956

**Befund (code-bestätigt):** Es existieren Runbook RB-22, Finding FND-2026-0003 und Maßnahme ACT-2026-0024 — aber kein Modul, das das Register erzeugt (siehe B-1).

**Vorgabe aus dem bestätigten Betriebsmodell (heute Referenz, später produktiv):** Der Export wird **nicht** gegen eine hartcodierte Fassung gebaut, sondern in drei getrennten Schichten:

1. **Fachliche Struktur** (jetzt umsetzen) — normalisierte Objekte Entität, Vertrag, Dienstleister, Dienstleistung, Funktion, Bewertung, Kettenglied, Ausstiegsplan mit allen fachlich erforderlichen Feldern.
2. **Mapping-Layer** (jetzt umsetzen, als Daten, nicht als Code) — `ItsTemplateVersion` (Fassungsbezeichnung, Gültigkeitsdatum, Quelle, Status „verifiziert / zu verifizieren"); darunter `ItsFieldMapping` (Cockpit-Feld → Meldebogen → Feld-ID → Datentyp → Codeliste → Pflicht/optional → Transformationsregel). Ein Fassungswechsel ist dann Datenpflege, kein Refactoring.
3. **Validierungs- und Exportlauf** (jetzt in fachlicher Tiefe, Validierung gegen die verbindliche Fassung als Ausbaustufe vor Produktivgang) — LEI-Prüfziffer nach ISO 17442, Referenzintegrität zwischen den Meldebögen, zulässige Enumerationswerte, Pflichtfeldvollständigkeit; Ergebnis als Report „Probeeinreichung" mit Fehlerliste je Datensatz.

**Offener Punkt vor Umsetzung:** Die Meldebogen-Bezeichnungen sind zu verifizieren — im Umlauf sind `B_01.*`…`B_99.01` und `RT.01.01`…`RT.11.01`. **Verbindlich ist allein der Text der DVO (EU) 2024/2956 und die aktuellen ESA-Meldebögen** — keine Bezeichnung aus einem Reviewdokument übernehmen; beide Schemata bis zur Verifikation als Versionsdatensätze führen.

**Fehlende Pflichtfelder (unverändert):** LEI der eigenen Entität und des Dienstleisters, EUID bzw. nationale Kennung mit Kennungstyp, Vertrags-Referenznummer, Funktions-Identifikationscode, Kettenrang, Land der Leistungserbringung / Datenspeicherung / Datenverarbeitung, Substituierbarkeit als Codeliste, Kündigungsfristen, Ausstiegsplan vorhanden j/n, Konsolidierungsebene.

**Stichtagslogik:** Export bezieht sich auf den Meldestichtag, nicht auf den Erzeugungszeitpunkt — ohne die Snapshot-Entität aus P1-06 nicht reproduzierbar; beide Punkte hängen zusammen.

### 3.2 P1-02 — CIF-Register: eine Wahrheit, ein Bewertungsverfahren

Aufbauend auf der vorhandenen Entität (`schema.prisma:141–151`):
- `CriticalFunction` ausbauen: Eigentümer, Geschäftsbereich, **Bewertungsverfahren** (Kriterien, Schwellenwerte, Ist-Werte, Bewerter, Datum, Begründung, Freigabe), RTO / RPO / maximal tolerierbare Ausfallzeit / Impact-Toleranzschwelle (Art. 11 Abs. 2), Wiederanlaufreihenfolge, Neubewertungsturnus; alte Bewertungen bleiben als Version erhalten.
- **Boolean `supportsCriticalFunction` (`schema.prisma:424`) entfernen** und durch ein aus der Relation abgeleitetes Feld ersetzen; Bestandsdaten migrieren (Flag → Relationseinträge), damit die zwei Wahrheiten verschwinden.
- KRI-K5-04 (`features/dora/queries.ts:206–214`) auf die Relation umstellen; **Regressionstest: leere Relation liefert „nicht berechenbar", niemals 0 mit Zielerreichung.**
- UI zum Pflegen der Verknüpfung CIF ↔ ThirdParty ↔ IctService (heute nicht vorhanden — die Relation ist nur per Seed befüllbar).
- Abhängigkeitsgraph je CIF mit Single-Point-of-Failure-Markierung; Vorabbewertung nach Art. 29 als eigener Abschnitt am Vertrag.

### 3.3 P1-03 — Vertragliche Mindestinhalte Art. 30 als prüfbare Klauselmatrix

Unverändert aus v2: Checkliste je Vertrag über Art. 30 Abs. 2 lit. a–h (alle Verträge) plus Abs. 3 lit. a–g (CIF-Verträge); je Klausel Status (erfüllt / teilweise / fehlt / n. a.), Vertragsziffer, Evidence-Link, Kommentar; Ampel „Art.-30-Konformität" je Vertrag; automatisches Finding bei Pflichtklausel-Lücke in CIF-Verträgen.

### 3.4 P1-04 — Klassifizierung schwerwiegender Vorfälle strukturieren

Unverändert aus v2: Assistent nach Art. 18 i. V. m. RTS (EU) 2025/301 — je Kriterium Schwellwert, Ist-Wert, erfüllt j/n, Begründung; automatische Ableitung „schwerwiegend", unveränderlich eingefroren; Aggregationsregel für wiederkehrende Vorfälle; freiwillige Meldung erheblicher Cyberbedrohungen (Art. 19 Abs. 2); NIS-2/BSIG-Strang parallel zum DSGVO-Strang.

### 3.5 P1-05 — Audit Trail: die drei echten Lücken schließen

Neu fokussiert nach Code-Verifikation (siehe B-4):
1. **Contract in den Trail aufnehmen** — alle Server Actions in `features/third-parties/actions.ts`, die Verträge anlegen/ändern, auditieren (Vorbild: vorhandene ThirdParty-Einträge).
2. **Manipulationsschutz:** Hash-Verkettung je Eintrag, periodischer Integritätscheck als Job, signierter Export für Prüfer, Aufbewahrungsdauer definieren und dokumentieren; append-only zusätzlich auf DB-Ebene absichern (Trigger/Revoke), nicht nur per Konvention.
3. **Anzeige:** LOGIN/LOGOUT in separate Sicherheitsereignis-Ansicht (verdrängen heute die fachlichen Einträge); Seed um realistische Änderungshistorie ergänzen, damit die Detailseiten-Auszüge den Demo-Nutzen zeigen.

### 3.6 P1-06 — Methodikversionierung und Stichtags-Snapshots

Unverändert aus v2: `MethodologyVersion` (Schwellwerte, Mitigation Cap, gültig-ab/bis, Freigeber, Begründung), jede Bewertung referenziert ihre Version; Vier-Augen-Freigabe für Methodik-/Appetit-Änderungen; `PeriodSnapshot` je Monatsabschluss (RB-17) mit eingefrorenen Kennzahlen; Trends und Berichte aus Snapshots; Grundlage der Registerreproduktion zum Meldestichtag.

### 3.7 P1-07 — Fristen erzeugen keine Benachrichtigung

Unverändert aus v2: Scheduler mit E-Mail und konfigurierbarem Webhook (T-30/T-7/T-0/überfällig, Eskalation, Tagesdigest an den ISO; Vorfallsmeldefristen stündlich in den 4-h-/24-h-/72-h-Fenstern). Gegenstand: Maßnahmen, Kontrolltests, Risk-/Third-Party-Reviews, Vertragsenden, Kündigungsfristen, Zertifikatsablauf, Exit-Tests, Nachweisgültigkeit.

---

## 4. Priorität 2 — methodisch und fachlich

Unverändert aus v2, mit zwei Code-Anmerkungen:

| ID | Befund | Umsetzung |
|---|---|---|
| **P2-01** | Rangverzerrung der 5×5-Multiplikationsmatrix (L4×I2=8 MEDIUM, L2×I5=10 HIGH) | Konfigurierbare Zell-zu-Klasse-Zuordnung; mindestens Impact-Dominanz-Regel (Impact 5 ⇒ min. HIGH; mit CIF-Bezug ⇒ CRITICAL) |
| **P2-02** | Fünfdimensionale Schutzbedarfsbewertung nur in der Wissensbasis, nicht im Datenmodell | Fünf Felder je Asset/ICT-Service/CIF, Maximumprinzip berechnet, NO-GO-Regel als harte Validierung |
| **P2-03** | Kontrollwirksamkeit wird manuell als Enum gesetzt (`features/controls/actions.ts:24–25`), Aggregationsregel intransparent | Regel offenlegen; Schlüsselkontrollen gewichten; manuelle Übersteuerung nur mit Begründung + Audit-Eintrag |
| **P2-04** | **Code-bestätigt:** keine Kopplung Nachweisgültigkeit → Wirksamkeit/Reifegrad (kein `expiresAt`-Bezug in `features/controls/`) — daher DORA-PROT-01 „Effective" trotz abgelaufenem EV-006 | Nachweisgültigkeit in die Reifegradformel; abgelaufener/nicht reviewter Nachweis kappt auf 2 und erzeugt ein Finding |
| **P2-05** | Testprogramm Art. 24–27 fehlt als Modul | `ResilienceTest` mit Jahresplan, Testarten, Testabdeckung je CIF, Befundnachverfolgung; TLPT-Dreijahreszyklus inkl. CIF-Dienstleister (Art. 26 Abs. 3) |
| **P2-06** | Subunternehmerkette einstufig (B-3, code-bestätigt: `schema.prisma:469–477`) | Selbstreferenzielles Modell mit Rang 1..n, Land, Leistungsanteil, Kennzeichen „erbringt CIF-Dienst"; Workflow Weitervergabe-Anzeige/Zustimmung; Konzentrationsrechnung über die gesamte Kette |
| **P2-07** | Kapitel VI (Art. 45) ohne operative Datenbasis | Register `ThreatIntelAlert` mit „Time to Assess" (Median/95-Perzentil) |
| **P2-08** | Risikoappetit nur je Kategorie | Zweite Dimension „je CIF"; Überschreitung bei Riss einer der beiden Schwellen; Portfolio-Aggregation |
| **P2-09** | Funktionstrennung nicht erzwungen | Harte SoD-Constraints (Auditor ⊄ Risk/Control Owner/Admin; Genehmiger ≠ Antragsteller; Quality Reviewer ≠ Ersteller), blockierende Validierung + Konfliktbericht |
| **P2-10** | Berichtspflichten ggü. Leitungsorgan nicht nachgehalten (Art. 5 Abs. 2, Art. 13 Abs. 5) | Berichtspflichten-Kalender mit Turnus, Adressat, Fälligkeit, Vorlage-Nachweis |
| **P2-11** | Dublettenprüfung über Namensgleichheit statt LEI | Primär LEI, sekundär normalisierter Name + Land |
| **P2-12** | Interne Revision (Art. 6 Abs. 8) nicht als eigene Findingquelle | Findingquelle „Interne Revision" mit Erledigungsnachverfolgung |
| **P2-13** | Lebenszyklus endet faktisch beim Vertragsschluss | Statusmodell Bedarf → Vorabbewertung → Due Diligence → Vertrag → laufende Überwachung → Neubewertung → Beendigung, Pflichtartefakt je Phase |

---

## 5. Priorität 3 — Konsistenz, Betrieb, Datenqualität

Unverändert aus v2 (P3-01 bis P3-14), mit einer Präzisierung:

- **P3-03 (sprechende IDs):** Code-bestätigt und trivial behebbar — das Schema führt `riskId String @unique` (`schema.prisma:196`), die Detailroute löst aber nur über CUID auf (`app/(app)/risks/[id]/page.tsx:35`). Fix: OR-Lookup `{ id } | { riskId }`; analog für Actions, Findings, Incidents, Third Parties.
- **P3-04 (`?tab=` wirkungslos):** Code-bestätigt — `components/ui/tabs.tsx:22` hält den Zustand in `useState`, ohne `useSearchParams`. Fix zentral in der Tabs-Komponente, wirkt dann überall.

---

## 6. Sicherheit der Anwendung selbst — nach Code-Sicht neu bewertet

Das Cockpit verarbeitet Vertrags-, Dienstleister- und Risikodaten und ist damit selbst ein schützenswertes Asset. Die Code-Sicht entschärft zwei Punkte aus v2 und präzisiert die übrigen:

| ID | Befund (verifiziert) | Maßnahme |
|---|---|---|
| **S-01** | **Betrieb über HTTP im Klartext auf Port 3001** — unverändert die wichtigste Feststellung. Positiv: Session-Cookie ist `httpOnly`, `sameSite: lax`, `secure` konfigurierbar (`lib/auth/session.ts:75–79`) — das Secure-Flag greift aber erst mit TLS | TLS via Reverse Proxy (Synology-Bordmittel oder Caddy/Traefik-Container) mit internem Zertifikat, HTTP→HTTPS-Redirect, HSTS; `AUTH_COOKIE_SECURE` aktivieren |
| **S-02** | **Kein MFA** (keinerlei TOTP/WebAuthn im Code). Positiv: Demo-Login ist bereits per `AUTH_DEMO_LOGIN` gekapselt (`lib/auth/actions.ts:42`), eine Brute-Force-Drossel existiert (`lib/auth/actions.ts:17–25`) — aber **in-memory**, sie fällt bei jedem Container-Neustart auf null | MFA (TOTP) mindestens für ADMIN, ISO, Second Line; Rate-Limit persistieren (DB); Passwort-Policy, Session-Timeout prüfen |
| **S-03** | **Entschärft:** Autorisierung wird serverseitig durchgesetzt — `requireUser`/`requirePermission`/`assertPermission` in `lib/authz.ts:22–41`, RBAC-Matrix in `lib/authz-map.ts` | Restaufgabe: automatisierte Tests je Rolle gegen jede Route (Vollständigkeitsnachweis statt Stichprobe); `tests/unit/authz.test.ts` ausbauen |
| **S-04** | SQLite unverschlüsselt, Backup-/Restore-Konzept nicht im Repo dokumentiert | Verschlüsselte Backups, dokumentierter und getesteter Wiederherstellungslauf; Verschlüsselung ruhender Daten über Volume-/Filesystem-Ebene |
| **S-05** | `.env.example` sauber (keine echten Secrets); CI-Workflow `cockpit-security.yml` existiert | Secret-Scanning-Abdeckung verifizieren; Ergebnis dokumentieren |
| **S-06** | Eingabevalidierung über Zod in Server Actions vorhanden (z. B. `features/controls/actions.ts`) | Vollständigkeit prüfen (alle Actions), Upload-Pfade mit Typ-/Größen-/Inhaltsprüfung |
| **S-07** | Dependabot + Security-Workflow vorhanden (`.github/dependabot.yml`, `cockpit-security.yml`) | SBOM ergänzen, Aktualisierungsprozess dokumentieren |
| **S-08** | Netzwerkexposition: Bindung/Segmentierung nicht im Repo geregelt | Reverse Proxy vorschalten, Bindung auf erforderliches Interface, Zugriff auf berechtigte Netzsegmente einschränken |

**Praktische Reihenfolge:** S-01 (Proxy + Zertifikat + `AUTH_COOKIE_SECURE`) und S-02 (MFA, persistente Drossel) zuerst; S-03 ist auf den Testnachweis geschrumpft.

---

## 7. Design: vollständiges Redesign-Konzept

**Entscheidung (geklärt):** kein punktuelles Nachschärfen, sondern eine Neufassung von Informationsarchitektur, Layout und Komponenten — bei Beibehaltung der vorhandenen, sauberen Token-Basis (`app/globals.css`). Die Befunde D-01 bis D-15 aus v2 bleiben gültig und gehen im folgenden Konzept auf. **Verbindliche visuelle Referenz ist die Mockup-Datei `TPRMCockpit_Redesign_Mockup.html`** (drei Kernansichten, hell/dunkel) — sie ist zugleich die Spezifikation für die Umsetzung.

### 7.1 Designprinzipien

1. **Signalökonomie:** Farbe ist ein Alarm, kein Dekor. Farbige Hervorhebung ausschließlich bei Zielwertverletzung; jede Kennzahl trägt „Ziel X · Ist Y"; ohne Zielwert bleibt sie neutral. (Der wirksamste Einzelgriff des gesamten Redesigns.)
2. **Drei Lesetiefen:** Jede Übersichtsseite beantwortet in dieser Reihenfolge: Wie ist die Lage? → Wo muss ich handeln? → Wie verlässlich sind die Daten? Nie zwölf gleich laute Kacheln.
3. **Nachweistauglichkeit als Designziel:** Jede Ansicht muss zitierfähig sein — sprechende IDs sichtbar, Tab-Zustand in der URL, Druckansicht mit Stichtag/Datenstand/Benutzer, „Als Nachweis exportieren".
4. **Eine Sprache pro Oberfläche:** Technische Enums (`OPEN`, `CLOUD_HOSTING`) erscheinen nie im UI; durchgängige Enum→Label-Schicht in DE und EN (die Label-Infrastruktur in `lib/i18n/messages/` und `features/*/labels.ts` existiert bereits und wird vervollständigt).
5. **Zugänglichkeit:** Risikoklassen nie allein über Farbe (Kürzel L/M/H/C zusätzlich — der Ansatz ist in `globals.css` bereits als Kommentar verankert, aber nicht überall umgesetzt); Kontraste WCAG 2.1 AA in beiden Modi, Dark-Palette eigenständig geprüft.

### 7.2 Informationsarchitektur

**Navigation: vier Gruppen statt 15 flacher Einträge**, mit Badge-Zahlen für offene/überfällige Posten:

| Gruppe | Einträge |
|---|---|
| Steuerung | Overview · Risks · Actions · Controls · Assessments |
| Drittparteien | Third Parties · Verträge · **Informationsregister** (neu, P1-01) |
| DORA | Compliance · Vorfälle · Findings · Wissensbasis |
| Nachweis & Betrieb | Evidence · Reports · Audit Trail · Administration |

**Kopfzeile:** Mandant/Gesellschaft, Datenstand, angemeldeter Benutzer mit Rolle; Umgebungskennzeichen (Demo/Test/Produktiv) als schmales farbiges Band aus der Konfiguration — das Demo-Banner räumt die prominenteste Zeile.

### 7.3 Executive Dashboard (Neuaufbau)

- **Ebene 1 „Lage":** drei große Kennzahlen — DORA Resilience Index, offene Knockouts, überfällige Meldungen — mit Zielwert, Trendpfeil, Sparkline.
- **Ebene 2 „Handlungsbedarf":** überfällige Maßnahmen, Risiken über Appetit, Kontrollen mit Schwächen, CIF-Drittparteien ohne getesteten Exit-Plan — als handlungsorientierte Zeilen mit Direktsprung, nicht als Kacheln.
- **Ebene 3 „Datenqualität":** ohne Owner, ohne Bewertung, überfällige Reviews, auslaufende Verträge — kompakte neutrale Zeile.
- **Risikomatrix:** nur Anzahl je Zelle, Score in die Legende; leere Zellen entsättigt; Umschalter Inherent ↔ Residual, Ausbaustufe Vektordarstellung (Pfeil Inherent→Residual je Risiko — die Ansicht, die im Leitungsorgan tatsächlich wirkt, weil sie zeigt, was die Kontrollen leisten).

### 7.4 Listen und Tabellen

Horizontaler Scroll im Container mit fixierter erster Spalte statt Clipping (die Basiskomponente `components/ui/table.tsx:6` hat bereits `overflow-x-auto` — der Katalog-Befund ist ein Seitenlayout-Problem, siehe Abschnitt 10 Nr. 7); konfigurierbare, speicherbare Spaltenauswahl; Zeilenhöhe kompakt/komfortabel; Titel per Ellipse + Tooltip; `font-variant-numeric: tabular-nums` in allen Zahlenspalten. Filter als Chip-Leiste mit entfernbaren aktiven Chips, Ergebniszahl daneben, gespeicherte Sichten je Rolle.

### 7.5 Detailseiten

Zweispaltiges Muster: links Inhalt in Tabs (Tab-Zustand in der URL), rechts persistente Spalte **„Nächste Schritte"** (fällige Aktionen, offene Findings, überfällige Termine, Statuswechsel) — sichtbar ohne Scrollen. Statuswechsel als Primäraktion im Kopf mit Pflichtbegründung und Anzeige des erlaubten Statusgraphen samt Sperrgrund. Beziehungsleiste am Kopf (Risiko ↔ Kontrolle ↔ Maßnahme ↔ Nachweis ↔ Anforderung ↔ Drittpartei) mit Anzahl und Direktsprung. Empty States mit sinnvoller Primäraktion.

### 7.6 Designsystem (Ausbau der vorhandenen Basis)

Die Token-Architektur ist vorhanden und gut (semantische HSL-Tokens, getrennte Dark-Palette, null Inline-Hex). Ausbau:
- Statussemantik-Tokens ergänzen: `--status-overdue`, `--status-due-soon`, `--status-ok`, `--signal-muted` — Kacheln und Badges binden ausschließlich an Semantik, nie an Rohfarbe.
- 8-pt-Raster verbindlich; Typografie auf vier Grade reduzieren (Display 28/Semibold, Titel 18/Semibold, Body 14, Meta 12).
- Badge-, Karten-, Kennzahl- und Tabellenkomponenten einmal definieren, überall wiederverwenden.
- Druckstile je Ansicht (Kopf mit Stichtag, Datenstand, Benutzer, aktiven Filtern; Seitenzahlen; ohne Navigation) + Button „Als Nachweis exportieren" (PDF, im Nachweisregister verlinkt, im Audit Trail vermerkt).
- Sprachwahl pro Benutzer persistieren; Berichte in der gewählten Sprache.

---

## 8. Konsolidierung der Reviews

Unverändert aus v2, ergänzt um die Code-Korrekturen dieses Dokuments (B-4, S-02, S-03, D-15). **Verhältnis zum TISAX-Control-Framework weiterhin offen** — Empfehlung unverändert: ein Dienstleisterobjekt mit regime-spezifischen Attributgruppen.

---

## 9. Umsetzungsreihenfolge (angepasst)

| Welle | Inhalt | Begründung |
|---|---|---|
| **0** | S-01 (TLS via Reverse Proxy + `AUTH_COOKIE_SECURE`), S-02 (MFA, persistente Login-Drossel) | Halber Tag; nimmt die offensichtlichste Feststellung vom Tisch. Demo-Konten-Kapselung existiert bereits |
| **1** | P1-02 (CIF: eine Wahrheit + Bewertungsverfahren + Pflege-UI), P1-05 (Contract-Audit, Hash-Kette, Sicherheitsereignis-Ansicht), P3-02/P3-03/P3-04 (Pflichtfeldlogik, sprechende IDs, URL-Tabs) | Datenmodell-Fundament; behebt B-2, B-4-Rest und die verifizierten Befunde 1, 2, 4, 5 |
| **2** | P1-01 (Informationsregister + Mapping-Layer), P1-03 (Art.-30-Klauselmatrix), P2-06 (rekursive Kette) | Behebt B-1 und B-3; größter regulatorischer Hebel; schließt FND-2026-0003 |
| **3** | P1-06 (Methodikversionierung + Snapshots), P1-04 (Klassifizierungsassistent), P1-07 (Benachrichtigungen) | Macht Trend, Meldeentscheidung und Fristen belastbar |
| **4** | **Redesign nach Abschnitt 7 / Mockup-Datei** (Dashboard, Navigation, Tabellen, Detailmuster, Tokens, Enum-Labels) | Als eigene Welle mit verbindlicher Referenz statt Einzelbefunden |
| **5** | P2-05 (Testprogramm/TLPT), P2-04 (Nachweisverfall), P2-09 (SoD), S-03-Testnachweis, S-04–S-08 | Schließt die Knockouts in Kap. IV/V, härtet Anwendung und Betrieb |
| **6** | übrige P2, P3 gesamt, Druck-/Nachweisansicht, Prüfungspaket-Export | Reife, Bedienbarkeit, Betrieb |

---

## 10. Verifizierte Befunde (vormals Bug-Kandidaten) — mit Ursache im Code

| Nr. | Beobachtung | Status | Ursache / Fundstelle | Fix-Richtung |
|---|---|---|---|---|
| 1 | KRI-K5-04 „Max. CIF-Abhängigkeit = 0 ✓" bei 7 kritischen TPs | **Bestätigt** | KRI zählt Relation TP↔CF (`features/dora/queries.ts:206–214`), Seed verbindet CFs nur mit IctService (`seed.ts:646`) und Risk (`seed.ts:1885`), nie mit TP; `ok: <= 2` macht aus der leeren Relation Zielerreichung (`queries.ts:257`) | P1-02: eine Wahrheit; „nicht berechenbar" statt 0 bei leerer Relation |
| 2 | TP-001: Kopf „unterstützt kritische Funktion", Feld „–" | **Bestätigt** | Kopf liest Boolean (`schema.prisma:424`), Feld liest Relation — zwei Wahrheiten | P1-02: Boolean entfernen, aus Relation ableiten |
| 3 | DORA-PROT-01 „Effective" trotz abgelaufenem EV-006 | **Bestätigt (Designlücke)** | Wirksamkeit wird manuell als Enum gesetzt (`features/controls/actions.ts:24–25`); keinerlei Kopplung an Nachweisgültigkeit im Code | P2-04: Verfall kappt Reifegrad, erzeugt Finding |
| 4 | `?tab=` wirkungslos | **Bestätigt** | `components/ui/tabs.tsx:22`: `useState(defaultValue)`, kein `useSearchParams` | Zentral in Tabs-Komponente fixen |
| 5 | `/risks/RISK-2026-0005` → 404 | **Bestätigt** | Route löst nur CUID auf (`app/(app)/risks/[id]/page.tsx:35`), obwohl `riskId @unique` existiert (`schema.prisma:196`) | OR-Lookup; analog für alle Objektarten |
| 6 | Incident-Detail: Audit-Auszug leer | **Nicht bestätigt als Code-Fehler** | Abfrage korrekt (`incidents/[id]/page.tsx:43–47`), Incident-Actions auditieren; Seed enthält keine Änderungsereignisse → „implementiert, Daten fehlen" | Seed um Historie ergänzen (P1-05.3) |
| 7 | Anforderungskatalog: Spalte „KO" abgeschnitten | **Nicht im Code reproduzierbar** | Basistabelle hat `overflow-x-auto` (`components/ui/table.tsx:6`); Ursache vermutlich im Seitenlayout/Spaltenbreiten des Katalogs | Im Browser reproduzieren; Fix im Seitencontainer, fixierte erste Spalte (7.4) |

---

*Die Code-Verifikation erfolgte gegen PR #52 (Commit `ef885d5`); UI-Beobachtungen stammen aus dem Demo-Datenstand. Diese Analyse ersetzt keine unabhängige aufsichtsrechtliche oder rechtliche Prüfung.*
