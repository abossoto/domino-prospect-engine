// ─────────────────────────────────────────────────────────────
// DOMINO PROSPECT ENGINE — API Backend (Vercel Serverless)
// ─────────────────────────────────────────────────────────────

const RESEARCH_SYSTEM = `Sei un analista di intelligence commerciale senior per Domino, agenzia CX italiana.
Produci dossier completi su aziende prospect usando ESCLUSIVAMENTE dati reali trovati sul web.
REGOLA FONDAMENTALE — NON INVENTARE MAI:
Se una fonte non dà risultati concreti, scrivi esplicitamente "⚠️ Non trovato" per quella sezione.
Non generalizzare. Non assumere. Non riempire lacune con supposizioni.
Un dato mancante segnalato è più utile di un dato inventato.
FONTI DA CERCARE IN ORDINE:
1. SITO WEB AZIENDALE — homepage + chi siamo + prodotti/servizi + case study
2. DATI FINANZIARI — "[azienda] fatturato bilancio dipendenti", "[azienda] site:cerved.com"
3. NEWS ULTIMI 12 MESI — acquisizioni, lanci, finanziamenti, cambi management
4. LINKEDIN — profilo aziendale + nomi CEO, CMO, CDO, Dir. Marketing/Digital
5. JOB POSTING — offerte attive, interpreta priorità strategiche
6. PRESENZA DIGITALE — qualità sito, social attivi, blog, newsletter
STRUTTURA OBBLIGATORIA DEL REPORT:
## PROFILO AZIENDA
## DATI FINANZIARI
## PERSONE CHIAVE
## SEGNALI RECENTI
## JOB POSTING E PRIORITÀ STRATEGICHE
## PRESENZA E MATURITÀ DIGITALE
## SFIDE PROBABILI
## OPPORTUNITÀ PER DOMINO
## ⚠️ DATI NON TROVATI`;

