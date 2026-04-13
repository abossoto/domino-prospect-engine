import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Brain loader — tutti gli 11 file ────────────────────────────────────────
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

// ─── Claude API helper — exponential backoff su 529/500/overloaded ───────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function callClaude({ system, messages, tools, max_tokens = 8000 }) {
  const body = { model: 'claude-sonnet-4-20250514', max_tokens, system, messages };
  if (tools?.length) body.tools = tools;

  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    // Overloaded or rate limited → retry with exponential backoff
    if (res.status === 529 || res.status === 429) {
      if (attempt >= MAX_RETRIES) {
        throw new Error('OVERLOADED:Claude è sovraccarico. Riprova tra qualche minuto.');
      }
      const retryAfter = parseInt(res.headers.get('retry-after') || '0', 10);
      const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(1000 * Math.pow(2, attempt), 32000);
      await sleep(backoff);
      continue;
    }

    // Transient server error → retry once
    if (res.status >= 500 && res.status !== 529) {
      if (attempt >= 2) {
        const text = await res.text();
        throw new Error(`OVERLOADED:Errore temporaneo del server (${res.status}). Sto riprovando…`);
      }
      await sleep(2000 * (attempt + 1));
      continue;
    }

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e?.error?.message || `Claude API ${res.status}`);
    }

    return res.json();
  }
}

