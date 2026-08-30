import type { Locale } from "@/lib/i18n/config";
import {
  DORA_GLOSSARY,
  DORA_PILLARS,
  type DoraPillar,
  type GlossaryEntry,
} from "@/lib/content/dora-knowledge";
import {
  DORA_GLOSSARY_EN,
  DORA_PILLARS_EN,
  WIRKUNGSKETTEN_EN,
} from "@/lib/content/dora-knowledge-en";
import {
  HANDBOOK_FIGURES,
  HANDBOOK_GROUPS,
  HANDBOOK_SECTIONS,
  type HandbookFigure,
  type HandbookGroup,
  type HandbookSection,
} from "@/lib/content/dora-handbook";
import {
  HANDBOOK_FIGURES_EN,
  HANDBOOK_GROUPS_EN,
  HANDBOOK_SECTIONS_EN_PART1,
} from "@/lib/content/dora-handbook-en-part1";
import { HANDBOOK_SECTIONS_EN_PART2 } from "@/lib/content/dora-handbook-en-part2";

/**
 * Sprachauswahl für die Wissensbasis-Inhalte. Die deutschen Module sind die
 * Referenz; die englische Fassung spiegelt Struktur, ids und slugs exakt,
 * sodass ein Sprachwechsel auf jeder Detailseite funktioniert.
 */

/** Die 9 Wirkungsketten des DORA-Regelkreises (FRWK-DORA-001, Kap. 4.1). */
const WIRKUNGSKETTEN_DE = [
  "Kapitel VI liefert externe Bedrohungsinformationen – neue Angriffsvektoren fließen als Eingangsgröße in die Risikobewertung ein.",
  "Kapitel V erweitert den Betrachtungsrahmen über die Unternehmensgrenze hinaus – Provider-Risiken und Vertragslage werden Teil des Risikoregisters.",
  "Kapitel II definiert daraus Test-Scope und Testfrequenz – getestet wird, was risikoseitig relevant ist.",
  "Kapitel IV liefert die Validierung zurück – Testbefunde sind Tatsachen und korrigieren die theoretische Risikobewertung.",
  "Kapitel II stellt für den Ernstfall die Fortführungs- und Wiederanlaufpläne bereit, auf die das Vorfallmanagement zugreift.",
  "Kapitel III führt nach jedem schwerwiegenden Vorfall die Erkenntnisse in das Risikoregister zurück – ohne diesen Rücklauf verliert der Regelkreis seine Lernfähigkeit. ⚠ prüfungsrelevant",
  "Ein Vorfall bei einem Dienstleister löst unmittelbar eine Vertrags- und Exit-Prüfung nach Kapitel V aus.",
  "Erhebliche Cyberbedrohungen können nach Art. 19 Abs. 2 freiwillig gemeldet und in den Informationsaustausch zurückgegeben werden.",
  "Dienstleister kritischer Funktionen sind nach Art. 26 Abs. 3 in die bedrohungsgeleiteten Tests einzubeziehen. ⚠ prüfungsrelevant",
];

export interface KnowledgeContent {
  pillars: DoraPillar[];
  glossary: Record<string, GlossaryEntry>;
  wirkungsketten: string[];
}

export function getKnowledgeContent(locale: Locale): KnowledgeContent {
  if (locale === "en") {
    return {
      pillars: DORA_PILLARS_EN,
      glossary: DORA_GLOSSARY_EN,
      wirkungsketten: WIRKUNGSKETTEN_EN,
    };
  }
  return {
    pillars: DORA_PILLARS,
    glossary: DORA_GLOSSARY,
    wirkungsketten: WIRKUNGSKETTEN_DE,
  };
}

export interface HandbookContent {
  groups: HandbookGroup[];
  sections: HandbookSection[];
  figures: Record<number, HandbookFigure>;
}

export function getHandbookContent(locale: Locale): HandbookContent {
  if (locale === "en") {
    return {
      groups: HANDBOOK_GROUPS_EN,
      sections: [...HANDBOOK_SECTIONS_EN_PART1, ...HANDBOOK_SECTIONS_EN_PART2],
      figures: HANDBOOK_FIGURES_EN,
    };
  }
  return {
    groups: HANDBOOK_GROUPS,
    sections: HANDBOOK_SECTIONS,
    figures: HANDBOOK_FIGURES,
  };
}
