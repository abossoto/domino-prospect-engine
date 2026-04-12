import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Brain loader — legge i 6 file .md da /brain/ a runtime ──────────────────
function loadBrain() {
  const files = [
    '01_domino_identita.md', '02_domino_servizi.md', '03_domino_metodi.md',
    '04_domino_case_history.md', '05_domino_settori.md', '06_domino_referenze.md',
  ];
  return files.map(f => {
    try { return readFileSync(join(process.cwd(), 'brain', f), 'utf-8'); }
    catch { return `[ATTENZIONE: file brain/${f} non trovato]`; }
  }).join('\n\n---\n\n');
}

// ─── Claude API helper ────────────────────────────────────────────────────────
async function callClaude({ system, messages, tools, max_tokens = 8000 }) {
  const body = { model: 'claude-sonnet-4-20250514', max_tokens, system, messages };
  if (tools?.length) body.tools = tools;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  return res.json();
}

function extractText(data) {
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
}

function parseJSON(text) {
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(clean);
}

// ─── Research System ──────────────────────────────────────────────────────────
const RESEARCH_SYSTEM = `Sei un analista di intelligence commerciale senior per Domino, agenzia CX italiana.
Produci un dossier completo e preciso su un'azienda prospect usando ESCLUSIVAMENTE dati reali trovati sul web.

REGOLA FONDAMENTALE — MAI INVENTARE:
Se una fonte non dà risultati concreti, scrivi "⚠️ Non trovato" per quella sezione.
Un dato mancante segnalato è più utile di un dato inventato.

FONTI DA CERCARE IN ORDINE:
1. SITO WEB AZIENDALE — homepage, chi siamo, prodotti/servizi, case study. Valuta qualità sito.
2. DATI FINANZIARI — "[azienda] fatturato bilancio dipendenti", "[azienda] site:cerved.com", Registro Imprese CCIAA.
3. NEWS (ultimi 12 mesi) — "[azienda] news 2024 2025", acquisizioni, partnership, cambi management.
4. LINKEDIN — profilo aziendale + persone chiave (CEO, CMO, CDO, Dir. Marketing/Commerciale/Digital/CX).
5. JOB POSTING — "[azienda] lavora con noi", "[azienda] site:linkedin.com/jobs". Interpreta strategicamente.
6. PRESENZA DIGITALE — social attivi, frequenza post, blog, newsletter. Rating: Bassa / Media / Alta.

Fai almeno 8-10 ricerche. Quando trovi un URL rilevante, leggi la pagina intera.

STRUTTURA OBBLIGATORIA DEL REPORT:
## PROFILO AZIENDA
## DATI FINANZIARI
## PERSONE CHIAVE
## SEGNALI RECENTI (ultimi 12 mesi)
## JOB POSTING E PRIORITÀ STRATEGICHE
## PRESENZA E MATURITÀ DIGITALE
## SFIDE PROBABILI
## OPPORTUNITÀ PER DOMINO
## ⚠️ DATI NON TROVATI`;

// ─── GTM Layer Instructions ───────────────────────────────────────────────────
const GTM_LAYER_INSTRUCTIONS = {
  vision: `LAYER GTM SELEZIONATO: L1 — Experience Vision (interlocutore: CEO / C-Suite)
- MAIL: apri con contesto strategico (Industry 5.0, AI, sostenibilità). Zero prodotti. CTA = call 30min sul tema.
- DECK: slide 1 contesto settore, slide 2 sfida strategica, slide 3 come altri l'hanno affrontata, slide 4 case d'impatto, slide 5 next step esplorativo (nessun commitment).
- WORKFLOW: 3 touch in 3 settimane. Touch 2 = contenuto rilevante sul settore, non pitch Domino.`,

  settori: `LAYER GTM SELEZIONATO: L2 — Settori (interlocutore: Director / VP Marketing)
- MAIL: aggancia con pain point del settore. Cita 1-2 clienti Domino con metrica. CTA = call su quel tema.
- DECK: slide 1 settore oggi, slide 2 pain point nel verticale, slide 3-4 case dello stesso settore, slide 5 next step.
- WORKFLOW: 4 touch in 4 settimane. Touch 2 = case study PDF del cliente più affine.`,

  usecases: `LAYER GTM SELEZIONATO: L3 — Use Cases (interlocutore: Director / Head of / Responsabile progetto)
- MAIL: descrivi il problema nel loro linguaggio. Cita metrica di business. CTA = Design Sprint o call 30min.
- DECK: slide 1 il problema (loro lingua), slide 2 perché è difficile, slide 3-4 case con numeri, slide 5 Design Sprint.
- WORKFLOW: 4 touch. Touch 3 = proponi Design Sprint con descrizione e costo indicativo.`,

  tech: `LAYER GTM SELEZIONATO: L4 — Tech Categories (interlocutore: Manager / Specialista)
- MAIL: osservazione tecnica sulla loro presenza digitale (usa i dati del report). CTA = call tecnica 20min.
- DECK: slide 1 analisi presenza digitale, slide 2 benchmark settore, slide 3 come Domino lavora, slide 4 risultati, slide 5 quick win 4 settimane.
- WORKFLOW: 3 touch rapidi in 2 settimane. Touch 2 = risorsa utile (articolo, tool, checklist).`,

  salesplay: `LAYER GTM SELEZIONATO: L5 — Sales Play (interlocutore: Manager / Procurement)
- MAIL: apri con riferimento al contesto specifico (RFP, call precedente, referenza). CTA = call approfondimento.
- DECK: slide 1 comprensione brief, slide 2 proposta specifica, slide 3 metodo, slide 4 case più affine, slide 5 investimento e timeline.
- WORKFLOW: 2 touch rapidi. Touch 2 (giorno 4) = follow-up diretto.`,
};

