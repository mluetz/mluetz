# Bedrohungsmodell (STRIDE)

**Dokument:** Security – Threat Model
**Anwendung:** ICT & Third Party Risk Management Cockpit
**Status:** Freigegeben | **Version:** 1.0 | **Stand:** 2026-08

---

## 1. Zweck und Methodik

Dieses Dokument beschreibt das Bedrohungsmodell der Anwendung nach der STRIDE-Methodik (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege). Es identifiziert schützenswerte Assets, Vertrauensgrenzen, Bedrohungen je Grenze sowie implementierte Gegenmaßnahmen und verbleibende Restrisiken. Das Modell ist bei Architekturänderungen (neue Integrationspunkte, Auth-Änderungen, neue Entitäten mit Schutzbedarf) zu aktualisieren.

## 2. Schützenswerte Assets

| Asset                                                                | Schutzbedarf                             | Begründung                                                                                       |
| -------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Risikodaten (Risk, RiskAssessment, RiskAcceptance)                   | Vertraulichkeit hoch, Integrität hoch    | Interne Risikolage eines regulierten Instituts; Manipulation verfälscht Steuerungsentscheidungen |
| Drittparteidaten (ThirdParty, Contract, ExitStrategy, Subcontractor) | Vertraulichkeit hoch                     | Vertrags- und Bewertungsdaten mit Geschäftsgeheimnischarakter                                    |
| Nachweise-Metadaten (Evidence)                                       | Integrität hoch                          | Referenzen auf Prüfnachweise; Manipulation untergräbt Revisionssicherheit                        |
| Zugangsdaten (User: Passwort-Hashes, Session-Cookies, HMAC-Secret)   | Vertraulichkeit sehr hoch                | Kompromittierung ermöglicht Identitätsübernahme                                                  |
| Audit-Log (AuditLog)                                                 | Integrität sehr hoch, Verfügbarkeit hoch | Zentraler Nachweis für Revision und Aufsicht; muss unveränderlich und vollständig sein           |

## 3. Trust Boundaries

| ID  | Grenze             | Beschreibung                                                                              |
| --- | ------------------ | ----------------------------------------------------------------------------------------- |
| TB1 | Browser ↔ Server   | Untrusted Client gegenüber Next.js-Server (Server Components, Server Actions, API Routes) |
| TB2 | Server ↔ Datenbank | Anwendungsprozess gegenüber SQLite (dev) / PostgreSQL (prod) via Prisma                   |
| TB3 | Auth-Grenze        | Übergang unauthentifiziert → authentifiziert (Login, Session-Validierung)                 |
| TB4 | Admin-Grenze       | Übergang normale Rolle → Administrator (Benutzer-, Rechte-, AppSetting-Verwaltung)        |

## 4. Bedrohungen und Gegenmaßnahmen je Boundary

### 4.1 TB1 – Browser ↔ Server

| STRIDE          | Bedrohung                                                                                   | Gegenmaßnahmen                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Spoofing        | Session-Diebstahl/-Fälschung, CSRF auf Server Actions                                       | HMAC-signierte Session-Cookies (HttpOnly, Secure, SameSite); serverseitige Signaturprüfung jeder Anfrage; Origin-Prüfung der Server Actions                                                      |
| Tampering       | Manipulierte Eingaben, Mass Assignment, Umgehung clientseitiger Validierung                 | Zod-Validierung aller Server-Action- und API-Eingaben (Whitelist-Schemata); Prisma-Parametrisierung gegen SQL-Injection; keine Vertrauensstellung für Client-State                               |
| Repudiation     | Bestreiten von Freigaben/Änderungen                                                         | Audit-Interceptor protokolliert alle Mutationen mit Benutzer, Zeitstempel, Alt-/Neuwert; Approvals als eigene Datensätze                                                                         |
| Info Disclosure | **IDOR** (Zugriff auf fremde Objekte über erratbare IDs), XSS, ausführliche Fehlermeldungen | Serverseitige RBAC- und Ownership-Prüfung je Objektzugriff (nie nur URL-/UI-Ebene); React-Escaping + CSP; generische Fehlermeldungen, Details nur ins Server-Log; keine Secrets im Client-Bundle |
| DoS             | Login-Brute-Force, teure Abfragen/Reports                                                   | Rate Limiting auf Login; Pagination und Query-Limits; Timeouts                                                                                                                                   |
| EoP             | Aufruf privilegierter Server Actions durch niedrig privilegierte Nutzer                     | Permission-Check serverseitig in jeder Server Action/API Route (deny by default); UI-Ausblendung ist ausschließlich Komfort, nie Kontrolle                                                       |

