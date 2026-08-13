import Link from "next/link";
import { Lock } from "lucide-react";
import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Audit Trail" };
export const dynamic = "force-dynamic";

interface Search {
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requirePermission("audit:read");
  const sp = await searchParams;

  const [entityTypes, actions] = await Promise.all([
    db.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true }, orderBy: { entityType: "asc" } }),
    db.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
  ]);

  const from = sp.from ? new Date(sp.from) : undefined;
  const toExclusive = sp.to ? new Date(new Date(sp.to).getTime() + 86400000) : undefined;

  const entries = await db.auditLog.findMany({
    where: {
      ...(sp.entityType ? { entityType: sp.entityType } : {}),
      ...(sp.action ? { action: sp.action } : {}),
      ...(from && !Number.isNaN(from.getTime()) ? { timestamp: { gte: from } } : {}),
      ...(toExclusive && !Number.isNaN(toExclusive.getTime())
        ? { timestamp: { ...(from ? { gte: from } : {}), lt: toExclusive } }
        : {}),
    },
    orderBy: { timestamp: "desc" },
    take: 500,
  });

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        description="Lückenlose Protokollierung aller sicherheits- und governance-relevanten Aktionen"
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Audit Trail" }]}
      />

      <div
        role="note"
        className="mb-4 flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs"
      >
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <p>
          Der Audit Trail ist unveränderlich (append-only) und über die Anwendung nicht editierbar.
        </p>
      </div>

      <form method="GET" className="mb-4 grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 md:grid-cols-5">
        <div>
          <Label htmlFor="f-entity">Entitätstyp</Label>
          <Select id="f-entity" name="entityType" defaultValue={sp.entityType ?? ""}>
            <option value="">Alle</option>
            {entityTypes.map((e) => (
              <option key={e.entityType} value={e.entityType}>
                {e.entityType}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-action">Aktion</Label>
          <Select id="f-action" name="action" defaultValue={sp.action ?? ""}>
            <option value="">Alle</option>
            {actions.map((a) => (
              <option key={a.action} value={a.action}>
                {a.action}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-from">Von</Label>
          <Input id="f-from" type="date" name="from" defaultValue={sp.from ?? ""} />
        </div>
        <div>
          <Label htmlFor="f-to">Bis</Label>
          <Input id="f-to" type="date" name="to" defaultValue={sp.to ?? ""} />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" variant="secondary">
            Filtern
          </Button>
          <Link href="/audit-log">
            <Button type="button" variant="ghost">
              Zurücksetzen
            </Button>
          </Link>
        </div>
      </form>

      <p className="mb-2 text-xs text-muted-foreground">
        {entries.length === 500
          ? "Die letzten 500 passenden Einträge werden angezeigt."
          : `${entries.length} Einträge`}
      </p>

      <Table>
        <THead>
          <TR>
            <TH>Zeitstempel</TH>
            <TH>Benutzer</TH>
            <TH>Aktion</TH>
            <TH>Entität</TH>
            <TH>Feld</TH>
            <TH>Änderung (alt → neu)</TH>
            <TH>Kommentar</TH>
          </TR>
        </THead>
        <TBody>
          {entries.length === 0 ? (
            <TR>
              <TD colSpan={7} className="h-20 text-center text-muted-foreground">
                Keine Einträge für die gewählten Filter.
              </TD>
            </TR>
          ) : (
            entries.map((e) => (
              <TR key={e.id}>
                <TD className="whitespace-nowrap">{formatDateTime(e.timestamp)}</TD>
                <TD className="whitespace-nowrap">{e.userEmail}</TD>
                <TD className="whitespace-nowrap font-medium">{e.action}</TD>
                <TD className="whitespace-nowrap">
                  {e.entityType}
                  <span className="text-xs text-muted-foreground"> · {e.entityId}</span>
                </TD>
                <TD className="whitespace-nowrap">{e.field ?? "–"}</TD>
                <TD className="max-w-72 truncate" title={`${e.oldValue ?? "–"} → ${e.newValue ?? "–"}`}>
                  {e.oldValue || e.newValue ? `${e.oldValue ?? "–"} → ${e.newValue ?? "–"}` : "–"}
                </TD>
                <TD className="max-w-72 truncate" title={e.comment ?? undefined}>
                  {e.comment ?? "–"}
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}
