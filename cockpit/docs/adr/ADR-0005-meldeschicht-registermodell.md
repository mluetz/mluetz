# ADR-0005: Meldeschicht Welle 1 – Registermodell für das DORA-Informationsregister

- **Status:** Akzeptiert
- **Datum:** 2026-08-30
- **Bezug:** Auftrag „Meldeschicht (DORA-Informationsregister)" (PROMPT_Cockpit-Meldeschicht.md),
  DVO (EU) 2024/2956; baut auf Review v3 (PR 53) auf, nicht auf dem im Auftrag
  genannten, inzwischen veralteten Basisbranch.

## Kontext

Das Cockpit soll das Register of Information (RoI) aus dem Datenbestand erzeugen,
validieren, als xBRL-CSV-Paket exportieren und als unveränderlichen Meldestand
historisieren. Der Auftrag beschreibt die Ausgangslage vor Review v3; seit PR 53
existieren bereits `ReportingEntity`, LEI-Felder, die rekursive
`Subcontractor`-Kette, die Art.-30-Klauselmatrix sowie der Ansatz „Mapping als
Daten" (`ItsTemplateVersion`/`ItsFieldMapping`/`RegisterExport`). Die
Modellvorschläge des Auftrags werden deshalb gegen den Ist-Stand abgeglichen
statt blind übernommen (Auftrag, Abschn. 2).

## Entscheidungen

1. **Kein neues `FinancialEntity` – `ReportingEntity` wird erweitert.**
   Ein zweites Modell für dieselbe Sache (meldende Rechtseinheit) wäre eine
   zweite Wahrheit. `ReportingEntity` erhält die B_01-Felder (Land,
   Unternehmensart, Bilanzsumme, zuständige Behörde, Hierarchierolle). Die
   bestehende Wertemenge `consolidationLevel` (`SOLO | PARTIAL_CONSOLIDATED |
CONSOLIDATED`) bleibt erhalten (Bestandsdaten auf der NAS); das Mapping auf
   die Meldeebene des Auftrags (`ENTITY | SUB_CONSOLIDATED | CONSOLIDATED`)
   ist dokumentiert: `SOLO→ENTITY`, `PARTIAL_CONSOLIDATED→SUB_CONSOLIDATED`.
2. **Kein `SupplyChainLink` – `Subcontractor` wird erweitert.**
   Die rekursive Kette (`parentId`, `rank`) existiert seit Review v3 und trägt
   Bestandsdaten. Für B_05.02 fehlen nur der Vertragsbezug und die
   IKT-Dienstleistungsart: `contractId` (optional, da Bestandsketten am
   Dienstleister hängen) und `ictServiceType` werden ergänzt. Rangprüfung
   (Rang 1 nur direkt, lückenlos, zyklenfrei) wird in Welle 2 Regelwerk.
3. **EUID über `nationalIdType = "EUID"`,** keine eigene Spalte. `ThirdParty`
   und `ReportingEntity` führen bereits `nationalId`/`nationalIdType`; die EUID
   ist dort ein Kennungstyp. `headquartersCountry` des Auftrags entspricht dem
   vorhandenen `ThirdParty.registeredCountry` (kein Duplikat).
4. **`ContractIctService` ist das Kernobjekt für B_02.02:** Vertrag ×
   IKT-Dienstleistungsart (geschlossene Taxonomie), Speicher-/Verarbeitungs-
   länder, Datensensibilität, gestützte Funktionen als n:m. Die vertragsweiten
   Länderfelder aus Review v3 bleiben als Voreinstellung erhalten; maßgeblich
   für das Register ist die Dienstleistungsebene.
5. **`CifServiceAssessment` (B_07.01) hängt 1:1 an `ContractIctService`,**
   nicht an `ThirdParty`. Das grobe `ThirdParty.substitutability` bleibt für
   die TPRM-Sicht bestehen; die Registerbewertung ist je Dienstleistung.
   (Nicht zu verwechseln mit `CifAssessment` = Kritikalitätsbewertung der
   Funktion.)
