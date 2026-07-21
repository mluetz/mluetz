#!/usr/bin/env python3
"""
Generator for the ENGLISH edition of the TISAX AL3 finding database (index-en.html).

Builds on the same template as the German edition (tools/template.html): the UI strings
are switched to English via the exact replacement table below (CSS/JS stay single-source),
enum values (priority, status, site, tags) are mapped deterministically, and the free-text
fields come from the reviewed translation overlay data/translations_en.json.

Usage:
    python3 tools/generate.py        # refresh German data first (if the Excel changed)
    python3 tools/generate_en.py

Produces:  index-en.html  and  data/findings_en.json
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "tools" / "template.html"
SRC_JSON = ROOT / "data" / "findings.json"
OVERLAY = ROOT / "data" / "translations_en.json"
OUT_HTML = ROOT / "index-en.html"
OUT_JSON = ROOT / "data" / "findings_en.json"

PRIO = {"Kritisch": "Critical", "Hoch": "High", "Mittel": "Medium", "Niedrig": "Low"}
STATUS = {"Offen": "Open", "In Bearbeitung": "In progress"}
SITE = {"Alle": "All"}
TAGS = {"BCM/Verfügbarkeit": "BCM/Availability", "Datenschutz": "Data Protection"}
MODULE = {"General / Katalog": "General / Catalogue"}

# Free-text fields supplied by the translation overlay (keyed by excelRow).
OVERLAY_FIELDS = ["kapitel", "beschreibung", "gap", "massnahme", "umsetzung",
                  "xref", "scope", "verantwortlich", "isbKommentar", "isaModul", "frageEn"]

# Exact UI string replacements applied to the shared template. Every entry must
# match exactly once — the build fails loudly if the template drifts.
UI = [
    ('<html lang="de">', '<html lang="en">'),
    ('<title>TISAX AL3 Finding-Register — REUTIB (Reutter-Group)</title>',
     '<title>TISAX AL3 Finding Register — REUTIB (Reutter Group)</title>'),
    ('TISAX AL3 · VDA ISA 6.0.3 · Maßnahmen- &amp; Finding-Register',
     'TISAX AL3 · VDA ISA 6.0.3 · Action &amp; Finding Register'),
    ('REUTIB — TISAX AL3 Finding-Register</h1>',
     'REUTIB — TISAX AL3 Finding Register</h1>'),
    ('<p class="sub">Interaktive Datenbank der Stage-Review-Findings mit Cross-Referenzen zu den Controls des\n        VDA-ISA-Prüfkatalogs. Filterbar nach Domäne (u.&nbsp;a. <b>OT</b>), Modul, Priorität, Standort und Status.</p>',
     '<p class="sub">Interactive database of the stage-review findings with cross-references to the controls of the\n        VDA ISA assessment catalogue. Filterable by domain (incl. <b>OT</b>), module, priority, site and status.</p>'),
    ('<a class="theme-btn" id="langLink" href="index-en.html" title="Switch to English" style="text-decoration:none">EN</a>',
     '<a class="theme-btn" id="langLink" href="index.html" title="Zur deutschen Version" style="text-decoration:none">DE</a>'),
    ('aria-label="Theme wechseln"', 'aria-label="Toggle theme"'),
    ('Prüfkatalog <b>VDA ISA 6.0.3</b>', 'Catalogue <b>VDA ISA 6.0.3</b>'),
    ('Auditor <b>CIS GmbH, Wien</b>', 'Auditor <b>CIS GmbH, Vienna</b>'),
    ('Labels <b>Vertraulichkeit · Verfügbarkeit sehr hoch</b>',
     'Labels <b>Confidentiality · Very high availability</b>'),
    ('placeholder="Volltextsuche: Finding, Control-Nr, Maßnahme, Verantwortlich …"',
     'placeholder="Full-text search: finding, control no., measure, owner …"'),
    ('title="Nur OT-relevante Findings"', 'title="OT-relevant findings only"'),
    ('<button class="btn" id="resetBtn">Zurücksetzen</button>',
     '<button class="btn" id="resetBtn">Reset</button>'),
    ('<button class="btn primary" id="csvBtn">CSV Export</button>',
     '<button class="btn primary" id="csvBtn">CSV export</button>'),
    ('<span class="chips-label">Domäne</span>', '<span class="chips-label">Domain</span>'),
    ('<button data-v="modul" class="on">Nach ISA-Modul</button>',
     '<button data-v="modul" class="on">By ISA module</button>'),
    ('<button data-v="control">Nach Control</button>',
     '<button data-v="control">By control</button>'),
    ('<button data-v="flat">Liste (Prio)</button>',
     '<button data-v="flat">List (priority)</button>'),
    ('<div><b>Datengrundlage:</b> TISAX Finding Register v3 (Stage Review 29.04.2026, CIS GmbH) — Spalten M/N/O\n    (Umsetzungsgegenstand · X-Referenzen · Complete Remediation Scope) integriert. <b id="fcount"></b> Findings.</div>',
     '<div><b>Data basis:</b> TISAX Finding Register v3 (stage review 2026-04-29, CIS GmbH) — columns M/N/O\n    (implementation subject · x-references · complete remediation scope) included. <b id="fcount"></b> findings.</div>'),
    ('<div>Erzeugt aus <code>TISAX_Finding_Register_v3_M_N_O.xlsx</code>. Vertraulich — nur für den internen ISMS-/Audit-Gebrauch der Reutter-Group (REUTIB).\n    Änderungen bitte in der Quell-Datei pflegen und HTML neu generieren.</div>',
     '<div>Generated from <code>TISAX_Finding_Register_v3_M_N_O.xlsx</code>. Confidential — for internal ISMS/audit use of the Reutter Group (REUTIB) only.\n    Maintain changes in the source file and regenerate the HTML. English texts are translations of the German original; in case of doubt the German register prevails.</div>'),
    # ---- JS ----
    ('const PRIO_ORDER={ "Kritisch":0,"Hoch":1,"Mittel":2,"Niedrig":3,"":4 };',
     'const PRIO_ORDER={ "Critical":0,"High":1,"Medium":2,"Low":3,"":4 };'),
    ('fillSelect(document.getElementById("fModul"),"Alle Module",modules);',
     'fillSelect(document.getElementById("fModul"),"All modules",modules);'),
    ('fillSelect(document.getElementById("fTyp"),"Alle Finding-Typen",["Major NC","Minor NC","Observation"]);',
     'fillSelect(document.getElementById("fTyp"),"All finding types",["Major NC","Minor NC","Observation"]);'),
    ('fillSelect(document.getElementById("fPrio"),"Alle Prioritäten",["Kritisch","Hoch","Mittel","Niedrig"]);',
     'fillSelect(document.getElementById("fPrio"),"All priorities",["Critical","High","Medium","Low"]);'),
    ('fillSelect(document.getElementById("fStatus"),"Alle Status",distinct("status").sort().concat([ST_DONE,ST_NOTDONE]));',
     'fillSelect(document.getElementById("fStatus"),"All statuses",distinct("status").sort().concat([ST_DONE,ST_NOTDONE]));'),
    ('fillSelect(document.getElementById("fSite"),"Alle Standorte",["DE","AT","SK","PL","IT","Alle"]);',
     'fillSelect(document.getElementById("fSite"),"All sites",["DE","AT","SK","PL","IT","All"]);'),
    ('const tagOrder=["OT","BCM/Verfügbarkeit","Governance/Policy","IAM","Physical","HR","Supplier","Logging/Monitoring","Malware","Datenschutz","Compliance"];',
     'const tagOrder=["OT","BCM/Availability","Governance/Policy","IAM","Physical","HR","Supplier","Logging/Monitoring","Malware","Data Protection","Compliance"];'),
    ('if(s.includes("ALLE")) return ["Alle"];', 'if(s.includes("ALL")) return ["All"];'),
    ('if(state.site==="Alle"){ if(!f._sites.includes("Alle")) return false; }\n    else if(!(f._sites.includes(state.site)||f._sites.includes("Alle"))) return false;',
     'if(state.site==="All"){ if(!f._sites.includes("All")) return false; }\n    else if(!(f._sites.includes(state.site)||f._sites.includes("All"))) return false;'),
    ("<span class='reifebars' title='Reifegrad IST → SOLL'>",
     "<span class='reifebars' title='Maturity actual → target'>"),
    ('const k=f.kontrollNr||"(ohne Control)";', 'const k=f.kontrollNr||"(no control)";'),
    ('`<b>${list.length}</b> von ${FINDINGS.length} Findings`',
     '`<b>${list.length}</b> of ${FINDINGS.length} findings`'),
    ('Keine Findings für diese Filter.<br>Filter zurücksetzen und erneut versuchen.',
     'No findings match these filters.<br>Reset the filters and try again.'),
    # card: lead with the English control question, show German as secondary line
    ('<div class="qtitle">${esc(f.frageDe||f.kapitel||f.beschreibung||"(ohne Titel)")}</div>',
     '<div class="qtitle">${esc(f.frageEn||f.frageDe||f.kapitel||f.beschreibung||"(untitled)")}</div>'),
    ('${f.frageEn?`<div class="frage-en">EN: ${esc(f.frageEn)}</div>`:""}',
     '${f.frageDe&&f.frageDe!==f.frageEn?`<div class="frage-en">DE: ${esc(f.frageDe)}</div>`:""}'),
    ('${field("Finding-Beschreibung",f.beschreibung)}',
     '${field("Finding description",f.beschreibung)}'),
    ('${field("Maßnahme",f.massnahme)}', '${field("Measure / action",f.massnahme)}'),
    ('${field("Umsetzungsgegenstand, Prozessbezug & Workflow Items (Spalte M)",f.umsetzung)}',
     '${field("Implementation subject, process reference & workflow items (column M)",f.umsetzung)}'),
    ('<div class="fl">Cross-Referenzen (abhängige Findings)</div>',
     '<div class="fl">Cross-references (dependent findings)</div>'),
    ('${field("X-Referenzen zu StageReview Findings (Spalte N)",f.xref,true)}',
     '${field("X-references to stage-review findings (column N)",f.xref,true)}'),
    ('${field("Complete Remediation Scope (Spalte O)",f.scope,true)}',
     '${field("Complete remediation scope (column O)",f.scope,true)}'),
    ('<span><b>Modul:</b> ${esc(f.moduleName)}</span>', '<span><b>Module:</b> ${esc(f.moduleName)}</span>'),
    ('<span><b>Kapitel:</b> ${esc(f.kapitel||"—")}</span>', '<span><b>Chapter:</b> ${esc(f.kapitel||"—")}</span>'),
    ('<span><b>Verantwortlich:</b> ${esc(f.verantwortlich||"—")}</span>',
     '<span><b>Responsible:</b> ${esc(f.verantwortlich||"—")}</span>'),
    ('<span><b>Standort:</b> ${esc(f.standort||"—")}</span>', '<span><b>Site:</b> ${esc(f.standort||"—")}</span>'),
    ('<span><b>Frist:</b> ${esc(f.frist||"—")}</span>', '<span><b>Due date:</b> ${esc(f.frist||"—")}</span>'),
    ('`<span><b>Reifegrad:</b> IST ${esc(f.reifeIst||"–")} → SOLL ${esc(f.reifeSoll||"–")}</span>`',
     '`<span><b>Maturity:</b> actual ${esc(f.reifeIst||"–")} → target ${esc(f.reifeSoll||"–")}</span>`'),
    ('`<span><b>Nachweis:</b> ${esc(f.nachweis)}</span>`', '`<span><b>Evidence:</b> ${esc(f.nachweis)}</span>`'),
    ('const statusCl=/bearbeit/i.test(f.status)?"prog":"";', 'const statusCl=/progress/i.test(f.status)?"prog":"";'),
    # KPIs
    ('const krit=FINDINGS.filter(f=>f.prioritaet==="Kritisch").length;',
     'const krit=FINDINGS.filter(f=>f.prioritaet==="Critical").length;'),
    ('const hoch=FINDINGS.filter(f=>f.prioritaet==="Hoch").length;',
     'const hoch=FINDINGS.filter(f=>f.prioritaet==="High").length;'),
    ('tile(t,"Findings gesamt")+', 'tile(t,"Total findings")+'),
    ('tile(krit+hoch,"Kritisch + Hoch","k-hoch",(krit+hoch)/t,"var(--hoch)")+',
     'tile(krit+hoch,"Critical + High","k-hoch",(krit+hoch)/t,"var(--hoch)")+'),
    ('tile(done,`Erledigt · ${rest} offen`,"k-done",done/t,"var(--niedrig)");',
     'tile(done,`Done · ${rest} open`,"k-done",done/t,"var(--niedrig)");'),
    # ---- Erledigt / done feature ----
    ('<button class="btn" id="saveBtn" title="Erledigt-Stand als Datei sichern">Stand sichern</button>',
     '<button class="btn" id="saveBtn" title="Save completion status to a file">Save progress</button>'),
    ('<button class="btn" id="loadBtn" title="Erledigt-Stand aus Datei laden">Stand laden</button>',
     '<button class="btn" id="loadBtn" title="Load completion status from a file">Load progress</button>'),
    ('const ST_DONE="✓ Erledigt", ST_NOTDONE="○ Nicht erledigt";',
     'const ST_DONE="✓ Done", ST_NOTDONE="○ Not done";'),
    ('const XKIND={pre:"Voraussetzung (vorgelagert)",post:"Liefert Input an (nachgelagert)",cross:"Querverweise"};',
     'const XKIND={pre:"Prerequisite (upstream)",post:"Provides input to (downstream)",cross:"Cross-references"};'),
    ('const warnMsg=(n,ids)=>`Achtung: ${n} vorausgesetzte(s) Finding(s) noch nicht erledigt:\\n· ${ids}\\n\\nTrotzdem als erledigt markieren?`;',
     'const warnMsg=(n,ids)=>`Warning: ${n} prerequisite finding(s) not yet done:\\n· ${ids}\\n\\nMark as done anyway?`;'),
    ('<span class="b b-done">Erledigt${DONE[f.excelRow].t?" · "+esc(DONE[f.excelRow].t):""}</span>',
     '<span class="b b-done">Done${DONE[f.excelRow].t?" · "+esc(DONE[f.excelRow].t):""}</span>'),
    ('title="Erledigt umschalten" aria-label="Erledigt umschalten"',
     'title="Toggle done" aria-label="Toggle done"'),
    ('${isDone(f)?"✓ Erledigt — als offen markieren":"Als erledigt markieren"}',
     '${isDone(f)?"✓ Done — mark as open":"Mark as done"}'),
    ('Voraussetzungen erledigt: ${d}/${pres.length}',
     'Prerequisites done: ${d}/${pres.length}'),
    ('const DONE_CSV={col:"Erledigt",yes:"Ja",no:"Nein"};',
     'const DONE_CSV={col:"Done",yes:"Yes",no:"No"};'),
    ('a.download="TISAX_Findings_Stand.json";', 'a.download="TISAX_findings_progress.json";'),
    ('alert("Datei konnte nicht gelesen werden — bitte einen zuvor gesicherten Stand (JSON) wählen.");',
     'alert("Could not read the file — please choose a previously saved progress file (JSON).");'),
    # CSV
    ('const cols=[["findingId","Finding-ID"],["kontrollNr","Control"],["moduleName","Modul"],["kapitel","Kapitel"],\n    ["frageDe","Kontrollfrage"],["typ","Typ"],["prioritaet","Prio"],["status","Status"],["standort","Standort"],\n    ["verantwortlich","Verantwortlich"],["frist","Frist"],["beschreibung","Beschreibung"],["massnahme","Maßnahme"],\n    ["umsetzung","Umsetzung(M)"],["xref","XRef(N)"],["scope","Scope(O)"]];',
     'const cols=[["findingId","Finding ID"],["kontrollNr","Control"],["moduleName","Module"],["kapitel","Chapter"],\n    ["frageEn","Control question"],["typ","Type"],["prioritaet","Priority"],["status","Status"],["standort","Site"],\n    ["verantwortlich","Responsible"],["frist","Due"],["beschreibung","Description"],["massnahme","Measure"],\n    ["umsetzung","Implementation(M)"],["xref","XRef(N)"],["scope","Scope(O)"]];'),
    ('a.download="TISAX_Findings_gefiltert.csv";', 'a.download="TISAX_findings_filtered.csv";'),
    # theme button labels
    ('document.getElementById("themeTxt").textContent=dark?"Dunkel":"Hell"; }',
     'document.getElementById("themeTxt").textContent=dark?"Dark":"Light"; }'),
]


def translate_records(data, overlay):
    for rec in data:
        ov = overlay.get(str(rec["excelRow"]), {})
        for f in OVERLAY_FIELDS:
            if f in ov:
                rec[f] = ov[f]
        rec["prioritaet"] = PRIO.get(rec["prioritaet"], rec["prioritaet"])
        rec["status"] = STATUS.get(rec["status"], rec["status"])
        rec["standort"] = SITE.get(rec["standort"], rec["standort"])
        rec["moduleName"] = MODULE.get(rec["moduleName"], rec["moduleName"])
        rec["tags"] = [TAGS.get(t, t) for t in rec.get("tags", [])]
    return data


def main():
    data = json.loads(SRC_JSON.read_text(encoding="utf-8"))
    overlay = json.loads(OVERLAY.read_text(encoding="utf-8"))
    data = translate_records(data, overlay)
    OUT_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    tpl = TEMPLATE.read_text(encoding="utf-8")
    for old, new in UI:
        n = tpl.count(old)
        if n != 1:
            raise SystemExit(f"UI replacement matched {n}x (expected 1): {old[:70]!r}")
        tpl = tpl.replace(old, new)
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    OUT_HTML.write_text(tpl.replace("/*__DATA__*/", payload), encoding="utf-8")

    ot = sum(1 for d in data if "OT" in d["tags"])
    print(f"OK · {len(data)} findings · {ot} OT-relevant · {OUT_HTML.name} ({OUT_HTML.stat().st_size//1024} KB)")


if __name__ == "__main__":
    main()
