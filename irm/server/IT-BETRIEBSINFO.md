# IRM-Tool V1.10 — Betriebsinformation für die Reutter-Group-IT

Stand: 02.08.2026 · Herausgeber: ISB (M. Lütz) · Bezug: GDL_010.001 V1.00, PROC_010.001 V2.10, POL_010.001 V3.00

Dieses Dokument beschreibt für die IT den technischen Aufbau des IRM-Tools
(Prototyp/Interimslösung bis zur Freshservice-Zielumsetzung), die Datenhaltung,
die empfohlene Entra-ID-Anbindung (Azure) und die offenen Punkte vor einer
Produktivsetzung.

---

## 1. Architektur in einem Absatz

Das Tool besteht aus **zwei Dateien ohne externe Abhängigkeiten**:
`irm/index.html` (die komplette Anwendung, läuft im Browser) und
`irm/server/server.js` (Node.js ≥ 22, kein `npm install`). Der Server liefert
die Anwendung unter `/` aus und stellt unter `/api/…` eine kleine REST-API mit
zentraler Datenbank bereit. Alle Clients synchronisieren sich darüber
(Änderungs-Polling alle 8 s, atomare Ticketnummern-Vergabe). Ist kein Server
erreichbar (z. B. auf der öffentlichen GitHub-Pages-Demo), fällt die Anwendung
automatisch in einen Einzelplatzmodus mit Browser-localStorage zurück —
erkennbar am Badge „🟡 Lokal" in der Kopfzeile.

## 2. Aufbau der Datenbank

**Speichertechnik:** SQLite über das in Node eingebaute Modul `node:sqlite`
(kein Treiber, keine Installation). Steht das Modul in der Node-Version nicht
zur Verfügung, fällt der Server transparent auf eine JSON-Datei mit identischem
API-Verhalten zurück. Der Pfad wird über die Umgebungsvariable `IRM_DB`
gesetzt (Default: `irm.db` neben dem Server; im Container `/data/irm.db`).

**Schema (bewusst minimal, Dokumentenspeicher):**

| Tabelle | Spalten | Inhalt |
|---|---|---|
| `tickets` | `id TEXT PRIMARY KEY`, `rev INTEGER`, `json TEXT` | Ein Datensatz je Ticket. `json` enthält das **vollständige Ticketdokument** (alle Felder nach GDL Anhang A, Meldeaufgaben, Genehmigungen, Aktivitätsprotokoll). `rev` ist die globale Revisionsnummer der letzten Änderung. |
| `meta` | `k TEXT PRIMARY KEY`, `v TEXT` | Zwei Zähler: `seq` (fortlaufende Ticketnummer IRM-nnnn, wird über `POST /api/seq` atomar vergeben — zwei Benutzer können nie dieselbe Nummer erhalten) und `rev` (globale Revision, monoton steigend). |

**Warum so?** Das Feldmodell der GDL ändert sich während der Erprobung noch;
ein Dokumentenspeicher erspart Schema-Migrationen. Die Revisionsnummer erlaubt
den effizienten Delta-Abgleich der Clients (`GET /api/changes?since=<rev>`
liefert nur geänderte Tickets). Konfliktmodell: Last-write-wins **je Ticket**
(nicht je Feld) — für den Erprobungsbetrieb ausreichend, da parallele
Bearbeitung desselben Tickets selten ist.

**Wichtige Eigenschaften:**
- **Kein Löschendpunkt.** Die API kennt kein DELETE — Tickets können
  systemseitig nicht gelöscht werden (GDL Kap. 14, Aufbewahrung ≥ 5 Jahre).
- **Backup = Dateikopie.** Die gesamte Datenbank ist eine einzige Datei.
  Nächtliche Kopie von `irm.db` (bzw. Snapshot des Volumes) genügt als
  Sicherung; Wiederherstellung = Datei zurücklegen, Server neu starten.
- **Eine Instanz.** SQLite und die In-Prozess-Zähler setzen **genau eine
  Serverinstanz** voraus. Kein Scale-out / keine Autoskalierung konfigurieren
  (bei den zu erwartenden Lasten — wenige hundert Tickets/Jahr — irrelevant).

**API-Übersicht:**

| Endpunkt | Zweck |
|---|---|
| `GET /` | Anwendung (index.html) |
| `GET /api/health` | Statusprüfung `{ok, version, storage, auth}` (ohne Auth) |
| `POST /api/seq` | atomare Vergabe der nächsten Ticketnummer |
| `GET /api/tickets` | Gesamtbestand `{seq, rev, tickets}` |
| `GET /api/changes?since=N` | nur Tickets mit Revision > N |
| `PUT /api/tickets/:id` | Ticket anlegen/aktualisieren |

**Umgebungsvariablen:** `PORT` (Default 8010) · `IRM_DB` (DB-Pfad) ·
`IRM_TOKEN` (optionales Bearer-Token für alle `/api`-Aufrufe außer health) ·
`IRM_CORS` (nur nötig, wenn Frontend und API auf getrennten Origins laufen —
im Normalbetrieb **nicht** setzen).

## 3. Entra-ID-Anbindung (empfohlener Weg: Azure + „Easy Auth")

Das Tool bringt bewusst **keine eigene Benutzerverwaltung** mit. Die
Authentifizierung wird davorgeschaltet — Konfiguration statt Programmierung:

1. **Container nach Azure bringen:** App Service (Web App for Containers)
   oder Azure Container App mit dem Image aus Abschnitt 4.
   **Persistentes Volume** (Azure Files) auf `/data` mounten — dort liegt die
   SQLite-Datei. **Replikazahl fest auf 1** stellen (siehe oben).
