# Umsetzungsstand — Review v3 (REV-TPRM-COCKPIT-003)

**Branch:** `feature/review-v3-wellen-0-6` · Basis: PR #52 (`ef885d5`)
**Stand:** 29.08.2026 · Alle Wellen implementiert; Restpunkte unten ausgewiesen.

## Bruchstellen

| ID | Status | Umsetzung |
|---|---|---|
| B-1 ITS-Mapping | ✅ | `ItsTemplateVersion`/`ItsFieldMapping` als Daten (beide Schemata, TO_VERIFY), Validierungslauf, CSV-Export mit Prüfsumme (`/register`, `/api/register-export`) |
| B-2 CIF-Einstufung | ✅ | Boolean entfernt; `CriticalFunction` + versioniertes `CifAssessment`; Einstufung nur aus der Relation; Pflege-UI; KRI-K5-04 „nicht berechenbar" statt 0 (Regressionstest) |
| B-3 Rekursive Kette | ✅ | `Subcontractor` selbstreferenziell (Rang 1..n, LEI, Anteil, „erbringt CIF-Dienst", Weitervergabe-Status); Konzentration über die gesamte Kette |
| B-4 Änderungshistorie | ✅ | Contract auditiert; Hash-Kette (seq/prevHash/hash) + Integritätscheck + Signatur; Sicherheitsereignis-Ansicht; Seed-Historie |

## Wellen

| Welle | Status | Kern |
|---|---|---|
| 0 Sicherheit | ✅ | TOTP-MFA (abhängigkeitsfrei, RFC-Testvektoren), Recovery-Codes, Admin-Reset, persistente Login-Drossel, Caddy-TLS (`deploy/Caddyfile`), Doku |
| 1 Datenmodell | ✅ | CIF eine Wahrheit, Audit-Härtung, sprechende IDs (alle Detailrouten), URL-Tabs, Pflichtfeldlogik + DQ-Score, CIF-Seiten mit SPOF |
| 2 Register | ✅ | Informationsregister 3-schichtig, Art.-30-Klauselmatrix mit RAG + Auto-Finding, Art.-29-Vorabbewertung, LEI ISO 17442 |
| 3 Nachvollziehbarkeit | ✅ | Methodikversion mit Vier-Augen, PeriodSnapshot (RB-17), Klassifizierungsassistent (einfrierbar, Ableitung testabgedeckt), Fristen-Scan (`/api/cron/deadlines`) |
| 4 Redesign | ✅ | Dashboard 3 Ebenen, Farbe nur bei Zielwertverletzung, Matrix-Neuaufbau mit Inhärent/Residual, gruppierte Nav mit Badges, Status-Tokens (AA), Druckkopf, Sprachpersistenz |
| 5 Härtung | ✅ | ResilienceTest/TLPT-Modul mit CIF-Abdeckung, Nachweisverfall kappt Kontrollwirksamkeit, SoD-Constraints + Konfliktbericht, Cockpit-Selbstregistrierung; SBOM/Scans bereits in CI |
| 6 Reife | ✅* | Threat-Intel-Register mit Time-to-Assess, Berichtspflichten-Kalender, Impact-Dominanz-Regel, LEI-Dublettenprüfung, Prüfungspaket-Export (JSON+Manifest+Checksum) |

## Bewusst offen (Folgearbeit, mit Begründung)

- **Auditfeste PDF-Berichte (P3-05)** — PDF-Erzeugung erfordert eine neue Abhängigkeit (z. B. Playwright-Print/pdf-lib); Druck-/Nachweisansicht mit Kopf existiert. Entscheidung über die Bibliothek beim Nutzer.
- **Row-Level-Security (P3-08)** — Grundlage gelegt (ReportingEntity-Hierarchie); mandantenscharfe Filterung aller Queries ist ein eigener, invasiver Schritt.
- **Fünfdimensionale Schutzbedarfsbewertung (P2-02), Risikoappetit je CIF (P2-08), transparente Wirksamkeits-Aggregation (P2-03)** — Datenmodell-/Methodikentscheidungen, die fachliche Abstimmung brauchen.
- **Gespeicherte Sichten, Bulk-Aktionen, globale Suche (P3-12), Import-Schnittstellen (P3-10), Link-Health-Check (P3-07)** — Komfortfunktionen ohne Auditkritikalität.
- **Vollständige Enum→Label-Abdeckung (D-06)** — Label-Schicht existiert und ist weit abgedeckt; ein automatisierter Render-Test auf rohe Enums steht aus.
- **CRUD-UIs für Testprogramm/Threat-Intel/Berichtspflichten** — als Register mit Seed-Daten angelegt; Pflege-Formulare folgen.
- **Meldebogen-Verifikation** — beide ITS-Schemata bleiben TO_VERIFY, bis die Bezeichnungen am verbindlichen Text der DVO (EU) 2024/2956 geprüft sind (bewusste Vorgabe des Reviews).

## Bestehende Datenbanken

Updates in Reihenfolge einspielen: `prisma/updates/0003` … `0007`, danach
Mapping-Stammdaten per `register-seed.mjs` (Hinweis in 0005). Neue
Installationen erhalten alles über `prisma db push` + Seed.
