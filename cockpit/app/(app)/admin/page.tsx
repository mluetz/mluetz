import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";
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
  const locale = await getLocale();
  const t = TPRM_MESSAGES[locale];
  const a = t.admin.page;

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
        title={a.title}
        description={a.description}
        crumbs={[{ label: t.tp.list.crumbOverview, href: "/overview" }, { label: a.title }]}
      />

      <div className="space-y-6">
        {/* (a) Benutzer & Rollen */}
        <Card>
          <CardHeader>
            <CardTitle>{a.usersRolesTitle}</CardTitle>
            <CardDescription>{a.usersRolesDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>{a.colName}</TH>
                  <TH>{a.colEmail}</TH>
                  <TH>{a.colActive}</TH>
                  <TH>{a.colRoles}</TH>
                  <TH>{a.colAction}</TH>
                </TR>
              </THead>
              <TBody>
                {users.map((u) => (
                  <TR key={u.id}>
                    <TD className="whitespace-nowrap font-medium">
                      {u.name}
                      {u.id === currentUser.id ? (
                        <span className="ml-1 text-xs text-muted-foreground">{a.you}</span>
                      ) : null}
                    </TD>
                    <TD className="whitespace-nowrap">{u.email}</TD>
                    <TD>
                      <Badge variant={u.active ? "low" : "critical"}>
                        {u.active ? a.active : a.inactive}
                      </Badge>
                    </TD>
                    <TD className="min-w-80">
                      <UserRolesForm
                        userId={u.id}
                        allRoles={roles.map((r) => ({ key: r.key, name: r.name }))}
                        currentRoleKeys={u.roles.map((r) => r.role.key)}
                        locale={locale}
                      />
                    </TD>
                    <TD>
                      <UserActiveToggle
                        userId={u.id}
                        active={u.active}
                        isSelf={u.id === currentUser.id}
                        locale={locale}
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
            <CardTitle>{a.methodologyTitle}</CardTitle>
            <CardDescription>{a.methodologyDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <ThresholdsForm
              lowMax={thresholds.lowMax}
              mediumMax={thresholds.mediumMax}
              highMax={thresholds.highMax}
              mitigationCap={mitigationCap}
              locale={locale}
            />
          </CardContent>
        </Card>

        {/* (c) Risikoappetit je Kategorie */}
        <Card>
          <CardHeader>
            <CardTitle>{a.appetiteTitle}</CardTitle>
            <CardDescription>{a.appetiteDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>{a.colCategory}</TH>
                  <TH>{a.colDescription}</TH>
                  <TH>{a.colCurrentAppetite}</TH>
                  <TH>{a.colChange}</TH>
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
                        locale={locale}
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
            <CardTitle>{a.masterDataTitle}</CardTitle>
            <CardDescription>{a.masterDataDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                {a.orgUnits} ({ous.length})
              </h3>
              <ul className="space-y-1 text-sm">
                {ous.map((ou) => (
                  <li key={ou.id}>
                    {ou.name}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({ou.kind === "COMPANY" ? a.company : a.businessUnit})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                {a.locations} ({locations.length})
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
                {a.riskCategories} ({categories.length})
              </h3>
              <ul className="space-y-1 text-sm">
                {categories.map((c) => (
                  <li key={c.id}>{c.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">{a.volumes}</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  {a.assets}: {assetCount}
                </li>
                <li>
                  {a.businessProcesses}: {processCount}
                </li>
                <li>
                  {a.ictServices}: {serviceCount}
                </li>
                <li>
                  {a.roles}: {roles.map((r) => ROLES[r.key as RoleKey] ?? r.name).join(", ")}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
