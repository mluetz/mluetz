/**
 * DORA ISRM knowledge base — English edition (Regulation (EU) 2022/2554).
 *
 * Editorially curated summaries of the five DORA core pillars from the
 * perspective of a bank's information security risk management (ISRM)
 * function. Terms marked in the texts ([[term]]) reference the glossary
 * and are rendered in the UI as clickable terms with an explanatory modal.
 *
 * Note: These texts are working and training material. They do not replace
 * a legal review of the Regulation and the associated RTS/ITS.
 */

import type { DoraPillar } from "@/lib/content/dora-knowledge";

export const DORA_PILLARS_EN: DoraPillar[] = [
  {
    id: "ict-risk",
    chapter: "Chapter II",
    articles: "Art. 5–16",
    title: "ICT Risk Management",
    paragraphs: [
      "Chapter II obliges financial entities to maintain a sound, comprehensive and well-documented ICT risk management framework that forms an integral part of the overall risk management system and is reviewed at least annually as well as on an event-driven basis. Ultimate responsibility rests explicitly with the [[management body]]: it approves the digital operational resilience strategy, sets the [[risk tolerance]] for ICT risk, allocates the budget for implementation, and must build and maintain sufficient knowledge of ICT risk itself.",
      "In substance, the framework follows a complete lifecycle: identification of all information and ICT assets, business functions and dependencies (including the classification of [[critical or important functions]]), protection and prevention (including security policies, network segmentation, encryption and access control), detection of anomalous activities, response and recovery with defined [[RTO/RPO]] objectives, backup and restoration procedures, and learning and evolving — for example by evaluating incidents and tests. Under the [[proportionality principle]], the scope and depth may be calibrated to the institution's size and risk profile; certain small institutions may apply a simplified framework (Art. 16).",
    ],
    isrmTasks: [
      "Define and document the ICT risk methodology, risk appetite and thresholds, and submit them to the management body for approval (in the Cockpit: risk methodology and appetite per category in Administration).",
      "Maintain a complete register of assets, ICT services and dependencies and derive risks from it (Risk Register, RB-01/RB-02).",
      "Conduct business impact analyses ([[BIA]]) with the business units and track RTO/RPO targets for each critical function.",
      "Have the effectiveness of protection, detection and recovery controls tested on a regular basis (Control Library, RB-07).",
      "Establish management reporting on ICT risk and feed lessons learned from incidents back into the framework (RB-08).",
    ],
    cockpitLinks: [
      { label: "Risk Register", href: "/risks" },
      { label: "Control Library", href: "/controls" },
      { label: "DORA Mapping (Governance)", href: "/governance" },
    ],
  },
  {
    id: "incidents",
    chapter: "Chapter III",
    articles: "Art. 17–23",
    title: "ICT-Related Incident Management, Classification and Reporting",
    paragraphs: [
      "Chapter III requires a defined process for managing ICT-related incidents: detection, logging, classification, escalation, communication and root-cause analysis. Every [[ICT incident]] must be classified against uniform criteria — including the clients and transactions affected, duration and geographical spread, data losses, the criticality of the services affected and the economic impact. If an incident exceeds the materiality thresholds specified in the technical standards, it qualifies as a [[major ICT incident]] subject to mandatory reporting to the competent supervisory authority.",
      "Staggered [[reporting deadlines]] apply to major incidents: an initial notification shortly after classification, an intermediate report upon a change in status or at the latest within the deadlines laid down in the RTS, and a final report including a root-cause analysis. Significant cyber threats may be reported on a voluntary basis; affected clients must be informed about major incidents and significant threats where their financial interests are at stake. What matters most for ISRM is tight integration with the incident response process: incident classification must work in minutes, not days — backed by reliable data from monitoring and the [[SOC]].",
    ],
    isrmTasks: [
      "Implement classification logic based on the DORA criteria and integrate it with the incident response process (CTL-016); keep playbooks PB-05/PB-06 for provider-related incidents ready.",
      "Establish reporting workflows with deadline monitoring for initial, intermediate and final reports, and rehearse them regularly.",
      "Feed incident data back into the risk assessment as early-warning indicators (RB-02) and track control gaps as remediation actions.",
      "Document communication channels to the supervisory authority, clients and internal committees, and keep them readily available in a crisis.",
    ],
    cockpitLinks: [
      { label: "Playbook PB-05 (provider outage)", href: "/playbooks" },
      { label: "Runbooks", href: "/runbooks" },
    ],
  },
  {
    id: "testing",
    chapter: "Chapter IV",
    articles: "Art. 24–27",
    title: "Digital Operational Resilience Testing",
    paragraphs: [
      "Chapter IV obliges financial entities to run a risk-based digital operational resilience testing programme as an integral part of the ICT risk management framework. All ICT systems and applications supporting [[critical or important functions]] must be tested at least annually — the spectrum ranges from vulnerability scans, open-source analyses and network security assessments through scenario-based and compatibility testing to penetration testing. Identified vulnerabilities must be fully tracked and remediated; the Cockpit reflects this through actions with effectiveness verification.",
      "For institutions of sufficient significance and risk profile, threat-led penetration testing ([[TLPT]]) is added: at least every three years, on live production systems, against critical functions, and based on real threat scenarios — methodologically aligned with [[TIBER-EU]]. Where critical functions are operated by [[ICT third-party providers]], these must be included in the test (where appropriate via pooled testing). ISRM steers scoping, risk sign-offs and the confidential handling of results, and transfers findings into the remediation process.",
    ],
    isrmTasks: [
      "Plan the annual testing programme on a risk basis (derive the scope from the criticality of functions) and align it with the control testing calendar (RB-07).",
      "Clarify whether your institution is subject to the TLPT obligation, prepare scoping documents and management sign-offs, and contractually oblige providers to participate.",
      "Track all test results as findings with actions, deadlines and effectiveness verification (Actions, PB-10).",
      "Keep audit-proof evidence of the tests in the Evidence Register (RB-19).",
    ],
    cockpitLinks: [
      { label: "Actions", href: "/actions" },
      { label: "Evidence Register", href: "/evidence" },
    ],
  },
  {
    id: "third-party",
    chapter: "Chapter V",
    articles: "Art. 28–44",
    title: "Managing ICT Third-Party Risk",
    paragraphs: [
      "Chapter V treats ICT third-party risk as an integral part of ICT risk management. Financial entities need a strategy on [[ICT third-party providers]], must perform a risk assessment before entering into a contract (including [[concentration risk]] and scrutiny of the [[subcontracting chain]]), and must maintain a complete [[register of information]] on all contractual arrangements — with an annual reporting obligation to the supervisory authority. Contracts for ICT services must contain the [[mandatory contractual provisions]] under Art. 30; where critical or important functions are supported, extended requirements apply, such as unrestricted audit and access rights, participation in resilience testing, and documented [[exit strategies]] with tested exit plans.",
      "New is the European oversight framework for critical ICT third-party providers ([[CTPP]]): the European Supervisory Authorities ([[ESAs]]) designate providers of systemic importance, and a [[Lead Overseer]] supervises them directly — with powers to request information, conduct investigations and issue recommendations. For the bank this brings no relief: responsibility for outsourced functions remains fully with the institution. ISRM must therefore continuously assess criticality, substitutability and concentration exposures, and keep the register data at supervisory-grade quality.",
    ],
    isrmTasks: [
      "Maintain the register of information in a complete, report-ready state (third-party register including contracts, subcontractors and data locations — RB-09 to RB-11).",
      "Perform criticality and concentration assessments on a regular basis (RB-10, RB-12; playbooks PB-04/PB-08/PB-16).",
      "Enforce the Art. 30 standard contractual clauses (CTL-014) and review existing contracts for gaps.",
      "Document and test exit strategies for all critical third parties (RB-13, PB-07).",
    ],
    cockpitLinks: [
      { label: "Third-Party Register", href: "/third-parties" },
      { label: "TPRM Report", href: "/reports/TPRM_OVERVIEW" },
    ],
  },
  {
    id: "info-sharing",
    chapter: "Chapter VI",
    articles: "Art. 45",
    title: "Information-Sharing Arrangements",
    paragraphs: [
      "Chapter VI enables — and encourages — financial entities to exchange [[cyber threat intelligence]] among themselves: indicators of compromise, attacker tactics and procedures, alerts and configuration recommendations. The prerequisite is protected arrangements within trusted communities that preserve the sensitivity of the information and comply with data protection and competition rules. Participation in such arrangements must be notified to the supervisory authority.",
      "For a bank's ISRM, this building block is the bridge between the external threat landscape and internal risk steering: insights from sharing communities (e.g. sectoral CERTs or industry-specific exchange circles) feed into threat analysis, into the reassessment of affected risks and into the prioritisation of controls. Conversely, the bank's own participation strengthens the collective resilience of the sector.",
    ],
    isrmTasks: [
      "Evaluate participation in suitable threat intelligence communities, document the arrangements and notify the supervisory authority.",
      "Establish a process that translates external threat intelligence into risk reassessments (RB-02, PB-14 for new requirements).",
      "Define confidentiality and data protection rules for shared information (classification in the Evidence Register).",
    ],
    cockpitLinks: [
      { label: "Reassess risk (RB-02)", href: "/runbooks" },
      { label: "Governance Mapping", href: "/governance" },
    ],
  },
];