function extractText(data) {
  return (data?.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
}

function parseJSON(text) {
  // 1. Strip markdown fences
  let clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  // 2. Try direct parse
  let parsed = null;
  try { parsed = JSON.parse(clean); } catch {}
  // 3. Find outermost JSON object — handles any preamble/postamble the model adds
  if (!parsed) {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try { parsed = JSON.parse(clean.slice(start, end + 1)); } catch {}
    }
  }
  if (!parsed) {
    console.error('[parseJSON] failed. Response prefix:', clean.slice(0, 300));
    throw new Error('Risposta non strutturata dal modello. Riprova.');
  }
  // 4. Normalize — ensure all required fields exist with safe defaults
  // Prevents frontend crashes when model omits optional fields
  const p = parsed.prospect || {};
  parsed.prospect = {
    nome: p.nome || 'N/D',
    settore: p.settore || 'N/D',
    dimensione: p.dimensione || 'N/D',
    fatturato_stimato: p.fatturato_stimato || null,
    mercati: p.mercati || 'N/D',
    persone_chiave: Array.isArray(p.persone_chiave) ? p.persone_chiave : [],
    segnali_recenti: Array.isArray(p.segnali_recenti) ? p.segnali_recenti : [],
    sfide_probabili: Array.isArray(p.sfide_probabili) ? p.sfide_probabili : [],
    maturita_digitale: p.maturita_digitale || 'N/D',
    decisore_target: p.decisore_target || 'N/D',
    hook: p.hook || '',
    strumenti_suggeriti: p.strumenti_suggeriti || {},
    casi_studio: Array.isArray(p.casi_studio) ? p.casi_studio : [],
  };
  const m = parsed.mail || {};
  parsed.mail = { oggetto: m.oggetto || '', corpo: m.corpo || '' };

  const d = parsed.deck || {};
  parsed.deck = {
    slide_1_titolo: d.slide_1_titolo || '', slide_1_contenuto: d.slide_1_contenuto || '',
    slide_2_titolo: d.slide_2_titolo || '', slide_2_contenuto: d.slide_2_contenuto || '',
    slide_3_titolo: d.slide_3_titolo || '', slide_3_contenuto: d.slide_3_contenuto || '',
    slide_4_titolo: d.slide_4_titolo || 'Chi l\'ha fatto con noi', slide_4_contenuto: d.slide_4_contenuto || '',
    slide_5_titolo: d.slide_5_titolo || '', slide_5_contenuto: d.slide_5_contenuto || '',
  };
  parsed.workflow = Array.isArray(parsed.workflow) ? parsed.workflow : [];
  const li = parsed.linkedin || {};
  parsed.linkedin = { tipo: li.tipo || 'InMail', messaggio: li.messaggio || '' };

  return parsed;
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

// ─── GTM Layer/Motion instructions (3 livelli) ───────────────────────────────
// Tre livelli reali della vendita B2B: C-Level, Head of, Manager/Operativo.
// Non modificano la struttura JSON di output — adattano tono, argomenti e CTA.
const GTM_LAYER_INSTRUCTIONS = {

  clevel: `LAYER GTM SELEZIONATO: C-Level (CEO / CIO / DG / Direttore Generale)
FRAME: "Il digitale è leva strategica per il tuo business — ecco come altri come te l'hanno usata."
Il CEO non vuole essere venduto: vuole essere ispirato e vedere pattern di successo nel suo settore.
Non parlargli di tool, metodi o agenzie — parlagli di transizioni, opportunità e rischio competitivo.

MAIL:
- Oggetto: osservazione strategica sul loro settore o momento di mercato, mai "vi proponiamo"
- Apertura: contesto Industry 5.0, transizione digitale, pressione competitiva nel loro verticale
- Corpo: 3-4 righe max. Un'osservazione acuta sul loro momento. Cita 1 case di impatto nello stesso settore (risultato di business, non tecnico). Zero lista servizi.
- CTA: call esplorativa di 30 min sul tema strategico — non su Domino, non su un progetto specifico
- Tono: pari a pari. Mai "siamo felici di presentarvi". Mai "vi offriamo".

DECK (5 slide):
- Slide 1: Il contesto — cosa sta cambiando nel loro settore (dati reali dal report intelligence)
- Slide 2: La sfida strategica — rischio di restare indietro o opportunità da cogliere
- Slide 3: Come aziende simili l'hanno affrontata — 2 case dello stesso settore con impatto di business
- Slide 4: L'approccio Domino — visione, B Corp, 29 anni, metodo (NO lista servizi tecnici)
- Slide 5: Next step — call esplorativa, zero commitment, zero preventivo

WORKFLOW (3 touch, 3 settimane):
- Gg1 [Email]: mail di visione personalizzata sul settore
- Gg8 [LinkedIn]: condividi articolo/ricerca rilevante sul tema — zero pitch Domino
- Gg18 [Email]: follow-up diretto, proponi 30 min di confronto sul tema`,

  headof: `LAYER GTM SELEZIONATO: Head of (Director / VP / Responsabile area / Head of Marketing/Digital)
FRAME: "Questa è la scelta giusta — te lo dimostriamo prima di spendere. Se va storto, siamo noi il problema."
L'Head of ha DUE fronti: deve convincere il CEO sopra e non creare problemi al team sotto.
Il suo bisogno reale è ridurre il rischio percepito e avere munizioni per la vendita interna.
Non parlargli di visione (quella è del CEO) né di operatività (quella è del manager): parlagli di credibilità e metodo.

MAIL:
- Oggetto: pain point specifico del settore formulato come domanda o osservazione concreta
- Apertura: dimostra che conosci il loro mondo con un dato o osservazione dal report intelligence
- Corpo: collega il problema a come Domino l'ha risolto per qualcuno di simile. Cita 1-2 clienti stesso settore con KPI. Menziona il Design Sprint come modo per validare prima di investire.
- CTA: call di 30 min per capire il loro contesto specifico — non per presentare Domino
- Tono: consulenziale, specifico, orientato a ridurre il rischio. No jargon tecnico.

DECK (5 slide):
- Slide 1: Il vostro settore oggi — dinamiche chiave e pressioni (personalizzato dal report)
- Slide 2: I 3 pain point più comuni per aziende come la loro — insight non ovvio che dimostra expertise
- Slide 3: Come [cliente affine] l'ha risolto con Domino — case con KPI e contesto simile
- Slide 4: Il Design Sprint — come validare la direzione in 4 giorni prima di investire il budget
- Slide 5: Next step — proposta di Foundation Sprint o Design Sprint come primo passo a basso rischio

WORKFLOW (4 touch, 4 settimane):
- Gg1 [Email]: mail settore personalizzata
- Gg7 [LinkedIn]: invia case study PDF del cliente più affine — no pitch
- Gg16 [Email]: proponi esplicitamente Design Sprint con descrizione e investimento indicativo
- Gg26 [Telefono]: follow-up diretto "ha senso parlarne?"`,

  manager: `LAYER GTM SELEZIONATO: Manager / Operativo (Resp. progetto / Specialista / Responsabile tecnico)
FRAME: "I feel your pain — lavorare con Domino è più semplice di quanto pensi. Lavorerai meno e meglio."
Il manager si preoccupa del suo carico di lavoro quotidiano, non della visione strategica.
Teme: riunioni infinite, brief che cambiano, deliverable che tornano indietro, il progetto che diventa "il suo problema" per mesi.
Dagli certezza sul processo, dimostrate che guidate voi, che il metodo funziona.
IMPORTANTE: usa i file GTM di settore (07-11) per citare sales play e audit tattici specifici per il loro verticale.

MAIL:
- Oggetto: tecnico e specifico sul loro problema operativo dichiarato o dedotto dal report
- Apertura: osservazione concreta sulla loro situazione attuale (sito, tool, processi — dai dati del report)
- Corpo: spiega brevemente come Domino gestisce il processo in modo che lui/lei lavori meno, non di più. Cita 1 risultato concreto (metrica). Menziona l'audit tattico di settore se pertinente (€1.500, 1-2 settimane, diagnosi oggettiva).
- CTA: call tecnica di 20 min — proponi tu l'agenda concreta
- Tono: diretto, pratico, tra professionisti. Niente filosofia. Parla di process, tool, timeline.

DECK (5 slide):
- Slide 1: Analisi della loro situazione attuale — cosa funziona e cosa no (dati reali dal report)
- Slide 2: Come lavora Domino — il metodo in pratica, chi fa cosa, cosa si chiede al cliente
- Slide 3: Risultati per clienti simili — metriche operative, non solo business outcomes
- Slide 4: Il primo passo — audit tattico o Design Sprint: scope fisso, timeline definita, zero ambiguità
- Slide 5: Come sarà lavorare insieme — ruoli chiari, un interlocutore dedicato, nessuna sorpresa

WORKFLOW (4 touch, 3 settimane — veloci, i manager decidono in fretta):
- Gg1 [Email]: mail operativa con osservazione specifica sulla loro situazione
- Gg5 [LinkedIn]: risorsa utile (checklist, audit gratuito, articolo pratico) — no pitch
- Gg12 [Email]: proponi audit tattico (€1.500) o call tecnica con agenda precisa
- Gg18 [Telefono]: follow-up diretto`,
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
// ARCHITETTURA: system prompt = regole + GTM (compatto)
//               user message = brain rilevante + report intelligence
// Questo evita che il modello si perda in un system prompt enorme
// e garantisce che il JSON di output sia sempre completo.
function buildGenerationSystem(layer, motion) {
  const layerInstr = GTM_LAYER_INSTRUCTIONS[layer] || GTM_LAYER_INSTRUCTIONS.headof;
  const motionInstr = GTM_MOTION_INSTRUCTIONS[motion] || GTM_MOTION_INSTRUCTIONS.bottomup;

  return `Sei il generatore di materiali sales di Domino (domino.it), agenzia CX italiana.
Ricevi il Domino Brain (documenti interni) e un report di intelligence su un prospect.
Il tuo compito: produrre materiali sales personalizzati in formato JSON.

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

REFERENZE: usa 06_domino_referenze.md. Cita IKA per automotive/B2B, Sortlist per prospect scettici, B Corp per sensibilità ESG.
SALES PLAY: usa il file GTM del settore del prospect (07-11). Cita audit tattici specifici per il manager layer.

━━━ ISTRUZIONI GTM ━━━
${layerInstr}

${motionInstr}

OUTPUT: restituisci ESCLUSIVAMENTE JSON puro, zero testo prima o dopo, zero markdown, zero backtick.
Schema obbligatorio:
{
  "prospect": { "nome","settore","dimensione","fatturato_stimato","mercati","persone_chiave":[],"segnali_recenti":[],"sfide_probabili":[],"maturita_digitale","decisore_target","hook","strumenti_suggeriti":{"foundation_sprint":bool,"design_sprint_tipo":str|null,"design_sprint_motivazione":str|null,"preventivo_emozionale":bool,"preventivo_emozionale_motivazione":str|null},"casi_studio":[{"cliente","progetto","kpi","perche_affine","tipo"}] },
  "mail": { "oggetto","corpo" },
  "deck": { "slide_1_titolo","slide_1_contenuto","slide_2_titolo","slide_2_contenuto","slide_3_titolo","slide_3_contenuto","slide_4_titolo","slide_4_contenuto","slide_5_titolo","slide_5_contenuto" },
  "workflow": [ { "giorno":int,"canale":"LinkedIn|Email|Telefono","azione":str } ],
  "linkedin": { "tipo":"Richiesta connessione|InMail","messaggio":str }
}`;
}

// Seleziona solo i file brain rilevanti per il settore del prospect
// e li include nel messaggio utente insieme al report
function buildUserMessage(brain, prospect, report) {
  return `=== DOMINO BRAIN (usa questi documenti per generare i materiali) ===
${brain}

=== REPORT INTELLIGENCE SU: ${prospect} ===
${report}

Genera ora i materiali sales. Restituisci SOLO il JSON, nessun testo aggiuntivo.`;
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
    const { prospect, note, layer = 'headof', motion = 'bottomup' } = body;

    if (!prospect) return res.status(400).json({ error: 'prospect è obbligatorio' });

    // 1. Load brain
    const brain = loadBrain();

    // 2. Research agent
    const report = await runResearch(prospect, note);

    // 3. Build generation system (focused — brain goes in user message)
    const genSystem = buildGenerationSystem(layer, motion);
    const userMsg = buildUserMessage(brain, prospect, report);

    // 4. Generate materials — max_tokens alto per garantire JSON completo
    const genData = await callClaude({
      system: genSystem,
      messages: [{ role: 'user', content: userMsg }],
      max_tokens: 10000,
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
