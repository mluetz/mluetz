/**
 * DORA Handbook – English edition, Part 1 (Chapters 1–6).
 *
 * English counterpart of lib/content/dora-handbook.ts (FRWK-DORA-001 v1.0).
 * Exports the five thematic groups, all 16 figures (English assets under
 * public/dora/en/fig-NN.svg) and the first six sections. Slugs, group ids,
 * figure numbers and cockpit link hrefs are identical to the German source.
 *
 * Texts with [[term]] markers are rendered as clickable glossary terms in
 * the UI; the markers match the canonical keys of the English glossary.
 */

import type { HandbookFigure, HandbookGroup, HandbookSection } from "@/lib/content/dora-handbook";

/** Thematic parts of the handbook – the steering level of the overview. */
export const HANDBOOK_GROUPS_EN: HandbookGroup[] = [
  {
    id: "grundlagen",
    title: "Part A – Context & Mandate",
    description:
      "Why the framework exists, who it applies to, and how DORA sits within the web of NIS 2, the GDPR and the ISO standards.",
  },
  {
    id: "wirkungsmodell",
    title: "Part B – Operating Model & Risk Assessment",
    description:
      "The DORA control loop, threat intelligence along the supply chain and the five-dimensional protection-needs assessment.",
  },
  {
    id: "integration",
    title: "Part C – Integration, Incident Reporting & Testing",
    description:
      "The interplay of ISMS, BCMS and data protection, the parallel reporting deadlines and the resilience testing programme up to TLPT.",
  },
  {
    id: "steuerung",
    title: "Part D – Methodology & Governance",
    description:
      "Crosswalk, maturity and scoring model, findings/CAPA, the KPI system and governance along the three lines of defense.",
  },
  {
    id: "architektur",
    title: "Part E – Architecture & Implementation",
    description:
      "The GRC target architecture, the executive dashboard, the data model and the application's interfaces.",
  },
];

/** Figures 1–16 of the source document (Fig. 17 belongs to Ch. 16 – roadmap). */
export const HANDBOOK_FIGURES_EN: Record<number, HandbookFigure> = {
  1: {
    src: "/dora/en/fig-01.svg",
    width: 2047,
    height: 1159,
    caption:
      "Regulatory map – DORA in relation to NIS 2, the GDPR, the CRA and the normative implementation foundations",
  },
  2: {
    src: "/dora/en/fig-02.svg",
    width: 1732,
    height: 2047,
    caption:
      "Information flow between the DORA chapters – Chapter II as the central steering instance",
  },
  3: {
    src: "/dora/en/fig-03.svg",
    width: 2046,
    height: 482,
    caption: "Threat intelligence feedback loop across third- and fourth-party risks",
  },
  4: {
    src: "/dora/en/fig-04.svg",
    width: 2046,
    height: 1301,
    caption: "Lifecycle of the ICT third-party relationship from strategy to exit",
  },
  5: {
    src: "/dora/en/fig-05.svg",
    width: 1556,
    height: 2046,
    caption:
      "Five-dimensional protection-needs assessment – the CIA triad extended by authenticity and non-repudiation",
  },
  6: {
    src: "/dora/en/fig-06.svg",
    width: 1834,
    height: 1382,
    caption: "Integration point of ISMS, BCMS and data protection – orchestrated incident handling",
  },
  7: {
    src: "/dora/en/fig-07.svg",
    width: 2046,
    height: 1155,
    caption:
      "Parallel reporting deadlines under DORA, NIS 2 and the GDPR from the moment of becoming aware",
  },
  8: {
    src: "/dora/en/fig-08.svg",
    width: 2047,
    height: 1383,
    caption: "Flow of a threat-led penetration test under Art. 26 and 27 DORA",
  },
  9: {
    src: "/dora/en/fig-09.svg",
    width: 1292,
    height: 2046,
    caption:
      "Assessment and aggregation logic from the individual requirement up to the DORA Resilience Index",
  },
  10: {
    src: "/dora/en/fig-10.svg",
    width: 1283,
    height: 2045,
    caption:
      "Process from the finding through the corrective and preventive action to the effectiveness check",
  },
  11: {
    src: "/dora/en/fig-11.svg",
    width: 2046,
    height: 670,
    caption:
      "KPI tree from the DORA Resilience Index through the chapter level down to the individual metrics",
  },
  12: {
    src: "/dora/en/fig-12.svg",
    width: 2045,
    height: 754,
    caption:
      "Responsibilities according to the three-lines-of-defense model with references to the DORA articles",
  },
  13: {
    src: "/dora/en/fig-13.svg",
    width: 2046,
    height: 1133,
    caption:
      "Layered architecture of the GRC solution with mapping of the DORA chapters to the operational modules",
  },
  14: {
    src: "/dora/en/fig-14.svg",
    width: 2047,
    height: 1209,
    caption:
      "Target view of the DORA dashboard's executive overview with KPI tiles, chapter traffic lights, maturity trend, heatmap and reporting-deadline monitor",
  },
  15: {
    src: "/dora/en/fig-15.svg",
    width: 1958,
    height: 1854,
    caption: "Map of the application views with target groups and functional scope",
  },
  16: {
    src: "/dora/en/fig-16.svg",
    width: 2046,
    height: 1867,
    caption: "Entity-relationship model of the DORA dashboard",
  },
};