// ─── GTM Motion Instructions ──────────────────────────────────────────────────
const GTM_MOTION_INSTRUCTIONS = {
  bottomup: `MOTION GTM: BOTTOM-UP (contatto freddo o inbound)
- Il destinatario non ti conosce: guadagnati la fiducia prima di tutto.
- Inizia SEMPRE con il loro problema — mai con Domino.
- Usa referenze come prova di credibilità, non come name-dropping.
- CTA = proporre una conversazione, non una vendita.`,

  topdown: `MOTION GTM: TOP-DOWN (referenza CEO/evento — già "pre-venduto")
- Salta l'introduzione di Domino: vai diretto al tema operativo.
- Apri con "Su indicazione di [referente]..." o "Dopo il nostro incontro a [evento]...".
- Tono: stai già lavorando insieme, non ti stai presentando.
- CTA operativa: definire il perimetro del progetto.`,
};

// ─── Generation System Builder ────────────────────────────────────────────────
function buildGenerationSystem(brain, layer, motion) {
  const layerInstr  = GTM_LAYER_INSTRUCTIONS[layer]  || GTM_LAYER_INSTRUCTIONS.usecases;
  const motionInstr = GTM_MOTION_INSTRUCTIONS[motion] || GTM_MOTION_INSTRUCTIONS.bottomup;

  return `${brain}

Sei il generatore di materiali sales di Domino. Ricevi un report di intelligence e produci output personalizzati.

REGOLE FONDAMENTALI:
- Usa SOLO informazioni dal report di intelligence — zero invenzioni
- Prima frase sempre sul PROBLEMA del prospect, mai sui servizi di Domino
- Se il report menziona un nome specifico, usalo nella mail e nel LinkedIn
- Se il report cita una notizia recente, agganciatici nell'hook
- Seleziona 2-3 elementi Domino rilevanti per QUEL prospect, non elencare tutto
- Tono diretto, concreto, umano — non da template
- Next step sempre specifico ("30 minuti per capire se c'è fit")

CASE STUDY — REGOLA DEI 3 (coerente tra intelligence, mail e deck):
[0] Il più affine: stesso settore O stessa sfida specifica. Spiega PERCHÉ in 1 frase. Includi KPI.
[1] Stesso settore o simile: mostra expertise verticale. Includi KPI.
[2] Metodologia specifica rilevante: Design Sprint!, Preventivo Emozionale, GEO, AI B2B, Internal Comm.
MAI usare solo Fiat e Costa Crociere — usa l'intero repertorio del Brain.

BADGE STRUMENTI — logica di selezione:
- foundation_sprint: stakeholder multipli, visioni contrastanti, mancanza di direzione
- design_sprint_tipo — UNO tra: Service / CX / Brand / Digital Marketing / Website / Intranet
- preventivo_emozionale: ciclo vendita lungo, rete indiretta, prodotto complesso

━━━ ISTRUZIONI GTM ━━━
${layerInstr}

${motionInstr}

Restituisci ESCLUSIVAMENTE JSON puro. Zero testo. Zero markdown. Zero backtick.
{
  "prospect": {
    "nome": "string",
    "settore": "string",
    "dimensione": "PMI | Mid-market | Enterprise",
    "fatturato_stimato": "string | null",
    "mercati": "string",
    "persone_chiave": [{ "nome": "string", "ruolo": "string", "anzianita": "string" }],
    "segnali_recenti": ["string"],
    "sfide_probabili": ["string", "string", "string"],
    "maturita_digitale": "Bassa | Media | Alta — motivazione concreta",
    "decisore_target": "string",
    "hook": "string — osservazione specifica su dato reale trovato",
    "strumenti_suggeriti": {
      "foundation_sprint": true,
      "design_sprint_tipo": "Service | CX | Brand | Digital Marketing | Website | Intranet | null",
      "design_sprint_motivazione": "string | null",
      "preventivo_emozionale": true,
      "preventivo_emozionale_motivazione": "string | null"
    },
    "casi_studio": [
      { "cliente": "string", "progetto": "string", "kpi": "string", "perche_affine": "string", "tipo": "affine" },
      { "cliente": "string", "progetto": "string", "kpi": "string", "perche_affine": "string", "tipo": "settore" },
      { "cliente": "string", "progetto": "string", "kpi": "string", "perche_affine": "string", "tipo": "metodologia" }
    ]
  },
  "mail": { "oggetto": "string", "corpo": "string — max 150 parole" },
  "deck": {
    "slide_1_titolo": "string", "slide_1_contenuto": "string",
    "slide_2_titolo": "string", "slide_2_contenuto": "string",
    "slide_3_titolo": "string", "slide_3_contenuto": "string",
    "slide_4_titolo": "Chi l'ha fatto con noi", "slide_4_contenuto": "string",
    "slide_5_titolo": "string", "slide_5_contenuto": "string"
  },
  "workflow": [
    { "giorno": 1,  "canale": "LinkedIn", "azione": "string" },
    { "giorno": 3,  "canale": "Email",    "azione": "string" },
    { "giorno": 7,  "canale": "LinkedIn", "azione": "string" },
    { "giorno": 10, "canale": "Email",    "azione": "string" },
    { "giorno": 14, "canale": "Telefono", "azione": "string" }
  ],
  "linkedin": { "tipo": "Richiesta connessione | InMail", "messaggio": "string — max 300 caratteri" }
}`;
}

