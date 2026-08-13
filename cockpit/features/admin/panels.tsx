"use client";

import { useActionState } from "react";
import {
  setUserActive,
  setUserRoles,
  updateCategoryAppetite,
  updateThresholds,
  type ActionResult,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/input";
import { ROLES, type RoleKey } from "@/lib/domain/enums";

function ErrorLine({ state }: { state: ActionResult }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  if (state.ok) return <p className="text-sm text-risk-low">Gespeichert.</p>;
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
}: {
  userId: string;
  allRoles: RoleOption[];
  currentRoleKeys: string[];
}) {
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
      <ErrorLine state={state} />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "Speichern…" : "Rollen speichern"}
      </Button>
    </form>
  );
}

export function UserActiveToggle({
  userId,
  active,
  isSelf,
}: {
  userId: string;
  active: boolean;
  isSelf: boolean;
}) {
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
        title={isSelf && active ? "Der eigene Account kann nicht deaktiviert werden." : undefined}
      >
        {pending ? "…" : active ? "Deaktivieren" : "Aktivieren"}
      </Button>
      <ErrorLine state={state} />
    </form>
  );
}

// ---------------- Risikomethodik ----------------

export function ThresholdsForm({
  lowMax,
  mediumMax,
  highMax,
  mitigationCap,
}: {
  lowMax: number;
  mediumMax: number;
  highMax: number;
  mitigationCap: number;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(updateThresholds, {});
  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Low-Max (Klasse LOW bis …)" htmlFor="t-low" required>
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
        <Field label="Medium-Max (MEDIUM bis …)" htmlFor="t-medium" required>
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
        <Field label="High-Max (HIGH bis …; darüber CRITICAL)" htmlFor="t-high" required>
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
        <Field label="Mitigation Cap (0–1)" htmlFor="t-cap" required>
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
      <ErrorLine state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Speichern…" : "Methodik speichern"}
      </Button>
    </form>
  );
}

// ---------------- Risikoappetit je Kategorie ----------------

export function CategoryAppetiteForm({
  categoryId,
  appetiteThreshold,
}: {
  categoryId: string;
  appetiteThreshold: number;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    updateCategoryAppetite,
    {},
  );
  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="categoryId" value={categoryId} />
      <div>
        <Label htmlFor={`app-${categoryId}`}>Appetit (1–25)</Label>
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
        {pending ? "…" : "Speichern"}
      </Button>
      <div>
        <ErrorLine state={state} />
      </div>
    </form>
  );
}
