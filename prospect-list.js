import { readFileSync } from 'fs';
import { join } from 'path';

// ── CORS ──────────────────────────────────────────────────────────────────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── BRAIN ─────────────────────────────────────────────────────────────────────
function loadBrain() {
  const files = [
    '01_domino_identita.md',
    '02_domino_servizi.md',
    '03_domino_metodi.md',
    '04_domino_case_history.md',
    '05_domino_settori.md',
    '06_domino_referenze.md',
    '07_domino_gtm_b2b.md',
    '08_domino_gtm_salute_beauty.md',
    '09_domino_gtm_turismo_cultura.md',
    '10_domino_gtm_finance_pa.md',
    '11_domino_gtm_automotive.md',
  ];
  return files.map(f => {
    try { return readFileSync(join(process.cwd(), 'brain', f), 'utf-8'); }
    catch { return `[ATTENZIONE: file brain/${f} non trovato]`; }
  }).join('\n\n---\n\n');
}

// ── CLAUDE API ────────────────────────────────────────────────────────────────
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
  return data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');
}

function parseJSON(text) {
  let clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) clean = clean.slice(start, end + 1);
  return JSON.parse(clean);
}

// ── RESEARCH SYSTEM ───────────────────────────────────────────────────────────
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
   - Query: "[azienda] news 2024 2025", "[azienda] comunicato stampa acquisizione partnership"
   - Estrai eventi con date precise. Se nulla: "⚠️ Nessuna news rilevante trovata"

4. PERSONE CHIAVE — strategia indiretta (LinkedIn blocca i crawler diretti)
   - Query 1: '[azienda] "marketing director" OR "CMO" OR "responsabile marketing" site:linkedin.com'
   - Query 2: '[azienda] "direttore digitale" OR "CDO" OR "head of digital" linkedin'
   - Query 3: '[azienda] comunicato stampa nomina "direttore" OR "responsabile" 2024 2025'
   - Query 4: Leggi pagina "Team" o "Chi siamo" o "Management" del sito aziendale
   - Per ogni persona trovata: nome completo, ruolo, anzianità stimata
   - Se profili non accessibili neanche con Google: "⚠️ Profili LinkedIn non accessibili — verificare manualmente"

5. JOB POSTING ATTIVI
   - Query: "[azienda] lavora con noi offerte lavoro", "[azienda] site:linkedin.com/jobs"
   - Interpreta cosa rivelano strategicamente
   - Se nulla: "⚠️ Nessun job posting trovato"

6. PRESENZA DIGITALE E SOCIAL
   - Valuta sito, social attivi, frequenza post, blog, newsletter
   - Rating maturità: Bassa / Media / Alta con motivazione concreta

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
## ⚠️ DATI NON TROVATI (obbligatoria — guida la ricerca manuale del commerciale)`;

