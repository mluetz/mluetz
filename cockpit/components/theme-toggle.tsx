"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  function toggle() {
    const el = document.documentElement;
    const dark = el.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      /* Storage nicht verfügbar – Theme gilt nur für die Sitzung */
    }
  }
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Hell-/Dunkelmodus umschalten">
      <Sun className="h-4 w-4 dark:hidden" aria-hidden />
      <Moon className="hidden h-4 w-4 dark:block" aria-hidden />
    </Button>
  );
}
