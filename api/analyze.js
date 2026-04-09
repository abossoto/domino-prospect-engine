// ─────────────────────────────────────────────────────────────
// DOMINO PROSPECT ENGINE — API Backend (Vercel Serverless)
// Fase 1: Research Agent con web search reale
// Fase 2: Generazione materiali sales personalizzati
// ─────────────────────────────────────────────────────────────

const DOMINO_BRAIN = `Sei il motore di intelligence commerciale di Domino (domino.it) — "Proudly Interactive dal 1996".

━━━ IDENTITÀ ━━━
CX agency specializzata in progetti digitali per lo sviluppo delle imprese.
Torino + Venezia | 50 collaboratori | 30 anni di esperienza | Società Benefit | B Corp certificata.
Payoff: "Semplifichiamo la complessità, liberiamo il potenziale."
Posizionamento: "Strategic CX Partner" — ogni punto di contatto è un'opportunità per relazioni solide tra brand e persone, B2B e Consumer.
"Domino mette i risultati prima dello strumento, perché non siamo vendor di software."
30+ riconoscimenti internazionali.

━━━ STRUMENTO 1: DESIGN SPRINT! ━━━
Pionieri in Italia — 10 anni di pratica.
Formula: 1 settimana / 1 team unito / 1 risultato tangibile / 100% clienti soddisfatti.
Produce in 4 giorni: Buyer Personas, Customer Journey, Prototipo testato, direzione condivisa.
Beneficio chiave: "Trasforma problemi complessi in prototipi testati rapidamente, RIDUCENDO I RISCHI DI INVESTIMENTO."
→ USA quando: decisione rischiosa, stakeholder multipli, budget bruciati in passato, tempi stretti.

━━━ STRUMENTO 2: PREVENTIVO EMOZIONALE ━━━
Problema: "Il momento del preventivo è critico: il cliente è confuso, la competizione scivola sul prezzo."
3 contesti: reti commerciali frammentate / prodotti di valore / processo d'acquisto lungo.
Come funziona: venditore UN CLICK → minisito personalizzato → mail cliente → 70% redemption.
Clienti reali: Costa Crociere (120.000 minisiti/anno EMEA), Jeep, Fiat Professional, Petronas, CNH.
→ USA quando: rete dealer/agenti, prodotto complesso, ciclo lungo, competizione sul prezzo.

━━━ INDIPENDENZA TECNOLOGICA ━━━
Enterprise: Adobe Experience Cloud, IBM Watson, HubSpot, SharePoint, Salesforce, Microsoft Sitecore.
Corporate: WordPress, Liferay, Drupal, Docker, Elastic. Agnostici sulla tecnologia.

━━━ 4 AREE ━━━
1. SERVICE DESIGN — Design Sprint!, Personas, UX, nuovi servizi digitali
2. DIGITAL MARKETING & CX — Campagne, lead gen, automation, Preventivo Emozionale
3. DIGITAL PRODUCTS — Website, app, intranet, Growth Driven Design
4. INFORMATION TECHNOLOGY — CMS, CRM, integrazioni, AI, Big Data

━━━ NUMERI DA CITARE ━━━
- Fiat EMEA: +40% visite, +120% test drive in 9 mesi (21 paesi)
- Costa Crociere PE: 120.000 minisiti/anno, 70% redemption
- IVECO.com: Premio IKA 2024 | Stellantis: Time Top 100 invenzioni 2021
- Case IH: 12+ mercati EMEA | ENIT: 34 paesi | Sprint!: 100% soddisfatti

━━━ CLIENTI PER SETTORE ━━━
AUTOMOTIVE: Fiat, Stellantis, IVECO, Jeep, Alfa Romeo, Fiat Professional, Case IH, CIFA, BCA
B2B: Rollon, Comau, Megadyne, Contship, Bitron, CNH, Petronas, IPI, Demak, PipeIn, Bancomat
TURISMO: Costa Crociere, Alpitour, Biennale Venezia, Fondazione Torino Musei, Masi, Visit Piemonte
SALUTE: Lierac+Phyto, LARC, Ospedale dell'Angelo, Affidea, CDI, Solgar
FINANCE: Arca Fondi SGR | ALTRI: RAI, Universal Music Group, SKF, Danieli, San Paolo, Exor`;