// ── GTM LAYER INSTRUCTIONS ────────────────────────────────────────────────────
const GTM_LAYER_INSTRUCTIONS = {
  vision: `LAYER GTM SELEZIONATO: L1 — Experience Business Vision (interlocutore: C-Suite)
Adatta i materiali così:
- MAIL: apri con contesto strategico o transizione di settore (Industry 5.0, AI, sostenibilità). Zero prodotti nel corpo. CTA = call 30 min sul tema, non su Domino.
- DECK: slide 1 su contesto settore, slide 2 sulla sfida strategica, slide 3 su come altre organizzazioni simili l'hanno affrontata, slide 4 case d'impatto, slide 5 next step esplorativo.
- WORKFLOW: 3 touch in 3 settimane. Touch 2 = condividi contenuto rilevante sul settore, non pitch Domino.`,

  settori: `LAYER GTM SELEZIONATO: L2 — Settori (interlocutore: Director / VP Marketing)
Adatta i materiali così:
- MAIL: aggancia con pain point specifico del settore del prospect. Cita 1-2 clienti Domino dello stesso settore con metrica. CTA = call per approfondire quel tema.
- DECK: slide 1 sul loro settore oggi, slide 2 sui 3 pain point più comuni nel verticale, slide 3-4 case dello stesso settore con numeri, slide 5 next step.
- WORKFLOW: 4 touch in 4 settimane. Touch 2 = case study PDF del cliente più affine.`,

  usecases: `LAYER GTM SELEZIONATO: L3 — Use Cases (interlocutore: Director / Head of / Responsabile progetto)
Adatta i materiali così:
- MAIL: descrivi il loro problema specifico nel loro linguaggio. Cita metrica di business (non tecnica). CTA = Design Sprint o call operativa di 30 min.
- DECK: slide 1 il problema (loro lingua), slide 2 perché è difficile (insight non ovvio), slide 3-4 case con numeri, slide 5 Design Sprint come prossimo passo a basso rischio.
- WORKFLOW: 4 touch. Touch 3 = proponi esplicitamente un Design Sprint con descrizione e costo indicativo.`,

  tech: `LAYER GTM SELEZIONATO: L4 — Tech Categories (interlocutore: Manager / Specialista)
Adatta i materiali così:
- MAIL: osservazione tecnica specifica sulla loro presenza digitale attuale. Expertise concreta, niente visione strategica. CTA = call tecnica 20 min.
- DECK: slide 1 analisi loro presenza digitale attuale, slide 2 benchmark di settore, slide 3 come Domino lavora su quella categoria, slide 4 risultati per clienti simili, slide 5 quick win nelle prime 4 settimane.
- WORKFLOW: 3 touch rapidi in 2 settimane. Touch 2 = risorsa utile (articolo, tool, checklist).`,

  salesplay: `LAYER GTM SELEZIONATO: L5 — Sales Play (interlocutore: Manager / Procurement)
Il prospect è già in fase di selezione o ha emesso un RFP. Adatta i materiali così:
- MAIL: apri con riferimento al contesto specifico (RFP, call precedente, referenza). Diretto, problem-solution, con cifre. CTA = disponibilità per call di approfondimento.
- DECK: slide 1 comprensione del problema specifico, slide 2 proposta di valore diretta, slide 3-4 prove (case, KPI, referenze), slide 5 proposta concreta con next step immediato.
- WORKFLOW: 3 touch in 10 giorni. Touch 2 = follow-up con dettaglio tecnico o referenza specifica richiesta.`,
};

// ── GTM MOTION INSTRUCTIONS ───────────────────────────────────────────────────
const GTM_MOTION_INSTRUCTIONS = {
  bottomup: `MOTION SELEZIONATA: Bottom-up ⬆ (contatto freddo/inbound — pipeline rapida)
Il contatto è a livello manager/operativo. L'obiettivo è essere rilevanti e salire verso il decisore.
- Tono: esperto che capisce il loro problema specifico, non venditore
- Prima CTA: piccolo impegno (audit €1.500, call 20 min, Design Sprint €10K)
- Non menzionare budget grandi o commitment alti nella prima comunicazione
- Workflow: frequente e basato su valore concreto, non su pressione`,

  topdown: `MOTION SELEZIONATA: Top-down ⬇ (referenza CEO/evento — deal più grandi)
Entri già con credibilità C-level. L'obiettivo è scendere al team con la benedizione del vertice.
- Tono: pari a pari con il C-level, consulenziale e strategico
- Prima CTA: incontro strategico (workshop gratuito per grandi clienti, Foundation Sprint)
- Apri con contesto I5.0 o con la referenza/evento che ha aperto il canale
- Workflow: meno touch, più mirati, più alto valore per ogni comunicazione
- Apri mail e LinkedIn con "Su indicazione di [referente]..." o "Dopo il nostro incontro a [evento]..."`,
};