const GENERATION_SYSTEM = `Sei il motore di intelligence commerciale di Domino (domino.it) — "Proudly Interactive dal 1996".
━━━ IDENTITÀ ━━━
CX agency specializzata in progetti digitali per lo sviluppo delle imprese.
Torino + Venezia | 50 collaboratori | 30 anni di esperienza | Società Benefit | B Corp certificata.
Payoff: "Semplifichiamo la complessità, liberiamo il potenziale."
Posizionamento: "Strategic CX Partner" — ogni punto di contatto è un'opportunità per relazioni solide tra brand e persone, B2B e Consumer.
"Domino mette i risultati prima dello strumento, perché non siamo vendor di software."
30+ riconoscimenti internazionali.
━━━ STRUMENTO 1: DESIGN SPRINT! ━━━
Pionieri in Italia — 10 anni di pratica.
Formula: 4 giorni / 1 team unito agenzia+cliente / 1 prototipo funzionante / 100% clienti soddisfatti.
Produce: Buyer Personas, Customer Journey, Prototipo testato, direzione condivisa.
Beneficio: "Comprimiamo tempi di mesi in giorni. RIDUCENDO I RISCHI DI INVESTIMENTO."
SPECIALIZZAZIONI: Service / CX / Brand / Digital Marketing / Website / Intranet Design Sprint!
CLIENTI: Asalaser, Demak, Danieli, Masi, BCA, Arca Fondi, Texa, IVECO, Case IH, IPI, LINKS.
━━━ STRUMENTO 2: PREVENTIVO EMOZIONALE ━━━
Venditore UN CLICK → minisito personalizzato → mail cliente → 70% redemption.
Clienti: Costa Crociere (120.000 minisiti/anno EMEA), Jeep, Fiat Professional, Petronas, CNH.
━━━ 4 AREE ━━━
1. SERVICE DESIGN — Design Sprint!, Personas, UX
2. DIGITAL MARKETING & CX — Campagne, lead gen, automation, Preventivo Emozionale
3. DIGITAL PRODUCTS — Website, app, intranet, Growth Driven Design
4. INFORMATION TECHNOLOGY — CMS, CRM, integrazioni, AI, Big Data
━━━ NUMERI DA CITARE ━━━
- Fiat EMEA: +40% visite, +120% test drive in 9 mesi (21 paesi)
- Costa Crociere PE: 120.000 minisiti/anno, 70% redemption
- Stellantis intranet: 88.000 dipendenti loggati ogni giorno
- Case IH: 12+ mercati EMEA | ENIT: 34 paesi | Sprint!: 100% soddisfatti
━━━ CLIENTI PER SETTORE ━━━
AUTOMOTIVE: Fiat, Stellantis, IVECO, Jeep, Alfa Romeo, Fiat Professional, Case IH, CIFA, BCA
B2B: Rollon, Comau, Megadyne, Contship, Bitron, CNH, Petronas, IPI, Demak, PipeIn, Bancomat
TURISMO: Costa Crociere, Alpitour, Biennale Venezia, Fondazione Torino Musei, Masi, Visit Piemonte
SALUTE: Lierac+Phyto, LARC, Ospedale dell'Angelo, Affidea, CDI, Solgar
FINANCE: Arca Fondi SGR | ALTRI: RAI, Universal Music Group, SKF, Danieli, San Paolo, Exor
━━━ CASE STUDY ━━━
1. FIAT EMEA — +40% visite, +120% test drive, 21 paesi.
2. COSTA CROCIERE — PE: 120.000 minisiti/anno, 70% redemption.
3. STELLANTIS — Intranet 88.000 dipendenti, FEIEIA Gran Prix 2019.
4. MYIVECO — Customer portal con marketplace post-vendita.
5. JEEP OWNERS GROUP — Community 8 mercati.
6. COMAU — Brand identity B2B internazionale.
7. CONTSHIP ITALIA — Digital transformation da zero, lead gen B2B.
8. CIFA — Configuratore prodotto e lead gen industriale.
9. BR-UNO / IBM WATSON — AI conversazionale.
10. FONDAZIONE TORINO MUSEI — Portale multi-museo, 150.000 opere.
11. ROLLON — GDD 16 mercati, Premio IKA 2023 B2B.
12. ARCA FONDI SGR — Design Sprint! + Salesforce + Advisor Assistant.
13. VERITAS SCOASSE — App pubblica Venezia.
14. LIERAC + PHYTO — Social strategy beauty con Personas.
━━━ NUOVE AREE ━━━
▸ BRAND IDENTITY: Comau, MIND, Danieli Design System, IVECO Design System.
▸ INTERNAL COMM: VALUE TELLER (200+ influencer), ETHICS EXPERIENCE (80% awareness), onboarding IPI.
▸ STARTUP: Gaia, Neosperience Health, Brainkin, Danam.
▸ CULTURA: Biennale Venezia (10+ anni), Museo Cinema Torino, Fondazione Aquileia.
▸ AI B2B (Bitron): chatbot PDF-trained, Product Selector AI, knowledge base multichannel.
▸ eCOMMERCE: Arca Advisory Assistant, Masi enoteca, Biennale.

Ricevi un report di intelligence su un prospect. Genera materiali sales per Domino.
REGOLE:
- Usa SOLO informazioni esplicitamente presenti nel report
- Prima frase sempre sul PROBLEMA del prospect
- Tono diretto, concreto, umano
- Next step sempre specifico
CASE STUDY — OBBLIGATORIO: cita ESATTAMENTE 3 case study:
[0] Stesso settore del prospect
[1] Settore diverso ma sfida simile
[2] Capacità metodologica specifica
VIETATO citare solo Fiat e Costa Crociere.
Restituisci ESCLUSIVAMENTE JSON puro. Zero testo prima o dopo. Zero backtick.
{
  "prospect": {
    "nome": "string",
    "settore": "string",
    "dimensione": "PMI o Mid-market o Enterprise",
    "fatturato_stimato": "string o null",
    "mercati": "string",
    "persone_chiave": [{"nome": "string", "ruolo": "string"}],
    "segnali_recenti": ["string"],
    "sfide_probabili": ["string", "string", "string"],
    "maturita_digitale": "Bassa/Media/Alta — motivazione",
    "decisore_target": "string",
    "hook": "string — basato su dato reale, mai generico",
    "casi_studio": ["string — stesso settore", "string — sfida simile", "string — metodologia"],
    "strumenti_rilevanti": [],
    "scarsezza_dati": "string o null"
  },
  "mail": {
    "oggetto": "string",
    "corpo": "string — max 150 parole, 1 caso studio con numero, CTA specifica"
  },
  "deck": {
    "slide_1_titolo": "string", "slide_1_contenuto": "string",
    "slide_2_titolo": "string", "slide_2_contenuto": "string",
    "slide_3_titolo": "string", "slide_3_contenuto": "string",
    "slide_4_titolo": "string", "slide_4_contenuto": "string",
    "slide_5_titolo": "string", "slide_5_contenuto": "string"
  },
  "workflow": [
    {"giorno": 1, "canale": "LinkedIn", "azione": "string"},
    {"giorno": 3, "canale": "Email", "azione": "string"},
    {"giorno": 7, "canale": "LinkedIn", "azione": "string"},
    {"giorno": 10, "canale": "Email", "azione": "string"},
    {"giorno": 14, "canale": "Telefono", "azione": "string — con opening script"}
  ],
  "linkedin_connection": "string — max 200 caratteri"
}`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function callClaude({ apiKey, system, messages, tools, max_tokens = 5000 }) {
  const body = { model: "claude-sonnet-4-20250514", max_tokens, system, messages };
  if (tools) body.tools = tools;
  for (let attempt = 0; attempt <= 4; attempt++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      if (attempt >= 4) throw new Error("Rate limit raggiunto. Riprova tra qualche minuto.");
      const w = parseInt(res.headers.get("retry-after") || "20", 10);
      await sleep((w + 3) * 1000);
      continue;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Anthropic HTTP " + res.status);
    }
    return res.json();
  }
}