export const HANDBOOK_SECTIONS_EN_PART1: HandbookSection[] = [
  // ───────────────────────── Part A – Context & Mandate ─────────────────────────
  {
    slug: "dokumentensteuerung",
    chapter: "Ch. 1",
    title: "Document Control",
    summary:
      "Purpose, scope and addressees of the FRWK-DORA-001 framework and the governing legal foundations.",
    groupId: "grundlagen",
    figures: [],
    cockpitLinks: [
      { label: "Requirements Catalogue", href: "/dora/requirements" },
      { label: "Compliance Mapping", href: "/compliance" },
    ],
    blocks: [
      {
        kind: "p",
        text: "The FRWK-DORA-001 framework consolidates three separate analyses of Regulation (EU) 2022/2554 (DORA) into a single overall view: the cross-chapter interplay, the operational GRC implementation including the diagrams, and the delineation from the NIS 2 Directive. It pursues three objectives: the expansion into a complete, auditable requirements catalogue covering DORA Chapters II to VI, the mapping of every requirement to ISO/IEC 27001:2022, ISO 22301:2019 and the German NIS-2 implementation in the BSIG (German NIS-2 implementation act), and a structure with a data model that can be transferred directly into a dashboard application – which is exactly what this cockpit delivers.",
      },
      {
        kind: "p",
        text: "The document does not replace legal advice. It translates the requirements of DORA and the associated delegated acts into a structure suitable for implementation and evidence.",
      },
      { kind: "h3", text: "Scope and addressees" },
      {
        kind: "p",
        text: "The scope covers all organisational units, processes, ICT systems and ICT services within the scope of DORA under Art. 2 – including the services provided by [[ICT third-party providers]].",
      },
      {
        kind: "list",
        items: [
          "the [[management body]] as bearer of ultimate responsibility under Art. 5(2) DORA,",
          "the ICT risk management control function and information security,",
          "third-party risk management, procurement and the legal department,",
          "the business continuity officer and crisis management,",
          "IT operations, IT architecture and security operations,",
          "the compliance function and internal audit,",
          "the project team implementing the dashboard application.",
        ],
      },
      { kind: "h3", text: "Legal foundations and normative references" },
      {
        kind: "table",
        title: "Table 3: Legal foundations and normative references",
        head: ["Reference", "Title", "Status"],
        rows: [
          [
            "Regulation (EU) 2022/2554",
            "DORA – Digital Operational Resilience Act",
            "Applicable since 17 Jan 2025",
          ],
          [
            "Directive (EU) 2022/2556",
            "DORA accompanying directive amending sectoral legal acts",
            "In force",
          ],
          ["Directive (EU) 2022/2555", "NIS 2 Directive", "National implementation required"],
          [
            "BSIG as amended (NIS2UmsuCG)",
            "BSIG (German NIS-2 implementation act)",
            "In force since 6 Dec 2025",
          ],
          ["Regulation (EU) 2016/679", "GDPR", "In force"],
          [
            "ISO/IEC 27001:2022",
            "Information security management systems",
            "Normative, certifiable",
          ],
          ["ISO 22301:2019", "Business continuity management systems", "Normative, certifiable"],
          [
            "ISO/IEC 27005:2022",
            "Guidance on information security risk management",
            "Normative, methodology",
          ],
        ],
      },
    ],
  },
  {
    slug: "management-summary",
    chapter: "Ch. 2",
    title: "Management Summary",
    summary:
      "The five findings that shape DORA implementation – from the control loop through the reporting deadlines to evidence management as a data problem.",
    groupId: "grundlagen",
    figures: [],
    cockpitLinks: [
      { label: "DORA Dashboard", href: "/dora" },
      { label: "Readiness Report", href: "/reports/DORA_READINESS" },
    ],
    blocks: [
      {
        kind: "p",
        text: "DORA has applied directly in all Member States since 17 January 2025. It is not a recommendation and not a framework open to free interpretation, but directly applicable law with a tightly framed evidence regime. For financial entities, the audit question shifts from “Do you have security measures?” to “Can you prove their effectiveness at any time?”.",
      },
      { kind: "h3", text: "Five findings shape the implementation" },
      {
        kind: "list",
        ordered: true,
        items: [
          "The chapters interlock. DORA is constructed as a control loop: a gap in the testing programme (Chapter IV) inevitably creates blind spots in risk management (Chapter II) and increases the likelihood of undetected incidents (Chapter III). Working through the chapters in silos systematically produces audit findings.",
          "The [[reporting deadlines]] are stricter than under NIS 2. The initial notification of a major incident must be submitted within four hours of its classification and no later than 24 hours after becoming aware of it – practically impossible to meet without a prepared classification logic and an on-call organisation.",
          "Third-party risk is the most demanding block. The [[register of information]] under Art. 28(3) must be submitted annually and is checked against the validation rules of the [[ESAs]]. Added to this are mandatory contractual clauses under Art. 30 as well as documented and tested [[exit strategies]] for every provider of critical functions.",
          "The classic CIA triad is not enough. For the financial sector, authenticity and non-repudiation are protection goals of equal rank. Without tamper-proof audit trails, the root-cause analysis required by DORA after an incident cannot be conducted – not even when the system is running without technical faults.",
          "Evidence management is a data problem. The number of individual requirements to be evidenced, the linkage of requirement, asset, function, provider, incident and evidence, and the short deadlines make document-based administration impracticable – this is precisely where the application specified in Chapter 15 comes in.",
        ],
      },
      {
        kind: "p",
        text: "The catalogue breaks Chapters II to VI of DORA down into 133 auditable individual requirements. 122 of them are MUST requirements, and 98 are knockout-relevant: if one of these requirements is assessed at a [[maturity level]] below level 3, the status of the affected chapter must be set to red regardless of the calculated average. This override prevents good averages from masking a hard compliance gap.",
      },
      {
        kind: "callout",
        tone: "info",
        title: "Key message",
        text: "DORA does not demand the reinvention of existing management systems, but their deep integration and gapless demonstrability. The most economical path runs through the reuse of existing ISO/IEC 27001 and ISO 22301 controls – supplemented by the DORA-specific tightening in testing depth, third-party risk and reporting deadlines. The crosswalk (Ch. 10) demonstrates this reuse for each requirement.",
      },
    ],
  },
  {
    slug: "regulatorischer-rahmen",
    chapter: "Ch. 3",
    title: "Regulatory Framework",
    summary:
      "DORA at a glance, the regulatory map, the delineation from NIS 2 (lex specialis) and the delegated acts (RTS/ITS).",
    groupId: "grundlagen",
    figures: [1],
    cockpitLinks: [
      { label: "Compliance Mapping", href: "/compliance" },
      { label: "Requirements Catalogue", href: "/dora/requirements" },
    ],
    blocks: [
      {
        kind: "p",
        text: "DORA pursues the objective of establishing a uniform and high level of digital operational resilience in the European financial sector. The regulatory approach has five parts: ICT risk management and governance (Chapter II), management and reporting of ICT-related incidents (Chapter III), digital operational resilience testing (Chapter IV), management of ICT third-party risk including the direct oversight of critical providers (Chapter V), and information-sharing arrangements (Chapter VI).",
      },
      {
        kind: "p",
        text: "As a regulation, DORA applies directly; no national implementing act is required, and national deviations are in principle excluded. Substantive detail is provided through delegated regulations and implementing regulations ([[RTS/ITS]]), which in turn apply directly. Art. 4 anchors the [[proportionality principle]]: it does not reduce the number of applicable obligations, but the depth of their implementation.",
      },
      { kind: "h3", text: "Regulatory map" },
      {
        kind: "p",
        text: "The map places DORA within the web of adjacent legal acts and standards. Decisive is the relationship with the NIS 2 Directive: under the [[lex specialis]] principle, DORA, as the more specific law for the financial sector, displaces the general requirements of the NIS 2 Directive insofar as they concern the same subject matter.",
      },
      { kind: "figure", num: 1 },
      { kind: "h3", text: "Delineation of DORA and NIS 2" },
      {
        kind: "table",
        title: "Table 5: Key differences between DORA and the NIS 2 Directive",
        head: [
          "Characteristic",
          "DORA – Regulation (EU) 2022/2554",
          "NIS 2 – Directive (EU) 2022/2555 / BSIG",
        ],
        rows: [
          [
            "Legal nature",
            "EU regulation. Applies directly and identically in all Member States, without a national implementing act.",
            "EU directive. Must be transposed into national law – in Germany through the BSIG (German NIS-2 implementation act). National deviations are possible.",
          ],
          [
            "Scope",
            "Sector-specific: around 20 categories of financial entities as well as their ICT third-party providers.",
            "Cross-sectoral: 18 critical and important sectors, including energy, transport, health, manufacturing and digital infrastructures.",
          ],
          [
            "Regulatory depth",
            "Deep resilience: business continuity, disaster recovery, recovery objectives, comprehensive testing up to TLPT.",
            "Broad baseline security: a basic level of cybersecurity and reporting obligations across the breadth of the economy.",
          ],
          [
            "Third-party risk",
            "Direct oversight: ICT third-party providers designated as critical are examined directly by a Lead Overseer of the ESAs.",
            "Indirect oversight: companies secure their own supply chain themselves; as a rule, only the commissioning company is examined.",
          ],
          [
            "Reporting deadlines",
            "Initial notification within 4 h of classification as major, at the latest 24 h after becoming aware; intermediate report 72 h after the initial notification; final report 1 month.",
            "Early warning within 24 h of becoming aware; notification within 72 h of becoming aware; final report within 1 month of the notification.",
          ],
          [
            "Contractual requirements",
            "Mandatory register of information with annual submission; mandatory contractual clauses under Art. 30 including audit rights, termination grounds and exit strategies.",
            "Contractual flow-down of security requirements to suppliers; no central contract register, no exhaustively standardised mandatory clauses.",
          ],
          [
            "Testing obligations",
            "Annual testing of all systems supporting critical functions; TLPT at least every three years for designated entities.",
            "Risk-based assessment of effectiveness; no standardised TLPT obligation.",
          ],
          [
            "Supervision in Germany",
            "BaFin, supported by the ECB and the ESAs (EBA, ESMA, EIOPA).",
            "Federal Office for Information Security (BSI).",
          ],
          [
            "Management responsibility",
            "Ultimate responsibility of the management body (Art. 5(2)) with an explicit training obligation (Art. 5(4)).",
            "Approval and oversight duty of the management with personal liability (Section 38 BSIG); training obligation.",
          ],
        ],
      },
      {
        kind: "p",
        text: "For a financial entity that could fall under both regimes at the same time, the rule is: the specific requirements of DORA take precedence. The practical consequence is not an exemption but a tightening – DORA adopts the baseline level of NIS 2 and tailors it precisely to the financial sector.",
      },
      { kind: "h3", text: "Overlaps and synergies" },
      {
        kind: "list",
        items: [
          "Incident management and reporting: the process structure (initial notification, intermediate report, final report) is largely congruent; the differences lie in the deadline system, the addressee (BSI vs. BaFin) and the depth of classification – DORA demands a considerably more detailed classification against seven criteria.",
          "Risk management and business continuity: both require a cross-departmental risk analysis and management responsibility. DORA goes considerably deeper: concrete requirements for network segregation, backup strategies and precisely defined recovery objectives ([[RTO/RPO]]) per critical function.",
          "Supply chain security: NIS 2 requires the assessment of one's own supply chain and the contractual flow-down of security requirements. DORA tightens this radically: a mandatory register of information, mandatory contractual clauses including audit rights, and complete, tested exit strategies.",
        ],
      },
      { kind: "h3", text: "Delegated acts – RTS and ITS" },
      {
        kind: "p",
        text: "DORA's operational bindingness only arises through the delegated acts. They specify, among other things, the risk management framework, incident classification, the reporting templates, the register of information and the conduct of threat-led penetration tests. A robust implementation is not possible without knowledge of these acts.",
      },
      {
        kind: "table",
        title: "Table 6: Delegated and implementing regulations under DORA",
        head: ["Legal act", "DORA mandate", "Subject matter", "Status / applicability"],
        rows: [
          [
            "Delegated Regulation (EU) 2024/1774",
            "Art. 15, 16(3)",
            "ICT risk management framework and simplified framework",
            "17 Jan 2025",
          ],
          [
            "Delegated Regulation (EU) 2024/1772",
            "Art. 18(3)",
            "Classification of major ICT incidents and significant cyber threats",
            "17 Jan 2025",
          ],
          [
            "Delegated Regulation (EU) 2024/1773",
            "Art. 28(10)",
            "Policy on ICT services supporting critical or important functions",
            "17 Jan 2025",
          ],
          [
            "Implementing Regulation (EU) 2024/2956",
            "Art. 28(9)",
            "Register of information – templates and taxonomy",
            "In force, annual submission",
          ],
          [
            "Delegated Regulation (EU) 2024/1502",
            "Art. 31(6)",
            "Criteria for designating critical ICT third-party providers (CTPPs)",
            "2024",
          ],
          [
            "Delegated Regulation (EU) 2024/1505",
            "Art. 43(2)",
            "Oversight fees for designated CTPPs",
            "30 May 2024",
          ],
          [
            "Delegated Regulation (EU) 2025/295",
            "Art. 41(1)",
            "Harmonisation of oversight activities (Lead Overseer regime)",
            "13 Feb 2025",
          ],
          [
            "Delegated Regulation (EU) 2025/301",
            "Art. 20(a)",
            "Incident reporting – content and time limits",
            "20 Feb 2025",
          ],
          [
            "Implementing Regulation (EU) 2025/302",
            "Art. 20(b)",
            "Incident reporting – forms, templates and procedures",
            "20 Feb 2025",
          ],
          [
            "Delegated Regulation (EU) 2025/420",
            "Art. 41(1)(c)",
            "Joint examination teams",
            "16 Dec 2024",
          ],
          [
            "Delegated Regulation (EU) 2025/532",
            "Art. 30(5)",
            "Subcontracting of ICT services supporting critical functions",
            "22 Jul 2025",
          ],
          [
            "Delegated Regulation (EU) 2025/1190",
            "Art. 26(11)",
            "Threat-led penetration testing (TLPT)",
            "8 Jul 2025",
          ],
        ],
      },
    ],
  },

  // ─────────────── Part B – Operating Model & Risk Assessment ───────────────
  {
    slug: "zusammenspiel",
    chapter: "Ch. 4",
    title: "The Cross-Chapter Interplay",
    summary:
      "DORA as a control loop: Chapter II as the central steering instance and the nine cause-effect chains between the chapters.",
    groupId: "wirkungsmodell",
    figures: [2],
    cockpitLinks: [
      { label: "DORA Dashboard", href: "/dora" },
      { label: "Risk Register", href: "/risks" },
    ],
    blocks: [
      {
        kind: "p",
        text: "DORA is not a static rulebook to be worked through with checklists. Chapters II to VI form a dynamic, interlocking system – a control loop. A weakness in one area directly affects the others.",
      },
      {
        kind: "p",
        text: "Chapter II (ICT risk management and governance) forms the centre: this is where the strategy is defined, the risk register is maintained and the risk appetite is set. All other chapters feed information into this centre or are steered from it.",
      },
      { kind: "figure", num: 2 },
      {
        kind: "p",
        text: "Solid arrows: the steered control loop. Dashed arrows: event-driven triggers.",
      },
      { kind: "h3", text: "The nine cause-effect chains in detail" },
      {
        kind: "list",
        ordered: true,
        items: [
          "Chapter VI supplies external threat information. New attack vectors and vulnerabilities feed into the risk assessment as input variables.",
          "Chapter V extends the frame of observation beyond the company's own boundary. Provider risks and the contractual situation become part of the risk register.",
          "Chapter II derives the test scope and test frequency from this. What gets tested is what is relevant from a risk perspective – not what is technically convenient.",
          "Chapter IV feeds the validation back. Test findings are facts and correct the theoretical risk assessment.",
          "Chapter II provides the continuity and recovery plans for the emergency, which incident management draws on.",
          "Chapter III feeds the lessons from every major incident back into the risk register. Without this return flow, the control loop loses its ability to learn.",
          "An incident at a provider immediately triggers a contract and exit review under Chapter V.",
          "Significant cyber threats can be reported voluntarily under Art. 19(2) and fed back into the information exchange.",
          "Providers of critical functions must be included in the threat-led tests under Art. 26(3).",
        ],
      },
      {
        kind: "callout",
        tone: "warn",
        title: "Audit relevance",
        text: "The return flow from incident management into the risk register (chain 6) and the inclusion of providers in the testing programme (chain 9) are the two points where audits most frequently produce findings. Both are classified as knockout-relevant in the catalogue.",
      },
    ],
  },
  {
    slug: "threat-intelligence",
    chapter: "Ch. 5",
    title: "Threat Intelligence and Third-Party Risk",
    summary:
      "The threat intelligence feedback loop, third-/fourth-party risks and the lifecycle of the third-party relationship.",
    groupId: "wirkungsmodell",
    figures: [3, 4],
    cockpitLinks: [
      { label: "Third Parties", href: "/third-parties" },
      { label: "Concentration Analysis", href: "/third-parties/concentration" },
    ],
    blocks: [
      {
        kind: "p",
        text: "Chapter VI is not an optional extra but the fuel for a proactive DORA set-up. This is particularly critical in the context of the supply chain: today, attackers rarely compromise the financial institution directly – they attack the IT service provider (third party) or its software supplier (fourth party).",
      },
      { kind: "h3", text: "The threat intelligence feedback loop" },
      {
        kind: "p",
        text: "The feedback loop forces the organisation to translate external warnings ([[cyber threat intelligence]]) into measurable internal actions via the GRC system. The second step is decisive: without a complete and up-to-date [[register of information]], it is impossible to answer which of one's own providers a reported vulnerability even affects.",
      },
      { kind: "figure", num: 3 },
      {
        kind: "p",
        text: "The [[Time to Assess]] metric maintained in the dashboard measures the time from receipt of an external alert to the completed register reconciliation. It is the most robust single indicator of the maturity of the interplay between Chapter V and Chapter VI.",
      },
      { kind: "h3", text: "Third- and fourth-party risks" },
      {
        kind: "p",
        text: "The financial entity's responsibility does not end with the direct contractual partner. Art. 29(2) explicitly requires the assessment of subcontracting arrangements, in particular with subcontractors in third countries. Delegated Regulation (EU) 2025/532 specifies the requirements for governing the [[subcontracting chain]] for services supporting critical or important functions.",
      },
      {
        kind: "p",
        text: "In practice this means: the chain must be captured down to the material subcontractors, mapped in the register of information and monitored on an ongoing basis. Approval reservations for the replacement of material subcontractors belong in the contract.",
      },
      { kind: "h3", text: "Lifecycle of the third-party relationship" },
      {
        kind: "p",
        text: "The requirements of Chapter V can be read as one continuous lifecycle. The register entry is not an administrative act at the end, but the pivot: it is both a supervisory obligation and the internal data basis for the concentration and dependency analysis ([[concentration risk]]).",
      },
      { kind: "figure", num: 4 },
    ],
  },
  {
    slug: "fuenf-dimensionen",
    chapter: "Ch. 6",
    title: "Extended Risk Assessment – the Five Dimensions",
    summary:
      "From the CIA triad to the five-dimensional protection-needs assessment with authenticity and non-repudiation – including the maximum principle and the NO-GO rule.",
    groupId: "wirkungsmodell",
    figures: [5],
    cockpitLinks: [
      { label: "Risk Register", href: "/risks" },
      { label: "Assets", href: "/admin" },
    ],
    blocks: [
      {
        kind: "p",
        text: "The classic assessment of information security risks rests on the CIA triad of confidentiality, integrity and availability. For the financial sector and for DORA, this view is not sufficient – two additional dimensions are required to be able to assess operational resilience in a highly interconnected supply chain at all:",
      },
      {
        kind: "list",
        items: [
          "Authenticity: it must be provable beyond doubt and cryptographically that an actor – human or machine – is who they claim to be. When third-party providers connect via interfaces, the authenticity of every request must be assured; a deficiency leads directly to high ICT risk through spoofing.",
          "Non-repudiation: a performed action must not be deniable after the fact. Immutable audit trails are mandatory for the forensic analysis after an incident. Without them, the root-cause analysis required by DORA is worthless, because attackers could cover their tracks.",
        ],
      },
      { kind: "figure", num: 5 },
      { kind: "h3", text: "Assessment scale and derivation of protection needs" },
      {
        kind: "p",
        text: "Each of the five dimensions is assessed on a five-level scale. An asset's overall protection need results from the highest individual rating under the [[maximum principle]]; averaging is expressly inadmissible, because it would mask a critical individual finding.",
      },
      {
        kind: "table",
        title: "Table 7: Assessment scale per protection dimension",
        head: ["Level", "Designation", "Impact if the protection goal is violated"],
        rows: [
          [
            "1",
            "Negligible",
            "No noticeable impact on business processes, customers or regulatory obligations.",
          ],
          ["2", "Low", "Limited internal impact, compensable at short notice with existing means."],
          [
            "3",
            "Medium",
            "Noticeable impairment of processes or customers; compensation requires increased effort.",
          ],
          [
            "4",
            "High",
            "Substantial impairment of a critical or important function; reporting obligations possible.",
          ],
          [
            "5",
            "Very high",
            "Failure or compromise of a critical function with supervisory and reputational relevance.",
          ],
        ],
      },
      { kind: "h3", text: "Operational effect in the GRC system" },
      {
        kind: "p",
        text: "In the risk analysis of a critical asset, all five dimensions must be assessed. Take a payment service provider interface as an example: confidentiality may only warrant a medium rating if nothing but tokens are exchanged – availability and authenticity, however, must be rated at the highest levels. If a penetration test under Chapter IV shows that the logs of this interface can be manipulated after the fact, the protection need in the non-repudiation dimension is breached: the overall risk must immediately be classified in the red zone, because the evidence obligation in an incident scenario can no longer be met – even if the system runs without technical faults.",
      },
      {
        kind: "callout",
        tone: "danger",
        title: "Knockout rule",
        text: "If, for an asset supporting a critical or important function, one of the five dimensions is assessed at a fulfilment level below level 3, the asset is deemed a NO-GO. The result must be recorded as a finding with a corrective action and reported to the management body.",
      },
    ],
  },
];
