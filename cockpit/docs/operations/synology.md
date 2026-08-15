# Deployment auf Synology NAS (DSM 7, Container Manager)

Anleitung für ein NAS unter **`192.168.178.97`** (DSM-Oberfläche: `https://192.168.178.97:5001`).

**Ergebnis:** Das Cockpit läuft im Heimnetz unter **`http://192.168.178.97:3000`**
(Demo-Login z. B. `riskmanager@demo.example` / `Demo!2026`).

Der Betrieb erfolgt als **ein Container mit SQLite** in einem Docker-Volume
(`docker-compose.synology.yml`). Die synthetische Demo-Datenbank wird beim ersten
Start automatisch angelegt — keine weiteren Kommandos nötig. PostgreSQL ist dafür
nicht erforderlich.

## Voraussetzungen prüfen

| Punkt | Anforderung |
|---|---|
| DSM | 7.x mit Paket **Container Manager** (Paket-Zentrum). Auf DSM 6 heißt es „Docker“ – Schritte analog. |
| CPU | x86_64 oder ARM64 (alle aktuellen Modelle). |
| **Arbeitsspeicher** | **≥ 2 GB RAM** für den Build auf dem NAS. Bei weniger (z. B. DS220j, DS120j) bitte **Variante C** nutzen – der Next.js-Build scheitert sonst mit „JavaScript heap out of memory“. |
| Port | **3000** bevorzugt. Ist er belegt, wählt der Installer automatisch den nächsten freien Port (3001, 3002, 3080, 8300, 8380). Fester Wunschport: `HOST_PORT=8390` vor dem Installationsbefehl setzen. Der gewählte Port wird in `.env` festgeschrieben und bei Updates beibehalten. |

---

## Voraussetzungen automatisch prüfen (Preflight)

Rein lesender Check aller Voraussetzungen (DSM, Docker, RAM, Speicher, Port,
Internetzugang) – per SSH auf dem NAS:

```bash
curl -fsSL https://raw.githubusercontent.com/mluetz/mluetz/claude/ict-third-party-risk-cockpit-96rfzf/cockpit/check-synology.sh | sudo sh
```

Das Skript meldet je Prüfung `[OK]` / `[WARNUNG]` / `[FEHLER]` und sagt am Ende,
ob die Installation starten kann.

---

## Variante 0: Ein-Befehl-Installation (SSH, vollautomatisch)

SSH aktivieren (Systemsteuerung → Terminal & SNMP), anmelden und **einen** Befehl ausführen:

```bash
curl -fsSL https://raw.githubusercontent.com/mluetz/mluetz/claude/ict-third-party-risk-cockpit-96rfzf/cockpit/install-synology.sh | sudo sh
```

Das Skript (`cockpit/install-synology.sh`, vor Ausführung gern lesen) prüft
Docker, lädt den Projektstand nach `/volume1/docker/cockpit`, erzeugt ein
`SESSION_SECRET`, baut das Image und startet den Container. Am Ende wird die
Aufruf-URL angezeigt. Erneutes Ausführen aktualisiert die Installation, die
Datenbank und die `.env` bleiben erhalten.

---

## Variante 0b: Ohne SSH – Installation über den DSM-Aufgabenplaner

Wenn SSH deaktiviert ist („connection refused“ auf Port 22), lässt sich die
Ein-Befehl-Installation vollständig über die DSM-Weboberfläche ausführen — der
Aufgabenplaner führt Skripte als root aus:

1. **Aufgabe anlegen:** Systemsteuerung → **Aufgabenplaner** → Erstellen →
   **Geplante Aufgabe** → **Benutzerdefiniertes Skript**
   - Allgemein: Name `Cockpit-Preflight`, Benutzer **root**
   - Zeitplan: Datum auf **„Am folgenden Datum ausführen“** ohne Wiederholung
     stellen (die Aufgabe wird gleich manuell gestartet)
   - Aufgabeneinstellungen → „Benutzerdefiniertes Skript“:

     ```sh
     mkdir -p /volume1/docker
     curl -fsSL https://raw.githubusercontent.com/mluetz/mluetz/claude/ict-third-party-risk-cockpit-96rfzf/cockpit/check-synology.sh | sh > /volume1/docker/cockpit-preflight.log 2>&1
     ```

2. **Ausführen:** Aufgabe markieren → **Ausführen**. Ergebnis nach ~1 Minute in
   File Station öffnen: `docker/cockpit-preflight.log` (jede Prüfung `[OK]` /
   `[WARNUNG]` / `[FEHLER]` plus Fazit).