// ── GENERATION SYSTEM ─────────────────────────────────────────────────────────
function buildGenerationSystem(brain, layer, motion) {
  const layerInstr = GTM_LAYER_INSTRUCTIONS[layer] || GTM_LAYER_INSTRUCTIONS.usecases;
  const motionInstr = GTM_MOTION_INSTRUCTIONS[motion] || GTM_MOTION_INSTRUCTIONS.bottomup;

  return `${brain}

Sei il generatore di materiali sales di Domino. Ricevi un report di intelligence e produci output personalizzati.

REGOLE FONDAMENTALI:
1. Usa SOLO dati reali dal report. MAI inventare KPI, nomi, eventi.
2. Se il report segna "⚠️ Non trovato", NON inventare — usa "dati non disponibili" o ometti.
3. Ogni materiale deve essere specifico per QUESTO prospect, non generico.
4. Scegli SEMPRE 3 case study Domino rilevanti dal brain: uno per affinità diretta, uno per settore, uno per metodologia. Non ripetere lo stesso.
5. Cita almeno 1 KPI numerico reale per case study (%, €, n. mercati, n. dipendenti).

${layerInstr}

${motionInstr}

SCALA PRICING DA USARE:
- Audit tattico (SEO/GEO, Digital Mktg o CX): €1.500
- Foundation Sprint: €6.000
- Design Sprint: €10.000
- Progetto completo: €20.000–100.000+
Non proporre mai lavoro gratuito per prospect bottom-up.
Workshop gratuito (2h) solo per grandi clienti top-down come apertura verso Foundation Sprint.

Produci ESCLUSIVAMENTE il JSON richiesto, senza testo prima o dopo, senza markdown fences.

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
    "hook": "string — osservazione specifica su dato reale trovato nel report",
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
  "mail": {
    "oggetto": "string — specifico, non generico",
    "corpo": "string — max 150 parole"
  },
  "deck": {
    "slide_1_titolo": "string", "slide_1_contenuto": "string",
    "slide_2_titolo": "string", "slide_2_contenuto": "string",
    "slide_3_titolo": "string", "slide_3_contenuto": "string",
    "slide_4_titolo": "Chi l'ha fatto con noi", "slide_4_contenuto": "string",
    "slide_5_titolo": "string", "slide_5_contenuto": "string"
  },
  "workflow": [
    { "giorno": 1, "canale": "LinkedIn", "azione": "string" },
    { "giorno": 3, "canale": "Email", "azione": "string" },
    { "giorno": 7, "canale": "LinkedIn", "azione": "string" },
    { "giorno": 10, "canale": "Email", "azione": "string" },
    { "giorno": 14, "canale": "Telefono", "azione": "string" }
  ],
  "linkedin": {
    "tipo": "Richiesta connessione | InMail",
    "messaggio": "string — max 300 caratteri"
  }
}`;
}

// ── RESEARCH AGENT ────────────────────────────────────────────────────────────
async function runResearch(prospect, note) {
  const webSearch = { type: 'web_search_20250305', name: 'web_search' };
  const userMsg = note
    ? `Produci dossier su: "${prospect}"\n\nNote commerciali: ${note}`
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
      i < 8  ? 'Continua — cerca ancora persone chiave con query Google indirette ("azienda" "ruolo" site:linkedin.com) e Cerved per dati finanziari.' :
      i < 15 ? 'Approfondisci job posting e presenza digitale, poi produci il report.' :
               'Hai abbastanza dati. Produci il report finale completo con tutte le sezioni.';

    const results = toolBlocks.map(b => ({ type: 'tool_result', tool_use_id: b.id, content: feedback }));
    messages = [...messages, { role: 'user', content: results }];
    data = await callClaude({ system: RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });
  }
  return extractText(data);
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prospect, note, layer = 'usecases', motion = 'bottomup' } = req.body;
    if (!prospect?.trim()) return res.status(400).json({ error: 'prospect richiesto' });

    const brain = loadBrain();

    // Step 1: Research
    const report = await runResearch(prospect.trim(), note?.trim());

    // Step 2: Generate materials
    const genSystem = buildGenerationSystem(brain, layer, motion);
    const genData = await callClaude({
      system: genSystem,
      messages: [{ role: 'user', content: `Report intelligence:\n\n${report}\n\nGenera i materiali sales in JSON.` }],
      max_tokens: 8000,
    });
    const generatedText = extractText(genData);

    // Step 3: Parse + attach sources
    const result = parseJSON(generatedText);
    // FIX: guard esplicito su fonti_ricerca — allegato dopo il parse, non nel JSON generato
    result.fonti_ricerca = report || '⚠️ Report research non disponibile per questa analisi.';

    return res.status(200).json(result);
  } catch (err) {
    console.error('analyze error:', err);
    return res.status(500).json({ error: err.message });
  }
}
