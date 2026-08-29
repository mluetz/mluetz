import "server-only";
import { db } from "@/lib/db";

/**
 * Fristen-Scan (Review v3, P1-07): erzeugt Benachrichtigungen für
 * T-30 / T-7 / T-0 / überfällig an die Owner, eine Eskalationsstufe und
 * einen Tagesdigest an den ISO; optional Webhook (NOTIFY_WEBHOOK_URL).
 *
 * Aufruf: stündlich über /api/cron/deadlines (Bearer CRON_SECRET) —
 * z. B. Synology-Aufgabenplaner mit curl (docs/operations/synology.md).
 * Vorfallsmeldefristen (4 h/24 h/72 h) werden bei jedem Lauf geprüft,
 * die übrigen Gegenstände einmal täglich (Dedupe über 20 h).
 *
 * E-Mail: bewusst als Abstraktion — ohne SMTP-Abhängigkeit werden In-App-
 * Notifications erzeugt und der Webhook bedient (der z. B. an einen
 * Mail-Relay/Teams/Slack-Adapter zeigt). SMTP kann später hinter
 * dispatchExternal() ergänzt werden, ohne den Scan zu ändern.
 */

const DAY = 86_400_000;

interface DueItem {
  key: string; // Dedupe-Schlüssel
  title: string;
  body: string;
  link: string;
  ownerId: string | null;
  severity: "OVERDUE" | "T0" | "T7" | "T30" | "WINDOW";
}

function windowFor(due: Date, now: Date): DueItem["severity"] | null {
  const diff = due.getTime() - now.getTime();
  if (diff < 0) return "OVERDUE";
  if (diff <= 1 * DAY) return "T0";
  if (diff <= 7 * DAY) return "T7";
  if (diff <= 30 * DAY) return "T30";
  return null;
}