### 4.2 TB2 – Server ↔ Datenbank

| STRIDE          | Bedrohung                                                                                     | Gegenmaßnahmen                                                                                                                                                                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spoofing        | Fremdzugriff mit DB-Credentials                                                               | DB-Credentials nur serverseitig (Env-Variablen); in prod dedizierter DB-Benutzer mit minimalen Rechten; Netzsegmentierung                                                                                                                                        |
| Tampering       | **Direkte Manipulation des Audit-Logs**, Änderung von Bewertungsdaten an der Anwendung vorbei | AuditLog append-only: die Anwendung bietet keinerlei Update-/Delete-Pfad (keine UI-Mutation, keine Server Action); in prod restriktive DB-Grants (kein UPDATE/DELETE auf AuditLog für den App-User empfohlen); DB-Zugriff organisatorisch auf Betrieb beschränkt |
| Repudiation     | Nicht nachvollziehbare Direktänderungen in der DB                                             | DB-seitiges Zugriffslogging (prod), Vier-Augen-Prinzip für administrative DB-Zugriffe (organisatorisch)                                                                                                                                                          |
| Info Disclosure | Auslesen der DB-Datei / Dumps                                                                 | Prod: verschlüsselte Volumes, Zugriffsbeschränkung auf DB-Host; Backups verschlüsselt ablegen                                                                                                                                                                    |
| DoS             | Verbindungspool-Erschöpfung, Lock-Kontention (SQLite)                                         | Prisma-Connection-Pooling; SQLite nur für dev/demo, prod PostgreSQL                                                                                                                                                                                              |
| EoP             | Ausnutzung überprivilegierter DB-Rechte                                                       | Least-Privilege-DB-User (kein DDL zur Laufzeit in prod; Migrationen über separaten Deploy-Schritt)                                                                                                                                                               |

### 4.3 TB3 – Auth-Grenze

| STRIDE          | Bedrohung                                                      | Gegenmaßnahmen                                                                                                                                    |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spoofing        | Credential Stuffing, Passwort-Raten, gefälschte Session-Tokens | bcrypt-Hashing mit Salt; Rate Limiting auf Login-Endpunkt; HMAC-Signatur mit serverseitigem Secret; keine Benutzer-Enumeration in Fehlermeldungen |
| Tampering       | Manipulation des Cookie-Inhalts (Rolle/User-ID)                | HMAC-Signatur über den gesamten Cookie-Payload; Ablehnung bei ungültiger Signatur; Session-Ablauf (Expiry im signierten Payload)                  |
| Repudiation     | Bestreiten von Logins                                          | Protokollierung von Login-Ereignissen (Erfolg/Fehlschlag) im AuditLog                                                                             |
| Info Disclosure | Session-Secret- oder Hash-Leak                                 | Secrets ausschließlich in Server-Env, nie im Client-Bundle oder in `NEXT_PUBLIC_*`; Passwort-Hashes werden nie an den Client serialisiert         |
| DoS             | Login-Flooding                                                 | Rate Limiting, konstante Antwortzeiten beim Hash-Vergleich                                                                                        |
| EoP             | Rollenanhebung im Token                                        | Rolle wird serverseitig aus der DB gelesen bzw. gegen sie geprüft, nicht dem Client-Token blind entnommen                                         |

### 4.4 TB4 – Admin-Grenze