// ─── Research Agent (agentico, max 20 iterazioni) ─────────────────────────────
async function runResearch(prospect, note) {
  const webSearch = { type: 'web_search_20250305', name: 'web_search' };
  const userMsg   = note
    ? `Produci dossier su: "${prospect}"\nNote commerciali: ${note}`
    : `Produci dossier su: "${prospect}"`;

  let messages = [{ role: 'user', content: userMsg }];
  let data = await callClaude({ system: RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });

  let i = 0;
  while (data.stop_reason === 'tool_use' && i < 20) {
    i++;
    const toolBlocks = data.content.filter(b => b.type === 'tool_use');
    if (!toolBlocks.length) break;
    messages = [...messages, { role: 'assistant', content: data.content }];

    const feedback =
      i < 8  ? 'Continua — cerca LinkedIn per manager e Cerved per dati finanziari.' :
      i < 15 ? 'Approfondisci job posting e presenza digitale, poi produci il report.' :
               'Hai abbastanza dati. Produci il report finale completo con tutte le sezioni.';

    const results = toolBlocks.map(b => ({ type: 'tool_result', tool_use_id: b.id, content: feedback }));
    messages = [...messages, { role: 'user', content: results }];
    data = await callClaude({ system: RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });
  }
  return extractText(data);
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prospect, note = '', layer = 'usecases', motion = 'bottomup' } = req.body;
    if (!prospect) return res.status(400).json({ error: 'prospect obbligatorio' });

    const brain     = loadBrain();
    const report    = await runResearch(prospect, note);
    const genSystem = buildGenerationSystem(brain, layer, motion);
    const genData   = await callClaude({
      system: genSystem,
      messages: [{ role: 'user', content: `Report di intelligence:\n\n${report}` }],
      max_tokens: 8000,
    });

    const result = parseJSON(extractText(genData));
    result.fonti_ricerca = report;
    return res.status(200).json(result);
  } catch (err) {
    console.error('analyze error:', err);
    return res.status(500).json({ error: err.message });
  }
}