export async function collectDueItems(now = new Date()): Promise<DueItem[]> {
  const items: DueItem[] = [];
  const soon = new Date(now.getTime() + 31 * DAY);

  const [actions, risks, tps, contracts, evidence, controls, exits, incidents] = await Promise.all([
    db.action.findMany({
      where: { status: { notIn: ["COMPLETED", "CLOSED"] }, dueDate: { not: null, lte: soon } },
      select: { id: true, actionId: true, title: true, dueDate: true, ownerId: true },
    }),
    db.risk.findMany({
      where: { status: { notIn: ["CLOSED", "REJECTED"] }, nextReviewDate: { not: null, lte: soon } },
      select: { id: true, riskId: true, title: true, nextReviewDate: true, riskOwnerId: true },
    }),
    db.thirdParty.findMany({
      where: { status: { not: "EXIT" }, nextReviewDate: { not: null, lte: soon } },
      select: { id: true, tpId: true, name: true, nextReviewDate: true, businessOwnerId: true },
    }),
    db.contract.findMany({
      where: { endDate: { not: null, lte: new Date(now.getTime() + 210 * DAY) } },
      select: {
        id: true,
        title: true,
        contractRef: true,
        endDate: true,
        noticePeriodDays: true,
        thirdParty: { select: { id: true, tpId: true, contractOwnerId: true } },
      },
    }),
    db.evidence.findMany({
      where: { validUntil: { not: null, lte: soon } },
      select: { id: true, evidenceId: true, title: true, validUntil: true, ownerId: true },
    }),
    db.control.findMany({
      where: { nextTestDate: { not: null, lte: soon } },
      select: { id: true, controlId: true, name: true, nextTestDate: true, ownerId: true },
    }),
    db.exitStrategy.findMany({
      select: {
        id: true,
        status: true,
        lastTestDate: true,
        thirdParty: {
          select: {
            id: true,
            tpId: true,
            name: true,
            businessOwnerId: true,
            _count: { select: { criticalFunctions: true } },
          },
        },
      },
    }),
    db.incidentReport.findMany({
      where: { submittedAt: null, incident: { status: { not: "CLOSED" } } },
      select: {
        id: true,
        reportType: true,
        dueAt: true,
        incident: { select: { id: true, incidentId: true, createdById: true } },
      },
    }),
  ]);

  for (const a of actions) {
    const w = windowFor(a.dueDate!, now);
    if (w)
      items.push({
        key: `action:${a.id}:${w}`,
        title: `Maßnahme ${a.actionId} ${w === "OVERDUE" ? "überfällig" : "fällig"}`,
        body: `${a.title} — Fälligkeit ${a.dueDate!.toISOString().slice(0, 10)}`,
        link: `/actions/${a.id}`,
        ownerId: a.ownerId,
        severity: w,
      });
  }
  for (const r of risks) {
    const w = windowFor(r.nextReviewDate!, now);
    if (w)
      items.push({
        key: `risk-review:${r.id}:${w}`,
        title: `Risk-Review ${r.riskId} ${w === "OVERDUE" ? "überfällig" : "fällig"}`,
        body: r.title,
        link: `/risks/${r.id}`,
        ownerId: r.riskOwnerId,
        severity: w,
      });
  }
  for (const tp of tps) {
    const w = windowFor(tp.nextReviewDate!, now);
    if (w)
      items.push({
        key: `tp-review:${tp.id}:${w}`,
        title: `Third-Party-Review ${tp.tpId} ${w === "OVERDUE" ? "überfällig" : "fällig"}`,
        body: tp.name,
        link: `/third-parties/${tp.id}`,
        ownerId: tp.businessOwnerId,
        severity: w,
      });
  }
  for (const c of contracts) {
    const end = c.endDate!;
    const notice = c.noticePeriodDays
      ? new Date(end.getTime() - c.noticePeriodDays * DAY)
      : null;
    const wEnd = windowFor(end, now);
    if (wEnd)
      items.push({
        key: `contract-end:${c.id}:${wEnd}`,
        title: `Vertragsende ${c.contractRef ?? c.title}`,
        body: `Ende ${end.toISOString().slice(0, 10)} (${c.thirdParty.tpId})`,
        link: `/third-parties/${c.thirdParty.id}?tab=contracts`,
        ownerId: c.thirdParty.contractOwnerId,
        severity: wEnd,
      });
    const wNotice = notice ? windowFor(notice, now) : null;
    if (wNotice && wNotice !== "OVERDUE")
      items.push({
        key: `contract-notice:${c.id}:${wNotice}`,
        title: `Kündigungsfrist läuft: ${c.contractRef ?? c.title}`,
        body: `Letzter Kündigungstermin ${notice!.toISOString().slice(0, 10)} (${c.thirdParty.tpId})`,
        link: `/third-parties/${c.thirdParty.id}?tab=contracts`,
        ownerId: c.thirdParty.contractOwnerId,
        severity: wNotice,
      });
  }
  for (const e of evidence) {
    const w = windowFor(e.validUntil!, now);
    if (w)
      items.push({
        key: `evidence:${e.id}:${w}`,
        title: `Nachweis ${e.evidenceId} ${w === "OVERDUE" ? "abgelaufen" : "läuft ab"}`,
        body: e.title,
        link: `/evidence/${e.id}`,
        ownerId: e.ownerId,
        severity: w,
      });
  }
  for (const c of controls) {
    const w = windowFor(c.nextTestDate!, now);
    if (w)
      items.push({
        key: `control-test:${c.id}:${w}`,
        title: `Kontrolltest ${c.controlId} ${w === "OVERDUE" ? "überfällig" : "fällig"}`,
        body: c.name,
        link: `/controls/${c.id}`,
        ownerId: c.ownerId,
        severity: w,
      });
  }
  for (const x of exits) {
    if (x.thirdParty._count.criticalFunctions === 0) continue;
    const lastTest = x.lastTestDate;
    const due = lastTest ? new Date(lastTest.getTime() + 365 * DAY) : now;
    const w = windowFor(due, now);
    if (w && (x.status !== "TESTED" || w === "OVERDUE" || w === "T30" || w === "T7" || w === "T0"))
      items.push({
        key: `exit-test:${x.id}:${w}`,
        title: `Exit-Test ${x.thirdParty.tpId} ${w === "OVERDUE" ? "überfällig" : "fällig"} (Art. 28 Abs. 8)`,
        body: x.thirdParty.name,
        link: `/third-parties/${x.thirdParty.id}?tab=exit`,
        ownerId: x.thirdParty.businessOwnerId,
        severity: w,
      });
  }
  // Vorfallsmeldefristen: stündliche Prüfung innerhalb der Fenster.
  for (const r of incidents) {
    const diff = r.dueAt.getTime() - now.getTime();
    if (diff < 0 || diff <= 3 * DAY) {
      items.push({
        key: `incident-report:${r.id}:${diff < 0 ? "OVERDUE" : Math.floor(diff / 3_600_000)}h`,
        title: `Meldefrist ${r.reportType} ${diff < 0 ? "GERISSEN" : "läuft"} (${r.incident.incidentId})`,
        body: `Fällig ${r.dueAt.toISOString()}`,
        link: `/dora/incidents/${r.incident.id}`,
        ownerId: r.incident.createdById,
        severity: diff < 0 ? "OVERDUE" : "WINDOW",
      });
    }
  }
  return items;
}

