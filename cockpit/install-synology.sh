#!/bin/sh
# ============================================================
# ICT & TPRM Cockpit – Ein-Befehl-Installation für Synology DSM 7
# ------------------------------------------------------------
# Aufruf auf dem NAS (SSH, als Admin):
#
#   curl -fsSL https://raw.githubusercontent.com/mluetz/mluetz/claude/ict-third-party-risk-cockpit-96rfzf/cockpit/install-synology.sh | sudo sh
#
# Das Skript: prüft Docker, lädt den Projektstand, erzeugt bei Bedarf
# ein SESSION_SECRET, baut das Image und startet den Container.
# Es verändert nichts außerhalb von /volume1/docker/cockpit.
# ============================================================
set -eu

BRANCH="claude/ict-third-party-risk-cockpit-96rfzf"
TARBALL="https://github.com/mluetz/mluetz/archive/refs/heads/${BRANCH}.tar.gz"
APP_DIR="/volume1/docker/cockpit"

echo "==> ICT & TPRM Cockpit – Installation auf Synology"

if [ "$(id -u)" != "0" ]; then
  echo "FEHLER: Bitte mit sudo ausführen (sudo sh …)." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "FEHLER: Docker nicht gefunden. Bitte im Paket-Zentrum 'Container Manager' installieren." >&2
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "FEHLER: 'docker compose' nicht verfügbar. Bitte Container Manager aktualisieren." >&2
  exit 1
fi

if [ ! -d /volume1 ]; then
  echo "FEHLER: /volume1 nicht gefunden – ist das ein Synology-NAS?" >&2
  exit 1
fi

echo "==> Lade Projektstand (Branch ${BRANCH}) …"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl -fsSL "$TARBALL" -o "$TMP/src.tar.gz"
tar -xzf "$TMP/src.tar.gz" -C "$TMP"
mkdir -p "$APP_DIR"
cp -a "$TMP"/*/cockpit/. "$APP_DIR"/

if [ ! -f "$APP_DIR/.env" ]; then
  SECRET="$(head -c 64 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | cut -c1-48)"
  printf 'SESSION_SECRET=%s\n' "$SECRET" > "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  echo "==> Neues SESSION_SECRET erzeugt (${APP_DIR}/.env)."
else
  echo "==> Vorhandene .env wird weiterverwendet."
fi

# --- Host-Port bestimmen -------------------------------------
# Reihenfolge: HOST_PORT aus der Umgebung > bereits in .env gespeicherter
# Wert > 3000 > erster freier Port aus der Kandidatenliste.
port_in_use() {
  netstat -tln 2>/dev/null | grep -q "[:.]$1 "
}

CONFIGURED_PORT="$(sed -n 's/^HOST_PORT=//p' "$APP_DIR/.env" | tail -1)"
CHOSEN_PORT="${HOST_PORT:-${CONFIGURED_PORT:-}}"

if [ -z "$CHOSEN_PORT" ]; then
  for CANDIDATE in 3000 3001 3002 3080 8300 8380; do
    if ! port_in_use "$CANDIDATE"; then
      CHOSEN_PORT="$CANDIDATE"
      break
    fi
  done
fi

if [ -z "$CHOSEN_PORT" ]; then
  echo "FEHLER: Kein freier Port gefunden. Bitte HOST_PORT setzen, z. B.:" >&2
  echo "  HOST_PORT=8390 sh install-synology.sh" >&2
  exit 1
fi

if [ "$CHOSEN_PORT" != "${CONFIGURED_PORT:-}" ] && port_in_use "$CHOSEN_PORT"; then
  echo "FEHLER: Port $CHOSEN_PORT ist belegt. Bitte anderen Port wählen:" >&2
  echo "  HOST_PORT=<freier-port> sh install-synology.sh" >&2
  exit 1
fi

# Port in der .env festschreiben (idempotent)
if [ -n "$CONFIGURED_PORT" ]; then
  sed -i.bak "s/^HOST_PORT=.*/HOST_PORT=${CHOSEN_PORT}/" "$APP_DIR/.env" && rm -f "$APP_DIR/.env.bak"
else
  printf 'HOST_PORT=%s\n' "$CHOSEN_PORT" >> "$APP_DIR/.env"
fi
echo "==> Host-Port: ${CHOSEN_PORT}"

# --- APP_BASE_URL setzen -------------------------------------
# Bestimmt u. a., ob das Session-Cookie das Secure-Flag trägt: Über eine reine
# HTTP-Verbindung darf es das NICHT, sonst verwirft der Browser das Cookie und
# man landet nach der Anmeldung wieder auf der Login-Seite.
NAS_IP="$(ip route get 1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if ($i=="src") {print $(i+1); exit}}')"
[ -n "${NAS_IP:-}" ] || NAS_IP="localhost"
BASE_URL="http://${NAS_IP}:${CHOSEN_PORT}"

if grep -q '^APP_BASE_URL=' "$APP_DIR/.env" 2>/dev/null; then
  sed -i.bak "s#^APP_BASE_URL=.*#APP_BASE_URL=${BASE_URL}#" "$APP_DIR/.env" && rm -f "$APP_DIR/.env.bak"
else
  printf 'APP_BASE_URL=%s\n' "$BASE_URL" >> "$APP_DIR/.env"
fi
echo "==> Basis-URL: ${BASE_URL}"

cd "$APP_DIR"
echo "==> Baue Image und starte Container – der erste Build dauert je nach Modell 10–25 Minuten …"
$COMPOSE -f docker-compose.synology.yml up -d --build

echo ""
echo "============================================================"
echo "Fertig. Das Cockpit läuft unter:  http://${NAS_IP}:${CHOSEN_PORT}"
echo "Demo-Login: riskmanager@demo.example / Demo!2026"
echo "Status:     docker logs -f ict-tprm-cockpit"
echo "Health:     http://${NAS_IP}:${CHOSEN_PORT}/api/health"
echo "Hinweis:    Keine Portweiterleitung ins Internet einrichten."
echo "============================================================"
