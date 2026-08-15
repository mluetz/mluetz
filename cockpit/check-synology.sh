#!/bin/sh
# ============================================================
# ICT & TPRM Cockpit – Voraussetzungs-Check für Synology DSM
# ------------------------------------------------------------
# Rein lesende Prüfung, verändert nichts. Aufruf auf dem NAS:
#
#   curl -fsSL https://raw.githubusercontent.com/mluetz/mluetz/claude/ict-third-party-risk-cockpit-96rfzf/cockpit/check-synology.sh | sudo sh
#
# Ergebnis: je Prüfung [OK] / [WARNUNG] / [FEHLER] und am Ende ein Fazit.
# ============================================================
set -u

FAIL=0
WARN=0

ok()   { echo "[OK]       $1"; }
warn() { echo "[WARNUNG]  $1"; WARN=$((WARN + 1)); }
fail() { echo "[FEHLER]   $1"; FAIL=$((FAIL + 1)); }

echo "=== Voraussetzungs-Check: ICT & TPRM Cockpit auf Synology ==="
echo ""

# --- System ---------------------------------------------------
if [ -f /etc.defaults/VERSION ]; then
  DSM_VER="$(grep -E '^productversion' /etc.defaults/VERSION | cut -d'"' -f2)"
  MAJOR="$(echo "$DSM_VER" | cut -d. -f1)"
  if [ "${MAJOR:-0}" -ge 7 ]; then
    ok "DSM-Version: $DSM_VER"
  else
    warn "DSM-Version $DSM_VER (< 7) – Paket heißt hier 'Docker', Schritte analog"
  fi
else
  warn "Kein Synology-DSM erkannt (/etc.defaults/VERSION fehlt)"
fi

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64|aarch64|arm64) ok "CPU-Architektur: $ARCH" ;;
  *) fail "CPU-Architektur $ARCH wird von den Node-Basisimages nicht unterstützt (armv7-Modelle: Variante C mit --platform prüfen)" ;;
esac

[ -d /volume1 ] && ok "/volume1 vorhanden" || fail "/volume1 nicht gefunden"

# --- RAM ------------------------------------------------------
MEM_KB="$(grep MemTotal /proc/meminfo | awk '{print $2}')"
MEM_MB=$((MEM_KB / 1024))
if [ "$MEM_MB" -ge 3800 ]; then
  ok "Arbeitsspeicher: ${MEM_MB} MB"
elif [ "$MEM_MB" -ge 1900 ]; then
  warn "Arbeitsspeicher: ${MEM_MB} MB – Build auf dem NAS möglich, kann aber knapp werden; ggf. Variante C (Image auf dem PC bauen)"
else
  fail "Arbeitsspeicher: ${MEM_MB} MB – zu wenig für den Build auf dem NAS; bitte Variante C nutzen (Image auf dem PC bauen und importieren)"
fi

# --- Docker / Compose -----------------------------------------
if command -v docker >/dev/null 2>&1; then
  ok "Docker vorhanden: $(docker --version 2>/dev/null | head -1)"
  if docker info >/dev/null 2>&1; then
    ok "Docker-Daemon läuft"
  else
    fail "Docker-Daemon antwortet nicht (Container Manager gestartet? Als root/sudo ausgeführt?)"
  fi
  if docker compose version >/dev/null 2>&1; then
    ok "docker compose verfügbar: $(docker compose version 2>/dev/null | head -1)"
  elif command -v docker-compose >/dev/null 2>&1; then
    ok "docker-compose (v1) verfügbar – funktioniert ebenfalls"
  else
    fail "Kein 'docker compose' – Container Manager im Paket-Zentrum aktualisieren/installieren"
  fi
else
  fail "Docker nicht installiert – Paket-Zentrum → 'Container Manager' installieren"
fi

# --- Speicherplatz --------------------------------------------
if [ -d /volume1 ]; then
  FREE_GB="$(df -Pm /volume1 2>/dev/null | awk 'NR==2 {printf "%d", $4/1024}')"
  if [ "${FREE_GB:-0}" -ge 10 ]; then
    ok "Freier Speicher auf /volume1: ${FREE_GB} GB"
  elif [ "${FREE_GB:-0}" -ge 5 ]; then
    warn "Freier Speicher auf /volume1: ${FREE_GB} GB – reicht knapp (Image + Build-Cache ~5 GB)"
  else
    fail "Freier Speicher auf /volume1: ${FREE_GB:-?} GB – mindestens 5 GB nötig"
  fi
fi

# --- Port 3000 ------------------------------------------------
if netstat -tln 2>/dev/null | grep -q ':3000 '; then
  fail "Port 3000 ist bereits belegt – anderen Port im Compose-Mapping wählen (z. B. \"3001:3000\")"
else
  ok "Port 3000 ist frei"
fi

# --- Internetzugang (für Image-Download und Projektstand) ------
if curl -fsSL -m 10 -o /dev/null https://registry-1.docker.io/v2/ 2>/dev/null; then
  ok "Docker-Registry erreichbar"
else
  # Registry antwortet ohne Auth mit 401 – curl -f schlägt dann fehl; genauer prüfen:
  CODE="$(curl -s -m 10 -o /dev/null -w '%{http_code}' https://registry-1.docker.io/v2/ 2>/dev/null)"
  if [ "$CODE" = "401" ]; then
    ok "Docker-Registry erreichbar"
  else
    fail "Docker-Registry nicht erreichbar (HTTP $CODE) – Internetzugang/DNS des NAS prüfen"
  fi
fi
if curl -fsSL -m 10 -o /dev/null https://raw.githubusercontent.com/mluetz/mluetz/claude/ict-third-party-risk-cockpit-96rfzf/cockpit/package.json 2>/dev/null; then
  ok "GitHub (Projektstand) erreichbar"
else
  fail "GitHub nicht erreichbar – Internetzugang/DNS des NAS prüfen"
fi

# --- Fazit ----------------------------------------------------
echo ""
echo "============================================================"
if [ "$FAIL" -eq 0 ] && [ "$WARN" -eq 0 ]; then
  echo "Fazit: Alle Voraussetzungen erfüllt. Installation starten mit:"
  echo "  curl -fsSL https://raw.githubusercontent.com/mluetz/mluetz/claude/ict-third-party-risk-cockpit-96rfzf/cockpit/install-synology.sh | sudo sh"
elif [ "$FAIL" -eq 0 ]; then
  echo "Fazit: Installation möglich – $WARN Warnung(en) oben beachten."
else
  echo "Fazit: $FAIL Blocker und $WARN Warnung(en) – bitte zuerst die [FEHLER]-Punkte beheben."
fi
echo "============================================================"
exit "$FAIL"
