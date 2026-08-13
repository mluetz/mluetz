import Link from "next/link";
import { ShieldX } from "lucide-react";

export const metadata = { title: "Zugriff verweigert" };

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <ShieldX className="h-10 w-10 text-destructive" aria-hidden />
      <h1 className="text-xl font-semibold">Zugriff verweigert</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Ihre Rolle verfügt nicht über die erforderliche Berechtigung für diese Funktion
        (Least-Privilege-Prinzip). Wenden Sie sich bei Bedarf an den Administrator.
      </p>
      <Link href="/overview" className="text-sm text-primary underline">
        Zur Übersicht
      </Link>
    </main>
  );
}
