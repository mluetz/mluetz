"use client";

import { useActionState } from "react";
import { createRisk, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/config";
import { CORE_MESSAGES } from "@/lib/i18n/messages/core";

interface Option {
  id: string;
  name: string;
}

export function NewRiskForm({
  locale,
  categories,
  owners,
  ous,
  locations,
}: {
  locale: Locale;
  categories: Option[];
  owners: Option[];
  ous: Option[];
  locations: Option[];
}) {
  const t = CORE_MESSAGES[locale].newRisk;
  const tc = CORE_MESSAGES[locale].common;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createRisk, {});

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.sectionDescription}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label={t.fields.title} htmlFor="title" required>
            <Input id="title" name="title" required minLength={5} maxLength={200} />
          </Field>
          <Field
            label={t.fields.description}
            htmlFor="description"
            required
            hint={t.fields.descriptionHint}
          >
            <Textarea id="description" name="description" required minLength={10} rows={3} />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t.fields.cause} htmlFor="cause" required>
              <Textarea id="cause" name="cause" required minLength={5} rows={3} />
            </Field>
            <Field label={t.fields.riskEvent} htmlFor="riskEvent" required>
              <Textarea id="riskEvent" name="riskEvent" required minLength={5} rows={3} />
            </Field>
            <Field label={t.fields.impactDescription} htmlFor="impactDescription" required>
              <Textarea
                id="impactDescription"
                name="impactDescription"
                required
                minLength={5}
                rows={3}
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.fields.threat} htmlFor="threat" required>
              <Input id="threat" name="threat" required minLength={2} />
            </Field>
            <Field label={t.fields.vulnerability} htmlFor="vulnerability" required>
              <Input id="vulnerability" name="vulnerability" required minLength={2} />
            </Field>
          </div>
          <Field label={t.fields.existingControls} htmlFor="existingControls">
            <Textarea id="existingControls" name="existingControls" rows={2} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.sectionAssignment}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label={t.fields.category} htmlFor="categoryId" required>
            <Select id="categoryId" name="categoryId" required defaultValue="">
              <option value="" disabled>
                {tc.pleaseChoose}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.fields.owner} htmlFor="riskOwnerId">
            <Select id="riskOwnerId" name="riskOwnerId" defaultValue="">
              <option value="">{t.assignLater}</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.fields.ou} htmlFor="ouId">
            <Select id="ouId" name="ouId" defaultValue="">
              <option value="">–</option>
              {ous.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.fields.location} htmlFor="locationId">
            <Select id="locationId" name="locationId" defaultValue="">
              <option value="">–</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
        </CardContent>
      </Card>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? t.submitPending : t.submit}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t.footnote}</p>
    </form>
  );
}