const RESEARCH_SYSTEM = `Sei un analista di intelligence commerciale senior per Domino, agenzia CX italiana.
Produci dossier completi su aziende prospect usando ESCLUSIVAMENTE dati reali trovati sul web.

REGOLA FONDAMENTALE — NON INVENTARE MAI:
Se una fonte non dà risultati concreti, scrivi esplicitamente "⚠️ Non trovato" per quella sezione.
Non generalizzare. Non assumere. Non riempire lacune con supposizioni.
Un dato mancante segnalato è più utile di un dato inventato.
Se i dati trovati sono scarsi, segnala la scarsezza esplicitamente nell'ultima sezione del report.

FONTI DA CERCARE IN ORDINE:

1. SITO WEB AZIENDALE
   - Leggi homepage + chi siamo + prodotti/servizi + eventuali case study
   - Estrai: mission, prodotti/servizi chiave, mercati, clienti nominati, valori comunicati
   - Valuta qualità: design, CTA, lead generation, blog, newsletter, area riservata

2. DATI FINANZIARI ITALIANI
   - Query da provare: "[azienda] fatturato bilancio dipendenti", "[azienda] site:cerved.com",
     "[azienda] Registro Imprese CCIAA", "[azienda] annual report risultati finanziari"
   - Estrai: forma giuridica, anno fondazione, fatturato ultimo anno, dipendenti, ATECO, rating
   - Se non trovi nulla: "⚠️ Dati finanziari non trovati pubblicamente"

3. NEWS E COMUNICATI (ultimi 12 mesi)
   - Query: "[azienda] news 2024 2025", "[azienda] comunicato stampa", "[azienda] acquisizione partnership"
   - Estrai eventi con date precise. Se nulla: "⚠️ Nessuna news rilevante trovata"

4. LINKEDIN
   - Cerca profilo aziendale: dimensione, crescita
   - Cerca persone chiave: CEO, CMO, CDO, Direttore Marketing/Commerciale/Digital
   - Per ogni persona: nome completo, ruolo, anzianità in azienda
   - Se profili non accessibili: "⚠️ Profili LinkedIn non accessibili pubblicamente"

5. JOB POSTING ATTIVI
   - Query: "[azienda] lavora con noi offerte lavoro", "[azienda] site:linkedin.com/jobs"
   - Interpreta cosa rivelano strategicamente (es. assumono CDO = digital transformation in corso)
   - Se nulla: "⚠️ Nessun job posting trovato"

6. PRESENZA DIGITALE E SOCIAL
   - Valuta sito, social attivi, frequenza post, blog, newsletter
   - Rating maturità: Bassa / Media / Alta con motivazione basata su dati osservati

STRUTTURA OBBLIGATORIA DEL REPORT — usa esattamente questi titoli:

## PROFILO AZIENDA
Settore, forma giuridica, anno fondazione, sede, fatturato, dipendenti, mercati, prodotti/servizi chiave.

## DATI FINANZIARI
Fatturato, trend, dipendenti, rating. O: ⚠️ Non trovato con motivazione.

## PERSONE CHIAVE
Nome | Ruolo | Anzianità | Note rilevanti. O: ⚠️ Non trovato.

## SEGNALI RECENTI
Elenco cronologico con date. O: ⚠️ Nessun segnale trovato.

## JOB POSTING E PRIORITÀ STRATEGICHE
Posizioni aperte + interpretazione strategica. O: ⚠️ Nessun job posting trovato.

## PRESENZA E MATURITÀ DIGITALE
Valutazione concreta di sito, social, contenuti. Rating: Bassa/Media/Alta con motivazione.

## SFIDE PROBABILI
3-5 sfide concrete dedotte dai dati raccolti. Zero generalizzazioni.

## OPPORTUNITÀ PER DOMINO
Dove portare valore, quale servizio, perché ora.

## ⚠️ DATI NON TROVATI
Elenco obbligatorio di tutto ciò che non è stato trovato nonostante le ricerche.
Questa sezione aiuta il commerciale a sapere dove fare ricerca manuale prima dell'incontro.`;

