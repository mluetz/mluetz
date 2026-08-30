/**
 * Konzentrationsanalytik über den Registerbestand (Meldeschicht Welle 5,
 * ADR-0009): reine Funktionen über dem RoiInput — dieselbe Quelle wie
 * Validierung und Export. Vier Sichten: Exponierung je Dienstleister,
 * Kettenkonzentration über unabhängige Direktanbieter, geografische
 * Konzentration mit Drittstaatenkennzeichen, CTPP-Exponierung mit
 * Listenabgleich (Stammdatendatei lib/content/ctpp-list.ts).
 */

import { providerKey } from "@/lib/domain/concentration";
import { isThirdCountry } from "@/lib/content/eea-countries";
import type { CtppListEntry } from "@/lib/content/ctpp-list";
import type { RoiInput } from "@/lib/domain/roi-build";

// ---------- 1. Exponierung je Dienstleister ----------

export interface RoiProviderExposure {
  thirdPartyId: string;
  tpId: string;
  name: string;
  isCtpp: boolean;
  /** Verträge mit mindestens einer CIF-gestützten Dienstleistung. */
  cifContracts: number;
  /** CIF-gestützte Dienstleistungen (Vertrag × Dienstleistungsart). */
  cifServices: number;
  /** Betroffene kritische/wichtige Funktionen (cfIds, dedupliziert). */
  functionIds: string[];
  /** Anteil an allen CIF-gestützten Dienstleistungen (0–100). */
  sharePercent: number;
}

export function providerExposure(input: RoiInput): RoiProviderExposure[] {
  const criticalFn = new Set(input.functions.filter((f) => f.isCritical).map((f) => f.id));
  const perTp = new Map<
    string,
    { cifContracts: number; cifServices: number; functionIds: Set<string> }
  >();
  let totalCifServices = 0;

  for (const c of input.contracts) {
    const cifServices = c.ictServices.filter((s) =>
      s.supportedFunctionIds.some((id) => criticalFn.has(id)),
    );
    if (cifServices.length === 0) continue;
    totalCifServices += cifServices.length;
    const agg = perTp.get(c.thirdPartyId) ?? {
      cifContracts: 0,
      cifServices: 0,
      functionIds: new Set<string>(),
    };
    agg.cifContracts += 1;
    agg.cifServices += cifServices.length;
    for (const s of cifServices) {
      for (const id of s.supportedFunctionIds) if (criticalFn.has(id)) agg.functionIds.add(id);
    }
    perTp.set(c.thirdPartyId, agg);
  }

  const tps = new Map(input.thirdParties.map((tp) => [tp.id, tp]));
  return [...perTp.entries()]
    .map(([thirdPartyId, agg]) => {
      const tp = tps.get(thirdPartyId);
      return {
        thirdPartyId,
        tpId: tp?.tpId ?? thirdPartyId,
        name: tp?.name ?? thirdPartyId,
        isCtpp: tp?.isCtpp ?? false,
        cifContracts: agg.cifContracts,
        cifServices: agg.cifServices,
        functionIds: [...agg.functionIds].sort(),
        sharePercent:
          totalCifServices === 0 ? 0 : Math.round((agg.cifServices / totalCifServices) * 1000) / 10,
      };
    })
    .sort((a, b) => b.cifServices - a.cifServices || a.tpId.localeCompare(b.tpId));
}

// ---------- 2. Kettenkonzentration über unabhängige Direktanbieter ----------

export interface CrossChainConcentration {
  key: string; // LEI- bzw. Namensschlüssel (providerKey)
  name: string;
  country: string;
  /** Unabhängige Direktanbieter, unter denen das Glied auftritt. */
  directProviders: string[]; // tpIds
  /** Erbringt das Glied in mindestens einer Kette den CIF-Dienst? */
  providesCifService: boolean;
}

/**
 * Findet Subdienstleister, die über MEHRERE unabhängige Direktanbieter
 * hinweg auftreten — der Fall, den flache Lieferantenlisten strukturell
 * nicht finden (Auftrag Welle 5).
 */