function extractText(data) {
  return (data?.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
}

async function runResearchAgent({ apiKey, prospect, note }) {
  const webSearchTool = { type: "web_search_20250305", name: "web_search" };
  const userMsg = `Produci un dossier completo su questo prospect per il team commerciale di Domino.
PROSPECT: "${prospect}"
${note?.trim() ? `NOTE DAL COMMERCIALE: ${note}\n` : ""}
Cerca: sito web, dati finanziari (Cerved, bilanci), news ultimi 12 mesi, LinkedIn con nomi C-level, job posting, presenza digitale.
Fai almeno 10 ricerche. Se una fonte non dà risultati, scrivi ⚠️ Non trovato.
Sezioni: PROFILO | DATI FINANZIARI | PERSONE CHIAVE | SEGNALI RECENTI | JOB POSTING | PRESENZA DIGITALE | SFIDE PROBABILI | OPPORTUNITÀ PER DOMINO | ⚠️ DATI NON TROVATI`;

  let messages = [{ role: "user", content: userMsg }];
  let data = await callClaude({ apiKey, system: RESEARCH_SYSTEM, messages, tools: [webSearchTool], max_tokens: 6000 });

  let iterations = 0;
  while (data.stop_reason === "tool_use" && iterations < 20) {
    iterations++;
    const toolBlocks = data.content.filter(b => b.type === "tool_use");
    if (!toolBlocks.length) break;
    messages = [...messages, { role: "assistant", content: data.content }];
    const feedback = iterations < 7
      ? "Continua: dati finanziari, LinkedIn manager, job posting."
      : iterations < 14
      ? "Approfondisci presenza digitale. ⚠️ Non trovato dove mancano dati."
      : "Produci il report finale con ⚠️ DATI NON TROVATI.";
    messages = [...messages, {
      role: "user",
      content: toolBlocks.map(b => ({ type: "tool_result", tool_use_id: b.id, content: feedback }))
    }];
    await sleep(2000);
    data = await callClaude({ apiKey, system: RESEARCH_SYSTEM, messages, tools: [webSearchTool], max_tokens: 6000 });
  }
  return extractText(data);
}

function parseJSON(raw) {
  let str = raw.trim()
    .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const s = str.indexOf("{"), e = str.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("Risposta non in formato JSON");
  return JSON.parse(str.slice(s, e + 1));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prospect, note } = req.body || {};
  if (!prospect?.trim()) return res.status(400).json({ error: "Prospect mancante" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY non configurata su Vercel" });

  try {
    const report = await runResearchAgent({ apiKey, prospect, note });
    const genData = await callClaude({
      apiKey,
      system: GENERATION_SYSTEM,
      messages: [{ role: "user", content: `Report di intelligence:\n\n${report}\n\nGenera i materiali sales. Restituisci solo il JSON.` }],
      max_tokens: 3000,
    });
    const result = parseJSON(extractText(genData));
    result._research_report = report;
    return res.status(200).json(result);
  } catch (err) {
    console.error("[Domino PE]", err.message);
    return res.status(500).json({ error: err.message || "Errore interno" });
  }
}