| STRIDE          | Bedrohung                                                                                               | Gegenmaßnahmen                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Spoofing        | Übernahme eines Admin-Kontos                                                                            | Wie TB3; organisatorisch: starke Passwörter, dedizierte Admin-Konten                                                                           |
| Tampering       | Unbemerkte Änderung von Rollen/Permissions/AppSetting (z. B. Klassifikationsgrenzen, Mitigationsfaktor) | Vollständige Auditierung aller Admin-Mutationen mit Alt-/Neuwert; Konfigurationsänderungen im Reporting kenntlich                              |
| Repudiation     | Bestreiten administrativer Eingriffe                                                                    | AuditLog; Auditor-Rolle mit lesendem Zugriff auf den vollständigen Trail                                                                       |
| Info Disclosure | Admin-Übersicht legt sensible Daten offen                                                               | Admin sieht Verwaltungsdaten, hat aber keine fachlichen Freigaberechte (SoD, siehe `docs/governance/raci.md`)                                  |
| DoS             | Sperrung aller Konten durch fehlerhafte Admin-Aktion                                                    | Schutz des letzten aktiven Admin-Kontos vor Selbst-Deaktivierung                                                                               |
| EoP             | Selbstzuweisung fachlicher Freigaberollen durch Admin                                                   | Rollenkombinationsverbote (Admin ≠ Auditor, Admin ohne Management-Freigaben); jede Rollenänderung auditiert und im Berechtigungsreview geprüft |

## 5. Querschnittsmaßnahmen

- **RBAC serverseitig:** Zentrale Permission-Prüfung in allen Server Actions und API Routes; deny by default; Ownership-Checks auf Objektebene gegen IDOR.
- **Eingabevalidierung:** Zod-Schemata für sämtliche Mutationen; TypeScript strict als zusätzliche Fehlerklasse-Prävention.
- **Security-Header:** Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, Frame-Ancestors (Clickjacking) via Next.js-Konfiguration.
- **Kryptografie:** bcrypt für Passwörter, HMAC (serverseitiges Secret) für Sessions; TLS-Terminierung in prod am Reverse Proxy.
- **Audit-Log:** Append-only per Design; keine Mutationspfade in Anwendung oder UI.
- **Secrets-Handling:** Keine Secrets im Client; Env-Trennung dev/prod.

## 6. Restrisiken

| Restrisiko                             | Beschreibung                                                                                           | Umgang                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Demo-Login in Dev                      | Seed-Benutzer mit dokumentierten Demo-Passwörtern; in einer produktiven Umgebung nicht akzeptabel      | Vor Prod-Deployment Seed-Konten deaktivieren/entfernen; OIDC/Entra ID vorgesehen (siehe Architektur)          |
| Kein echtes Dokumenten-Backend         | Evidence verwaltet nur Metadaten/Referenzen; Nachweisdateien liegen außerhalb der Anwendungs­kontrolle | Ablage in einem berechtigungsgeprüften DMS; Verweis-Integrität organisatorisch sichern                        |
| SQLite ohne At-rest-Encryption (lokal) | Lokale Dev-/Demo-DB unverschlüsselt auf Dateisystemebene                                               | Nur nicht-produktive/Demo-Daten in SQLite; prod ausschließlich PostgreSQL mit verschlüsseltem Storage         |
| DB-Direktzugriff                       | Betreiber mit DB-Zugang könnten Daten inkl. AuditLog außerhalb der Anwendung ändern                    | Restriktive DB-Grants, Zugriffslogging, organisatorische Kontrollen; optional Export/Spiegelung des AuditLogs |
| In-Memory Rate Limiting                | Bei horizontaler Skalierung nicht instanzübergreifend wirksam                                          | Prod: Rate Limiting zusätzlich am Reverse Proxy/WAF                                                           |
| Kein MFA im lokalen Auth-Verfahren     | Passwort-basierte Anmeldung ohne zweiten Faktor                                                        | Anbindung an OIDC/Entra ID (inkl. MFA/Conditional Access) für Unternehmensbetrieb vorgesehen                  |

Restrisiken sind als Risiken im Cockpit selbst zu erfassen und dem Regelprozess (Bewertung, Behandlung oder befristete Akzeptanz) zu unterwerfen.

---

_Die Anwendung unterstützt die Dokumentation und Steuerung regulatorischer Anforderungen. Sie ersetzt keine rechtliche, aufsichtsrechtliche oder unabhängige Compliance-Prüfung._