3. **Installation:** Zweite Aufgabe `Cockpit-Install` genauso anlegen mit:

     ```sh
     mkdir -p /volume1/docker
     curl -fsSL https://raw.githubusercontent.com/mluetz/mluetz/claude/ict-third-party-risk-cockpit-96rfzf/cockpit/install-synology.sh | sh > /volume1/docker/cockpit-install.log 2>&1
     ```

   → **Ausführen**. Der Build läuft 10–25 Minuten im Hintergrund; Fortschritt
   steht in `docker/cockpit-install.log` (Datei in File Station erneut öffnen
   bzw. herunterladen, sie wird fortlaufend geschrieben). Parallel erscheint im
   **Container Manager** das Abbild und danach der Container `ict-tprm-cockpit`.
4. **Fertig-Prüfung:** `http://192.168.178.97:3000/api/health` im Browser →
   `{"status":"ok"}`, dann `http://192.168.178.97:3000` öffnen.
5. **Aufräumen:** Beide Aufgaben im Aufgabenplaner wieder löschen (oder für
   spätere Updates behalten — erneutes Ausführen von `Cockpit-Install`
   aktualisiert die Installation, Datenbank und `.env` bleiben erhalten).

> Hinweis: Der Aufgabenplaner zeigt keine Live-Ausgabe; maßgeblich sind die
> Log-Dateien unter `docker/` in der File Station. Optional kann unter
> Aufgabenplaner → Einstellungen die Ausgabe zusätzlich per E-Mail versendet
> werden.

---

## Variante A: Container Manager, ohne SSH (empfohlen)

**1. Projektordner anlegen**
File Station → im freigegebenen Ordner `docker` einen Ordner `cockpit` anlegen
→ Pfad `/volume1/docker/cockpit`.
Fehlt der Ordner `docker`: Systemsteuerung → Freigegebener Ordner → Erstellen.

**2. Projektdateien hochladen**
Repository als ZIP laden:
`https://github.com/mluetz/mluetz/archive/refs/heads/claude/ict-third-party-risk-cockpit-96rfzf.zip`
→ lokal entpacken → **den Inhalt des Unterordners `cockpit/`** nach
`/volume1/docker/cockpit` hochladen (also `Dockerfile`,
`docker-compose.synology.yml`, `package.json`, `app/`, `prisma/`, `lib/` …).

> Wichtig: Der Ordner `cockpit` auf dem NAS muss direkt die `Dockerfile` enthalten –
> nicht noch einen Unterordner `cockpit/cockpit/`.

**3. Secret hinterlegen**
In `/volume1/docker/cockpit` eine Datei **`.env`** anlegen
(File Station → Erstellen → Neue Datei) mit genau einer Zeile:

```
SESSION_SECRET=bitte-hier-einen-eigenen-zufallswert-mit-mindestens-32-zeichen-eintragen
```

Beliebige lange Zufallszeichenfolge (z. B. zwei zusammengehängte UUIDs).
Ohne diesen Wert startet der Container bewusst nicht.

**4. Projekt anlegen**
Container Manager → **Projekt** → **Erstellen**
- Projektname: `cockpit`
- Pfad: `/volume1/docker/cockpit`
- Quelle: „Vorhandene docker-compose.yml verwenden“ → **`docker-compose.synology.yml`** wählen
- Weiter → Fertigstellen

Der erste Build dauert je nach Modell **10–25 Minuten** (Node-Image laden,
`npm ci`, Next.js-Build, Demo-Datenbank erzeugen). Fortschritt im Protokoll-Tab.

**5. Aufrufen**
`http://192.168.178.97:3000` im Browser öffnen → Anmeldung mit einem Demo-Konto.
Prüfung, ob alles läuft: `http://192.168.178.97:3000/api/health` → `{"status":"ok"}`.

---

## Variante B: Per SSH (schneller)

Systemsteuerung → Terminal & SNMP → **SSH-Dienst aktivieren** (Port 22), dann:

```bash
ssh <dsm-admin>@192.168.178.97

sudo -i
mkdir -p /volume1/docker && cd /volume1/docker
git clone -b claude/ict-third-party-risk-cockpit-96rfzf \
  https://github.com/mluetz/mluetz.git repo
cd repo/cockpit

# Secret erzeugen
echo "SESSION_SECRET=$(head -c 48 /dev/urandom | base64 | tr -d '\n')" > .env

# Starten (baut beim ersten Mal das Image)
docker compose -f docker-compose.synology.yml up -d --build
```

Status und Logs:

```bash
docker ps
docker logs -f ict-tprm-cockpit
# beim ersten Start erscheint:
# "SQLite-Datenbank mit synthetischen Demo-Daten angelegt: /data/cockpit.db"
```

SSH danach wieder deaktivieren, wenn nicht mehr benötigt.

*(Ist `git` auf dem NAS nicht verfügbar: ZIP wie in Variante A hochladen und nur
die letzten drei Befehle ausführen.)*

---

## Variante C: Image auf dem PC bauen, aufs NAS übertragen

Für NAS-Modelle mit wenig RAM oder schwacher CPU. Voraussetzung: Docker auf dem
eigenen Rechner.

