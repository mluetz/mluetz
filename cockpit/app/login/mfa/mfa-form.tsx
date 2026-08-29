"use client";

import { useActionState } from "react";
import { continueAfterEnroll, verifyMfa, type MfaState } from "@/lib/auth/actions";
import type { Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";

const TEXT = {
  de: {
    titleVerify: "Zwei-Faktor-Code",
    titleSetup: "Zwei-Faktor-Authentifizierung einrichten",
    setupIntro:
      "Ihre Rolle erfordert MFA. Fügen Sie das Konto in einer Authenticator-App hinzu (QR-fähige Apps können die otpauth-Adresse öffnen; alternativ das Secret manuell eintragen) und bestätigen Sie mit dem ersten Code.",
    secretLabel: "Secret (manuelle Eingabe)",
    codeLabel: "6-stelliger Code",
    codeOrRecovery: "Code aus der App oder Wiederherstellungscode",
    submit: "Bestätigen",
    submitting: "Prüfe …",
    recoveryTitle: "Wiederherstellungscodes",
    recoveryIntro:
      "Diese Codes werden nur einmal angezeigt. Sicher verwahren — jeder Code ist einmal verwendbar und ersetzt den Authenticator bei Geräteverlust.",
    continue: "Weiter zur Anwendung",
    account: "Konto",
  },
  en: {
    titleVerify: "Two-factor code",
    titleSetup: "Set up two-factor authentication",
    setupIntro:
      "Your role requires MFA. Add the account to an authenticator app (QR-capable apps can open the otpauth address; alternatively enter the secret manually) and confirm with the first code.",
    secretLabel: "Secret (manual entry)",
    codeLabel: "6-digit code",
    codeOrRecovery: "Code from the app or a recovery code",
    submit: "Confirm",
    submitting: "Checking …",
    recoveryTitle: "Recovery codes",
    recoveryIntro:
      "These codes are shown only once. Store them safely — each code can be used once and replaces the authenticator if the device is lost.",
    continue: "Continue to the application",
    account: "Account",
  },
} as const;

export function MfaForm({
  mode,
  email,
  secret,
  otpauthUri,
  locale,
}: {
  mode: "verify" | "setup";
  email: string;
  secret?: string;
  otpauthUri?: string;
  locale: Locale;
}) {
  const [state, formAction, pending] = useActionState<MfaState, FormData>(verifyMfa, {});
  const t = TEXT[locale];

  if (state.recoveryCodes) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.recoveryTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t.recoveryIntro}</p>
          <ul className="grid grid-cols-2 gap-2 rounded-md border p-4 font-mono text-sm tabular-nums">
            {state.recoveryCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <form action={continueAfterEnroll}>
            <Button type="submit" className="w-full">
              {t.continue}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "setup" ? t.titleSetup : t.titleVerify}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          {t.account}: {email}
        </p>
        {mode === "setup" ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t.setupIntro}</p>
            <div className="rounded-md border p-3 text-xs">
              <div className="font-medium">{t.secretLabel}</div>
              <code className="break-all font-mono">{secret}</code>
            </div>
            {otpauthUri ? (
              <div className="rounded-md border p-3 text-xs">
                <div className="font-medium">otpauth-URI</div>
                <code className="break-all font-mono">{otpauthUri}</code>
              </div>
            ) : null}
          </div>
        ) : null}
        <form action={formAction} className="space-y-4">
          <Field
            label={mode === "setup" ? t.codeLabel : t.codeOrRecovery}
            htmlFor="code"
            required
          >
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              placeholder="123456"
            />
          </Field>
          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.submitting : t.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
