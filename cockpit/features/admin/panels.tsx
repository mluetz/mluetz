"use client";

import { useActionState } from "react";
import {
  approveMethodology,
  rejectMethodology,
  resetUserMfa,
  setUserActive,
  setUserRoles,
  updateCategoryAppetite,
  updateThresholds,
  type ActionResult,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/input";
import { ROLES, type RoleKey } from "@/lib/domain/enums";
import type { Locale } from "@/lib/i18n/config";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";

function ErrorLine({ state, locale }: { state: ActionResult; locale: Locale }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  if (state.ok)
    return <p className="text-sm text-risk-low">{TPRM_MESSAGES[locale].common.saved}</p>;
  return null;
}

// ---------------- Benutzer & Rollen ----------------

export interface RoleOption {
  key: string;
  name: string;
}

export function UserRolesForm({
  userId,
  allRoles,
  currentRoleKeys,
  locale,
}: {
  userId: string;
  allRoles: RoleOption[];
  currentRoleKeys: string[];
  locale: Locale;
}) {
  const t = TPRM_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(setUserRoles, {});
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="userId" value={userId} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {allRoles.map((r) => (
          <label key={r.key} className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              name="roles"
              value={r.key}
              defaultChecked={currentRoleKeys.includes(r.key)}
              className="h-3.5 w-3.5 rounded border-input"
            />
            {ROLES[r.key as RoleKey] ?? r.name}
          </label>
        ))}
      </div>
      <ErrorLine state={state} locale={locale} />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? t.common.saving : t.admin.panels.saveRoles}
      </Button>
    </form>
  );
}

export function UserActiveToggle({
  userId,
  active,
  isSelf,
  locale,
}: {
  userId: string;
  active: boolean;
  isSelf: boolean;
  locale: Locale;
}) {
  const t = TPRM_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(setUserActive, {});
  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <Button
        type="submit"
        size="sm"
        variant={active ? "outline" : "default"}
        disabled={pending || (isSelf && active)}
        title={isSelf && active ? t.admin.panels.cannotDeactivateSelf : undefined}
      >
        {pending ? "…" : active ? t.admin.panels.deactivate : t.admin.panels.activate}
      </Button>
      <ErrorLine state={state} locale={locale} />
    </form>
  );
}

/** MFA zurücksetzen: Neueinrichtung wird beim nächsten Login erzwungen. */
export function ResetMfaButton({
  userId,
  mfaEnabled,
  locale,
}: {
  userId: string;
  mfaEnabled: boolean;
  locale: Locale;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(resetUserMfa, {});
  const label = locale === "de" ? "MFA zurücksetzen" : "Reset MFA";
  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending || !mfaEnabled}>
        {pending ? "…" : label}
      </Button>
      <ErrorLine state={state} locale={locale} />
    </form>
  );
}

// ---------------- Risikomethodik ----------------

export function ThresholdsForm({
  lowMax,
  mediumMax,
  highMax,
  mitigationCap,
  locale,
}: {
  lowMax: number;
  mediumMax: number;
  highMax: number;
  mitigationCap: number;
  locale: Locale;
}) {
  const t = TPRM_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(updateThresholds, {});
  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Field label={t.admin.panels.lowMax} htmlFor="t-low" required>
          <Input
            id="t-low"
            name="lowMax"
            type="number"
            min={1}
            max={25}
            required
            defaultValue={lowMax}
          />
        </Field>
        <Field label={t.admin.panels.mediumMax} htmlFor="t-medium" required>
          <Input
            id="t-medium"
            name="mediumMax"
            type="number"
            min={1}
            max={25}
            required
            defaultValue={mediumMax}
          />
        </Field>
        <Field label={t.admin.panels.highMax} htmlFor="t-high" required>
          <Input
            id="t-high"
            name="highMax"
            type="number"
            min={1}
            max={25}
            required
            defaultValue={highMax}
          />
        </Field>
        <Field label={t.admin.panels.mitigationCap} htmlFor="t-cap" required>
          <Input
            id="t-cap"
            name="mitigationCap"
            type="number"
            min={0}
            max={1}
            step={0.05}
            required
            defaultValue={mitigationCap}
          />
        </Field>
      </div>
      <Field
        label={locale === "de" ? "Begründung (Pflicht, Vier-Augen-Antrag)" : "Rationale (required, four-eyes request)"}
        htmlFor="t-rationale"
        required
      >
        <Input
          id="t-rationale"
          name="rationale"
          required
          minLength={10}
          placeholder={
            locale === "de"
              ? "Warum wird die Methodik geändert?"
              : "Why is the methodology being changed?"
          }
        />
      </Field>
      <p className="text-xs text-muted-foreground">
        {locale === "de"
          ? "Änderungen werden erst wirksam, wenn eine andere Person mit Second-Line-Berechtigung den Antrag freigibt (P1-06)."
          : "Changes take effect only after a different person with second-line permission approves the request (P1-06)."}
      </p>
      <ErrorLine state={state} locale={locale} />
      <Button type="submit" disabled={pending}>
        {pending
          ? t.common.saving
          : locale === "de"
            ? "Methodikänderung beantragen"
            : "Request methodology change"}
      </Button>
    </form>
  );
}