**Auf dem PC** (im Ordner `cockpit/`):

```bash
# Bei ARM-NAS (z. B. DS220+ ist x86; DS223/DS423 sind ARM64) Zielplattform angeben:
docker build --platform linux/amd64 -t ict-tprm-cockpit:latest .
#   ARM64-NAS stattdessen:  --platform linux/arm64

docker save ict-tprm-cockpit:latest -o cockpit-image.tar
```

Die Datei `cockpit-image.tar` (ca. 400–600 MB) per File Station nach
`/volume1/docker/` hochladen.

**Auf dem NAS:** Container Manager → **Abbild** → **Aktion** → **Importieren** →
Datei auswählen. Danach Container Manager → **Container** → **Erstellen**:
- Abbild: `ict-tprm-cockpit:latest`
- Container-Name: `ict-tprm-cockpit`
- Port-Einstellungen: lokaler Port **3000** → Container-Port **3000**
- Umgebungsvariablen:
  - `DATABASE_URL` = `file:/data/cockpit.db`
  - `SESSION_SECRET` = *(eigener Zufallswert, mind. 32 Zeichen)*
  - `APP_BASE_URL` = `http://192.168.178.97:3000`
- Speicherort: neuen Ordner `/volume1/docker/cockpit-data` einbinden als **`/data`**
- Automatischer Neustart: aktivieren

---

## Optional: HTTPS über den DSM-Reverse-Proxy

DSM bringt einen Reverse Proxy mit, der das vorhandene NAS-Zertifikat nutzt:

1. Systemsteuerung → **Anmeldeportal → Erweitert → Reverse Proxy → Erstellen**
   - **Quelle:** Protokoll `HTTPS`, Hostname `192.168.178.97` (oder lokaler
     DNS-Name), Port **8443**
   - **Ziel:** Protokoll `HTTP`, Hostname `localhost`, Port **3000**
2. Cockpit ist danach zusätzlich unter `https://192.168.178.97:8443` erreichbar
   (Zertifikatswarnung bei selbstsigniertem Zertifikat ist im Heimnetz normal).
3. In der `.env` ergänzen: `APP_BASE_URL=https://192.168.178.97:8443`, dann
   Container neu starten – damit Links in Reports korrekt sind.

> **Nicht ins Internet veröffentlichen:** keine Portweiterleitung im Router auf
> Port 3000/8443 und kein QuickConnect. Der Demo-Login ist für vertrauenswürdige
> Netze gedacht; für eine Veröffentlichung wären zuerst SSO (OIDC) und die
> Härtungsmaßnahmen aus `docs/security/threat-model.md` umzusetzen.

---

## Betrieb

| Aufgabe | Vorgehen |
|---|---|
| **Update** | Neue Dateien hochladen bzw. `git pull`, dann Container Manager → Projekt → **Aktion → Erstellen** (SSH: `docker compose -f docker-compose.synology.yml up -d --build`). Die Datenbank im Volume bleibt erhalten. |
| **Backup** | `sudo docker cp ict-tprm-cockpit:/data/cockpit.db /volume1/docker/cockpit-backup-$(date +%F).db` – für einen konsistenten Stand den Container kurz stoppen. Zusätzlich den Ordner in die Hyper-Backup-Aufgabe aufnehmen. |
| **Restore** | Container stoppen → Backup-Datei zurückkopieren (`docker cp <datei> ict-tprm-cockpit:/data/cockpit.db`) → Container starten. |
| **Demo-Daten zurücksetzen** | Container stoppen → Volume `cockpit_cockpit-data` löschen (Container Manager → Volume) → Projekt starten; die Demo-Datenbank wird frisch angelegt. |
| **Logs** | Container Manager → Container → `ict-tprm-cockpit` → Protokoll, oder `sudo docker logs -f ict-tprm-cockpit`. |
| **Healthcheck** | `http://192.168.178.97:3000/api/health` → `{"status":"ok"}` |

## Wenn etwas nicht klappt

| Symptom | Ursache / Lösung |
|---|---|
| Build bricht mit „heap out of memory“ ab | Zu wenig RAM → **Variante C** (Image auf dem PC bauen). |
| Container startet nicht, Log: „SESSION_SECRET fehlt oder ist zu kurz“ | `.env` fehlt, liegt im falschen Ordner oder der Wert ist < 32 Zeichen. |
| Seite nicht erreichbar, Container läuft | Port-Zuordnung 3000→3000 prüfen; DSM-Firewall (Systemsteuerung → Sicherheit → Firewall) für Port 3000 freigeben. |
| „exec /app/docker-entrypoint.sh: permission denied“ | Image mit altem Stand gebaut → Projekt neu bauen (Rechte werden jetzt im Dockerfile gesetzt). |
| Anmeldung schlägt fehl | Demo-Login benötigt `AUTH_DEMO_LOGIN=true` (Standard); Passwort ist `Demo!2026`. |