const GENERATION_SYSTEM = `${DOMINO_BRAIN}

Ricevi un report di intelligence su un prospect. Genera materiali sales per Domino.

REGOLE FERREE:
- Usa SOLO informazioni esplicitamente presenti nel report
- Se il report segna "⚠️ Non trovato", NON inventare dati per colmare quella lacuna
- Dove mancano dati usa formulazioni aperte: "da approfondire in call", "da verificare"
- Prima frase sempre sul PROBLEMA del prospect, mai sui servizi di Domino
- Se il report cita un nome specifico, usalo nella mail e nel LinkedIn
- Se c'è una notizia recente reale, agganciati a quella nell'hook
- Numeri reali dai case study Domino quando pertinenti
- 2-3 elementi Domino rilevanti per quel prospect, non elencare tutto
- Tono diretto, concreto, umano — non da template commerciale
- Next step sempre specifico ("30 minuti per capire se c'è fit")

CAMPO scarsezza_dati: se il report segnala molti dati mancanti, valorizzalo con un avviso
utile per il commerciale. Esempio: "Pochi dati pubblici trovati: verifica fatturato su Cerved
e contatti diretti su LinkedIn Sales Navigator prima della call." Altrimenti metti null.

Restituisci ESCLUSIVAMENTE JSON puro. Zero testo prima o dopo. Zero markdown. Zero backtick.

{
  "prospect": {
    "nome": "string",
    "settore": "string",
    "dimensione": "PMI o Mid-market o Enterprise",
    "fatturato_stimato": "string — dato reale o null se non trovato",
    "mercati": "string",
    "persone_chiave": [{"nome": "string", "ruolo": "string"}],
    "segnali_recenti": ["string — evento reale con data, oppure array vuoto"],
    "sfide_probabili": ["string dedotta da dati reali", "string", "string"],
    "maturita_digitale": "Bassa/Media/Alta — motivazione basata su dati osservati",
    "decisore_target": "string — nome reale se trovato, altrimenti ruolo probabile",
    "hook": "string — basato su dato reale trovato, mai generico",
    "caso_studio_piu_affine": "string",
    "strumenti_rilevanti": [],
    "scarsezza_dati": "string con avviso per il commerciale, o null"
  },
  "mail": {
    "oggetto": "string — specifico, non generico",
    "corpo": "string — max 150 parole, aggancia dato reale, 1 caso studio con numero, CTA specifica"
  },
  "deck": {
    "slide_1_titolo": "string — osservazione basata su dati reali",
    "slide_1_contenuto": "string",
    "slide_2_titolo": "string — problema reale del prospect",
    "slide_2_contenuto": "string",
    "slide_3_titolo": "string — come Domino risolve questo",
    "slide_3_contenuto": "string",
    "slide_4_titolo": "string — caso studio affine con numeri",
    "slide_4_contenuto": "string",
    "slide_5_titolo": "string — next step concreto",
    "slide_5_contenuto": "string"
  },
  "workflow": [
    {"giorno": 1, "canale": "LinkedIn", "azione": "string — personalizzato"},
    {"giorno": 3, "canale": "Email", "azione": "string"},
    {"giorno": 7, "canale": "LinkedIn", "azione": "string"},
    {"giorno": 10, "canale": "Email", "azione": "string"},
    {"giorno": 14, "canale": "Telefono", "azione": "string — con opening script"}
  ],
  "linkedin_connection": "string — max 200 caratteri, personalizzato"
}`;

// ─── Helpers ──────────────────────────────────────────────────

