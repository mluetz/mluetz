/**
 * Konzentrationsrechnung über die GESAMTE Subunternehmerkette
 * (Review v3, B-3/2.3) — nicht nur über Erstdienstleister. Provider werden
 * über LEI (primär) bzw. normalisierten Namen (sekundär) zusammengeführt,
 * damit gemeinsame Sub-Dienstleister mehrerer Ketten sichtbar werden.
 */

export interface ChainNode {
  name: string;
  lei: string | null;
  country: string;
  rank: number;
  providesCifService: boolean;
}

export interface ProviderExposure {
  key: string;
  name: string;
  country: string;
  /** Anzahl unterstützter CIF (dedupliziert) über alle Ketten. */
  cifCount: number;
  /** Direkte (Rang 0) oder nur mittelbare Betroffenheit. */
  direct: boolean;
  /** In wie vielen Ketten (Erstdienstleistern) das Glied vorkommt. */
  chains: number;
}

export function providerKey(name: string, lei: string | null): string {
  if (lei && lei.trim()) return `lei:${lei.trim().toUpperCase()}`;
  return `name:${name.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

export interface TpChainInput {
  tpName: string;
  tpLei: string | null;
  tpCountry: string;
  cifIds: string[];
  chain: ChainNode[];
}

export function concentrationOverChain(tps: TpChainInput[]): ProviderExposure[] {
  const map = new Map<
    string,
    { name: string; country: string; cifs: Set<string>; direct: boolean; chains: Set<string> }
  >();
  const add = (
    key: string,
    name: string,
    country: string,
    cifIds: string[],
    direct: boolean,
    chainOwner: string,
  ) => {
    const e = map.get(key) ?? {
      name,
      country,
      cifs: new Set<string>(),
      direct: false,
      chains: new Set<string>(),
    };
    for (const c of cifIds) e.cifs.add(c);
    e.direct = e.direct || direct;
    e.chains.add(chainOwner);
    map.set(key, e);
  };

  for (const tp of tps) {
    add(providerKey(tp.tpName, tp.tpLei), tp.tpName, tp.tpCountry, tp.cifIds, true, tp.tpName);
    for (const node of tp.chain) {
      add(providerKey(node.name, node.lei), node.name, node.country, tp.cifIds, false, tp.tpName);
    }
  }

  return [...map.entries()]
    .map(([key, e]) => ({
      key,
      name: e.name,
      country: e.country,
      cifCount: e.cifs.size,
      direct: e.direct,
      chains: e.chains.size,
    }))
    .sort((a, b) => b.cifCount - a.cifCount || b.chains - a.chains);
}
