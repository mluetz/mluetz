# Betriebshandbuch

**Dokument:** Operations – Installation, Betrieb, Notfall, Datenhaltung
**Anwendung:** ICT & Third Party Risk Management Cockpit
**Status:** Freigegeben | **Version:** 1.0 | **Stand:** 2026-08

---

## 1. Installation

### 1.1 Voraussetzungen
- Node.js (LTS) und npm
- Dev/Demo: SQLite (dateibasiert, keine Serverinstallation nötig)
- Produktion: PostgreSQL ≥ 14, Reverse Proxy mit TLS-Terminierung

### 1.2 Ersteinrichtung (Entwicklung/Demo)
```bash
npm install                 # Abhängigkeiten installieren
cp .env.example .env        # Umgebungsvariablen setzen (DATABASE_URL, SESSION_SECRET)
npx prisma db push          # Schema in die Datenbank übertragen
npx prisma db seed          # Demo-Daten und Demo-Benutzer je Rolle einspielen
npm run dev                 # Entwicklungsserver starten
```
Hinweise:
- `SESSION_SECRET` muss ein kryptografisch zufälliger Wert sein; niemals den Beispielwert produktiv verwenden.
- Der Seed legt je Rolle einen Demo-Benutzer an; Passwörter siehe Projekt-README. **Demo-Konten dürfen in Produktion nicht existieren.**

### 1.3 Produktion
```bash
npm ci
npx prisma migrate deploy   # Versionierte Migrationen anwenden (kein db push in prod)
npm run build
npm run start
```
Konfiguration ausschließlich über Umgebungsvariablen; keine Secrets im Repository oder im Client-Bundle.

## 2. Backup & Restore

### 2.1 SQLite (Dev/Demo)
- **Backup:** Kopie der Datenbankdatei (z. B. `prisma/dev.db`) bei gestoppter Anwendung, alternativ `sqlite3 dev.db ".backup backup.db"` im laufenden Betrieb.
- **Restore:** Anwendung stoppen, Datei zurückkopieren, Anwendung starten.

### 2.2 PostgreSQL (Produktion)
- **Backup:** `pg_dump -Fc "$DATABASE_URL" > cockpit_$(date +%F).dump` – täglich automatisiert; Aufbewahrung gemäß Abschnitt 6; Ablage verschlüsselt und zugriffsbeschränkt.
- **Restore:** `pg_restore -d "$DATABASE_URL" --clean --if-exists cockpit_YYYY-MM-DD.dump` in einer Wartungsphase; anschließend Healthcheck (Abschnitt 3) und Stichprobenprüfung (Login, Risikoliste, Audit Trail).
- **Tests:** Restore-Verfahren mindestens halbjährlich testen und das Ergebnis dokumentieren (revisionsrelevant).
- Backups enthalten den vollständigen AuditLog; der Schutzbedarf des Backups entspricht dem der Produktivdaten.

## 3. Monitoring

- **Healthcheck:** `GET /api/health` – liefert Status der Anwendung und der DB-Verbindung; Einbindung in das zentrale Monitoring (Alarm bei HTTP ≠ 200 oder Timeout).
- **Logs:** Anwendungslogs auf stdout/stderr (Container-konform); Sammlung über die Plattform (z. B. journald, Container-Log-Driver). Fehlermeldungen an Clients sind generisch; Details stehen nur im Server-Log.
- **Fachliches Monitoring im Cockpit:** überfällige Reviews, ablaufende Akzeptanzen und Verträge werden als Notification angezeigt; das Dashboard (Overview) dient als operative Sicht.
- **Kennzahlen (empfohlen):** Antwortzeiten, Fehlerrate (5xx), fehlgeschlagene Logins (Häufung = möglicher Angriff, vgl. `docs/security/threat-model.md`), DB-Verbindungsstatus.

## 4. Incident Handling

- Sicherheits- und Betriebsvorfälle werden nach den in der Anwendung hinterlegten **Playbooks** behandelt (Bereich Playbooks): Playbook auswählen → PlaybookExecution starten → Schritte abarbeiten und Ergebnisse dokumentieren.
- Wiederkehrende operative Abläufe (z. B. Restore-Test, Failover-Übung) sind als **Runbooks** hinterlegt; Ausführungen (RunbookExecution) mit Schrittergebnissen dienen als Nachweis.
- Eskalation: Betriebsvorfälle an den Administrator, sicherheitsrelevante Vorfälle zusätzlich an den Information Security Officer; Bewertung der Meldepflichten (u. a. DORA-Vorfallmeldung) erfolgt durch die Fachbereiche außerhalb der Anwendung.
- Nach jedem Vorfall: Lessons Learned dokumentieren; erkannte Schwächen als Risiko oder Maßnahme im Cockpit erfassen.

