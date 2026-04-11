import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Load Brain from /brain/*.md at runtime ───────────────────────────────────

function loadBrain() {
  const files = [
    '01_domino_identita.md',
    '02_domino_servizi.md',
    '03_domino_metodi.md',
    '04_domino_case_history.md',
    '05_domino_settori.md',
    '06_domino_referenze.md',
  ];
  return files
    .map(f => {
      try {
        return readFileSync(join(process.cwd(), 'brain', f), 'utf-8');
      } catch {
        return `[ATTENZIONE: file brain/${f} non trovato]`;
      }
    })
    .join('\n\n---\n\n');
}

// ─── System Prompts ───────────────────────────────────────────────────────────

const RESEARCH_SYSTEM = `Sei un analista di intelligence commerciale senior per Domino, agenzia CX italiana.
Produci un dossier completo e preciso su un'azienda prospect usando ESCLUSIVAMENTE dati reali trovati sul web.

REGOLA FONDAMENTALE — MAI INVENTARE:
Se una fonte non dà risultati concreti, scrivi "⚠️ Non trovato" per quella sezione.
Un dato mancante segnalato è più utile di un dato inventato.
Se i dati trovati sono pochi, segnala la scarsezza esplicitamente.

FONTI DA CERCARE IN ORDINE:

1. SITO WEB AZIENDALE
   - Leggi homepage + chi siamo + prodotti/servizi + case study
   - Estrai: mission, prodotti/servizi chiave, mercati, clienti nominati, valori
   - Valuta qualità sito: design, CTA, lead generation, blog, newsletter, area riservata

2. DATI FINANZIARI ITALIANI
   - Query: "[azienda] fatturato bilancio dipendenti", "[azienda] site:cerved.com",
     "[azienda] Registro Imprese CCIAA", "[azienda] annual report risultati finanziari"
   - Estrai: forma giuridica, anno fondazione, fatturato ultimo anno, dipendenti, ATECO, rating
   - Se non trovi nulla: "⚠️ Dati finanziari non trovati pubblicamente"

3. NEWS E COMUNICATI (ultimi 12 mesi)
   - Query: "[azienda] news 2024 2025", "[azienda] comunicato stampa acquisizione partnership finanziamento"
   - Estrai eventi con date precise. Se nulla: "⚠️ Nessuna news rilevante trovata"

4. LINKEDIN
   - Cerca profilo aziendale + persone chiave (CEO, CMO, CDO, Dir. Marketing/Commerciale/Digital/CX)
   - Per ogni persona: nome completo, ruolo, anzianità
   - Se non accessibili: "⚠️ Profili LinkedIn non accessibili"

5. JOB POSTING ATTIVI
   - Query: "[azienda] lavora con noi offerte lavoro", "[azienda] site:linkedin.com/jobs"
   - Interpreta cosa rivelano strategicamente
   - Se nulla: "⚠️ Nessun job posting trovato"

6. PRESENZA DIGITALE E SOCIAL
   - Valuta sito, social attivi, frequenza post, blog, newsletter
   - Rating maturità: Bassa / Media / Alta con motivazione concreta

Fai almeno 8-10 ricerche. Quando trovi un URL rilevante, leggi la pagina intera — non solo snippet.

STRUTTURA OBBLIGATORIA DEL REPORT:
## PROFILO AZIENDA
## DATI FINANZIARI
## PERSONE CHIAVE
## SEGNALI RECENTI (ultimi 12 mesi)
## JOB POSTING E PRIORITÀ STRATEGICHE
## PRESENZA E MATURITÀ DIGITALE
## SFIDE PROBABILI
## OPPORTUNITÀ PER DOMINO
## ⚠️ DATI NON TROVATI (obbligatoria — guida la ricerca manuale del commerciale)`;

function buildGenerationSystem(brain) {
  return `${brain}

Sei il generatore di materiali sales di Domino. Ricevi un report di intelligence su un prospect e produci output personalizzati.

REGOLE FONDAMENTALI:
- Usa SOLO informazioni dal report di intelligence — zero invenzioni
- Prima frase sempre sul PROBLEMA del prospect, mai sui servizi di Domino
- Se il report menziona un nome specifico, usalo nella mail e nel LinkedIn
- Se il report cita una notizia recente, agganciatici nell'hook
- Seleziona 2-3 elementi Domino rilevanti per QUEL prospect, non elencare tutto
- Tono diretto, concreto, umano — non da template
- Next step sempre specifico ("30 minuti per capire se c'è fit")

CASE STUDY — REGOLA DEI 3 (coerente tra intelligence, mail e deck):
Scegli ESATTAMENTE 3 case study:
[0] Il più affine: stesso settore O stessa sfida specifica. Spiega PERCHÉ in 1 frase. Includi KPI.
[1] Stesso settore o simile: mostra expertise verticale. Includi KPI.
[2] Metodologia specifica rilevante: Design Sprint!, Preventivo Emozionale, GEO, AI B2B, Internal Comm. Includi KPI.
MAI usare solo Fiat e Costa Crociere — usa l'intero repertorio del Brain.

BADGE STRUMENTI — logica di selezione:
- foundation_sprint: stakeholder multipli, visioni contrastanti, mancanza di direzione strategica
- design_sprint_tipo — scegli UNO tra 6 in base al bisogno principale del prospect:
  * "Service" → vuole lanciare nuovo prodotto/servizio digitale
  * "CX" → customer journey frammentata, touchpoint incoerenti
  * "Brand" → rebranding, riposizionamento, brand non rappresentativo
  * "Digital Marketing" → lead generation debole, scarsa visibilità digitale
  * "Website" → sito da rinnovare, nuova presenza digitale
  * "Intranet" → problemi comunicazione interna, nuova intranet
- preventivo_emozionale: ciclo di vendita lungo, rete indiretta, prodotto complesso

MAIL — i 3 case study devono comparire: caso [0] nel corpo con KPI, gli altri come proof point secondari.
DECK — slide 4 "Chi l'ha fatto con noi" usa tutti e 3 i casi con cliente, KPI e perché è affine.

Restituisci ESCLUSIVAMENTE JSON puro. Zero testo. Zero markdown. Zero backtick.

{
  "prospect": {
    "nome": "string",
    "settore": "string",
    "dimensione": "PMI | Mid-market | Enterprise",
    "fatturato_stimato": "string | null",
    "mercati": "string",
    "persone_chiave": [{"nome": "string", "ruolo": "string", "anzianita": "string"}],
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
      {"cliente": "string", "progetto": "string", "kpi": "string", "perche_affine": "string", "tipo": "affine"},
      {"cliente": "string", "progetto": "string", "kpi": "string", "perche_affine": "string", "tipo": "settore"},
      {"cliente": "string", "progetto": "string", "kpi": "string", "perche_affine": "string", "tipo": "metodologia"}
    ]
  },
  "mail": {
    "oggetto": "string — specifico, non generico",
    "corpo": "string — max 150 parole. Problema prospect prima. Segnale reale. Caso [0] con KPI. Referenza/premio coerente. CTA specifica."
  },
  "deck": {
    "slide_1_titolo": "string — osservazione specifica sul prospect",
    "slide_1_contenuto": "string",
    "slide_2_titolo": "string — il loro problema reale",
    "slide_2_contenuto": "string",
    "slide_3_titolo": "string — come Domino lo risolve + strumento specifico",
    "slide_3_contenuto": "string",
    "slide_4_titolo": "Chi l'ha fatto con noi",
    "slide_4_contenuto": "string — usa tutti e 3 i casi con cliente, KPI e perché affine",
    "slide_5_titolo": "string — next step concreto e specifico",
    "slide_5_contenuto": "string"
  },
  "workflow": [
    {"giorno": 1, "canale": "LinkedIn", "azione": "string"},
    {"giorno": 3, "canale": "Email", "azione": "string"},
    {"giorno": 7, "canale": "LinkedIn", "azione": "string"},
    {"giorno": 10, "canale": "Email", "azione": "string"},
    {"giorno": 14, "canale": "Telefono", "azione": "string"}
  ],
  "linkedin": {
    "tipo": "Richiesta connessione | InMail",
    "messaggio": "string — max 300 caratteri, personalizzato con nome e hook reale"
  }
}`;
}

// ─── Claude API helpers ───────────────────────────────────────────────────────

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
  return data.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || '';
}

function parseJSON(text) {
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(clean);
}

// ─── Research Agent ───────────────────────────────────────────────────────────

async function runResearch(prospect, note) {
  const webSearch = { type: 'web_search_20250305', name: 'web_search' };

  const userMsg = `Produci un dossier completo su questo prospect per il team commerciale di Domino.

PROSPECT: "${prospect}"
${note?.trim() ? `NOTE: ${note}\n` : ''}
Cerca in ordine: sito web (leggi le pagine, non solo snippet), dati finanziari Cerved/CCIAA, news ultimi 12 mesi, LinkedIn con nomi reali, job posting attivi, presenza digitale.
Fai almeno 8-10 ricerche. Produci il report con tutte le sezioni obbligatorie.`;

  let messages = [{ role: 'user', content: userMsg }];
  let data = await callClaude({ system: RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });

  let i = 0;
  while (data.stop_reason === 'tool_use' && i < 20) {
    i++;
    const toolBlocks = data.content.filter(b => b.type === 'tool_use');
    if (!toolBlocks.length) break;

    messages = [...messages, { role: 'assistant', content: data.content }];
    const feedback = i < 8
      ? 'Continua — cerca ancora LinkedIn per nomi manager e Cerved per dati finanziari.'
      : i < 15
      ? 'Approfondisci job posting e presenza digitale, poi produci il report.'
      : 'Hai abbastanza dati. Produci il report finale completo con tutte le sezioni.';

    const results = toolBlocks.map(b => ({ type: 'tool_result', tool_use_id: b.id, content: feedback }));
    messages = [...messages, { role: 'user', content: results }];
    data = await callClaude({ system: RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });
  }

  return extractText(data);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prospect, note } = req.body || {};
  if (!prospect?.trim()) return res.status(400).json({ error: 'Prospect richiesto' });

  try {
    const brain = loadBrain();
    const researchReport = await runResearch(prospect.trim(), note?.trim());
    const genSystem = buildGenerationSystem(brain);

    const genData = await callClaude({
      system: genSystem,
      messages: [{
        role: 'user',
        content: `Prospect: "${prospect}"\n\nReport di intelligence:\n${researchReport}\n\nGenera i materiali sales. Solo JSON puro.`,
      }],
      max_tokens: 6000,
    });

    const result = parseJSON(extractText(genData));
    result.fonti_ricerca = researchReport;
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
