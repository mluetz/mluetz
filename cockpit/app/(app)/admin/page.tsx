import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getMitigationCap, getRiskThresholds } from "@/lib/settings";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ROLES, type RoleKey } from "@/lib/domain/enums";
import {
  CategoryAppetiteForm,
  ThresholdsForm,
  UserActiveToggle,
  UserRolesForm,
} from "@/features/admin/panels";

export const metadata = { title: "Administration" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const currentUser = await requirePermission("admin");

  const [
    users,
    roles,
    thresholds,
    mitigationCap,
    categories,
    ous,
    locations,
    assetCount,
    processCount,
    serviceCount,
  ] = await Promise.all([
    db.user.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { name: "asc" },
    }),
    db.role.findMany({ orderBy: { key: "asc" } }),
    getRiskThresholds(),
    getMitigationCap(),
    db.riskCategory.findMany({ orderBy: { name: "asc" } }),
    db.organizationalUnit.findMany({ orderBy: { name: "asc" } }),
    db.location.findMany({ orderBy: { name: "asc" } }),
    db.asset.count(),
    db.businessProcess.count(),
    db.ictService.count(),
  ]);

  return (
    <div>
      <PageHeader
        title="Administration"
        description="Benutzer & Rollen, Risikomethodik, Risikoappetit und Stammdaten"
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Administration" }]}
      />

      <div className="space-y-6">
        {/* (a) Benutzer & Rollen */}
        <Card>
          <CardHeader>
            <CardTitle>Benutzer & Rollen</CardTitle>
            <CardDescription>
              Rollenzuweisung (RBAC, Least Privilege) und Aktivierung. Änderungen werden im Audit
              Trail protokolliert. Der eigene Account kann weder deaktiviert werden noch die eigene
              ADMIN-Rolle verlieren.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>E-Mail</TH>
                  <TH>Aktiv</TH>
                  <TH>Rollen</TH>
                  <TH>Aktion</TH>
                </TR>
              </THead>
              <TBody>
                {users.map((u) => (
                  <TR key={u.id}>
                    <TD className="whitespace-nowrap font-medium">
                      {u.name}
                      {u.id === currentUser.id ? (
                        <span className="ml-1 text-xs text-muted-foreground">(Sie)</span>
                      ) : null}
                    </TD>
                    <TD className="whitespace-nowrap">{u.email}</TD>
                    <TD>
                      <Badge variant={u.active ? "low" : "critical"}>
                        {u.active ? "aktiv" : "inaktiv"}
                      </Badge>
                    </TD>
                    <TD className="min-w-80">
                      <UserRolesForm
                        userId={u.id}
                        allRoles={roles.map((r) => ({ key: r.key, name: r.name }))}
                        currentRoleKeys={u.roles.map((r) => r.role.key)}
                      />
                    </TD>
                    <TD>
                      <UserActiveToggle
                        userId={u.id}
                        active={u.active}
                        isSelf={u.id === currentUser.id}
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {/* (b) Risikomethodik */}
        <Card>
          <CardHeader>
            <CardTitle>Risikomethodik</CardTitle>
            <CardDescription>
              Formel: Inherent = Likelihood × Impact (1–25); Residual = round(Inherent × (1 −
              Kontrollwirksamkeit × Mitigation Cap)), mindestens 1. Die Schwellwerte bestimmen die
              Klassifizierung: Score ≤ Low-Max → LOW, ≤ Medium-Max → MEDIUM, ≤ High-Max → HIGH,
              darüber CRITICAL. Der Mitigation Cap begrenzt die maximal anrechenbare Risikominderung
              (Restrisiko-Prinzip: auch eine zu 100 % wirksame Kontrolle eliminiert ein Risiko nie
              vollständig).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThresholdsForm
              lowMax={thresholds.lowMax}
              mediumMax={thresholds.mediumMax}
              highMax={thresholds.highMax}
              mitigationCap={mitigationCap}
            />
          </CardContent>
        </Card>

        {/* (c) Risikoappetit je Kategorie */}
        <Card>
          <CardHeader>
            <CardTitle>Risikoappetit je Kategorie</CardTitle>
            <CardDescription>
              Residual-Score, ab dessen Überschreitung ein Risiko der Kategorie als „über Appetit&ldquo;
              gilt (sofern kein risikoindividueller Override gesetzt ist).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Kategorie</TH>
                  <TH>Beschreibung</TH>
                  <TH>Aktueller Appetit</TH>
                  <TH>Ändern</TH>
                </TR>
              </THead>
              <TBody>
                {categories.map((c) => (
                  <TR key={c.id}>
                    <TD className="whitespace-nowrap font-medium">{c.name}</TD>
                    <TD className="max-w-96 truncate" title={c.description}>
                      {c.description}
                    </TD>
                    <TD className="tabular-nums">{c.appetiteThreshold}</TD>
                    <TD>
                      <CategoryAppetiteForm
                        categoryId={c.id}
                        appetiteThreshold={c.appetiteThreshold}
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {/* (d) Stammdaten */}
        <Card>
          <CardHeader>
            <CardTitle>Stammdaten (Übersicht)</CardTitle>
            <CardDescription>
              Read-only-Überblick über Organisationseinheiten, Standorte, Kategorien und
              Mengengerüste.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                Organisationseinheiten ({ous.length})
              </h3>
              <ul className="space-y-1 text-sm">
                {ous.map((ou) => (
                  <li key={ou.id}>
                    {ou.name}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({ou.kind === "COMPANY" ? "Gesellschaft" : "Geschäftsbereich"})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                Standorte ({locations.length})
              </h3>
              <ul className="space-y-1 text-sm">
                {locations.map((l) => (
                  <li key={l.id}>
                    {l.name} <span className="text-xs text-muted-foreground">({l.country})</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                Risikokategorien ({categories.length})
              </h3>
              <ul className="space-y-1 text-sm">
                {categories.map((c) => (
                  <li key={c.id}>{c.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Mengengerüst</h3>
              <ul className="space-y-1 text-sm">
                <li>Assets: {assetCount}</li>
                <li>Geschäftsprozesse: {processCount}</li>
                <li>ICT-Services: {serviceCount}</li>
                <li>
                  Rollen:{" "}
                  {roles.map((r) => ROLES[r.key as RoleKey] ?? r.name).join(", ")}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