## 5. Release & Rollback

### 5.1 Release
- Releases werden über **Git-Tags** (SemVer, z. B. `v1.4.0`) markiert; aus dem Tag wird ein versioniertes **Docker-Image** gebaut (`cockpit:v1.4.0`).
- Deployment-Reihenfolge: Backup erstellen → `prisma migrate deploy` → neues Image starten → Healthcheck prüfen.
- **Migrationsstrategie:** ausschließlich versionierte Prisma-Migrationen in Produktion; abwärtskompatible Migrationen bevorzugen (expand/contract: erst additiv erweitern, Entfernen erst im Folgerelease), damit ein Rollback des Images ohne Schema-Rückbau möglich bleibt.

### 5.2 Rollback
- **Anwendung:** vorheriges Image-Tag starten (`cockpit:v1.3.x`); bei abwärtskompatiblen Migrationen ohne DB-Eingriff möglich.
- **Datenbank:** nur im Ausnahmefall Restore aus Backup (Abschnitt 2); dabei gehen zwischenzeitliche Daten inkl. AuditLog-Einträge verloren – Entscheidung dokumentieren und Management informieren.
- Jedes Rollback ist als Betriebsvorfall zu dokumentieren.

## 6. Aufbewahrung & Löschkonzept

| Datenart | Regel |
|---|---|
| **AuditLog** | Unveränderlich (append-only, kein Änderungs-/Löschpfad in der Anwendung); Aufbewahrung gemäß konfigurierter Frist (AppSetting, Standard 10 Jahre – institutsspezifisch festzulegen); Löschung/Archivierung nur als kontrollierter, dokumentierter Betriebsprozess auf DB-Ebene |
| Fachdaten (Risiken, Assessments, Akzeptanzen, Kontrollen, Maßnahmen) | Kein physisches Löschen im Regelbetrieb; Abschluss über Status (Closed); Aufbewahrungsfristen je Objekttyp über AppSetting konfigurierbar |
| Drittpartei- und Vertragsdaten | Aufbewahrung mindestens für die Vertragslaufzeit zuzüglich konfigurierter Frist |
| Evidence | Es werden nur Metadaten gehalten; Aufbewahrung der referenzierten Dokumente regelt das führende DMS |
| Personenbezogene Daten (User) | Deaktivierung statt Löschung, solange AuditLog-Referenzen bestehen; Löschanfragen im Einklang mit gesetzlichen Aufbewahrungspflichten bewerten (DSGVO Art. 17 Abs. 3 lit. b) |
| **Demo-Daten** | Nur in Dev/Demo-Umgebungen; vor Produktivsetzung vollständig entfernen (frische DB, produktiver Seed ohne Demo-Konten) |

Konfigurierbare Fristen werden über AppSetting gepflegt; Änderungen werden auditiert. Das Löschkonzept ist mit Datenschutz und Compliance des Instituts abzustimmen.

## 7. Wartungsfenster und Verfügbarkeit

- Geplante Wartungen (Updates, Migrationen, Restore-Tests) sind außerhalb der Kernarbeitszeiten durchzuführen und vorab an die Nutzer zu kommunizieren.
- Vor jeder wartungsbedingten Änderung an Datenbank oder Anwendung ist ein aktuelles Backup zu erstellen (Abschnitt 2).
- Zielverfügbarkeit und maximal tolerierbare Ausfallzeit (RTO/RPO) legt das Institut fest; als Richtwert für ein internes Steuerungswerkzeug gelten RTO ≤ 1 Arbeitstag und RPO ≤ 24 Stunden (tägliches Backup). Strengere Anforderungen erfordern häufigere Backups bzw. DB-Replikation.

## 8. Betriebsverantwortung

| Aufgabe | Verantwortlich |
|---|---|
| Installation, Updates, Monitoring | Administrator / Betrieb |
| Backup-Ausführung und Restore-Tests | Betrieb (Nachweis via Runbook-Execution) |
| Incident-Koordination | Administrator, bei Sicherheitsbezug ISO |
| Freigabe von Releases | Administrator (technisch), Management (bei fachlich relevanten Änderungen, z. B. Methodik-Parametern) |

---
*Die Anwendung unterstützt die Dokumentation und Steuerung regulatorischer Anforderungen. Sie ersetzt keine rechtliche, aufsichtsrechtliche oder unabhängige Compliance-Prüfung.*
