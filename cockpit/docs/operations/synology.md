# Deployment auf Synology NAS (DSM 7, Container Manager)

Diese Anleitung richtet das Cockpit auf einem Synology NAS ein — Beispielwerte für
ein NAS unter `192.168.178.97` (DSM-Oberfläche: `https://192.168.178.97:5001`).

**Ergebnis:** Das Cockpit ist danach im Heimnetz erreichbar unter
**`http://192.168.178.97:3000`** (Demo-Login z. B. `riskmanager@demo.example` / `Demo!2026`).

Der Betrieb erfolgt als **ein Container mit SQLite** in einem Docker-Volume
(`docker-compose.synology.yml`). Die synthetische Demo-Datenbank wird beim ersten
Start automatisch angelegt — es sind keine weiteren Kommandos nötig. PostgreSQL
(docker-compose.yml) ist für diesen Zweck nicht erforderlich.

## Voraussetzungen

- DSM 7.x mit installiertem Paket **Container Manager** (Paket-Zentrum → „Container Manager“).
  Auf älteren DSM-Versionen heißt das Paket „Docker“ — die Schritte sind analog.
- NAS-Modell mit x86_64- oder ARM64-CPU (Standard bei aktuellen Modellen).
- Port **3000** am NAS frei (DSM selbst nutzt 5000/5001, keine Kollision).

## Variante A: Container Manager (ohne SSH)

1. **Projektordner anlegen:** In **File Station** unter dem freigegebenen Ordner
   `docker` einen Ordner `cockpit` anlegen (also `/volume1/docker/cockpit`).
   Falls der Ordner `docker` nicht existiert: Systemsteuerung → Freigegebener
   Ordner → Erstellen.
2. **Projektdateien hochladen:** Das Repository als ZIP von GitHub herunterladen
   (Branch `claude/ict-third-party-risk-cockpit-96rfzf` → „Code“ → „Download ZIP“),
   lokal entpacken und den **Inhalt des Ordners `cockpit/`** nach
   `/volume1/docker/cockpit` hochladen (inkl. `Dockerfile`,
   `docker-compose.synology.yml`, `prisma/`, `app/` …).
3. **Secret setzen:** In `/volume1/docker/cockpit` eine Textdatei **`.env`**
   anlegen (File Station → Erstellen → Datei) mit folgendem Inhalt:

   ```
   SESSION_SECRET=hier-einen-langen-zufallswert-mit-mindestens-32-zeichen-eintragen
   ```

   (Beliebige lange Zufallszeichenfolge; z. B. zwei UUIDs aneinandergehängt.)
4. **Projekt erstellen:** **Container Manager → Projekt → Erstellen**
   - Projektname: `cockpit`
   - Pfad: `/volume1/docker/cockpit`
   - Quelle: „docker-compose.yml erstellen … vorhandene auswählen“ →
     **`docker-compose.synology.yml`** auswählen
   - Weiter → Fertigstellen. Der erste Build dauert je nach NAS **10–20 Minuten**
     (Node-Image laden, `npm ci`, Next.js-Build, Demo-Datenbank erzeugen).
5. **Aufrufen:** `http://192.168.178.97:3000` im Browser öffnen und mit einem
   Demo-Konto anmelden (Liste in der Projekt-README).

## Variante B: SSH (schneller, wenn git vorhanden)

1. Systemsteuerung → Terminal & SNMP → **SSH aktivieren** (Port 22), danach:

   ```bash
   ssh <dein-dsm-admin>@192.168.178.97
   mkdir -p /volume1/docker && cd /volume1/docker
   # Projekt holen (Git via Paket "Git Server"/Entwicklertools oder ZIP wie oben):
   git clone -b claude/ict-third-party-risk-cockpit-96rfzf <REPO-URL> repo
   cd repo/cockpit
   echo "SESSION_SECRET=$(head -c 48 /dev/urandom | base64)" > .env
   sudo docker compose -f docker-compose.synology.yml up -d --build
   ```

2. Status prüfen: `sudo docker ps` und `sudo docker logs ict-tprm-cockpit`
   (beim ersten Start erscheint „SQLite-Datenbank mit synthetischen Demo-Daten angelegt“).
3. Aufrufen: `http://192.168.178.97:3000`. SSH danach wieder deaktivieren, falls
   nicht benötigt.

## Optional: HTTPS über den DSM-Reverse-Proxy

DSM bringt einen Reverse Proxy mit, der das vorhandene NAS-Zertifikat nutzt:

1. Systemsteuerung → **Anmeldeportal → Erweitert → Reverse Proxy → Erstellen**
   - Quelle: Protokoll **HTTPS**, Hostname `192.168.178.97` (oder ein lokaler
     DNS-Name), Port **8443**
   - Ziel: Protokoll **HTTP**, Hostname `localhost`, Port **3000**
2. Danach ist das Cockpit zusätzlich unter `https://192.168.178.97:8443`
   erreichbar (Zertifikatswarnung bei Selbstsignat ist im Heimnetz normal).
3. In der `.env` dann `APP_BASE_URL=https://192.168.178.97:8443` setzen und den
   Container neu starten, damit Links in Reports korrekt sind.

**Wichtig:** Das Cockpit nicht ohne weitere Härtung ins Internet veröffentlichen
(keine Portweiterleitung im Router, kein QuickConnect auf Port 3000) — der
Demo-Login ist für vertrauenswürdige Netze gedacht.

## Betrieb

| Aufgabe | Vorgehen |
|---|---|
| **Update auf neuen Stand** | Neue Projektdateien hochladen bzw. `git pull`, dann im Container Manager Projekt → „Erstellen/Build“ neu ausführen (SSH: `docker compose -f docker-compose.synology.yml up -d --build`). Die Datenbank im Volume bleibt erhalten. |
| **Backup der Datenbank** | `sudo docker cp ict-tprm-cockpit:/data/cockpit.db /volume1/docker/cockpit-backup-$(date +%F).db` (Container kann dabei laufen; für konsistente Backups kurz stoppen). |
| **Demo-Daten zurücksetzen** | Container stoppen, Volume `cockpit_cockpit-data` im Container Manager löschen, Projekt erneut starten — die Demo-Datenbank wird frisch angelegt. |
| **Logs** | Container Manager → Container → `ict-tprm-cockpit` → Protokolle, oder `sudo docker logs -f ict-tprm-cockpit`. |
| **Healthcheck** | `http://192.168.178.97:3000/api/health` liefert `{"status":"ok"}`. |
