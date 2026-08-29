import { describe, expect, it } from "vitest";
import {
  base32Decode,
  base32Encode,
  generateTotpSecret,
  hotp,
  totp,
  totpUri,
  verifyTotp,
} from "@/lib/auth/totp";

/** RFC-4226-Testsecret "12345678901234567890" in Base32. */
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890", "ascii"));

describe("Base32", () => {
  it("kodiert und dekodiert verlustfrei", () => {
    const buf = Buffer.from("Hallo TPRM Cockpit!", "utf8");
    expect(base32Decode(base32Encode(buf)).equals(buf)).toBe(true);
  });
  it("entspricht dem RFC-4648-Beispiel", () => {
    expect(base32Encode(Buffer.from("foobar", "ascii"))).toBe("MZXW6YTBOI");
  });
});

describe("HOTP (RFC 4226, Anhang D)", () => {
  const expected = ["755224", "287082", "359152", "969429", "338314", "254676"];
  it.each(expected.map((code, counter) => [counter, code]))(
    "Counter %i -> %s",
    (counter, code) => {
      expect(hotp(RFC_SECRET, counter as number)).toBe(code);
    },
  );
});

describe("TOTP (RFC 6238)", () => {
  it("liefert bei T=59s den RFC-Wert 287082 (6-stellig, SHA-1)", () => {
    expect(totp(RFC_SECRET, 59_000)).toBe("287082");
  });
  it("akzeptiert den aktuellen Code und ±1 Zeitschritt", () => {
    const now = 1_111_111_109_000; // RFC-Testzeitpunkt
    const code = totp(RFC_SECRET, now);
    expect(verifyTotp(RFC_SECRET, code, now)).toBe(true);
    expect(verifyTotp(RFC_SECRET, code, now + 30_000)).toBe(true);
    expect(verifyTotp(RFC_SECRET, code, now - 30_000)).toBe(true);
    expect(verifyTotp(RFC_SECRET, code, now + 90_000)).toBe(false);
  });
  it("weist falsche und fehlformatierte Codes zurück", () => {
    expect(verifyTotp(RFC_SECRET, "000000")).toBe(false);
    expect(verifyTotp(RFC_SECRET, "abc123")).toBe(false);
    expect(verifyTotp(RFC_SECRET, "12345")).toBe(false);
  });
});

describe("Secret & URI", () => {
  it("erzeugt 160-Bit-Secrets (32 Base32-Zeichen)", () => {
    const s = generateTotpSecret();
    expect(s).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Decode(s).length).toBe(20);
  });
  it("baut eine standardkonforme otpauth-URI", () => {
    const uri = totpUri("ABCDEFGH", "iso@example.com", "ICT & TPRM Cockpit");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("secret=ABCDEFGH");
    expect(uri).toContain("issuer=ICT%20%26%20TPRM%20Cockpit");
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });
});
