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


def get_credentials():
    """Zugangsdaten mehrerer Benutzer: VAULT_CREDS="user1:pass1;user2:pass2"
    (Passwörter dürfen ':' enthalten, nur ';' ist Trenner) oder interaktive
    Abfrage — leerer Benutzername beendet die Eingabe."""
    env = os.environ.get("VAULT_CREDS")
    if not env and os.environ.get("VAULT_USER"):
        env = os.environ["VAULT_USER"] + ":" + os.environ.get("VAULT_PASS", "")
    creds = []
    if env:
        for item in env.split(";"):
            user, _, pw = item.partition(":")
            creds.append((user.strip(), pw))
    else:
        while True:
            user = input(f"Benutzer {len(creds) + 1} (leer = fertig): ").strip()
            if not user:
                break
            creds.append((user, getpass.getpass(f"Passwort für {user}: ")))
    creds = [(u, p) for u, p in creds if u and p]
    if not creds:
        sys.exit("Mindestens ein Benutzer mit Passwort wird benötigt.")
    return creds


def main():
    creds = get_credentials()

    # Envelope-Schema: ein zufälliger Inhaltsschlüssel (CEK) verschlüsselt die
    # Inhalte; je Benutzer wird der CEK mit einem per PBKDF2 abgeleiteten
    # Schlüssel (KEK, eigener Salt) eingewickelt. Benutzernamen werden nicht
    # gespeichert — der Login probiert alle Slots durch.
    cek = secrets.token_bytes(32)
    aes = AESGCM(cek)

    payloads = {}
    for lang, path in APPS.items():
        if not path.exists():
            sys.exit(f"Fehlt: {path} — zuerst tools/generate.py bzw. generate_en.py ausführen.")
        data = gzip.compress(path.read_bytes(), 9)
        nonce = secrets.token_bytes(12)
        payloads[lang] = {"nonce": b64(nonce), "ct": b64(aes.encrypt(nonce, data, None))}

    slots = []
    for user, pw in creds:
        salt = secrets.token_bytes(16)
        kek = hashlib.pbkdf2_hmac(
            "sha256", (user.lower() + "\x00" + pw).encode("utf-8"), salt, ITERATIONS, 32)
        nonce = secrets.token_bytes(12)
        slots.append({"salt": b64(salt), "nonce": b64(nonce),
                      "wrapped": b64(AESGCM(kek).encrypt(nonce, cek, None))})

    vault = {"v": 2, "iter": ITERATIONS, "slots": slots, "payloads": payloads}
    tpl = TEMPLATE.read_text(encoding="utf-8")
    if "/*__VAULT__*/" not in tpl:
        sys.exit("Template-Platzhalter /*__VAULT__*/ fehlt.")
    OUT.write_text(tpl.replace("/*__VAULT__*/", json.dumps(vault, separators=(",", ":"))),
                   encoding="utf-8")
    users = ", ".join(u.lower() for u, _ in creds)
    print(f"OK · index.html ({OUT.stat().st_size // 1024} KB) — "
          f"AES-256-GCM, PBKDF2 {ITERATIONS:,} Iterationen, {len(creds)} Benutzer ({users})")


if __name__ == "__main__":
    main()