async function dispatchExternal(items: DueItem[]): Promise<void> {
  const url = process.env.NOTIFY_WEBHOOK_URL;
  if (!url || items.length === 0) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "ict-tprm-cockpit",
        generatedAt: new Date().toISOString(),
        items: items.map((i) => ({
          title: i.title,
          body: i.body,
          link: i.link,
          severity: i.severity,
        })),
      }),
    });
  } catch {
    // Webhook-Fehler dürfen den Scan nie abbrechen.
  }
}

export async function runDeadlineScan(now = new Date()): Promise<{
  scanned: number;
  notified: number;
}> {
  const items = await collectDueItems(now);
  const isoUsers = await db.user.findMany({
    where: { active: true, roles: { some: { role: { key: "ISO" } } } },
    select: { id: true },
  });
  const dedupeSince = new Date(now.getTime() - 20 * 3_600_000);
  let notified = 0;

  for (const item of items) {
    const recipients = new Set<string>();
    if (item.ownerId) recipients.add(item.ownerId);
    // Eskalation überfälliger Posten zusätzlich an den ISO.
    if (item.severity === "OVERDUE") for (const u of isoUsers) recipients.add(u.id);
    for (const userId of recipients) {
      const already = await db.notification.findFirst({
        where: { userId, title: item.title, createdAt: { gte: dedupeSince } },
      });
      if (already) continue;
      await db.notification.create({
        data: { userId, title: item.title, body: item.body, link: item.link },
      });
      notified += 1;
    }
  }

  // Tagesdigest an den ISO (einmal je 20 h).
  if (items.length > 0 && isoUsers.length > 0) {
    const digestTitle = `Fristen-Digest: ${items.length} Posten (${items.filter((i) => i.severity === "OVERDUE").length} überfällig)`;
    for (const u of isoUsers) {
      const already = await db.notification.findFirst({
        where: { userId: u.id, title: { startsWith: "Fristen-Digest:" }, createdAt: { gte: dedupeSince } },
      });
      if (!already) {
        await db.notification.create({
          data: {
            userId: u.id,
            title: digestTitle,
            body: items
              .slice(0, 20)
              .map((i) => `• ${i.title}`)
              .join("\n"),
            link: "/overview",
          },
        });
        notified += 1;
      }
    }
  }

  await dispatchExternal(items.filter((i) => i.severity === "OVERDUE" || i.severity === "T0" || i.severity === "WINDOW"));
  return { scanned: items.length, notified };
}
