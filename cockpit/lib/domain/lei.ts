/**
 * LEI-Validierung nach ISO 17442 (Review v3, P1-01/1.3):
 * 20 alphanumerische Zeichen, die letzten beiden sind Prüfziffern nach
 * ISO/IEC 7064 MOD 97-10 (wie IBAN): Buchstaben -> Zahlen (A=10..Z=35),
 * Gesamtzahl mod 97 muss 1 ergeben.
 */

export function isValidLeiFormat(lei: string): boolean {
  return /^[A-Z0-9]{18}[0-9]{2}$/.test(lei.toUpperCase().trim());
}

export function isValidLei(lei: string): boolean {
  const s = lei.toUpperCase().trim();
  if (!isValidLeiFormat(s)) return false;
  let acc = 0;
  for (const ch of s) {
    const v = ch >= "0" && ch <= "9" ? ch : String(ch.charCodeAt(0) - 55);
    for (const digit of v) acc = (acc * 10 + (digit.charCodeAt(0) - 48)) % 97;
  }
  return acc === 1;
}
