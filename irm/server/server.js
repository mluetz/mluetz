#!/usr/bin/env node
/* =====================================================================
   REUTIB IRM-Server V1.40 — zentrale Serverdatenbank für den
   Mehrbenutzerbetrieb des IRM-Tools (GDL_010.001).

   Zero-Dependency: benötigt nur Node.js >= 22 (kein npm install).
   Speicher: SQLite über das eingebaute Modul node:sqlite; steht es in
   der Node-Version nicht zur Verfügung, fällt der Server transparent
   auf eine JSON-Datei zurück (gleiches API-Verhalten).

   Start:      node server.js
   Umgebung:   PORT       (Default 8010)
               IRM_DB     Pfad zur Datenbankdatei (Default ./irm.db bzw. ./irm-data.json)
               IRM_TOKEN  optionales Zugriffstoken; wenn gesetzt, verlangt
                          jede /api-Anfrage "Authorization: Bearer <token>"
               IRM_CORS   optional: erlaubter Origin für Cross-Origin-Zugriff
                          (z. B. bei Einbettung der Pages-Seite); Default: aus

   Endpunkte:  GET  /                    IRM-Anwendung (../index.html)
               GET  /api/health          {ok, version, storage, auth}
               POST /api/seq             atomare Ticketnummern-Vergabe {seq}
               POST /api/inbound         Monitoring-/API-Eingang {betreff, beschreibung,
                                         standort, objekte, quelle, kenntnis} -> neues Ticket
               GET  /api/tickets         Gesamtbestand {seq, rev, tickets}
               GET  /api/changes?since=N Änderungen seit Revision N
               PUT  /api/tickets/:id     Ticket anlegen/aktualisieren {ok, rev}

   Tickets werden nie gelöscht (GDL Kap. 14: kein Löschrecht).
   ===================================================================== */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const VERSION = "1.40";
const PORT = parseInt(process.env.PORT || "8010", 10);
const TOKEN = process.env.IRM_TOKEN || "";
const CORS = process.env.IRM_CORS || "";
const MAX_BODY = 8 * 1024 * 1024; /* Tickets können eingebettete Anlagen tragen (bis 4 MB je Ticket) */

