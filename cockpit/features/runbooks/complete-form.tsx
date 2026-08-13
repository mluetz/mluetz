"use client";

import { useActionState } from "react";
import { completeExecution, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function CompleteExecutionForm({ executionId }: { executionId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(completeExecution, {});
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="executionId" value={executionId} />
      <div className="min-w-56">
        <Label htmlFor="outcome">Ergebnis</Label>
        <Select id="outcome" name="outcome" required defaultValue="">
          <option value="" disabled>
            Bitte wählen
          </option>
          <option value="COMPLETED">Erfolgreich abschließen</option>
          <option value="ABORTED">Abbrechen</option>
        </Select>
      </div>
      <div className="min-w-72 flex-1">
        <Label htmlFor="complete-comment">Kommentar (Pflicht bei Abbruch)</Label>
        <Input id="complete-comment" name="comment" maxLength={2000} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Wird gespeichert…" : "Ausführung beenden"}
      </Button>
      <div className="w-full">
        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {state.ok ? <p className="text-sm text-risk-low">Gespeichert.</p> : null}
      </div>
    </form>
  );
}
