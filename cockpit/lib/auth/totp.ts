import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Abhängigkeitsfreies TOTP (RFC 6238) auf HOTP-Basis (RFC 4226), SHA-1,
 * 6 Stellen, 30-Sekunden-Schritt — kompatibel mit allen gängigen
 * Authenticator-Apps. Bewusst ohne Fremdbibliothek (Randbedingung:
 * keine neue Abhängigkeit ohne Begründung).
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** Neues Secret (160 Bit, RFC-4226-Empfehlung), Base32-codiert. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** HOTP (RFC 4226): HMAC-SHA1, Dynamic Truncation, 6 Stellen. */
export function hotp(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(msg).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const code =
    ((digest[offset]! & 0x7f) << 24) |
    (digest[offset + 1]! << 16) |
    (digest[offset + 2]! << 8) |
    digest[offset + 3]!;
  return String(code % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

export function totp(secretBase32: string, nowMs: number = Date.now()): string {
  return hotp(secretBase32, Math.floor(nowMs / 1000 / TOTP_STEP_SECONDS));
}

/**
 * Prüft einen Code mit ±1 Zeitschritt Toleranz (Uhrendrift).
 * Konstantzeit-Vergleich je Kandidat.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  nowMs: number = Date.now(),
): boolean {
  const normalized = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  const counter = Math.floor(nowMs / 1000 / TOTP_STEP_SECONDS);
  const given = Buffer.from(normalized);
  for (const c of [counter, counter - 1, counter + 1]) {
    const expected = Buffer.from(hotp(secretBase32, c));
    if (given.length === expected.length && timingSafeEqual(given, expected)) return true;
  }
  return false;
}

/** otpauth-URI für Authenticator-Apps (auch manuell eintragbar). */
export function totpUri(secretBase32: string, accountEmail: string, issuer: string): string {
  const enc = encodeURIComponent;
  return `otpauth://totp/${enc(issuer)}:${enc(accountEmail)}?secret=${secretBase32}&issuer=${enc(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`;
}
