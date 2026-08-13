"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";

export function LoginForm({ demoEnabled }: { demoEnabled: boolean }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anmeldung</CardTitle>
      </CardHeader>
      <CardContent>
        {demoEnabled ? (
          <form action={formAction} className="space-y-4">
            <Field label="E-Mail" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="riskmanager@demo.example"
              />
            </Field>
            <Field label="Passwort" htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
            {state.error ? (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Anmeldung läuft…" : "Anmelden"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Der lokale Demo-Login ist deaktiviert. In produktiven Umgebungen erfolgt die Anmeldung
            über das Enterprise-SSO (OIDC / Microsoft Entra ID) – siehe Betriebsdokumentation.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