/* ---------- Speicher-Abstraktion: SQLite, sonst JSON-Datei ---------- */
let store;
function initSqlite() {
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(process.env.IRM_DB || path.join(__dirname, "irm.db"));
  db.exec("CREATE TABLE IF NOT EXISTS tickets(id TEXT PRIMARY KEY, rev INTEGER NOT NULL, json TEXT NOT NULL)");
  db.exec("CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT NOT NULL)");
  const getMeta = db.prepare("SELECT v FROM meta WHERE k=?");
  const setMeta = db.prepare("INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v");
  const meta = (k, d) => { const r = getMeta.get(k); return r ? parseInt(r.v, 10) : d; };
  const upsert = db.prepare("INSERT INTO tickets(id,rev,json) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET rev=excluded.rev, json=excluded.json");
  return {
    kind: "sqlite",
    seq() { const n = meta("seq", 0) + 1; setMeta.run("seq", String(n)); return n; },
    bumpSeqTo(n) { if (n > meta("seq", 0)) setMeta.run("seq", String(n)); },
    getSeq() { return meta("seq", 0); },
    getRev() { return meta("rev", 0); },
    put(id, json) { const rev = meta("rev", 0) + 1; setMeta.run("rev", String(rev)); upsert.run(id, rev, JSON.stringify(json)); return rev; },
    all() { return db.prepare("SELECT json FROM tickets").all().map(r => JSON.parse(r.json)); },
    since(rev) { return db.prepare("SELECT json FROM tickets WHERE rev>?").all(rev).map(r => JSON.parse(r.json)); }
  };
}
function initJson() {
  const file = process.env.IRM_DB || path.join(__dirname, "irm-data.json");
  let d = { seq: 0, rev: 0, tickets: {} };
  try { d = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { /* neue Datei */ }
  const flush = () => fs.writeFileSync(file, JSON.stringify(d));
  return {
    kind: "json-file",
    seq() { d.seq++; flush(); return d.seq; },
    bumpSeqTo(n) { if (n > d.seq) { d.seq = n; flush(); } },
    getSeq() { return d.seq; },
    getRev() { return d.rev; },
    put(id, json) { d.rev++; d.tickets[id] = { rev: d.rev, json }; flush(); return d.rev; },
    all() { return Object.values(d.tickets).map(t => t.json); },
    since(rev) { return Object.values(d.tickets).filter(t => t.rev > rev).map(t => t.json); }
  };
}
try { store = initSqlite(); } catch (e) { store = initJson(); }

/* ---------- HTTP ---------- */
const INDEX = path.join(__dirname, "..", "index.html");
function send(res, code, obj, type) {
  const body = type ? obj : JSON.stringify(obj);
  const headers = { "Content-Type": type || "application/json; charset=utf-8", "Cache-Control": "no-store" };
  if (CORS) { headers["Access-Control-Allow-Origin"] = CORS; headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"; headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, OPTIONS"; }
  res.writeHead(code, headers);
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let len = 0; const chunks = [];
    req.on("data", c => { len += c.length; if (len > MAX_BODY) { reject(new Error("too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}
function authorized(req) {
  if (!TOKEN) return true;
  const h = req.headers.authorization || "";
  return h === "Bearer " + TOKEN;
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  try {
    if (req.method === "OPTIONS") return send(res, 204, "", "text/plain");

    /* Anwendung ausliefern */
    if (req.method === "GET" && (u.pathname === "/" || u.pathname === "/index.html")) {
      return send(res, 200, fs.readFileSync(INDEX), "text/html; charset=utf-8");
    }

    if (!u.pathname.startsWith("/api/")) return send(res, 404, { error: "not found" });

    if (u.pathname === "/api/health") {
      return send(res, 200, { ok: true, version: VERSION, storage: store.kind, auth: !!TOKEN });
    }
    if (!authorized(req)) return send(res, 401, { error: "unauthorized" });

    if (req.method === "POST" && u.pathname === "/api/seq") {
      return send(res, 200, { seq: store.seq() });
    }
    /* Monitoring-/Event-Management-Eingang: erzeugt ein vollständiges Ticket im Status Open */
    if (req.method === "POST" && u.pathname === "/api/inbound") {
      const body = await readBody(req).catch(() => null);
      if (!body || !body.betreff) return send(res, 400, { error: "betreff required" });
      const ts = Date.now();
      const t = {
        id: "IRM-" + String(store.seq()).padStart(4, "0"),
        erstellt: ts, kenntnis: Number(body.kenntnis) || ts,
        betreff: String(body.betreff).slice(0, 140),
        beschreibung: String(body.beschreibung || "").slice(0, 4000),
        standort: String(body.standort || ""), beobachtet: null,
        personen: false, nearmiss: false,
        quelle: String(body.quelle || "Monitoring/API"), kanal: "API",
        status: "Open", leitdomaene: "", nebendomaenen: [], owner: "",
        domWechsel: "", gefahrBeendet: null, gef: "noch nicht bestimmt", gefWeitere: [],
        ursache1: "", ursache2: "", s1: "", s2: "", s3: "", s4: "", s5: "", s6: "",
        herab: "nein", herabStufe: "", herabBegr: "", einstufungBegr: "", eskOverride: "",
        infoklass: "", objekte: String(body.objekte || ""), tisax: false, prototyp: false,
        sofort: "", beweis: false, beweisText: "", kenntnisBegr: "",
        pf: {}, nachweis: "", fvSystem: "", fvNummer: "", fvAbgeschlossen: false,
        freigabe: false, freigabeIsb: false, freigabeQl: false,
        abschlussbericht: "", lessons: "", risikoRef: "", wirksamkeit: null, bcmNote: "",
        pb: {}, d8: null, parent: "", wait: { on: false, since: null, total: 0 },
        resolvedAt: null, csat: 0, anhaenge: [], beobachter: ["ISB"],
        tasks: [], approvals: [],
        log: [{ ts, who: "System (API)", txt: "Ticket über die Monitoring-/API-Schnittstelle angelegt (POST /api/inbound)." }],
        erstreaktion: null
      };
      const rev = store.put(t.id, t);
      return send(res, 201, { ok: true, id: t.id, rev });
    }
    if (req.method === "GET" && u.pathname === "/api/tickets") {
      return send(res, 200, { seq: store.getSeq(), rev: store.getRev(), tickets: store.all() });
    }
    if (req.method === "GET" && u.pathname === "/api/changes") {
      const since = parseInt(u.searchParams.get("since") || "0", 10) || 0;
      return send(res, 200, { seq: store.getSeq(), rev: store.getRev(), tickets: store.since(since) });
    }
    const mPut = u.pathname.match(/^\/api\/tickets\/([A-Za-z0-9\-]+)$/);
    if (req.method === "PUT" && mPut) {
      const body = await readBody(req);
      if (!body || body.id !== mPut[1]) return send(res, 400, { error: "id mismatch" });
      const mSeq = /^IRM-(\d+)$/.exec(body.id);
      if (mSeq) store.bumpSeqTo(parseInt(mSeq[1], 10));
      const rev = store.put(body.id, body);
      return send(res, 200, { ok: true, rev });
    }
    return send(res, 404, { error: "not found" });
  } catch (e) {
    return send(res, 500, { error: String(e.message || e) });
  }
});
server.listen(PORT, () => {
  console.log(`REUTIB IRM-Server V${VERSION} · http://localhost:${PORT} · Speicher: ${store.kind}` + (TOKEN ? " · Token-Auth aktiv" : " · ohne Auth (IRM_TOKEN setzen!)"));
});
