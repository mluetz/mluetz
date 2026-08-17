"use client";

import { useActionState } from "react";
import { createRisk, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";

interface Option {
  id: string;
  name: string;
}

export function NewRiskForm({
  categories,
  owners,
  ous,
  locations,
}: {
  categories: Option[];
  owners: Option[];
  ous: Option[];
  locations: Option[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createRisk, {});

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Risikobeschreibung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Risikotitel" htmlFor="title" required>
            <Input id="title" name="title" required minLength={5} maxLength={200} />
          </Field>
          <Field
            label="Risikobeschreibung"
            htmlFor="description"
            required
            hint="Verständliche Gesamtbeschreibung des Risikos."
          >
            <Textarea id="description" name="description" required minLength={10} rows={3} />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Ursache" htmlFor="cause" required>
              <Textarea id="cause" name="cause" required minLength={5} rows={3} />
            </Field>
            <Field label="Risikoereignis" htmlFor="riskEvent" required>
              <Textarea id="riskEvent" name="riskEvent" required minLength={5} rows={3} />
            </Field>
            <Field label="Mögliche Auswirkungen" htmlFor="impactDescription" required>
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
            <Field label="Bedrohung" htmlFor="threat" required>
              <Input id="threat" name="threat" required minLength={2} />
            </Field>
            <Field label="Schwachstelle" htmlFor="vulnerability" required>
              <Input id="vulnerability" name="vulnerability" required minLength={2} />
            </Field>
          </div>
          <Field label="Bestehende Kontrollen (narrativ)" htmlFor="existingControls">
            <Textarea id="existingControls" name="existingControls" rows={2} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zuordnung</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Risikokategorie" htmlFor="categoryId" required>
            <Select id="categoryId" name="categoryId" required defaultValue="">
              <option value="" disabled>
                Bitte wählen
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Risk Owner" htmlFor="riskOwnerId">
            <Select id="riskOwnerId" name="riskOwnerId" defaultValue="">
              <option value="">– später zuordnen –</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Gesellschaft / Geschäftsbereich" htmlFor="ouId">
            <Select id="ouId" name="ouId" defaultValue="">
              <option value="">–</option>
              {ous.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Standort" htmlFor="locationId">
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
          {pending ? "Wird angelegt…" : "Risiko anlegen (Status: Draft)"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Nach der Anlage: Bewertung durchführen, dann Workflow Draft → Self Assessment → Quality
        Review → Freigaben (siehe RB-01/RB-03).
      </p>
    </form>
  );
}
