# Security Policy – ICT & TPRM Cockpit

## Meldung von Schwachstellen

Bitte Schwachstellen **nicht** als öffentliches Issue melden, sondern vertraulich an
den Repository-Owner (GitHub Private Vulnerability Reporting bzw. Security Advisory).
Wir bestätigen den Eingang innerhalb von 5 Arbeitstagen.

## Sicherheitsprinzipien der Anwendung

- **RBAC serverseitig:** Jede Seite und jede Server Action prüft Berechtigungen über
  `lib/authz.ts` (Least Privilege, Funktionstrennung). Client-Navigation ist nie die
  einzige Kontrolle.
- **Eingabevalidierung:** Zod-Schemata in allen Server Actions; Workflow-Übergänge
  nur entlang definierter Übergangstabellen.
- **Sessions:** HMAC-SHA256-signierte HttpOnly-Cookies (SameSite=Lax, Secure in
  Produktion, 8 h TTL); Passwörter mit bcrypt; Login-Rate-Limiting.
- **Security-Header/CSP:** zentral in `next.config.ts` (X-Frame-Options DENY,
  nosniff, restriktive CSP, form-action self).
- **Audit Trail:** append-only (`AuditLog`), keine Update-/Delete-Pfade in der
  Anwendung; Login-Fehlversuche, Statuswechsel, Freigaben, Exporte und
  Berechtigungsänderungen werden protokolliert.
- **Exportkontrolle:** Exporte nur mit Berechtigung `export`, jeder Export wird
  auditiert; CSV-Ausgabe mit Schutz vor Formel-Injection.
- **IDOR-Schutz:** IDs sind nicht ratbare cuids; jede Detailabfrage läuft nach
  Berechtigungsprüfung; sensible Aktionen prüfen zusätzlich Objektbezug.
- **Keine Secrets im Repository:** Konfiguration ausschließlich über `.env`
  (Vorlage `.env.example`); CI nutzt Wegwerf-Werte.
- **Demo-Daten:** ausschließlich synthetische Daten; Demo-Login nur mit
  `AUTH_DEMO_LOGIN=true` (Entwicklung).

## Unterstützte Versionen

Prototyp-Phase: Es wird nur der jeweils aktuelle Stand des Standardbranches gepflegt.

## Weiterführend

- Threat Model: `docs/security/threat-model.md`
- Betrieb & Härtung: `docs/operations/README.md`
- CI-Sicherheitsprüfungen: `.github/workflows/cockpit-security.yml`
  (npm audit, gitleaks, CodeQL, Trivy, SBOM)