/** Glossary: technical terms in a banking context, short and to the point. */
export const DORA_GLOSSARY_EN: Record<string, { title: string; definition: string }> = {
  "management body": {
    title: "Management body",
    definition:
      "The institution's board of directors or executive management. DORA assigns it ultimate responsibility for ICT risk management: approval of the digital operational resilience strategy and the risk tolerance, budget responsibility, regular engagement with ICT risk and major incidents, and the duty to keep its own knowledge of ICT risk up to date. Delegation to the CISO or ISRM does not discharge this responsibility.",
  },
  "risk tolerance": {
    title: "Risk tolerance for ICT risk",
    definition:
      "The level of ICT risk, set by the management body, that the institution is consciously prepared to accept in pursuit of its business objectives. Implemented in the Cockpit as a risk appetite threshold per risk category: residual risks above the threshold require treatment or a formal, time-limited acceptance decision by management.",
  },
  "critical or important functions": {
    title: "Critical or important function",
    definition:
      "A function whose disruption would materially impair the institution's financial performance, the continuity of its services or its compliance with regulatory obligations — e.g. payments, securities settlement or regulatory reporting. Heightened DORA obligations attach to this classification: annual testing, TLPT scope, extended contractual clauses and exit strategies where the function is outsourced.",
  },
  "RTO/RPO": {
    title: "RTO / RPO",
    definition:
      "Recovery Time Objective: the maximum tolerated time to restore a service after a disruption. Recovery Point Objective: the maximum tolerated data loss, measured as the time span since the last backup. DORA requires both to be defined per function, embedded in recovery plans and demonstrably achievable through testing (e.g. failover data centre exercises) — for a bank's payment operations typically in the range of minutes to hours.",
  },
  "proportionality principle": {
    title: "Proportionality principle (Art. 4)",
    definition:
      "The DORA requirements are to be implemented taking into account size, overall risk profile, and the nature, scale and complexity of the services provided. It allows gradation in depth — not the waiver of core obligations. Microenterprises and certain exempted entities may apply the simplified framework under Art. 16.",
  },
  BIA: {
    title: "Business impact analysis (BIA)",
    definition:
      "A systematic assessment of how the failure of a process or ICT service affects the institution over time (financially, regulatorily, clients, reputation). It provides the basis for classifying critical functions, for RTO/RPO targets and for prioritising resilience measures.",
  },
  "ICT incident": {
    title: "ICT-related incident",
    definition:
      "An event or series of linked events not planned by the institution that compromises the security of network and information systems and has an adverse impact on the availability, authenticity, integrity or confidentiality of data or on the services provided. Every incident must be recorded and classified against uniform criteria.",
  },
  "major ICT incident": {
    title: "Major ICT-related incident",
    definition:
      "An ICT incident that exceeds the materiality thresholds specified in the regulatory technical standards — for example by clients/transactions affected, duration, data loss, geographical spread or the criticality of the services affected. It triggers the mandatory, deadline-bound reporting chain to the competent supervisory authority and must be reported to the management body.",
  },
  "reporting deadlines": {
    title: "Reporting deadlines for major incidents",
    definition:
      "DORA provides for a three-stage reporting chain to the competent authority: an early initial notification after the incident is classified as major, an intermediate report upon a relevant change in status, and a final report with a root-cause analysis once remediation is complete. The specific deadlines and templates are laid down in the RTS/ITS on incident reporting — within the institution they belong in a well-rehearsed workflow with deadline monitoring.",
  },
  SOC: {
    title: "Security Operations Center (SOC)",
    definition:
      "An organisational unit (in-house or as a managed service) that monitors, correlates and assesses security-relevant events around the clock. It supplies the data foundation for the DORA obligations on anomaly detection (Chapter II) and rapid incident classification (Chapter III). Where outsourced, the SOC is itself a critical ICT third-party service.",
  },
  TLPT: {
    title: "TLPT – Threat-Led Penetration Testing",
    definition:
      "Threat-led penetration testing under Art. 26/27: simulates real attacks on the production systems of critical functions based on current threat analyses — at least every three years for the institutions designated for it. Conducted by qualified, independent testers under strict confidentiality; supporting ICT third-party providers must be included. The methodological reference framework in Europe is TIBER-EU.",
  },
  "TIBER-EU": {
    title: "TIBER-EU",
    definition:
      "Threat Intelligence-based Ethical Red Teaming: the ECB framework for intelligence-led red team testing in the financial sector. It defines roles (including the White Team and threat intelligence and red team providers), phases and confidentiality rules. DORA TLPT is modelled on TIBER-EU; national implementations specify the execution in detail.",
  },
  "ICT third-party provider": {
    title: "ICT third-party service provider",
    definition:
      "An undertaking providing ICT services to the institution — from cloud and data centre services through software-as-a-service to network and security services. The obligations of Chapter V apply to them: risk assessment before contracting, register maintenance, mandatory contractual provisions, ongoing monitoring and — for critical functions — exit strategies.",
  },
  "ICT third-party providers": {
    title: "ICT third-party service provider",
    definition:
      "An undertaking providing ICT services to the institution — from cloud and data centre services through software-as-a-service to network and security services. The obligations of Chapter V apply to them: risk assessment before contracting, register maintenance, mandatory contractual provisions, ongoing monitoring and — for critical functions — exit strategies.",
  },
  "register of information": {
    title: "Register of information (Art. 28(3))",
    definition:
      "A complete, up-to-date register of all contractual arrangements on ICT services — at entity, sub-consolidated and consolidated level, with identification of the contracts that support critical or important functions. It must be reported to the supervisory authority at least annually; its structure and data fields are prescribed by ITS. In the Cockpit this corresponds to the Third-Party Register with contracts and subcontractors.",
  },
  "concentration risk": {
    title: "ICT concentration risk",
    definition:
      "Risk arising from dependence on a single provider or a small number of providers, on services that are difficult to substitute, or on subcontractors shared across several of the institution's own providers. To be assessed before contracting and on an ongoing basis — including a view of data locations and regions. Critical concentration exposures require a deliberate management decision (diversification, contractual resilience or documented acceptance).",
  },
  "subcontracting chain": {
    title: "Subcontracting chain",
    definition:
      "The chain of subcontractors through which an ICT third-party provider delivers parts of its service. DORA requires transparency about material subcontracting arrangements, contractual provisions governing their control, and an assessment of the risks of long or complex chains — in particular where subcontractors carry critical parts of the service or are located in third countries.",
  },
  "mandatory contractual provisions": {
    title: "Mandatory contractual provisions (Art. 30)",
    definition:
      "Mandatory content of every ICT service contract: including the service description, data locations, provisions on availability, integrity and confidentiality, incident support, termination rights and cooperation on exit. Where critical or important functions are supported, additionally: full audit and access rights (including for the supervisory authority), performance targets/SLAs, participation in TLPT and binding exit assistance.",
  },
  "exit strategies": {
    title: "Exit strategy / exit plan",
    definition:
      "A documented strategy for how a critical service outsourced to a third-party provider can be terminated or transferred in an orderly manner — without undue disruption to business activities or breach of regulatory obligations. It covers substitution options, data portability and transition periods, and must be tested regularly (in the Cockpit: RB-13, Playbook PB-07).",
  },
  CTPP: {
    title: "CTPP – Critical ICT third-party provider",
    definition:
      "Critical Third-Party Provider: an ICT third-party provider designated as critical by the European Supervisory Authorities due to its systemic importance for the financial sector (typically the large cloud hyperscalers). CTPPs are subject to direct European oversight by a Lead Overseer. Important: the designation does not relieve the individual institution of its own third-party responsibility.",
  },
  "Lead Overseer": {
    title: "Lead Overseer",
    definition:
      "The one of the three European Supervisory Authorities (EBA, EIOPA or ESMA) appointed to directly oversee an ICT third-party provider designated as critical. Powers: requests for information, investigations, on-site inspections and recommendations — where these are disregarded, supervisors may in extreme cases require institutions to stop using the provider.",
  },
  ESAs: {
    title: "ESAs – European Supervisory Authorities",
    definition:
      "Collective term for the EBA (banking), EIOPA (insurance) and ESMA (securities markets). Under DORA they jointly develop the regulatory and implementing technical standards (RTS/ITS), operate the oversight framework for critical ICT third-party providers and appoint the Lead Overseers.",
  },
  "maturity level": {
    title: "Maturity level (0–5)",
    definition:
      "A six-level assessment scale per requirement (FRWK-DORA-001, Chapter 11): 0 non-existent, 1 initial, 2 repeatable, 3 defined, 4 managed, 5 optimised. What counts is the demonstrable state as of the reference date — without a valid, verified piece of evidence, the evidence lock caps the effective maturity level at 2.",
  },
  "evidence lock": {
    title: "Evidence lock",
    definition:
      "A calculation rule of the requirements catalogue: if a requirement lacks a valid, verified piece of evidence, its effective maturity level is capped by the system at 2 — regardless of the self-assessment. It enforces the DORA principle that what counts is not intent but the demonstrable state.",
  },
  knockout: {
    title: "Knockout (KO)",
    definition:
      "A flag on those MUST requirements whose non-fulfilment in a supervisory examination would very likely lead directly to a finding or directly endanger a critical function (98 of 133 requirements). If a KO requirement stands at an effective maturity level below 3, the chapter status is set to RED — regardless of the arithmetic average. Response: Playbook PB-17.",
  },
  CAPA: {
    title: "CAPA – Corrective and preventive action",
    definition:
      "Corrective and Preventive Action: an action attached to a finding, with an owner, a due date and a pre-defined effectiveness criterion. A finding may only be closed once effectiveness has been demonstrated — only then is the maturity level of the associated requirement reassessed (FRWK-DORA-001, Chapter 12).",
  },
  "DORA Resilience Index": {
    title: "DORA Resilience Index",
    definition:
      "The overall metric of the requirements catalogue: the mean of the chapter scores weighted by chapter (Ch. II 30 %, III 25 %, IV 15 %, V 25 %, VI 5 %), overridden by open knockouts. Target value ≥ 85 % (GREEN); 60–84 % AMBER; below that, or with an open knockout, RED.",
  },
  "cyber threat intelligence": {
    title: "Cyber threat intelligence",
    definition:
      "Information on threat situations that may be shared between financial entities: indicators of compromise (IoCs), attacker tactics/techniques/procedures, alerts and hardening recommendations. The exchange takes place in trusted communities on the basis of protected arrangements; participation must be notified to the supervisory authority.",
  },
  "lex specialis": {
    title: "Lex specialis derogat legi generali",
    definition:
      "A conflict-of-laws rule: the more specific law displaces the more general one. For the financial sector this means that DORA, as sector-specific law, displaces the general requirements of the NIS 2 Directive to the extent that both cover the same subject matter. The practical consequence is not an exemption but a tightening: DORA takes the NIS 2 baseline and tailors it to the financial sector.",
  },
  "RTS/ITS": {
    title: "RTS / ITS – delegated acts",
    definition:
      "Regulatory Technical Standards (delegated regulations) and Implementing Technical Standards (implementing regulations), drafted by the European Supervisory Authorities and adopted by the EU Commission. They operationalise DORA — including the risk management framework (Delegated Regulation 2024/1774), incident classification (2024/1772), reporting templates (2025/301, 2025/302), the register of information (2024/2956) and TLPT (2025/1190) — and apply directly.",
  },
  "maximum principle": {
    title: "Maximum principle",
    definition:
      "A rule for deriving an asset's overall protection requirement: what counts is the highest individual rating across the five protection dimensions (confidentiality, integrity, availability, authenticity, non-repudiation) — not the average. Averaging is not permissible, because it would mask a critical individual finding.",
  },
  "Time to Assess": {
    title: "Time to Assess",
    definition:
      "Metric KPI-K6-02: the mean time from receipt of an external threat intelligence alert to the completed reconciliation against the asset inventory and the register of information (target value ≤ 24 hours). It is the most robust single indicator of how maturely DORA Chapters V and VI interact — without an up-to-date register, the question “does this affect us?” cannot be answered.",
  },
  "effectiveness criterion": {
    title: "Effectiveness criterion",
    definition:
      "A pre-defined, measurable standard against which the effectiveness of a CAPA action is verified before the associated finding may be closed (FRWK-DORA-001, Chapter 12.1). The sequence — first proof of effectiveness, then closure, and only then reassessment of the maturity level — prevents actions from being formally completed without eliminating the root cause.",
  },
  "three lines of defense": {
    title: "Three lines of defense model",
    definition:
      "A governance model separating execution, control and audit: the first line comprises the operational units (business units, IT operations, SOC), the second line the independent control function for ICT risk under Art. 6(4) DORA (CISO/ICT risk management, compliance), and the third line internal audit with the audit obligation under Art. 6(6). Internal audit must never hold operational responsibility (R/A) anywhere.",
  },
};

/** The nine cause-and-effect chains linking the DORA chapters. */
export const WIRKUNGSKETTEN_EN: string[] = [
  "Chapter VI supplies external threat intelligence — new attack vectors feed into the risk assessment as an input variable.",
  "Chapter V extends the scope of consideration beyond the enterprise boundary — provider risks and the contractual situation become part of the risk register.",
  "Chapter II derives test scope and test frequency from this — what is tested is what is relevant from a risk perspective.",
  "Chapter IV returns the validation — test findings are facts and correct the theoretical risk assessment.",
  "Chapter II provides the continuity and recovery plans for the worst case, which incident management draws on.",
  "Chapter III feeds the lessons from every major incident back into the risk register — without this feedback loop, the control cycle loses its ability to learn. ⚠ audit-relevant",
  "An incident at a service provider immediately triggers a contract and exit review under Chapter V.",
  "Significant cyber threats may be reported voluntarily under Art. 19(2) and fed back into the information-sharing arrangements.",
  "Providers of critical functions must be included in threat-led testing under Art. 26(3). ⚠ audit-relevant",
];