export function crossChainConcentration(input: RoiInput): CrossChainConcentration[] {
  const tps = new Map(input.thirdParties.map((tp) => [tp.id, tp]));
  const byKey = new Map<
    string,
    { name: string; country: string; direct: Set<string>; cif: boolean }
  >();
  for (const s of input.subcontractors) {
    const key = providerKey(s.name, s.lei);
    const entry = byKey.get(key) ?? {
      name: s.name,
      country: s.country,
      direct: new Set<string>(),
      cif: false,
    };
    entry.direct.add(tps.get(s.thirdPartyId)?.tpId ?? s.thirdPartyId);
    entry.cif = entry.cif || s.providesCifService;
    byKey.set(key, entry);
  }
  return [...byKey.entries()]
    .filter(([, e]) => e.direct.size >= 2)
    .map(([key, e]) => ({
      key,
      name: e.name,
      country: e.country,
      directProviders: [...e.direct].sort(),
      providesCifService: e.cif,
    }))
    .sort((a, b) => b.directProviders.length - a.directProviders.length);
}

// ---------- 3. Geografische Konzentration ----------

export interface GeoConcentration {
  country: string;
  isThirdCountry: boolean;
  /** Dienstleistungen mit Speicherort in diesem Land. */
  storageServices: number;
  /** Dienstleistungen mit Verarbeitungsort in diesem Land. */
  processingServices: number;
  /** Davon CIF-gestützte Dienstleistungen (Speicher- oder Verarbeitungsort). */
  cifServices: number;
}

const splitCountries = (value: string | null): string[] =>
  (value ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c) => c.length > 0);

export function geoConcentration(input: RoiInput): GeoConcentration[] {
  const criticalFn = new Set(input.functions.filter((f) => f.isCritical).map((f) => f.id));
  const byCountry = new Map<string, { storage: number; processing: number; cif: Set<string> }>();
  const bump = (country: string, kind: "storage" | "processing", cifServiceId: string | null) => {
    const entry = byCountry.get(country) ?? { storage: 0, processing: 0, cif: new Set<string>() };
    entry[kind] += 1;
    if (cifServiceId) entry.cif.add(cifServiceId);
    byCountry.set(country, entry);
  };

  for (const c of input.contracts) {
    for (const s of c.ictServices) {
      const isCif = s.supportedFunctionIds.some((id) => criticalFn.has(id));
      const storage = splitCountries(s.dataStorageCountries ?? c.countryOfDataStorage);
      const processing = splitCountries(s.dataProcessingCountries ?? c.countryOfDataProcessing);
      for (const country of storage) bump(country, "storage", isCif ? s.id : null);
      for (const country of processing) bump(country, "processing", isCif ? s.id : null);
    }
  }

  return [...byCountry.entries()]
    .map(([country, e]) => ({
      country,
      isThirdCountry: isThirdCountry(country),
      storageServices: e.storage,
      processingServices: e.processing,
      cifServices: e.cif.size,
    }))
    .sort(
      (a, b) =>
        b.storageServices + b.processingServices - (a.storageServices + a.processingServices) ||
        a.country.localeCompare(b.country),
    );
}

// ---------- 4. CTPP-Exponierung mit Listenabgleich ----------

export type CtppMatch = "CONFIRMED" | "FLAGGED_ONLY" | "LISTED_ONLY";

export interface CtppExposure {
  tpId: string;
  name: string;
  lei: string | null;
  match: CtppMatch;
  cifServices: number;
  functionIds: string[];
}

/**
 * Abgleich der im Cockpit gekennzeichneten CTPPs (`ThirdParty.isCtpp`)
 * gegen die amtliche Liste (Stammdatendatei): CONFIRMED = Kennzeichen und
 * Listeneintrag, FLAGGED_ONLY = nur Kennzeichen (Liste ungepflegt oder
 * Eintrag fehlt), LISTED_ONLY = auf der Liste, aber im Cockpit nicht
 * gekennzeichnet (Pflegehinweis).
 */
export function ctppExposure(input: RoiInput, list: CtppListEntry[]): CtppExposure[] {
  const listedLeis = new Set(
    list.map((e) => e.lei?.trim().toUpperCase()).filter((l): l is string => Boolean(l)),
  );
  const exposure = new Map(providerExposure(input).map((e) => [e.thirdPartyId, e]));
  const out: CtppExposure[] = [];
  for (const tp of input.thirdParties) {
    const listed = tp.lei ? listedLeis.has(tp.lei.trim().toUpperCase()) : false;
    if (!tp.isCtpp && !listed) continue;
    const exp = exposure.get(tp.id);
    out.push({
      tpId: tp.tpId,
      name: tp.name,
      lei: tp.lei,
      match: tp.isCtpp && listed ? "CONFIRMED" : tp.isCtpp ? "FLAGGED_ONLY" : "LISTED_ONLY",
      cifServices: exp?.cifServices ?? 0,
      functionIds: exp?.functionIds ?? [],
    });
  }
  return out.sort((a, b) => b.cifServices - a.cifServices || a.tpId.localeCompare(b.tpId));
}