2. **Authentication aktivieren:** Im App Service unter *Settings →
   Authentication* → Identitätsanbieter **Microsoft Entra ID** hinzufügen
   (App-Registrierung erstellt Azure automatisch), Einstellung
   „Require authentication / HTTP 302 redirect". Ab jetzt erreicht kein
   nicht angemeldeter Benutzer mehr die Anwendung — inklusive der `/api`-Pfade.
3. **Zugriff einschränken:** In der erzeugten Enterprise Application
   „Assignment required = Yes" setzen und die berechtigten Gruppen zuweisen
   (z. B. „Alle Beschäftigten" für die Meldefunktion; das reicht, weil die
   Rollen im Tool derzeit simuliert sind).
4. **MFA/Conditional Access:** greifen automatisch über die bestehenden
   Richtlinien des Tenants — nichts zu tun.
5. **SSO-Effekt:** M365-angemeldete Benutzer sehen keinen zusätzlichen Login.
   Die SharePoint-Einbettung per iframe funktioniert dadurch nahtlos
   (Domain in SharePoint als zulässige Einbettungsquelle freigeben).

**Alternative ohne Azure-Hosting:** interne VM/Docker-Host + **Microsoft Entra
Application Proxy** mit Pre-Authentication (Connector intern installieren,
keine eingehenden Firewall-Öffnungen; Entra ID P1 erforderlich — in M365 E3/E5
enthalten). Wirkung identisch.

**Bedeutung für das Tool selbst:** keine Codeänderung erforderlich. Easy Auth /
App Proxy reichen die Identität als Header weiter
(`X-MS-CLIENT-PRINCIPAL-NAME`). **Empfohlener Ausbauschritt** (klein, auf
Zuruf umsetzbar): Server wertet den Header aus und übergibt ihn dem Frontend →
die Namensabfrage entfällt, das Aktivitätsprotokoll trägt automatisch den
AD-Benutzernamen. **Ausbaustufe 2** (eigenes Arbeitspaket): Mapping von
Entra-Sicherheitsgruppen (z. B. IRM-Triage, IRM-ISB, IRM-HSE) auf die
Tool-Rollen — ersetzt die Rollen-Simulation durch echte Zugriffssteuerung,
insbesondere für die geschützten Domänen E und I.

## 4. Docker-Image

Das `Dockerfile` liegt unter `irm/server/Dockerfile` (Basis `node:22-alpine`,
Volume `/data`, Port 8010). Bau und Start:

```bash
# aus dem Repo-Root
docker build -t reutib-irm -f irm/server/Dockerfile irm
docker run -d --name reutib-irm -p 8010:8010 \
  -e IRM_TOKEN='<geheimes-token>' \
  -v irm-data:/data \
  reutib-irm
# Healthcheck: curl http://localhost:8010/api/health
```

Auf Wunsch richte ich zusätzlich einen **GitHub-Actions-Workflow** ein, der
das Image bei jedem Release automatisch baut und in die GitHub Container
Registry (`ghcr.io`) veröffentlicht — die IT kann es dann per
`docker pull` beziehen, ohne selbst zu bauen.

## 5. Offene Punkte vor einer Produktivsetzung (Checkliste für die IT)

| # | Punkt | Verantwortlich | Status |
|---|---|---|---|
| 1 | Hosting-Entscheidung: Azure App Service / Container App **oder** interne VM + Entra Application Proxy | IT-Leitung | offen |
| 2 | Persistentes Volume für `/data` + Sicherungskonzept (nächtliche Kopie; Aufbewahrung im Einklang mit GDL Kap. 14: ≥ 5 Jahre) | IT | offen |
| 3 | Einzelinstanz sicherstellen (keine Autoskalierung) | IT | offen |
| 4 | Entra-Konfiguration: Easy Auth bzw. App Proxy, „Assignment required", Gruppenzuweisung | IT / Entra-Admin | offen |
| 5 | TLS/Domainname (bei Azure automatisch; intern: Zertifikat) und ggf. SharePoint-Einbettungsfreigabe | IT | offen |
| 6 | Geheimnisverwaltung `IRM_TOKEN` (Key Vault / App-Settings), falls als zweite Schicht gewünscht | IT | offen |
| 7 | Monitoring: `GET /api/health` in die Überwachung aufnehmen; App-Logs aktivieren | IT | offen |
| 8 | **DSB und Arbeitnehmervertretung beteiligen**, bevor echte Incident-Daten verarbeitet werden (GDL Kap. 1.2/14: Mitbestimmung, Verzeichnis der Verarbeitungstätigkeiten, Speicherort/AVV) | ISB / DSB / HR | offen |
| 9 | Freigabe des Konfigurationsstands durch den ISB (Änderungsmanagement nach GDL Kap. 17) | ISB | offen |
| 10 | Optional: Header-Auswertung für AD-Benutzernamen im Protokoll (kleiner Ausbauschritt, siehe Kap. 3) | ISB → Umsetzung | Angebot |
| 11 | Optional: Entra-Gruppen → Tool-Rollen (Ausbaustufe 2, ersetzt Rollen-Simulation) | ISB / IT | Angebot |

**Bewusste Grenzen des Prototyps** (bleiben bestehen, Zielplattform ist
Freshservice gemäß GDL): keine E-Mail-/SMS-Alarmierung (P1-Alarmierung läuft
weiter über die Bereitschaftskette nach STD_010.001), Rollen im Tool simuliert
(bis Ausbaustufe 2), Konfliktmodell Last-write-wins je Ticket, kein
Verzeichnisdienst-Sync der Gruppen, Anlagen als Textverweise statt Dateiupload.
