"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth/actions";
import type { Locale } from "@/lib/i18n/config";
import { CHROME_MESSAGES } from "@/lib/i18n/messages/chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";

export function LoginForm({ demoEnabled, locale }: { demoEnabled: boolean; locale: Locale }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});
  const t = CHROME_MESSAGES[locale].login;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.cardTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {demoEnabled ? (
          <form action={formAction} className="space-y-4">
            <Field label={t.email} htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="riskmanager@demo.example"
              />
            </Field>
            <Field label={t.password} htmlFor="password" required>
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
                {t.failed}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? t.submitting : t.submit}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">{t.ssoNote}</p>
        )}
      </CardContent>
    </Card>
  );
}
