#!/usr/bin/env python3
"""
Baut die geschützte Eingangsseite (index.html) für das TISAX-Finding-Register.

Verschlüsselt die beiden generierten Anwendungen (app/register-de.html und
app/register-en.html) mit AES-256-GCM. Der Schlüssel wird per PBKDF2-SHA-256
(600.000 Iterationen) aus Benutzername + Passwort abgeleitet — es wird weder
das Passwort noch ein Passwort-Hash gespeichert; ohne die richtigen Zugangs-
daten sind die eingebetteten Inhalte reiner Ciphertext. Die Zugangsdaten
selbst tauchen nirgends im Repository auf: sie werden beim Aufruf interaktiv
abgefragt (oder über die Umgebungsvariablen VAULT_USER / VAULT_PASS gesetzt).

Aufruf (nach jedem Neu-Generieren der Apps):
    python3 tools/generate.py && python3 tools/generate_en.py
    python3 tools/encrypt.py            # fragt Benutzer + Passwort ab
Erzeugt:  index.html  (Login-Seite mit eingebetteten, verschlüsselten Apps)
Abhängigkeit: cryptography  (pip install cryptography)

Passwort ändern = einfach mit neuen Zugangsdaten erneut ausführen und die
neue index.html committen (Salt und Schlüssel werden dabei neu erzeugt).
Der Benutzername ist beim Login unabhängig von Groß-/Kleinschreibung.
"""
import base64
import getpass
import gzip
import hashlib
import json
import os
import secrets
import sys
from pathlib import Path

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
except ImportError:
    sys.exit("Bitte zuerst installieren:  pip install cryptography")

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "tools" / "login_template.html"
APPS = {"de": ROOT / "app" / "register-de.html", "en": ROOT / "app" / "register-en.html"}
OUT = ROOT / "index.html"
ITERATIONS = 600_000

b64 = lambda b: base64.b64encode(b).decode()


def main():
    user = os.environ.get("VAULT_USER") or input("Benutzer: ")
    pw = os.environ.get("VAULT_PASS") or getpass.getpass("Passwort: ")
    if not user.strip() or not pw:
        sys.exit("Benutzer und Passwort dürfen nicht leer sein.")

    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac(
        "sha256", (user.strip().lower() + "\x00" + pw).encode("utf-8"), salt, ITERATIONS, 32)
    aes = AESGCM(key)

    payloads = {}
    for lang, path in APPS.items():
        if not path.exists():
            sys.exit(f"Fehlt: {path} — zuerst tools/generate.py bzw. generate_en.py ausführen.")
        data = gzip.compress(path.read_bytes(), 9)
        nonce = secrets.token_bytes(12)
        payloads[lang] = {"nonce": b64(nonce), "ct": b64(aes.encrypt(nonce, data, None))}

    vault = {"v": 1, "iter": ITERATIONS, "salt": b64(salt), "payloads": payloads}
    tpl = TEMPLATE.read_text(encoding="utf-8")
    if "/*__VAULT__*/" not in tpl:
        sys.exit("Template-Platzhalter /*__VAULT__*/ fehlt.")
    OUT.write_text(tpl.replace("/*__VAULT__*/", json.dumps(vault, separators=(",", ":"))),
                   encoding="utf-8")
    print(f"OK · index.html ({OUT.stat().st_size // 1024} KB) — "
          f"AES-256-GCM, PBKDF2 {ITERATIONS:,} Iterationen, Benutzer '{user.strip().lower()}'")


if __name__ == "__main__":
    main()
