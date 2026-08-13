"use client";

import { useActionState } from "react";
import { startRunbookExecution, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";

export function StartRunbookForm({ runbookId }: { runbookId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    startRunbookExecution,
    {},
  );
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="runbookId" value={runbookId} />
      <Field
        label="Kontext / Anlass (optional)"
        htmlFor="contextNote"
        hint="z. B. Anlass, betroffenes System, Ticket-Nr. – wird in der Ausführung angezeigt."
      >
        <Textarea id="contextNote" name="contextNote" rows={2} maxLength={2000} />
      </Field>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Starte…" : "Ausführung starten"}
      </Button>
    </form>
  );
}
