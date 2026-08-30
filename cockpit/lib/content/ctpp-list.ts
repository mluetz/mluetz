/**
 * Amtliche Liste der benannten kritischen IKT-Drittdienstleister (CTPP,
 * Art. 31 DORA) — gepflegte STAMMDATENDATEI (Meldeschicht Welle 5,
 * ADR-0009 Nr. 2), nicht hart kodiert.
 *
 * Quelle der NAMEN (verbindlich): Gemeinsame Veröffentlichung von EBA,
 * EIOPA und ESMA vom 18.11.2025 nach Art. 31 Abs. 9 DORA,
 * "List of designated CTPPs" —
 * https://www.eba.europa.eu/sites/default/files/2025-11/e388451b-356b-408a-bbf2-b8e425865d75/List%20of%20designated%20CTPPs.pdf
 * (Pressemitteilung: https://www.eba.europa.eu/publications-and-media/press-releases/european-supervisory-authorities-designate-critical-ict-third-party-providers-under-digital)
 * Die Schreibweise der Namen folgt exakt dem PDF (einschließlich
 * "International Business Machine Corporation" [sic] und
 * "Amazon web Services EMEA Sarl" [sic]).
 *
 * Quelle der LEIs: Das amtliche PDF enthält KEINE LEIs. Die hier
 * eingetragenen LEIs stammen aus dem öffentlichen GLEIF-Register
 * (api.gleif.org, Abruf 30.08.2026) und wurden nur übernommen, wo der
 * juristische Name eindeutig und der Status ISSUED war. `lei: null`
 * bedeutet: kein eindeutiger GLEIF-Treffer — vor dem Abgleich mit dem
 * eigenen Register nachpflegen (der Listenabgleich der
 * Konzentrationsanalytik matcht über die LEI).
 */

export interface CtppListEntry {
  /** Offizieller Name des benannten Dienstleisters. */
  name: string;
  /** LEI, sofern in der Veröffentlichung angegeben (Abgleichsschlüssel). */
  lei: string | null;
  /** Datum des Benennungsbeschlusses (ISO 8601). */
  designatedAt: string;
  /** Fundstelle der Veröffentlichung (URL oder Aktenzeichen). */
  source: string;
}

export const CTPP_LIST_VERSION = "2025-11-18";

const DESIGNATED_AT = "2025-11-18"; // Datum der ESA-Veröffentlichung nach Art. 31 Abs. 9
const SOURCE = "EBA/EIOPA/ESMA, List of designated CTPPs, 18.11.2025 (eba.europa.eu)";

export const CTPP_LIST: CtppListEntry[] = [
  // TODO(verify): LEI — GLEIF-Treffer für "Accenture plc" nur mit Status RETIRED (GI)
  { name: "Accenture plc", lei: null, designatedAt: DESIGNATED_AT, source: SOURCE },
  // TODO(verify): LEI — kein GLEIF-Treffer unter diesem Namen (Schreibweise wie im PDF)
  { name: "Amazon web Services EMEA Sarl", lei: null, designatedAt: DESIGNATED_AT, source: SOURCE },
  {
    name: "Bloomberg L.P.",
    lei: "549300B56MD0ZC402L06",
    designatedAt: DESIGNATED_AT,
    source: SOURCE,
  },
  // TODO(verify): LEI — kein eindeutiger GLEIF-Treffer für "Capgemini SE"
  { name: "Capgemini SE", lei: null, designatedAt: DESIGNATED_AT, source: SOURCE },
  {
    name: "Colt Technology Services",
    lei: "3912000PY0VABHVJX679",
    designatedAt: DESIGNATED_AT,
    source: SOURCE,
  },
  {
    name: "Deutsche Telekom AG",
    lei: "549300V9QSIG4WX4GJ96",
    designatedAt: DESIGNATED_AT,
    source: SOURCE,
  },
  {
    name: "Equinix (EMEA) B.V.",
    lei: "5493000WWMF7GKM9Z338",
    designatedAt: DESIGNATED_AT,
    source: SOURCE,
  },
  {
    name: "Fidelity National Information Services, Inc.",
    lei: "6WQI0GK1PRFVBA061U48",
    designatedAt: DESIGNATED_AT,
    source: SOURCE,
  },
  {
    name: "Google Cloud EMEA Limited",
    lei: "98450052CF14CFEB6435",
    designatedAt: DESIGNATED_AT,
    source: SOURCE,
  },
  // Schreibweise "Machine" [sic] wie im amtlichen PDF; LEI der
  // International Business Machines Corporation (GLEIF, ISSUED)
  {
    name: "International Business Machine Corporation",
    lei: "VGRQXHF3J8VDLUA7XE92",
    designatedAt: DESIGNATED_AT,
    source: SOURCE,
  },
  // TODO(verify): LEI — kein GLEIF-Treffer für "InterXion HeadQuarters B.V."
  { name: "InterXion HeadQuarters B.V.", lei: null, designatedAt: DESIGNATED_AT, source: SOURCE },
  // GLEIF führt die Gesellschaft als "KYNDRYL, INC." (nur Interpunktion abweichend)
  {
    name: "Kyndryl Inc.",
    lei: "549300RS9ZY2LETFSE98",
    designatedAt: DESIGNATED_AT,
    source: SOURCE,
  },
  {
    name: "LSEG Data and Risk Limited",
    lei: "213800WMU3E82HA1SY94",
    designatedAt: DESIGNATED_AT,
    source: SOURCE,
  },
  {
    name: "Microsoft Ireland Operations Limited",
    lei: "549300WCLFVEBTBNRF76",
    designatedAt: DESIGNATED_AT,
    source: SOURCE,
  },
  // TODO(verify): LEI — GLEIF-Treffer "NTT DATA, INC." ohne verknüpften LEI-Datensatz
  { name: "NTT DATA Inc.", lei: null, designatedAt: DESIGNATED_AT, source: SOURCE },
  // TODO(verify): LEI — kein GLEIF-Treffer für "Oracle Nederland B.V."
  { name: "Oracle Nederland B.V.", lei: null, designatedAt: DESIGNATED_AT, source: SOURCE },
  // GLEIF führt die Gesellschaft unter dem juristischen Namen "ORANGE" (FR, ISSUED)
  { name: "Orange SA", lei: "969500MCOONR8990S771", designatedAt: DESIGNATED_AT, source: SOURCE },
  { name: "SAP SE", lei: "529900D6BF99LW9R2E68", designatedAt: DESIGNATED_AT, source: SOURCE },
  // GLEIF: gleichnamiger Datensatz auch in NO; übernommen wurde die
  // Muttergesellschaft mit Sitz Indien (ISSUED)
  {
    name: "Tata Consultancy Services Limited",
    lei: "335800ZJKU9GPQRE2U66",
    designatedAt: DESIGNATED_AT,
    source: SOURCE,
  },
];