6. **`RoiSnapshot` ergänzt `RegisterExport`, ersetzt es nicht.**
   `RegisterExport` bleibt das Erzeugungsprotokoll einzelner CSV-Exporte;
   `RoiSnapshot` ist der unveränderliche, versionierte Meldestand (JSON-Abzug
   - SHA-256-Prüfsumme, Validierungszusammenfassung, Abgabevermerk). In
     Welle 3 referenziert der Paketexport den Snapshot.
7. **Taxonomien versioniert im Repository** (`lib/content/roi-taxonomies.ts`),
   nicht zur Laufzeit geladen — der Synology-Betrieb ist nicht zwingend online.
   Jede Taxonomie trägt Quelle und Verifikationsstatus; nicht am verbindlichen
   Text verifizierte Einträge sind `TODO(verify)` markiert (keine erfundenen
   Regulierungsfakten). Die Taxonomieversion wird im Snapshot mitgeschrieben.
8. **Eindeutigkeit von `functionIdCode` und `contractRef` wird serverseitig
   erzwungen** (Zod/Aktionen, Welle-2-Regel 805/806), nicht per DB-Unique:
   Auf Bestandsdatenbanken könnte ein Unique-Index-Aufbau mit Duplikaten den
   Containerstart abbrechen (`ensure-schema` bricht bei Fehlern bewusst ab).
   Konsequenz von ADR-0002 (Validierung in der Anwendung).
9. **MaRisk-Vorbereitung:** `Contract.isIctService` (Default `true`) wird
   angelegt, aber nicht ausgewertet — Umsetzung des Auslagerungsregisters erst
   nach Freigabe (Auftrag, Abschn. 7).
10. **B_03/B_04 brauchen den Entitätsbezug des Vertrags:** `Contract` erhält
    `signingEntityId` (unterzeichnende Einheit) und eine n:m-Beziehung
    `usingEntities` (nutzende Einheiten). Ohne diese Verknüpfung sind die
    Meldebögen B_03.01–B_04.01 strukturell nicht erzeugbar.

## Umsetzungsskizze

- **Schema:** Erweiterungen an `ReportingEntity`, `CriticalFunction`,
  `Contract`, `ThirdParty`, `Subcontractor`; neu: `EntityBranch`,
  `ContractIctService`, `CifServiceAssessment`, `RoiSnapshot`.
- **Migration:** `prisma/updates/0008-meldeschicht-welle1.sql` + Guard in
  `scripts/ensure-schema.mjs` (Muster 0005); `noticePeriodDays` wird beim
  Update nach `terminationNoticeDaysEntity` kopiert, die alte Spalte bleibt
  als deprecated erhalten.
- **Domäne:** `lib/content/roi-taxonomies.ts` (Wertelisten mit Quelle/Status),
  `lib/domain/roi-build.ts` (reine Zusammenstellung der 15 Meldebogen-
  Datensätze aus einem typisierten Datenabzug — Grundlage für Validierung
  (Welle 2) und Export (Welle 3)).
- **Seed:** je Meldebogen mindestens ein korrekter Datensatz.
- **Tests:** `tests/unit/roi-build.test.ts` weist die Befüllbarkeit aller
  15 Meldebögen aus dem Seed-äquivalenten Fixture nach.
- **Doku:** Mapping-Tabelle Objekt → Meldebogen in
  `docs/architecture/data-model.md`; CHANGELOG.

## Konsequenzen

- Bestandsdaten (NAS) bleiben ohne Datenmigration gültig; alle neuen Felder
  sind nullable oder mit Default.
- Die Meldebogen-Feld-IDs bleiben Datenpflege (`ItsFieldMapping`); der Code
  kennt nur kanonische Cockpit-Feldnamen — ein Fassungswechsel der ITS-Schemata
  erfordert keinen Code-Eingriff.
- `Subcontractor` wird entgegen dem Auftragstext nicht abgelöst; sollte sich
  der Vertragsbezug je Kettenglied als unzureichend erweisen, ist die
  Ablösung durch ein vertragsgebundenes Modell in einer Folge-ADR neu zu
  bewerten.
