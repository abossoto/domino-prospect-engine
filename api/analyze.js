import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Brain loader ────────────────────────────────────────────────────────────
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

// ─── Claude API helper ───────────────────────────────────────────────────────
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
  return (data?.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
}

function parseJSON(text) {
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(clean);
}

// ─── Research System ─────────────────────────────────────────────────────────
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

// ─── Research Agent (agentico multi-turn) ────────────────────────────────────
async function runResearch(prospect, note) {
  const webSearch = { type: 'web_search_20250305', name: 'web_search' };
  const userContent = `Produci dossier su: "${prospect}"${note ? `\nNote: ${note}` : ''}`;
  let messages = [{ role: 'user', content: userContent }];
  let data = await callClaude({ system: RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });

  let i = 0;
  while (data.stop_reason === 'tool_use' && i < 20) {
    i++;
    const toolBlocks = data.content.filter(b => b.type === 'tool_use');
    if (!toolBlocks.length) break;
    messages = [...messages, { role: 'assistant', content: data.content }];

    const feedback =
      i < 8  ? 'Continua — cerca ancora LinkedIn per nomi manager e Cerved per dati finanziari.' :
      i < 15 ? 'Approfondisci job posting e presenza digitale, poi produci il report.' :
               'Hai abbastanza dati. Produci il report finale completo con tutte le sezioni.';

    const results = toolBlocks.map(b => ({ type: 'tool_result', tool_use_id: b.id, content: feedback }));
    messages = [...messages, { role: 'user', content: results }];
    data = await callClaude({ system: RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });
  }
  return extractText(data);
}

// ─── GTM Layer/Motion instructions ───────────────────────────────────────────
// NUOVO: iniettate nel generation system in base alla selezione dell'utente.
// Non modificano la struttura JSON di output — adattano tono, argomenti e CTA.
const GTM_LAYER_INSTRUCTIONS = {
  vision: `LAYER GTM SELEZIONATO: L1 — Experience Vision (interlocutore: CEO / C-Suite)
Il destinatario vuole essere ispirato, non venduto. Adatta i materiali così:
- MAIL: apri con contesto strategico o transizione di settore (Industry 5.0, AI, sostenibilità). Zero prodotti nel corpo. CTA = call 30 min sul tema, non su Domino.
- DECK: slide 1 su contesto settore, slide 2 sulla sfida strategica, slide 3 su come altre organizzazioni simili l'hanno affrontata, slide 4 case d'impatto, slide 5 next step esplorativo (nessun commitment).
- WORKFLOW: 3 touch in 3 settimane. Touch 2 = condividi contenuto rilevante sul settore, non pitch Domino.`,

  settori: `LAYER GTM SELEZIONATO: L2 — Settori (interlocutore: Director / VP Marketing)
Il destinatario vuole sentirsi capito nel suo mondo. Adatta i materiali così:
- MAIL: aggancia con pain point specifico del settore del prospect. Cita 1-2 clienti Domino dello stesso settore con metrica. CTA = call per approfondire quel tema.
- DECK: slide 1 sul loro settore oggi, slide 2 sui 3 pain point più comuni nel verticale, slide 3-4 case dello stesso settore con numeri, slide 5 next step.
- WORKFLOW: 4 touch in 4 settimane. Touch 2 = case study PDF del cliente più affine.`,

  usecases: `LAYER GTM SELEZIONATO: L3 — Use Cases (interlocutore: Director / Head of / Responsabile progetto)
Il destinatario vuole vedere il problema risolto in modo concreto. Adatta i materiali così:
- MAIL: descrivi il loro problema specifico nel loro linguaggio (non quello dell'agenzia). Cita metrica di business (non tecnica). CTA = Design Sprint o call operativa di 30 min.
- DECK: slide 1 il problema (loro lingua), slide 2 perché è difficile (insight non ovvio), slide 3-4 case con numeri, slide 5 Design Sprint come prossimo passo a basso rischio.
- WORKFLOW: 4 touch. Touch 3 = proponi esplicitamente un Design Sprint con descrizione e costo indicativo.`,

  tech: `LAYER GTM SELEZIONATO: L4 — Tech Categories (interlocutore: Manager / Specialista)
Il destinatario ha trovato Domino cercando attivamente. Adatta i materiali così:
- MAIL: osservazione tecnica specifica sulla loro presenza digitale attuale (usa i dati del report). Expertise concreta, niente visione strategica. CTA = call tecnica 20 min.
- DECK: slide 1 analisi loro presenza digitale attuale, slide 2 benchmark di settore, slide 3 come Domino lavora su quella categoria, slide 4 risultati per clienti simili, slide 5 quick win possibile nelle prime 4 settimane.
- WORKFLOW: 3 touch rapidi in 2 settimane. Touch 2 = risorsa utile (articolo, tool, checklist), non pitch.`,

  salesplay: `LAYER GTM SELEZIONATO: L5 — Sales Play (interlocutore: Manager / Procurement)
Il prospect è già in fase di selezione o ha emesso un RFP. Adatta i materiali così:
- MAIL: apri con riferimento al contesto specifico (RFP, call precedente, referenza). Diretto, problem-solution, con cifre. CTA = disponibilità per call di approfondimento.
- DECK: slide 1 comprensione del loro brief (dimostra ascolto), slide 2 proposta specifica, slide 3 metodo (come si lavora dal giorno 1), slide 4 case più affine, slide 5 investimento indicativo e timeline.
- WORKFLOW: 2 touch rapidi. Touch 2 (giorno 4) = follow-up diretto.`,
};

