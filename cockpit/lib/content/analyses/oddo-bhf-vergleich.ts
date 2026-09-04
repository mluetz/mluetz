/**
 * Marktanalyse "ODDO BHF im Privatbanken-Vergleich" (Stand 04.09.2026) als
 * eigenständiges HTML-Dokument. Wird per srcDoc-iframe eingebettet
 * (components/analysis-frame.tsx), damit die mitgebrachten Stile das
 * App-CSS nicht berühren. Enthält bewusst kein Skript und keine externen
 * Ressourcen (CSP: default-src 'self'); die Google-Fonts-Verweise der
 * Originalfassung wurden entfernt, die Font-Stacks fallen auf
 * Georgia/System-Sans/Monospace zurück.
 */
export const ODDO_BHF_VERGLEICH_HTML = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ODDO BHF im Privatbanken-Vergleich</title>
<style>
  :root{
    --bg:#EFF1F0;
    --surface:#FFFFFF;
    --surface-2:#F6F7F6;
    --ink:#141E26;
    --ink-2:#374754;
    --muted:#63737F;
    --rule:#D8DCDA;
    --rule-strong:#B9C0BD;
    --accent:#8A6A24;
    --accent-2:#B08D3F;
    --accent-wash:#F2EBDA;
    --pos:#2C6B52;
    --warn:#9A5F14;
    --crit:#9B3226;
    --shadow:0 1px 2px rgba(20,30,38,.06), 0 8px 24px rgba(20,30,38,.05);
    --maxw:74rem;
    --col:44rem;
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --bg:#0F1720;
      --surface:#151F29;
      --surface-2:#1A2530;
      --ink:#E7EBEE;
      --ink-2:#C2CCD3;
      --muted:#8E9BA6;
      --rule:#25313C;
      --rule-strong:#3A4956;
      --accent:#D3AC63;
      --accent-2:#C29B4E;
      --accent-wash:#241E12;
      --pos:#66B08D;
      --warn:#D19A47;
      --crit:#D2776A;
      --shadow:0 1px 2px rgba(0,0,0,.4), 0 10px 28px rgba(0,0,0,.28);
    }
  }
  :root[data-theme="dark"]{
    --bg:#0F1720;
    --surface:#151F29;
    --surface-2:#1A2530;
    --ink:#E7EBEE;
    --ink-2:#C2CCD3;
    --muted:#8E9BA6;
    --rule:#25313C;
    --rule-strong:#3A4956;
    --accent:#D3AC63;
    --accent-2:#C29B4E;
    --accent-wash:#241E12;
    --pos:#66B08D;
    --warn:#D19A47;
    --crit:#D2776A;
    --shadow:0 1px 2px rgba(0,0,0,.4), 0 10px 28px rgba(0,0,0,.28);
  }

  *{box-sizing:border-box}
  body{
    background:var(--bg);
    color:var(--ink);
    font-family:"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size:16px;
    line-height:1.62;
    -webkit-font-smoothing:antialiased;
  }
  .wrap{max-width:var(--maxw);margin:0 auto;padding:0 clamp(1rem,4vw,3rem) 5rem}

  /* ---------- Kopf ---------- */
  .masthead{
    border-bottom:1px solid var(--rule-strong);
    padding:clamp(2.5rem,6vw,4.5rem) 0 1.75rem;
    display:flex;flex-direction:column;gap:1.5rem;
  }
  .kicker{
    font-family:"IBM Plex Mono",ui-monospace,monospace;
    font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;
    color:var(--accent);display:flex;flex-wrap:wrap;gap:.75rem 1.25rem;
  }
  .kicker span:not(:first-child){color:var(--muted)}
  h1{
    font-family:Spectral, Georgia, "Times New Roman", serif;
    font-weight:600;font-size:clamp(2.1rem,5.2vw,3.4rem);
    line-height:1.08;letter-spacing:-.015em;margin:0;text-wrap:balance;max-width:20ch;
  }
  .standfirst{
    font-family:Spectral, Georgia, serif;font-size:clamp(1.05rem,2.1vw,1.3rem);
    line-height:1.5;color:var(--ink-2);max-width:56ch;margin:0;
  }
  .meta-line{
    display:flex;flex-wrap:wrap;gap:.4rem 1.5rem;
    font-family:"IBM Plex Mono",monospace;font-size:.75rem;color:var(--muted);
    border-top:1px solid var(--rule);padding-top:1rem;
  }

  /* ---------- Struktur ---------- */
  section{padding-top:clamp(2.75rem,5vw,4rem)}
  .sec-head{display:flex;gap:1.25rem;align-items:baseline;margin-bottom:1.5rem}
  .sec-num{
    font-family:"IBM Plex Mono",monospace;font-size:.78rem;font-weight:500;
    color:var(--accent);padding-top:.35rem;letter-spacing:.06em;flex:none;
  }
  h2{
    font-family:Spectral, Georgia, serif;font-weight:600;
    font-size:clamp(1.4rem,3vw,1.95rem);line-height:1.2;margin:0;
    letter-spacing:-.01em;text-wrap:balance;
  }
  h3{
    font-family:"IBM Plex Sans",sans-serif;font-weight:600;font-size:1rem;
    margin:0 0 .5rem;letter-spacing:.005em;
  }
  .body{max-width:var(--col)}
  .body p{margin:0 0 1rem}
  .body p:last-child{margin-bottom:0}
  .indent{padding-left:calc(.78rem + 1.25rem)}
  @media(max-width:640px){.indent{padding-left:0}}

  strong{font-weight:600}
  em{font-style:normal;background:var(--accent-wash);padding:0 .18em;border-radius:2px}
  a{color:var(--accent);text-decoration:underline;text-underline-offset:2px;text-decoration-thickness:1px}
  a:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

  /* ---------- Kennzahlen-Leiste ---------- */
  .figs{
    display:grid;grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr));
    gap:1px;background:var(--rule);border:1px solid var(--rule);margin-top:1.75rem;
  }
  .fig{background:var(--surface);padding:1rem 1.1rem;display:flex;flex-direction:column;gap:.15rem}
  .fig b{
    font-family:"IBM Plex Mono",monospace;font-weight:500;font-size:1.32rem;
    letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.2;
  }
  .fig span{font-size:.75rem;color:var(--muted);line-height:1.35}

  /* ---------- Datenblock ---------- */
  .panel{
    background:var(--surface);border:1px solid var(--rule);
    padding:clamp(1.1rem,2.5vw,1.75rem);margin-top:1.75rem;box-shadow:var(--shadow);
  }
  .panel-head{
    display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;
    gap:.5rem 1rem;margin-bottom:1.25rem;
    border-bottom:1px solid var(--rule);padding-bottom:.75rem;
  }
  .panel-head h3{margin:0}
  .panel-head .unit{
    font-family:"IBM Plex Mono",monospace;font-size:.7rem;color:var(--muted);
    letter-spacing:.06em;text-transform:uppercase;
  }
  .note{font-size:.78rem;color:var(--muted);line-height:1.5;margin:1rem 0 0;max-width:70ch}

  /* ---------- Balken ---------- */
  .bars{display:flex;flex-direction:column;gap:.45rem}
  .bar-row{display:grid;grid-template-columns:minmax(7.5rem,11rem) 1fr auto;gap:.75rem;align-items:center}
  .bar-name{font-size:.83rem;line-height:1.25;color:var(--ink-2)}
  .bar-row.me .bar-name{color:var(--ink);font-weight:600}
  .bar-track{display:block;position:relative;height:1.1rem;min-width:0;background:var(--surface-2);border-left:1px solid var(--rule-strong)}
  .bar-fill{display:block;height:100%;min-width:2px;background:var(--rule-strong)}
  .bar-row.me .bar-fill{background:var(--accent)}
  .bar-val{
    font-family:"IBM Plex Mono",monospace;font-size:.8rem;font-variant-numeric:tabular-nums;
    color:var(--ink-2);min-width:4.2rem;text-align:right;
  }
  .bar-row.me .bar-val{color:var(--ink);font-weight:500}
  .axis{
    display:grid;grid-template-columns:minmax(7.5rem,11rem) 1fr auto;gap:.75rem;
    margin-top:.6rem;padding-top:.5rem;border-top:1px solid var(--rule);
  }
  .axis-ticks{display:flex;justify-content:space-between;font-family:"IBM Plex Mono",monospace;font-size:.68rem;color:var(--muted)}
  .axis-spacer{min-width:4.2rem}
  @media(max-width:560px){
    .bar-row,.axis{grid-template-columns:1fr;gap:.15rem}
    .bar-val{text-align:left;min-width:0}
    .axis-spacer{display:none}
  }

  /* ---------- Tabelle ---------- */
  .scroll{overflow-x:auto;margin-top:1.75rem;border:1px solid var(--rule);background:var(--surface)}
  table{border-collapse:collapse;width:100%;min-width:44rem;font-size:.84rem}
  caption{
    text-align:left;padding:1rem 1.1rem .75rem;font-weight:600;font-size:.95rem;
    border-bottom:1px solid var(--rule);
  }
  th,td{padding:.6rem .8rem;text-align:left;border-bottom:1px solid var(--rule);vertical-align:top}
  thead th{
    font-family:"IBM Plex Mono",monospace;font-weight:500;font-size:.68rem;
    letter-spacing:.07em;text-transform:uppercase;color:var(--muted);
    background:var(--surface-2);white-space:nowrap;
  }
  td.num{font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}
  th.num{text-align:right}
  tbody tr:last-child td{border-bottom:none}
  tr.me td{background:var(--accent-wash)}
  tr.me td:first-child{font-weight:600;box-shadow:inset 3px 0 0 var(--accent)}

  /* ---------- Matrix ---------- */
  .matrix-wrap{overflow-x:auto}
  svg.matrix{display:block;width:100%;min-width:34rem;height:auto}

  /* ---------- Karten / Länder ---------- */
  .grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);margin-top:1.75rem}
  .country{background:var(--surface);padding:1.25rem 1.3rem;display:flex;flex-direction:column;gap:.6rem}
  .country .flagline{
    font-family:"IBM Plex Mono",monospace;font-size:.7rem;letter-spacing:.1em;
    text-transform:uppercase;color:var(--accent);
  }
  .country h3{font-family:Spectral,Georgia,serif;font-size:1.15rem;font-weight:600;margin:0}
  .country p{margin:0;font-size:.88rem;color:var(--ink-2)}
  .dl{display:flex;flex-direction:column;gap:.35rem;margin-top:.2rem;padding-top:.7rem;border-top:1px solid var(--rule)}
  .dl div{display:flex;justify-content:space-between;gap:1rem;font-size:.79rem}
  .dl dt{color:var(--muted)}
  .dl dd{margin:0;font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums;text-align:right}

  /* ---------- Produktmatrix ---------- */
  .pillars{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);margin-top:1.75rem}
  .pillar{background:var(--surface);padding:1.2rem 1.25rem;display:flex;flex-direction:column;gap:.55rem}
  .pillar .tag{font-family:"IBM Plex Mono",monospace;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
  .pillar h3{margin:0;font-size:1rem}
  .pillar ul{margin:0;padding-left:1.05rem;font-size:.85rem;color:var(--ink-2);display:flex;flex-direction:column;gap:.3rem}
  .pillar .share{
    margin-top:auto;padding-top:.7rem;border-top:1px solid var(--rule);
    font-family:"IBM Plex Mono",monospace;font-size:.78rem;color:var(--accent);
  }

  /* ---------- Bewertung ---------- */
  .assess{display:grid;grid-template-columns:repeat(auto-fit,minmax(17rem,1fr));gap:1.25rem;margin-top:1.75rem}
  .assess > div{border-top:2px solid var(--rule-strong);padding-top:.9rem}
  .assess .st{border-top-color:var(--pos)}
  .assess .sw{border-top-color:var(--crit)}
  .assess .op{border-top-color:var(--accent-2)}
  .assess .th{border-top-color:var(--warn)}
  .assess h3{
    font-family:"IBM Plex Mono",monospace;font-size:.72rem;letter-spacing:.1em;
    text-transform:uppercase;font-weight:500;margin-bottom:.6rem;
  }
  .assess .st h3{color:var(--pos)}
  .assess .sw h3{color:var(--crit)}
  .assess .op h3{color:var(--accent-2)}
  .assess .th h3{color:var(--warn)}
  .assess ul{margin:0;padding-left:1.05rem;font-size:.87rem;color:var(--ink-2);display:flex;flex-direction:column;gap:.45rem}

  /* ---------- Thesen ---------- */
  .theses{list-style:none;margin:1.75rem 0 0;padding:0;display:flex;flex-direction:column;gap:1px;background:var(--rule);border:1px solid var(--rule)}
  .theses li{background:var(--surface);padding:1rem 1.2rem;display:grid;grid-template-columns:2.2rem 1fr;gap:.9rem;align-items:start}
  .theses .n{font-family:"IBM Plex Mono",monospace;font-size:.78rem;color:var(--accent);padding-top:.15rem}
  .theses p{margin:0;font-size:.92rem;color:var(--ink-2)}
  .theses p b{color:var(--ink)}

  /* ---------- Quellen ---------- */
  .sources{margin-top:1.5rem;font-size:.8rem;color:var(--muted);columns:2;column-gap:2.5rem}
  .sources li{margin-bottom:.5rem;break-inside:avoid}
  @media(max-width:640px){.sources{columns:1}}
  footer{margin-top:3.5rem;padding-top:1.25rem;border-top:1px solid var(--rule-strong);font-size:.76rem;color:var(--muted);max-width:70ch}
  @media (prefers-reduced-motion:no-preference){
    .bar-fill{animation:grow .6s cubic-bezier(.2,.7,.3,1) both}
    @keyframes grow{from{transform:scaleX(.85);transform-origin:left}to{transform:scaleX(1)}}
  }
</style>
</head>
<body>
<div class="wrap">

  <header class="masthead">
    <div class="kicker">
      <span>Marktanalyse</span><span>Private Banking Europa</span><span>Stand 04.09.2026</span>
    </div>
    <h1>ODDO BHF im Privatbanken-Vergleich</h1>
    <p class="standfirst">Wo die französisch-deutsch-schweizerische Gruppe zwischen Frankfurt, Paris und Zürich tatsächlich steht — nach Größe, Ertragsqualität, Produktbreite und Konsolidierungsposition im europäischen Wettbewerbsfeld.</p>
    <div class="meta-line">
      <span>Betrachtungsjahr 2025 (Ist), Ereignisse bis 08/2026</span>
      <span>Vergleichsgruppe: 13 europäische Privat- und Vermögensverwaltungsbanken</span>
      <span>Quellen: Geschäftszahlen der Häuser, Fachpresse</span>
    </div>
  </header>

  <section>
    <div class="sec-head"><span class="sec-num">01</span><h2>Management Summary</h2></div>
    <div class="indent">
      <div class="body">
        <p>ODDO BHF ist <strong>keine klassische Privatbank</strong>, sondern eine hybride Finanzgruppe: Vermögensverwaltung für Privatkunden, institutionelles Asset Management, Aktienresearch/Brokerage und Corporate Banking mit Asset Servicing stehen gleichrangig nebeneinander. Der Vergleich mit Pictet, Julius Bär oder Lombard Odier greift deshalb systematisch zu kurz — die relevante Peergroup sind Rothschild&nbsp;&&nbsp;Co, Metzler, Berenberg und Vontobel.</p>
      </div>
      <ol class="theses">
        <li><span class="n">T1</span><p><b>Mittelgroß in Europa, groß im deutsch-französischen Korridor.</b> Mit rund 156&nbsp;Mrd.&nbsp;€ Kundenvermögen (2025; 159&nbsp;Mrd.&nbsp;€ zum Zeitpunkt der IFSAM-Meldung 08/2026) liegt die Gruppe im europäischen Mittelfeld — deutlich über allen unabhängigen deutschen Häusern, aber bei rund einem Fünftel der Größe von Pictet.</p></li>
        <li><span class="n">T2</span><p><b>Die Ertragsmarge ist geschäftsmodellbedingt niedrig, nicht schwach.</b> 905&nbsp;Mio.&nbsp;€ Nettobankertrag auf 156&nbsp;Mrd.&nbsp;€ entsprechen rund 58&nbsp;Basispunkten. Der Wert liegt unter Julius Bär (≈74&nbsp;bp), weil ein erheblicher Teil der Volumina margenarmes Fondsservicing und KVG-Administration ist — genau das Segment, das mit IFSAM 2026 weiter ausgebaut wurde.</p></li>
        <li><span class="n">T3</span><p><b>Die Produktbreite ist der eigentliche Differenzierer.</b> Kaum ein europäischer Wettbewerber deckt Family Office, institutionelles Asset Management, europäisches Aktienresearch mit ECM-Zugang, Handelsfinanzierung und Verwahrstellen-/Fondsdienstleistungen unter einem Dach ab.</p></li>
        <li><span class="n">T4</span><p><b>Die Schweiz bleibt die strategische Schwachstelle.</b> Rund 8&nbsp;Mrd.&nbsp;CHF verwaltete Vermögen per Ende 2025 platzieren ODDO BHF in der Schweiz im untersten Größencluster eines Marktes, den UBS mit rund zwei Dritteln aller Vermögen dominiert. Das Ziel von 10&nbsp;Mrd.&nbsp;CHF ändert daran wenig — Skaleneffekte entstehen dort erst deutlich später.</p></li>
        <li><span class="n">T5</span><p><b>Der Konsolidierungsdruck kommt von oben und von der Seite.</b> ABN AMRO bündelt Bethmann und Hauck Aufhäuser Lampe zu rund 70&nbsp;Mrd.&nbsp;€ mit einem 100-Mrd.-€-Ziel bis 2030; gleichzeitig wächst die Profitabilitätslücke zwischen großen und kleinen Häusern. ODDO BHF antwortet mit Zukäufen im Servicing und einer Reorganisation entlang von Kundensegmenten ab Juni 2026.</p></li>
      </ol>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="sec-num">02</span><h2>Profil: eine Gruppe, drei Rechtsräume</h2></div>
    <div class="indent">
      <div class="body">
        <p>Die Gruppe führt zwei gleichrangige Hauptsitze — ODDO BHF SCA in Paris und ODDO BHF SE in Frankfurt am Main — und seit der Verschmelzung mit dem Waadtländer Haus Landolt&nbsp;&&nbsp;Cie einen eigenständigen Schweizer Bankstandort (ODDO&nbsp;BHF (Schweiz)&nbsp;AG, Genf und Zürich). Hinzu kommen Luxemburg als Fondsstandort, Standorte in Spanien, Italien, den Niederlanden, Österreich, Großbritannien, den USA, den VAE sowie ein Servicezentrum in Tunis. Die IT- und Betriebstochter ODDO&nbsp;BHF Solutions GmbH sitzt in Saarbrücken.</p>
        <p>Die Eigentümerstruktur ist das strukturelle Alleinstellungsmerkmal: <em>65&nbsp;% Familie Oddo, 25&nbsp;% Mitarbeitende</em>, der Rest im Wesentlichen bei Natixis, der Familie Bettencourt sowie den früheren Landolt-/Lombard-Partnern. Neun von zehn Anteilen liegen damit bei Familie und Belegschaft — eine Konstellation, die in Europa außerhalb der Schweizer Privatbankiers selten geworden ist.</p>
      </div>
      <div class="figs">
        <div class="fig"><b>156 Mrd. €</b><span>Kundenvermögen 2025 (159 Mrd. € lt. Mitteilung 08/2026)</span></div>
        <div class="fig"><b>905 Mio. €</b><span>Nettobankertrag 2025 (2024: 846 Mio. €)</span></div>
        <div class="fig"><b>&gt; 1,2 Mrd. €</b><span>Eigenkapital</span></div>
        <div class="fig"><b>~ 3.100</b><span>Mitarbeitende</span></div>
        <div class="fig"><b>BBB+</b><span>Fitch, Ausblick stabil</span></div>
        <div class="fig"><b>1849</b><span>Gründungsjahr (BHF-Wurzeln 1854)</span></div>
      </div>
      <p class="note">Nettobankertrag 2025 und Kundenvermögen gemäß Unternehmensangaben in der Pressemitteilung zur IFSAM-Übernahme vom 06.08.2026 sowie den Website-Boilerplates 2025/2026. Segmentbezogene Ertrags- oder Ergebniszahlen veröffentlicht die Gruppe nicht.</p>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="sec-num">03</span><h2>Größenvergleich: das europäische Feld</h2></div>
    <div class="indent">
      <div class="body">
        <p>Der Größenvergleich europäischer Privatbanken ist notorisch unsauber, weil die Häuser unterschiedlich abgrenzen — verwaltete Vermögen (AuM), betreute Kundenvermögen inklusive Depotverwahrung, teils inklusive Fondsadministration. Die folgende Übersicht weist die Basis deshalb je Institut aus. Schweizer Werte sind zu 1&nbsp;CHF&nbsp;=&nbsp;1,06&nbsp;€ umgerechnet.</p>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3>Kundenvermögen bzw. verwaltete Vermögen im Vergleich</h3>
          <span class="unit">Mrd. € · Geschäftsjahr 2025, sofern nicht anders vermerkt</span>
        </div>
        <div class="bars">
          <div class="bar-row"><span class="bar-name">Pictet <small>(CH)</small></span><span class="bar-track"><span class="bar-fill" style="width:100%"></span></span><span class="bar-val">802</span></div>
          <div class="bar-row"><span class="bar-name">Julius Bär <small>(CH)</small></span><span class="bar-track"><span class="bar-fill" style="width:68.8%"></span></span><span class="bar-val">552</span></div>
          <div class="bar-row"><span class="bar-name">Lombard Odier <small>(CH)</small></span><span class="bar-track"><span class="bar-fill" style="width:46.1%"></span></span><span class="bar-val">370</span></div>
          <div class="bar-row"><span class="bar-name">Vontobel <small>(CH)</small></span><span class="bar-track"><span class="bar-fill" style="width:31.8%"></span></span><span class="bar-val">255</span></div>
          <div class="bar-row"><span class="bar-name">J. Safra Sarasin <small>(CH)</small></span><span class="bar-track"><span class="bar-fill" style="width:30.2%"></span></span><span class="bar-val">242</span></div>
          <div class="bar-row"><span class="bar-name">Edmond de Rothschild <small>(CH/FR)</small></span><span class="bar-track"><span class="bar-fill" style="width:26.2%"></span></span><span class="bar-val">210</span></div>
          <div class="bar-row"><span class="bar-name">Van Lanschot Kempen <small>(NL/BE)</small></span><span class="bar-track"><span class="bar-fill" style="width:22.4%"></span></span><span class="bar-val">180</span></div>
          <div class="bar-row me"><span class="bar-name">ODDO BHF <small>(FR/DE/CH)</small></span><span class="bar-track"><span class="bar-fill" style="width:19.5%"></span></span><span class="bar-val">156</span></div>
          <div class="bar-row"><span class="bar-name">Quintet <small>(LU)</small></span><span class="bar-track"><span class="bar-fill" style="width:13.1%"></span></span><span class="bar-val">105</span></div>
          <div class="bar-row"><span class="bar-name">Metzler <small>(DE, AM 2024)</small></span><span class="bar-track"><span class="bar-fill" style="width:9.6%"></span></span><span class="bar-val">77</span></div>
          <div class="bar-row"><span class="bar-name">Bethmann HAL <small>(DE, 2026)</small></span><span class="bar-track"><span class="bar-fill" style="width:8.7%"></span></span><span class="bar-val">70</span></div>
          <div class="bar-row"><span class="bar-name">M.M. Warburg <small>(DE, 2022)</small></span><span class="bar-track"><span class="bar-fill" style="width:8.2%"></span></span><span class="bar-val">66</span></div>
          <div class="bar-row"><span class="bar-name">Berenberg <small>(DE)</small></span><span class="bar-track"><span class="bar-fill" style="width:4.9%"></span></span><span class="bar-val">39</span></div>
        </div>
        <div class="axis">
          <span></span>
          <span class="axis-ticks"><span>0</span><span>200</span><span>400</span><span>600</span><span>800</span></span>
          <span class="axis-spacer"></span>
        </div>
        <p class="note">Basis je Haus: Pictet = AuM und Depotverwahrung; Julius Bär, Vontobel, J. Safra Sarasin, Edmond de Rothschild, Berenberg, M.M. Warburg = AuM; Lombard Odier, Van Lanschot Kempen, ODDO BHF, Quintet, Bethmann HAL = betreute Kundenvermögen; Metzler = AuM Asset Management (ohne Pension Management, 18 Mrd. €). Zum Maßstab: UBS verwaltet rund 5.584 Mrd. CHF und damit etwa zwei Drittel aller in der Schweizer Privatbankenstatistik erfassten Vermögen — die Skala ist bewusst ohne UBS gezeichnet.</p>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3>Ertragsmarge auf betreute Vermögen</h3>
          <span class="unit">Basispunkte · Erträge ÷ Kundenvermögen · GJ 2025</span>
        </div>
        <div class="bars">
          <div class="bar-row"><span class="bar-name">Berenberg</span><span class="bar-track"><span class="bar-fill" style="width:99.2%"></span></span><span class="bar-val">119 bp</span></div>
          <div class="bar-row"><span class="bar-name">Julius Bär</span><span class="bar-track"><span class="bar-fill" style="width:61.7%"></span></span><span class="bar-val">74 bp</span></div>
          <div class="bar-row"><span class="bar-name">J. Safra Sarasin</span><span class="bar-track"><span class="bar-fill" style="width:61.7%"></span></span><span class="bar-val">74 bp</span></div>
          <div class="bar-row"><span class="bar-name">Lombard Odier</span><span class="bar-track"><span class="bar-fill" style="width:52.5%"></span></span><span class="bar-val">63 bp</span></div>
          <div class="bar-row"><span class="bar-name">Vontobel</span><span class="bar-track"><span class="bar-fill" style="width:49.2%"></span></span><span class="bar-val">59 bp</span></div>
          <div class="bar-row me"><span class="bar-name">ODDO BHF</span><span class="bar-track"><span class="bar-fill" style="width:48.3%"></span></span><span class="bar-val">58 bp</span></div>
          <div class="bar-row"><span class="bar-name">Quintet</span><span class="bar-track"><span class="bar-fill" style="width:44.2%"></span></span><span class="bar-val">53 bp</span></div>
          <div class="bar-row"><span class="bar-name">Pictet</span><span class="bar-track"><span class="bar-fill" style="width:35.0%"></span></span><span class="bar-val">42 bp</span></div>
        </div>
        <div class="axis">
          <span></span>
          <span class="axis-ticks"><span>0</span><span>30</span><span>60</span><span>90</span><span>120</span></span>
          <span class="axis-spacer"></span>
        </div>
        <p class="note">Eigene Berechnung aus veröffentlichten Erträgen und Vermögensbeständen; nicht bilanzanalytisch geprüft. Die Werte sind nur eingeschränkt vergleichbar: Häuser mit hohem Depotverwahr- oder Administrationsanteil (Pictet, ODDO BHF, Quintet) weisen strukturell niedrigere Margen aus, kapitalmarktlastige Häuser (Berenberg) strukturell höhere. Berenberg: Provisions- zzgl. Zinsüberschuss (468 Mio. €); Lombard Odier bezogen auf AuM (223 Mrd. CHF), nicht auf Kundenvermögen.</p>
      </div>

      <div class="scroll">
        <table>
          <caption>Kennzahlenvergleich Geschäftsjahr 2025</caption>
          <thead>
            <tr>
              <th>Institut</th><th>Sitz</th><th class="num">Vermögen</th><th class="num">Erträge</th><th class="num">Ergebnis</th><th class="num">CIR</th><th class="num">Kernkapital</th><th class="num">Mitarbeitende</th>
            </tr>
          </thead>
          <tbody>
            <tr class="me"><td>ODDO BHF</td><td>Paris / Frankfurt</td><td class="num">156 Mrd. €</td><td class="num">905 Mio. €</td><td class="num">n. v.</td><td class="num">n. v.</td><td class="num">n. v.</td><td class="num">3.100</td></tr>
            <tr><td>Pictet</td><td>Genf</td><td class="num">757 Mrd. CHF</td><td class="num">3.210 Mio. CHF</td><td class="num">667 Mio. CHF</td><td class="num">n. v.</td><td class="num">21,6 %<sup>*</sup></td><td class="num">5.500</td></tr>
            <tr><td>Julius Bär</td><td>Zürich</td><td class="num">521 Mrd. CHF</td><td class="num">3.861 Mio. CHF</td><td class="num">764 Mio. CHF</td><td class="num">71,3 %</td><td class="num">17,4 %</td><td class="num">7.390</td></tr>
            <tr><td>Lombard Odier</td><td>Genf</td><td class="num">349 Mrd. CHF</td><td class="num">1.394 Mio. CHF</td><td class="num">200 Mio. CHF</td><td class="num">n. v.</td><td class="num">33,0 %</td><td class="num">n. v.</td></tr>
            <tr><td>Vontobel</td><td>Zürich</td><td class="num">241 Mrd. CHF</td><td class="num">1.431 Mio. CHF</td><td class="num">280 Mio. CHF</td><td class="num">74,2 %</td><td class="num">19,7 %</td><td class="num">n. v.</td></tr>
            <tr><td>J. Safra Sarasin</td><td>Basel</td><td class="num">228 Mrd. CHF</td><td class="num">&gt; 1.700 Mio. CHF</td><td class="num">522 Mio. CHF</td><td class="num">n. v.</td><td class="num">34,5 %</td><td class="num">2.652</td></tr>
            <tr><td>Edmond de Rothschild</td><td>Genf</td><td class="num">198 Mrd. CHF</td><td class="num">n. v.</td><td class="num">211 Mio. CHF<sup>†</sup></td><td class="num">n. v.</td><td class="num">19,1 %<sup>*</sup></td><td class="num">2.700</td></tr>
            <tr><td>Van Lanschot Kempen</td><td>’s-Hertogenbosch</td><td class="num">180 Mrd. €</td><td class="num">n. v.</td><td class="num">157 Mio. €</td><td class="num">n. v.</td><td class="num">18,2 %</td><td class="num">n. v.</td></tr>
            <tr><td>Quintet</td><td>Luxemburg</td><td class="num">105 Mrd. €</td><td class="num">553 Mio. €</td><td class="num">66 Mio. €</td><td class="num">84,4 %</td><td class="num">22,5 %</td><td class="num">n. v.</td></tr>
            <tr><td>Berenberg</td><td>Hamburg</td><td class="num">39 Mrd. €</td><td class="num">468 Mio. €</td><td class="num">20 Mio. €</td><td class="num">90,4 %</td><td class="num">12,1 %</td><td class="num">1.588</td></tr>
          </tbody>
        </table>
      </div>
      <p class="note"><sup>*</sup> Gesamtkapitalquote bzw. Solvabilitätsquote statt CET1. <sup>†</sup> Betriebsergebnis. CIR = Aufwand-Ertrags-Relation. „n.&nbsp;v.“ = nicht veröffentlicht. Berenberg 2025: Ergebnisrückgang um 75&nbsp;% und CIR-Anstieg auf 90,4&nbsp;% im Zuge einer BaFin-Sonderprüfung zu Bilanzierung und Bewertung von Eigenhandelspositionen — der Wert ist kein Strukturmaß, sondern ein Sondereffekt.</p>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="sec-num">04</span><h2>Positionierung: Skala gegen Geschäftsmodellbreite</h2></div>
    <div class="indent">
      <div class="body">
        <p>Zwei Dimensionen erklären das Feld besser als jede Rangliste: die verwaltete Größe (horizontal, logarithmisch) und der Anteil der Erträge, der <strong>nicht</strong> aus klassischer Vermögensverwaltung stammt (vertikal). ODDO BHF liegt im oberen linken Quadranten — mittlere Skala bei hoher Ertragsdiversifikation. Das ist die Position von Metzler und Berenberg, nur eine Größenordnung darüber; die Schweizer Häuser besetzen die rechte untere Hälfte.</p>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h3>Positionierungsmatrix europäischer Privatbanken</h3>
          <span class="unit">x: Vermögen (Mrd. €, log) · y: Diversifikationsgrad (eigene Einschätzung)</span>
        </div>
        <div class="matrix-wrap">
          <svg class="matrix" viewBox="0 0 640 440" role="img" aria-label="Positionierungsmatrix: verwaltete Vermögen gegen Ertragsdiversifikation. ODDO BHF liegt bei 156 Milliarden Euro mit hohem Diversifikationsgrad.">
            <!-- Raster -->
            <g stroke="var(--rule)" stroke-width="1">
              <line x1="149" y1="40" x2="149" y2="380"/>
              <line x1="258" y1="40" x2="258" y2="380"/>
              <line x1="366" y1="40" x2="366" y2="380"/>
              <line x1="474" y1="40" x2="474" y2="380"/>
              <line x1="582" y1="40" x2="582" y2="380"/>
              <line x1="70" y1="125" x2="600" y2="125"/>
              <line x1="70" y1="210" x2="600" y2="210"/>
              <line x1="70" y1="295" x2="600" y2="295"/>
            </g>
            <!-- Achsen -->
            <g stroke="var(--rule-strong)" stroke-width="1.5">
              <line x1="70" y1="380" x2="600" y2="380"/>
              <line x1="70" y1="40" x2="70" y2="380"/>
            </g>
            <!-- x-Ticks -->
            <g font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--muted)" text-anchor="middle">
              <text x="149" y="398">50</text>
              <text x="258" y="398">100</text>
              <text x="366" y="398">200</text>
              <text x="474" y="398">400</text>
              <text x="582" y="398">800</text>
              <text x="335" y="418" fill="var(--ink-2)">Verwaltete bzw. betreute Vermögen in Mrd. € (logarithmisch)</text>
            </g>
            <!-- y-Beschriftung -->
            <g font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--muted)">
              <text x="62" y="64" text-anchor="end">hoch</text>
              <text x="62" y="214" text-anchor="end">mittel</text>
              <text x="62" y="376" text-anchor="end">gering</text>
              <text transform="rotate(-90 20 210)" x="20" y="210" text-anchor="middle" fill="var(--ink-2)">Ertragsdiversifikation</text>
            </g>
            <!-- Punkte -->
            <g font-family="IBM Plex Sans, sans-serif" font-size="11" fill="var(--ink-2)">
              <circle cx="111" cy="108" r="4.5" fill="var(--rule-strong)"/><text x="120" y="112">Berenberg</text>
              <circle cx="217" cy="142" r="4.5" fill="var(--rule-strong)"/><text x="226" y="146">Metzler</text>
              <circle cx="202" cy="329" r="4.5" fill="var(--rule-strong)"/><text x="211" y="333">Bethmann HAL</text>
              <circle cx="265" cy="352" r="4.5" fill="var(--rule-strong)"/><text x="274" y="356">Quintet</text>
              <circle cx="349" cy="227" r="4.5" fill="var(--rule-strong)"/><text x="358" y="231">Van Lanschot</text>
              <circle cx="373" cy="252" r="4.5" fill="var(--rule-strong)"/><text x="382" y="269">Edmond de Rothschild</text>
              <circle cx="404" cy="193" r="4.5" fill="var(--rule-strong)"/><text x="413" y="189">Vontobel</text>
              <circle cx="395" cy="295" r="4.5" fill="var(--rule-strong)"/><text x="404" y="299">J. Safra Sarasin</text>
              <circle cx="462" cy="261" r="4.5" fill="var(--rule-strong)"/><text x="471" y="265">Lombard Odier</text>
              <circle cx="524" cy="329" r="4.5" fill="var(--rule-strong)"/><text x="516" y="333" text-anchor="end">Julius Bär</text>
              <circle cx="582" cy="227" r="4.5" fill="var(--rule-strong)"/><text x="574" y="231" text-anchor="end">Pictet</text>
              <circle cx="327" cy="125" r="7" fill="var(--accent)"/>
              <text x="339" y="122" font-weight="600" font-size="12.5" fill="var(--ink)">ODDO BHF</text>
              <text x="339" y="137" font-size="10" fill="var(--muted)" font-family="IBM Plex Mono, monospace">156 Mrd. € · 4 Geschäftsfelder</text>
            </g>
          </svg>
        </div>
        <p class="note">Vermögenswerte wie in Abschnitt 03; der Diversifikationsgrad ist eine qualitative Einordnung anhand der veröffentlichten Geschäftsfeldstruktur (Anteil von Asset Management, Investment Banking, Corporate Banking und Asset Servicing am Geschäftsmodell), keine gemessene Ertragsaufteilung.</p>
      </div>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="sec-num">05</span><h2>Produkte und Angebote im Wettbewerbsvergleich</h2></div>
    <div class="indent">
      <div class="body">
        <p>Die Gruppe führt vier Geschäftsfelder. Entscheidend für die Wettbewerbsbewertung ist weniger die Qualität des einzelnen Feldes als deren Kombination: Der Unternehmerkunde erhält Vermögensverwaltung, Nachfolgeberatung, Kapitalmarktzugang für sein Unternehmen und Handelsfinanzierung aus derselben Gruppe.</p>
      </div>
      <div class="pillars">
        <div class="pillar">
          <span class="tag">Geschäftsfeld I</span>
          <h3>Private Wealth Management</h3>
          <ul>
            <li>16 Standorte in Deutschland, flächendeckend Frankreich, Genf/Zürich</li>
            <li>Vermögensverwaltung, Anlageberatung, Wealth Planning</li>
            <li>Family Office sowie Stiftungen und Institutionen</li>
            <li>Private Equity und Immobilien als Beimischung</li>
            <li>Lombard- und Sonderfinanzierungen, Betreuung unabhängiger Vermögensverwalter</li>
          </ul>
          <span class="share">Wettbewerb: Bethmann HAL, Berenberg, Deutsche Bank PB, Indosuez, Neuflize OBC</span>
        </div>
        <div class="pillar">
          <span class="tag">Geschäftsfeld II</span>
          <h3>Asset Management &amp; Private Assets</h3>
          <ul>
            <li>64,7 Mrd. € verwaltetes Vermögen (31.12.2025), 341 Mitarbeitende</li>
            <li>Investmentzentren Paris, Düsseldorf, Frankfurt, Luxemburg</li>
            <li>Schwerpunkte: Zinsen &amp; Kredit 32 %, KVG/Administration 22 %, Multi-Asset 19 %</li>
            <li>Fundamentale Aktien 11 %, quantitative Aktien 9 %, Private Assets 7 %</li>
            <li>81 % der Publikumsfondsvolumina mit ESG-Integration</li>
          </ul>
          <span class="share">Wettbewerb: Union Investment, DWS, Amundi, Metzler AM, Candriam</span>
        </div>
        <div class="pillar">
          <span class="tag">Geschäftsfeld III</span>
          <h3>Investment Banking &amp; Research</h3>
          <ul>
            <li>Coverage von 800 europäischen Titeln in 23 Sektoren, über 700 institutionelle Kunden</li>
            <li>Nr. 1 Broker Frankreich und Benelux, Nr. 2 Deutschland, Nr. 6 Spanien (Institutional Investor 2024)</li>
            <li>Platz 4 nach Anzahl europäischer ECM-Transaktionen 2024 (21 Transaktionen)</li>
            <li>ECM-Allianzen mit ABN AMRO, BBVA, Commerzbank, Natixis, RBI</li>
            <li>Über 200 Liquiditäts- und Designated-Sponsor-Mandate</li>
          </ul>
          <span class="share">Wettbewerb: Kepler Cheuvreux, Berenberg, Jefferies, Rothschild &amp; Co, Lazard</span>
        </div>
        <div class="pillar">
          <span class="tag">Geschäftsfeld IV</span>
          <h3>Corporate Banking, Asset Servicing &amp; Metals</h3>
          <ul>
            <li>Zahlungsverkehr, Cash Management, Investitions- und Förderkredite</li>
            <li>Handelsfinanzierung über 100 Länder, rund 30 % Marktanteil bei bestätigten deutschen Export-Akkreditiven</li>
            <li>Korrespondenzbankgeschäft und ECA-gedeckte Finanzierungen</li>
            <li>Fondsplattform: mit IFSAM (Übernahme von FNZ, 08/2026) über 90 Mrd. € Assets under Administration</li>
            <li>Edelmetallhandel als Nischenkompetenz</li>
          </ul>
          <span class="share">Wettbewerb: Hauck Aufhäuser (Asset Servicing), Commerzbank, Société Générale SS</span>
        </div>
      </div>
      <div class="body" style="margin-top:1.5rem">
        <p><strong>Bewertung der Angebotsstruktur.</strong> Reine Wealth-Manager wie Quintet, Bethmann HAL oder Edmond de Rothschild bieten kein Aktienresearch und keine Handelsfinanzierung. Pictet und Lombard Odier verbinden Vermögensverwaltung mit Asset Management und Verwahrdienstleistungen, jedoch ohne Unternehmensfinanzierung. Berenberg und Metzler bilden das ODDO-BHF-Modell in Deutschland am ehesten ab — bei einem Viertel bis der Hälfte des Volumens und ohne französischen Heimatmarkt. Das nächstliegende europäische Vergleichsmodell bleibt Rothschild&nbsp;&&nbsp;Co, das allerdings über eine deutlich stärkere M&A-Beratungsfranchise und kein Brokerage-Geschäft verfügt.</p>
      </div>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="sec-num">06</span><h2>Länderpositionierung: Frankreich, Deutschland, Schweiz</h2></div>
    <div class="indent">
      <div class="grid3">
        <div class="country">
          <span class="flagline">Frankreich · ODDO BHF SCA</span>
          <h3>Heimatmarkt und Kapitalmarktbasis</h3>
          <p>Paris trägt die Gruppengeschichte seit 1849 und die stärkste Kapitalmarktposition: Nr.&nbsp;1 im französischen Brokerage, führende Stellung im Small- und Mid-Cap-Research. Im Private Banking steht ODDO BHF gegen bankgestützte Schwergewichte — Indosuez (Crédit Agricole), Société Générale Private Banking, BNP Paribas Banque Privée — sowie gegen die unabhängigen Häuser Rothschild&nbsp;&&nbsp;Co, Lazard Frères Gestion und Banque Transatlantique.</p>
          <dl class="dl">
            <div><dt>Brokerage-Rang</dt><dd>Nr. 1</dd></div>
            <div><dt>Rechtsform</dt><dd>SCA</dd></div>
            <div><dt>Aufsicht</dt><dd>ACPR</dd></div>
          </dl>
        </div>
        <div class="country">
          <span class="flagline">Deutschland · ODDO BHF SE</span>
          <h3>Mittelstand, Frankfurt, BHF-Erbe</h3>
          <p>Die Frankfurter Einheit trägt das Erbe der BHF-Bank und ist der industrielle Kern der Gruppe: 16 PWM-Standorte, Nr.&nbsp;2 im deutschen Brokerage, rund 30&nbsp;% Marktanteil bei bestätigten Export-Akkreditiven. Der Wettbewerb ordnet sich gerade neu: ABN AMRO formt aus Bethmann und Hauck Aufhäuser Lampe die drittgrößte deutsche Vermögensverwaltung (rund 70&nbsp;Mrd.&nbsp;€, Ziel 100&nbsp;Mrd.&nbsp;€ bis 2030), während Berenberg eine aufsichtsrechtliche Sonderprüfung verarbeitet.</p>
          <dl class="dl">
            <div><dt>Bilanzsumme (2024)</dt><dd>10,0 Mrd. €</dd></div>
            <div><dt>Jahresüberschuss (2024)</dt><dd>70,1 Mio. €</dd></div>
            <div><dt>Aufsicht</dt><dd>BaFin / EZB</dd></div>
          </dl>
        </div>
        <div class="country">
          <span class="flagline">Schweiz · ODDO BHF (Schweiz) AG</span>
          <h3>Aufbau in einem gesättigten Markt</h3>
          <p>Aus der Verschmelzung mit Landolt&nbsp;&&nbsp;Cie, der ältesten Bank der Westschweiz, entstand ein eigenständiger Schweizer Bankstandort mit Büros in Genf und Zürich. Seit Oktober 2025 führt Hannes Gallus als CEO, Philippe Oddo amtiert als Verwaltungsratspräsident. Zuflüsse kommen überwiegend aus Deutschland und Frankreich, zunehmend aus dem Nahen Osten. Mit rund 8&nbsp;Mrd.&nbsp;CHF bleibt das Haus jedoch im untersten Größencluster eines Marktes, in dem UBS etwa zwei Drittel aller Vermögen hält.</p>
          <dl class="dl">
            <div><dt>AuM Ende 2025</dt><dd>8,0 Mrd. CHF</dd></div>
            <div><dt>Nettoneugeld 2025</dt><dd>0,5 Mrd. CHF</dd></div>
            <div><dt>Zielgröße</dt><dd>10 Mrd. CHF</dd></div>
          </dl>
        </div>
      </div>
      <p class="note">Der Dreiländeraufbau ist regulatorisch anspruchsvoll: EZB/BaFin-Aufsicht für die deutsche SE, ACPR für die französische SCA, FINMA für die Schweizer Tochter — bei gruppenweit einheitlichen Anforderungen aus DORA, NIS-2-Umsetzung und MiFID II.</p>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="sec-num">07</span><h2>Europäischer Kontext: Konsolidierung und Margendruck</h2></div>
    <div class="indent">
      <div class="body">
        <p>Der europäische Privatbankenmarkt spreizt sich. Große Häuser erwirtschaften weiterhin Eigenkapitalrenditen über 10&nbsp;%, während kleine und mittelgroße Institute 2025 sinkende Profitabilität hinnehmen mussten — überwiegend nicht wegen ausufernder Kosten, sondern wegen rückläufiger Zinserträge nach dem Ende des Zinshochs. Die verwalteten Vermögen wuchsen über alle Größenklassen hinweg um 5,5&nbsp;% bis 8,0&nbsp;%, getragen von Marktentwicklung und stabilen Nettozuflüssen.</p>
        <p>Konsolidiert wird selektiv statt flächendeckend: Die größte Schweizer Transaktion des Jahres 2025 war die Übernahme von Cité Gestion durch EFG International mit 7,5&nbsp;Mrd.&nbsp;CHF verwalteten Vermögen. In Deutschland und den Benelux-Ländern verlaufen die Bewegungen größer — ABN AMRO mit Bethmann/Hauck Aufhäuser Lampe, Van Lanschot Kempen mit einem Gemeinschaftsunternehmen im Aktienbrokerage mit KBC Securities.</p>
        <p>Für ODDO BHF folgt daraus eine klare Lesart: Die Gruppe befindet sich <em>oberhalb</em> der kritischen Größenschwelle, ab der Skaleneffekte tragen, aber <em>unterhalb</em> der Schwelle, ab der Skala selbst zum Wettbewerbsvorteil wird. Ihre Antwort ist nicht Größenwachstum in der Vermögensverwaltung, sondern die Verbreiterung margenstabiler Servicing-Erträge — die IFSAM-Übernahme im August 2026 hebt die administrierten Fondsvolumina auf über 90&nbsp;Mrd.&nbsp;€.</p>
      </div>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="sec-num">08</span><h2>Strategie und Ausblick</h2></div>
    <div class="indent">
      <div class="body">
        <p>Zum 1.&nbsp;Juni 2026 wurde die neu geschaffene Position der stellvertretenden Vorstandsvorsitzenden mit Simone Westerfeld besetzt, die in die Leitungsgremien beider Hauptgesellschaften einzieht. Der erklärte Umbau: Die Gruppe organisiert sich künftig <strong>nach Kundensegmenten statt nach Fachexpertisen</strong> — Privatkunden, Familienunternehmen und Stiftungen, Family Offices, Unternehmensentscheider, institutionelle Investoren, unabhängige Vermögensverwalter. Ergänzend wird weiter zugekauft; Akquisitionen sind seit Meriten (2015), Frankfurt-Trust, ACG Capital und Landolt&nbsp;&&nbsp;Cie fester Bestandteil des Wachstumsmodells.</p>
      </div>
      <div class="assess">
        <div class="st">
          <h3>Stärken</h3>
          <ul>
            <li>Eigentümerstruktur mit 90&nbsp;% bei Familie und Mitarbeitenden — Unabhängigkeit ohne Quartalsdruck</li>
            <li>Einzige Gruppe mit gleichrangiger Verankerung in beiden größten Volkswirtschaften der Eurozone</li>
            <li>Führende Research- und Brokerage-Position in Kontinentaleuropa mit fünf ECM-Allianzen</li>
            <li>Vier tragende Ertragssäulen dämpfen Zins- und Kapitalmarktzyklen</li>
          </ul>
        </div>
        <div class="sw">
          <h3>Schwächen</h3>
          <ul>
            <li>Bonität BBB+ deutlich unter Schweizer Vergleichshäusern (Lombard Odier AA−)</li>
            <li>Ertragsmarge von rund 58&nbsp;bp im unteren Mittelfeld der Vergleichsgruppe</li>
            <li>Sehr geringe Transparenz: weder Segmentergebnisse noch Gruppen-CIR oder CET1 werden veröffentlicht</li>
            <li>Schweizer Einheit unterhalb jeder Skalenschwelle</li>
          </ul>
        </div>
        <div class="op">
          <h3>Chancen</h3>
          <ul>
            <li>Asset Servicing als margenstabile, zinsunabhängige Ertragssäule (&gt; 90 Mrd. € nach IFSAM)</li>
            <li>Generationenübergang im deutschen und französischen Mittelstand</li>
            <li>Marktanteilsgewinne im deutschen Wettbewerb während der Bethmann-HAL-Integration und der Berenberg-Neuaufstellung</li>
            <li>Zuflüsse aus dem Nahen Osten über die Schweizer Plattform</li>
          </ul>
        </div>
        <div class="th">
          <h3>Risiken</h3>
          <ul>
            <li>Bethmann HAL mit Zielgröße 100 Mrd. € bis 2030 als neuer deutscher Wettbewerber in Skalengröße</li>
            <li>Anhaltender Margendruck auf Fonds- und Administrationsvolumina</li>
            <li>Zinsrückgang trifft Erträge kleinerer und mittlerer Häuser überproportional</li>
            <li>Integrationsrisiko aus Segmentreorganisation und IFSAM parallel</li>
            <li>Steigende Regulierungs- und Technologiekosten in drei Aufsichtsregimen</li>
          </ul>
        </div>
      </div>
      <div class="body" style="margin-top:1.75rem">
        <h3>Fazit</h3>
        <p>ODDO BHF ist im europäischen Vergleich ein <strong>mittelgroßer, ungewöhnlich breit aufgestellter Spezialist</strong> mit einem strukturellen Vorteil, den kein Wettbewerber kopieren kann: die gleichrangige Verankerung im deutschen und französischen Mittelstand bei unabhängiger Eigentümerstruktur. Die Gruppe gewinnt keinen Größenwettbewerb gegen Zürich und Genf und versucht es erkennbar auch nicht. Sie gewinnt dort, wo ein Unternehmerkunde grenzüberschreitend Vermögensverwaltung, Kapitalmarktzugang und Handelsfinanzierung aus einer Hand benötigt. Die offene Flanke bleibt die Schweiz — dort ist ODDO BHF derzeit ein Nischenanbieter mit einem Schild aus Genf, nicht ein Schweizer Wettbewerber.</p>
      </div>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="sec-num">09</span><h2>Quellen und Methodik</h2></div>
    <div class="indent">
      <div class="body">
        <p>Alle Zahlen stammen aus veröffentlichten Unternehmensangaben und Fachpresse; sie wurden nicht bilanzanalytisch verprobt. Vergleichbarkeit ist durch abweichende Vermögensabgrenzungen, Währungen und Stichtage eingeschränkt — die jeweilige Basis ist an den Tabellen und Grafiken vermerkt. Umrechnung CHF/€ zu 1,06.</p>
      </div>
      <ol class="sources">
        <li><a href="https://www.oddo-bhf.com/2026/08/06/oddo-bhf-acquires-international-fund-services-asset-management-ifsam/">ODDO BHF: Übernahme IFSAM, 06.08.2026</a> — Gruppenkennzahlen 2025</li>
        <li><a href="https://www.oddo-bhf.com/about-us/">ODDO BHF: Über uns</a> — Eigentümerstruktur, Geschäftsfelder, Standorte</li>
        <li><a href="https://am.oddo-bhf.com/fr-fr/distributeur-cgp/a-propos-notre-identite/">ODDO BHF Asset Management: Kennzahlen</a> — 64,7 Mrd. € AuM per 31.12.2025</li>
        <li><a href="https://www.oddo-bhf.com/equity-research-brokerage/">ODDO BHF: Equity Research &amp; Brokerage</a> — Coverage, Rankings, ECM</li>
        <li><a href="https://www.oddo-bhf.com/international-and-corporate-banking/">ODDO BHF: International &amp; Corporate Banking</a> — Akkreditiv-Marktanteil</li>
        <li><a href="https://www.oddo-bhf.com/2026/01/21/oddo-bhf-creates-the-position-of-deputy-ceo-to-be-filled-by-simone-westerfeld/">ODDO BHF: Deputy CEO Simone Westerfeld, 21.01.2026</a> — Segmentreorganisation</li>
        <li><a href="https://www.bluewin.ch/fr/infos/economie/oddo-bhf-suisse-vise-les-10-milliards-d-avoirs-sous-gestion-3190297.html">blue News: ODDO BHF Suisse, Ziel 10 Mrd. CHF</a></li>
        <li><a href="https://www.oddo-bhf.com/2025/10/10/oddo-bhf-strengthens-its-ambitions-in-switzerland-philippe-oddo-becomes-chairman-hannes-gallus-is-appointed-chief-executive-officer/">ODDO BHF: Führungswechsel Schweiz, 10.10.2025</a></li>
        <li><a href="https://www.finews.com/news/english-news/43630-oddo-bhf-landolt-switzerland-private-wealth-management-joachim-haeger-germany-france">finews: ODDO BHF/Landolt, Schweizer Strategie</a></li>
        <li><a href="https://thebanks.eu/banks/11122">thebanks.eu: ODDO BHF SE</a> — Bilanzsumme und Ergebnis 2024, Fitch-Rating</li>
        <li><a href="https://www.eqs-news.com/news/ad-hoc/presentation-of-the-2025-full-year-results-for-the-julius-baer-group/802d4961-fef8-4dc1-b0de-f0b99b109618_en">Julius Bär: Jahresergebnis 2025</a></li>
        <li><a href="https://www.privatebankerinternational.com/news/pictet-aum-growth/">Private Banker International: Pictet 2025</a></li>
        <li><a href="https://www.lombardodier.com/insights/2026/february/lombard-odier-reports-full-year.html">Lombard Odier: Jahresergebnis 2025</a></li>
        <li><a href="https://www.vontobel.com/en-ch/about-vontobel/media/communications/vontobel-achieves-successful-2025/">Vontobel: Jahresergebnis 2025</a></li>
        <li><a href="https://www.privatebankerinternational.com/news/j-safra-sarasin-profit-growth-2025/">Private Banker International: J. Safra Sarasin 2025</a></li>
        <li><a href="https://www.edmond-de-rothschild.com/en/news/show/1565-16673-strong-momentum-with-chf-10-billion-net-inflows-in-2025-taking-assets-under-management-to-a-record-high-close-to-chf-200-billion">Edmond de Rothschild: Jahresergebnis 2025</a></li>
        <li><a href="https://newsroom.vanlanschotkempen.com/en/van-lanschot-kempen-publishes-2025-annual-results">Van Lanschot Kempen: Jahresergebnis 2025</a></li>
        <li><a href="https://www.quintet.com/en-gb/media/quintet-reports-solid-2025-results-with-growing-client-assets-and-strong-capital-position">Quintet: Jahresergebnis 2025</a></li>
        <li><a href="https://www.private-banking-magazin.de/berenberg-jahresabschluss-2025-gewinneinbruch-bafin/">private banking magazin: Berenberg-Jahresabschluss 2025</a></li>
        <li><a href="https://www.fuchsbriefe.de/bethmann-hal-entsteht-wie-abn-amro-den-deutschen-private-banking-markt-neu-ordnet-twm2025">Fuchsbriefe: Bethmann HAL und die Neuordnung des deutschen Marktes</a></li>
        <li><a href="https://www.metzler.com/en/metzler/news/bank/bankhaus/2506-jahrespressegespraech">Bankhaus Metzler: Jahrespressegespräch (GJ 2024)</a></li>
        <li><a href="https://www.pwc.ch/en/insights/strategy/private-banking-market-update-2026.html">PwC Schweiz: Private Banking Market Update 2026</a></li>
        <li><a href="https://blog.zhaw.ch/wealth-management/2026/05/03/largest-swiss-private-banks-by-aum-2025/">ZHAW: Die größten Schweizer Privatbanken nach AuM 2025</a></li>
      </ol>
      <footer>
        Erstellt am 04.09.2026. Diese Analyse dient der Marktorientierung und stellt keine Anlage-, Rechts- oder Finanzberatung dar. Zahlenangaben beruhen auf öffentlich zugänglichen Quellen zum genannten Stand und können sich seither verändert haben; für die Richtigkeit der Primärangaben wird keine Gewähr übernommen.
      </footer>
    </div>
  </section>

</div>
</body>
</html>
`;
