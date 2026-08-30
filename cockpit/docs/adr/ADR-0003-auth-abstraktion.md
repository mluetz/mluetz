# ADR-0003: Leichtgewichtige Session-Schicht statt Auth.js (OIDC vorbereitet)

- **Status:** Akzeptiert
- **Datum:** 2026-08-13

## Kontext

Gefordert ist Auth.js **oder** eine abstrahierte Enterprise-Auth-Schicht mit
Vorbereitung für OIDC/SAML und Microsoft Entra ID; der lokale Demo-Login gilt nur
für die Entwicklungsumgebung.

## Entscheidung

Implementiert wird eine schmale, abhängigkeitsfreie Session-Schicht
(`lib/auth/session.ts`): HMAC-SHA256-signierte HttpOnly-Cookies (SameSite=Lax,
Secure in Produktion, 8 h TTL), Passwörter mit bcrypt. Der Demo-Login ist über
`AUTH_DEMO_LOGIN` schaltbar und in Produktion deaktiviert.

Die Schnittstelle ist bewusst minimal (`getSessionUser`, `requireUser`,
`createSessionCookie`), sodass sie 1:1 durch Auth.js v5 mit dem
Microsoft-Entra-ID-Provider ersetzt werden kann, ohne dass Seiten oder Server
Actions angepasst werden müssen. Die vorgesehenen Umgebungsvariablen
(`AUTH_OIDC_*`) sind in `.env.example` dokumentiert.

## Konsequenzen

- Kein zusätzlicher Abhängigkeits- und Konfigurationsaufwand im Prototyp; volle
  Kontrolle über Session-Sicherheit.
- Der Wechsel auf Enterprise-SSO ist ein begrenzter, dokumentierter Eingriff
  (nur `lib/auth/*`); Rollenzuordnung erfolgt dann über IdP-Claims-Mapping.