const GTM_MOTION_INSTRUCTIONS = {
  bottomup: `MOTION GTM: BOTTOM-UP (contatto freddo o inbound)
- Il destinatario non ti conosce bene: guadagnati la fiducia prima di tutto.
- Inizia SEMPRE con il loro problema o contesto — mai con Domino.
- Usa le referenze come prova di credibilità, non come name-dropping.
- CTA = proporre una conversazione, non una vendita.`,

  topdown: `MOTION GTM: TOP-DOWN (entri con referenza CEO/evento — il destinatario è già "pre-venduto")
- Salta l'introduzione di Domino: vai direttamente al tema operativo.
- Apri mail e LinkedIn con "Su indicazione di [referente]..." o "Dopo il nostro incontro a [evento]...".
- Tono: stai già lavorando insieme, non ti stai presentando.
- CTA operativa: definire il perimetro del progetto, non conoscersi.`,
};

// ─── Generation System (con GTM) ─────────────────────────────────────────────
function buildGenerationSystem(brain, layer, motion) {
  const layerInstr = GTM_LAYER_INSTRUCTIONS[layer] || GTM_LAYER_INSTRUCTIONS.usecases;
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

MAIL: caso [0] nel corpo con KPI, altri come proof secondari.
DECK slide 4: tutti e 3 i casi con cliente, KPI e perché affine.

━━━ ISTRUZIONI GTM ━━━
${layerInstr}

${motionInstr}

Restituisci ESCLUSIVAMENTE JSON puro. Zero testo. Zero markdown. Zero backtick.`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { prospect, note, layer = 'usecases', motion = 'bottomup' } = body;

    if (!prospect) return res.status(400).json({ error: 'prospect è obbligatorio' });

    // 1. Load brain
    const brain = loadBrain();

    // 2. Research agent
    const report = await runResearch(prospect, note);

    // 3. Build generation system with GTM context
    const genSystem = buildGenerationSystem(brain, layer, motion);

    // 4. Generate materials
    const genData = await callClaude({
      system: genSystem,
      messages: [{ role: 'user', content: `Genera i materiali sales per questo prospect.\n\n${report}` }],
      max_tokens: 6000,
    });

    // 5. Parse JSON
    const result = parseJSON(extractText(genData));

    // 6. Attach raw report
    result.fonti_ricerca = report;

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