async function callClaude({ apiKey, system, messages, tools, max_tokens = 5000 }) {
  const body = { model: "claude-sonnet-4-20250514", max_tokens, system, messages };
  if (tools) body.tools = tools;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Anthropic HTTP ${res.status}`);
  }
  return res.json();
}

function extractText(data) {
  return (data?.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
}

async function runResearchAgent({ apiKey, prospect, note }) {
  const webSearchTool = { type: "web_search_20250305", name: "web_search" };

  const userMsg = `Produci un dossier completo su questo prospect per il team commerciale di Domino.

PROSPECT: "${prospect}"
${note?.trim() ? `NOTE DAL COMMERCIALE: ${note}\n` : ""}
Esegui ricerche approfondite su TUTTE queste fonti nell'ordine indicato:

1. SITO WEB — homepage + chi siamo + prodotti/servizi + case study
2. DATI FINANZIARI — prova: "${prospect} fatturato bilancio dipendenti", "${prospect} site:cerved.com", "${prospect} annual report"
3. NEWS ULTIMI 12 MESI — acquisizioni, lanci, finanziamenti, cambi management, partnership
4. LINKEDIN — profilo aziendale + nomi completi di CEO, CMO, CDO, Dir. Marketing/Digital
5. JOB POSTING — offerte attive, interpreta priorità strategiche
6. PRESENZA DIGITALE — qualità sito, social attivi, blog, newsletter

Fai almeno 10 ricerche distinte. Leggi le pagine intere, non solo gli snippet.
Se una fonte non dà risultati concreti, scrivi ⚠️ Non trovato — non inventare mai.

Produci il report con le sezioni: PROFILO AZIENDA | DATI FINANZIARI | PERSONE CHIAVE | SEGNALI RECENTI | JOB POSTING E PRIORITÀ STRATEGICHE | PRESENZA E MATURITÀ DIGITALE | SFIDE PROBABILI | OPPORTUNITÀ PER DOMINO | ⚠️ DATI NON TROVATI`;

  let messages = [{ role: "user", content: userMsg }];
  let data = await callClaude({
    apiKey, system: RESEARCH_SYSTEM, messages,
    tools: [webSearchTool], max_tokens: 6000,
  });

  let iterations = 0;
  while (data.stop_reason === "tool_use" && iterations < 20) {
    iterations++;
    const toolBlocks = data.content.filter(b => b.type === "tool_use");
    if (!toolBlocks.length) break;

    messages = [...messages, { role: "assistant", content: data.content }];

    const feedback = iterations < 7
      ? "Ottimo. Continua con le fonti rimanenti: dati finanziari, LinkedIn con nomi manager, job posting."
      : iterations < 14
      ? "Continua. Approfondisci presenza digitale e social. Per ogni sezione senza dati, scrivi ⚠️ Non trovato."
      : "Hai abbastanza dati. Produci ora il report finale con tutte le sezioni, inclusa ⚠️ DATI NON TROVATI.";

    messages = [
      ...messages,
      { role: "user", content: toolBlocks.map(b => ({ type: "tool_result", tool_use_id: b.id, content: feedback })) },
    ];
    data = await callClaude({
      apiKey, system: RESEARCH_SYSTEM, messages,
      tools: [webSearchTool], max_tokens: 6000,
    });
  }

  return extractText(data);
}

function parseJSON(raw) {
  let str = raw.trim()
    .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const s = str.indexOf("{");
  const e = str.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("Risposta non in formato JSON");
  return JSON.parse(str.slice(s, e + 1));
}

// ─── Handler ─────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prospect, note } = req.body || {};
  if (!prospect?.trim()) return res.status(400).json({ error: "Prospect mancante" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key non configurata sul server" });

  try {
    // Fase 1 — Research Agent
    const report = await runResearchAgent({ apiKey, prospect, note });

    // Fase 2 — Generazione materiali
    const genData = await callClaude({
      apiKey,
      system: GENERATION_SYSTEM,
      messages: [{
        role: "user",
        content: `Report di intelligence:\n\n${report}\n\nGenera i materiali sales basandoti ESCLUSIVAMENTE su questi dati. Restituisci solo il JSON.`,
      }],
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
