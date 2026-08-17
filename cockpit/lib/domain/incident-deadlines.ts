/**
 * Meldefristen-Logik nach FRWK-DORA-001, Kap. 7.2 und 15.6.
 *
 * Alle Fristen laufen ab der Kenntniserlangung (awarenessAt) bzw. der
 * Klassifizierung (classifiedAt). Deterministische Berechnung – die
 * UI rendert nur die Ergebnisse.
 *
 *  DORA (Art. 19, RTS 2025/301), nur bei schwerwiegenden Vorfällen:
 *   - Erstmeldung: 4 h nach Klassifizierung, absolut spätestens
 *     24 h nach Kenntniserlangung (das frühere Datum gilt)
 *   - Zwischenmeldung: 72 h nach der (abgesetzten bzw. fälligen) Erstmeldung
 *   - Abschlussmeldung: 1 Monat nach der (abgesetzten bzw. fälligen) Zwischenmeldung
 *  NIS-2 / BSIG (sofern einschlägig): Frühwarnung 24 h, Meldung 72 h ab
 *  Kenntnis, Abschluss 1 Monat nach Meldung.
 *  DSGVO Art. 33 (sofern personenbezogene Daten betroffen): 72 h ab Kenntnis.
 */

const HOUR = 3_600_000;

export interface DeadlineInput {
  awarenessAt: Date;
  classifiedAt: Date | null;
  isMajor: boolean;
  gdprRelevant: boolean;
  nis2Relevant: boolean;
  /** Tatsächliche Abgabezeitpunkte, falls bereits gemeldet. */
  submitted?: Partial<Record<ReportType, Date>>;
}

export type ReportType =
  | "DORA_INITIAL"
  | "DORA_INTERMEDIATE"
  | "DORA_FINAL"
  | "NIS2_EARLY_WARNING"
  | "NIS2_REPORT"
  | "NIS2_FINAL"
  | "GDPR_NOTIFICATION";

export interface Deadline {
  reportType: ReportType;
  label: string;
  dueAt: Date;
  submittedAt: Date | null;
  /** OK = fristgerecht gemeldet; DUE = offen, Frist läuft; OVERDUE = Frist gerissen; LATE = gemeldet, aber zu spät. */
  status: "OK" | "DUE" | "OVERDUE" | "LATE";
}

function addMonth(d: Date): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + 1);
  return r;
}

function status(dueAt: Date, submittedAt: Date | null, now: Date): Deadline["status"] {
  if (submittedAt) return submittedAt.getTime() <= dueAt.getTime() ? "OK" : "LATE";
  return now.getTime() <= dueAt.getTime() ? "DUE" : "OVERDUE";
}

/** Berechnet alle anwendbaren Meldefristen eines Vorfalls. */
export function computeDeadlines(input: DeadlineInput, now: Date): Deadline[] {
  const out: Deadline[] = [];
  const sub = input.submitted ?? {};
  const push = (reportType: ReportType, label: string, dueAt: Date) => {
    const submittedAt = sub[reportType] ?? null;
    out.push({ reportType, label, dueAt, submittedAt, status: status(dueAt, submittedAt, now) });
  };

  if (input.isMajor) {
    const absolute = new Date(input.awarenessAt.getTime() + 24 * HOUR);
    const fromClassification = input.classifiedAt
      ? new Date(input.classifiedAt.getTime() + 4 * HOUR)
      : null;
    const initialDue =
      fromClassification && fromClassification.getTime() < absolute.getTime()
        ? fromClassification
        : absolute;
    push("DORA_INITIAL", "DORA-Erstmeldung (4 h / max. 24 h)", initialDue);

    const initialAnchor = sub.DORA_INITIAL ?? initialDue;
    const intermediateDue = new Date(initialAnchor.getTime() + 72 * HOUR);
    push("DORA_INTERMEDIATE", "DORA-Zwischenmeldung (72 h)", intermediateDue);

    const intermediateAnchor = sub.DORA_INTERMEDIATE ?? intermediateDue;
    push("DORA_FINAL", "DORA-Abschlussmeldung (1 Monat)", addMonth(intermediateAnchor));
  }

  if (input.nis2Relevant) {
    push(
      "NIS2_EARLY_WARNING",
      "NIS-2-Frühwarnung (24 h)",
      new Date(input.awarenessAt.getTime() + 24 * HOUR),
    );
    const reportDue = new Date(input.awarenessAt.getTime() + 72 * HOUR);
    push("NIS2_REPORT", "NIS-2-Meldung (72 h)", reportDue);
    push("NIS2_FINAL", "NIS-2-Abschlussbericht (1 Monat)", addMonth(sub.NIS2_REPORT ?? reportDue));
  }

  if (input.gdprRelevant) {
    push(
      "GDPR_NOTIFICATION",
      "DSGVO-Meldung Art. 33 (72 h)",
      new Date(input.awarenessAt.getTime() + 72 * HOUR),
    );
  }

  return out;
}

/** Menschlich lesbare Restlaufzeit (negativ = überfällig). */
export function remainingLabel(dueAt: Date, now: Date): string {
  const ms = dueAt.getTime() - now.getTime();
  const abs = Math.abs(ms);
  const h = Math.floor(abs / HOUR);
  const m = Math.floor((abs % HOUR) / 60000);
  const core = h >= 48 ? `${Math.floor(h / 24)} T ${h % 24} h` : `${h} h ${m} min`;
  return ms >= 0 ? `noch ${core}` : `überfällig seit ${core}`;
}