// ---------------- Methodik-Freigabe (Vier-Augen, P1-06) ----------------

export function MethodologyApprovalPanel({
  pending: pendingVersion,
  locale,
}: {
  pending: {
    id: string;
    version: number;
    lowMax: number;
    mediumMax: number;
    highMax: number;
    mitigationCap: number;
    rationale: string;
    requestedBy: string;
  } | null;
  locale: Locale;
}) {
  const de = locale === "de";
  const [aState, approveAction, aPending] = useActionState<ActionResult, FormData>(
    approveMethodology,
    {},
  );
  const [rState, rejectAction, rPending] = useActionState<ActionResult, FormData>(
    rejectMethodology,
    {},
  );
  if (!pendingVersion) {
    return (
      <p className="text-sm text-muted-foreground">
        {de ? "Kein offener Methodikantrag." : "No pending methodology request."}
      </p>
    );
  }
  return (
    <div className="space-y-2 rounded-md border p-3 text-sm">
      <p className="font-medium">
        {de ? "Antrag" : "Request"} v{pendingVersion.version} ·{" "}
        <span className="tabular-nums">
          low ≤ {pendingVersion.lowMax} · medium ≤ {pendingVersion.mediumMax} · high ≤{" "}
          {pendingVersion.highMax} · cap {pendingVersion.mitigationCap}
        </span>
      </p>
      <p className="text-muted-foreground">
        {pendingVersion.rationale} — {de ? "beantragt von" : "requested by"}{" "}
        {pendingVersion.requestedBy}
      </p>
      <div className="flex gap-2">
        <form action={approveAction}>
          <input type="hidden" name="versionId" value={pendingVersion.id} />
          <Button type="submit" size="sm" disabled={aPending}>
            {aPending ? "…" : de ? "Freigeben" : "Approve"}
          </Button>
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="versionId" value={pendingVersion.id} />
          <Button type="submit" size="sm" variant="outline" disabled={rPending}>
            {rPending ? "…" : de ? "Ablehnen" : "Reject"}
          </Button>
        </form>
      </div>
      <ErrorLine state={aState} locale={locale} />
      <ErrorLine state={rState} locale={locale} />
    </div>
  );
}

// ---------------- Risikoappetit je Kategorie ----------------

export function CategoryAppetiteForm({
  categoryId,
  appetiteThreshold,
  locale,
}: {
  categoryId: string;
  appetiteThreshold: number;
  locale: Locale;
}) {
  const t = TPRM_MESSAGES[locale];
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    updateCategoryAppetite,
    {},
  );
  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="categoryId" value={categoryId} />
      <div>
        <Label htmlFor={`app-${categoryId}`}>{t.admin.panels.appetite}</Label>
        <Input
          id={`app-${categoryId}`}
          name="appetiteThreshold"
          type="number"
          min={1}
          max={25}
          required
          defaultValue={appetiteThreshold}
          className="w-24"
        />
      </div>
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "…" : t.common.save}
      </Button>
      <div>
        <ErrorLine state={state} locale={locale} />
      </div>
    </form>
  );
}
