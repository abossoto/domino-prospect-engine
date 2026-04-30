import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

let _brainCache = null;

function loadBrain() {
  if (_brainCache) return _brainCache;
  const brainDir = join(process.cwd(), 'brain');
  const files = readdirSync(brainDir).filter(f => f.endsWith('.md')).sort();
  _brainCache = files.map(f => {
    try { return readFileSync(join(brainDir, f), 'utf-8'); }
    catch { return `[ATTENZIONE: file brain/${f} non trovato]`; }
  }).join('\n\n---\n\n');
  return _brainCache;
}

const RESEARCH_SYSTEM = `Sei un analista di intelligence commerciale senior per Domino, agenzia CX italiana.
Produci un dossier completo e preciso su un'azienda prospect usando ESCLUSIVAMENTE dati reali trovati sul web.

REGOLA FONDAMENTALE: MAI INVENTARE.
Se una fonte non da risultati, scrivi "Non trovato" per quella sezione.
Un dato mancante segnalato e' piu' utile di un dato inventato.

FONTI DA CERCARE IN ORDINE:
1. SITO WEB AZIENDALE - homepage, chi siamo, prodotti/servizi, case study
2. DATI FINANZIARI - "[azienda] fatturato bilancio dipendenti", "[azienda] site:cerved.com", Registro Imprese
3. NEWS E COMUNICATI (ultimi 12 mesi) - acquisizioni, lanci, finanziamenti, cambi management
4. LINKEDIN - profilo aziendale + persone chiave (CEO, CMO, CDO, Dir. Marketing/Digital/CX)
5. JOB POSTING ATTIVI - interpreta le priorita' strategiche
6. PRESENZA DIGITALE - qualita' sito, social, blog, newsletter, maturita' digitale

Fai almeno 8-10 ricerche. Leggi le pagine intere, non solo snippet.

STRUTTURA OBBLIGATORIA DEL REPORT:
## PROFILO AZIENDA
## DATI FINANZIARI
## PERSONE CHIAVE
## SEGNALI RECENTI (ultimi 12 mesi)
## JOB POSTING E PRIORITA' STRATEGICHE
## PRESENZA E MATURITA' DIGITALE
## SFIDE PROBABILI
## OPPORTUNITA' PER DOMINO
## DATI NON TROVATI

REGOLA SPECIALE - SEGNALI RECENTI - VERIFICABILITA' OBBLIGATORIA:
Per ogni segnale recente DEVI raccogliere e includere nel report l'URL della fonte
(comunicato stampa, articolo testata giornalistica, post LinkedIn ufficiale, ecc.).
Formato: "Evento (data) - URL: https://..." oppure su due righe.
Esempio:
- Acquisizione di X SpA (marzo 2025) - URL: https://www.ilsole24ore.com/art/...
- Lancio prodotto Y (gennaio 2026) - URL: https://comunicati.azienda.it/...
Se per un evento NON riesci a trovare la URL fonte verificabile, OMETTILO completamente
dalla sezione SEGNALI RECENTI. Meglio segnalare 2 eventi verificabili che 5 eventi senza prova.`;

const GTM_LAYER_INSTRUCTIONS = {
  clevel: `LAYER GTM: C-Level (CEO / CIO / DG)
FRAME: "Il digitale e' leva strategica per il tuo business."
Non parlargli di tool o agenzie. Parlagli di transizioni, opportunita' e rischio competitivo.
MAIL: oggetto strategico, apertura su trend settore, 3-4 righe, CTA call esplorativa 30min.
DECK: contesto settore, sfida strategica, 2 case stesso settore con impatto business, approccio Domino, next step zero commitment.
WORKFLOW: 3 touch in 3 settimane. Touch 2 = contenuto settore, zero pitch.`,

  headof: `LAYER GTM: Head of (Director / VP / Responsabile area)
FRAME: "Questa e' la scelta giusta - te lo dimostriamo prima di spendere."
Bisogno reale: ridurre rischio percepito, munizioni per vendita interna al CEO.
MAIL: pain point settore specifico, dato dal report, caso Domino affine con KPI, Core Sprint! come validazione (6000 euro, 1 settimana), CTA call 30min.
DECK: settore oggi, 3 pain point verticale, case affine con KPI, Core Sprint!, next step basso rischio.
WORKFLOW: 4 touch in 4 settimane. Gg16 proponi Core Sprint! con investimento (6000 euro). Gg26 telefono.`,

  manager: `LAYER GTM: Manager / Operativo (Resp. progetto / Specialista)
FRAME: "I feel your pain - lavorerai meno e meglio."
Il manager teme riunioni infinite, brief che cambiano, il progetto che diventa il suo problema per mesi.
IMPORTANTE: usa i file GTM di settore (07-11) per citare sales play e audit tattici (1500 euro).
MAIL: oggetto tecnico specifico, osservazione concreta dalla loro situazione, come Domino gestisce il processo, audit tattico se pertinente (1500 euro), CTA call tecnica 20min.
DECK: analisi situazione attuale, come lavora Domino, metriche operative, Audit tattico o Design Sprint! scope fisso, come sara' lavorare insieme.
WORKFLOW: 4 touch in 3 settimane veloci. Gg12 proponi Audit tattico (1500 euro). Gg18 telefono.`,
};

const GTM_MOTION_INSTRUCTIONS = {
  bottomup: `MOTION GTM: BOTTOM-UP (contatto freddo o inbound)
- Inizia SEMPRE con il problema del prospect, mai con Domino.
- Usa le referenze come prova di credibilita', non come name-dropping.
- CTA = proporre una conversazione, non una vendita.`,

  topdown: `MOTION GTM: TOP-DOWN (referenza CEO/evento - gia' pre-venduto)
- Apri con "Su indicazione di [referente]..." o "Dopo il nostro incontro a [evento]...".
- Tono: stai gia' lavorando insieme, non ti stai presentando.
- CTA operativa: definire il perimetro del progetto, non conoscersi.`,
};

function buildGenerationSystem(brain, layer = 'headof', motion = 'bottomup') {
  const layerInstr = GTM_LAYER_INSTRUCTIONS[layer] || GTM_LAYER_INSTRUCTIONS.headof;
  const motionInstr = GTM_MOTION_INSTRUCTIONS[motion] || GTM_MOTION_INSTRUCTIONS.bottomup;

  return `${brain}

Sei il generatore di materiali sales di Domino.

REGOLA DI NOTAZIONE CANONICA - VINCOLO ASSOLUTO:
Tutti i prodotti Domino terminano con il punto esclamativo "!". Non e' enfasi: e' il NOME UFFICIALE del prodotto. Scrivere "Core Sprint" senza "!" e' un ERRORE che svaluta il marchio. Vale per OGNI occorrenza in OGNI campo del JSON: oggetti email, corpi mail, slide, messaggi LinkedIn, motivazioni dei badge, casi studio.

CORRETTO: "Core Sprint!", "Design Sprint!", "Build Sprint!", "Trainstorming!", "Brain & Identity Design Sprint!", "Service Design Sprint!", "CX Design Sprint!", "Brand Design Sprint!", "Digital Marketing Design Sprint!", "Website Design Sprint!", "Intranet Design Sprint!"
ERRATO: "Core Sprint", "Design Sprint", "Build Sprint", "Trainstorming", "il Core Sprint del cliente", "un Design Sprint di 4 giorni"
Eccezioni (NON portano "!"): "Preventivo Emozionale" (storico), "Audit tattico" (descrittivo).

Prima di restituire il JSON, RILEGGI ogni occorrenza dei nomi prodotto e verifica che il "!" finale sia presente.

CATALOGO 2026 - prodotti Domino (fonte canonica: brain/03_domino_metodi.md):
- "Core Sprint!" (6.000 euro, 1-2 giorni) - allineamento strategico, NON "Foundation Sprint" (linguaggio startup, noi serviamo enterprise).
- "Design Sprint!" (10.000 euro, 4 giorni) - prototipo testato. Specializzazioni: Service / CX / Brand / Digital Marketing / Website / Intranet / Brain & Identity (variante di punta 2026, fondamenta brain aziendale + design system).
- "Build Sprint!" (20-60K euro, 8-52 settimane) - esecuzione a blocchi di 2 settimane o 1 mese, perimetro aperto. Sostituisce la voce storica "Progetto completo".
- "Trainstorming!" (da 15.000 euro, 12 mesi, 3 sessioni) - change management. Era rituale interno dal 2010, dal 2026 anche servizio venduto.
- "Preventivo Emozionale" - tool commerciale (minisite preventivo con analytics).
- "Audit tattico" (1.500 euro, 1-2 settimane) - entry point.

CORNICE TRASVERSALE: "Decision Design" - progettazione delle conseguenze (trade-off, scenari, effetti a 6-12 mesi). Slogan: "da come si naviga a come si sceglie". Citarlo come postura strategica, non come tool.

REGOLE: usa SOLO info dal report. Prima frase = problema del prospect. Tono diretto, concreto.
CASE STUDY - REGOLA DEI 3: [0] stesso settore/sfida con KPI [1] settore simile con KPI [2] metodologia specifica (es. Brain & Identity Design Sprint!, Build Sprint!, Preventivo Emozionale, GEO, AI B2B). MAI solo Fiat e Costa Crociere.
BADGE: core_sprint se stakeholder multipli/no chiarezza. design_sprint_tipo = Service/CX/Brand/Digital Marketing/Website/Intranet/Brain & Identity. preventivo_emozionale se ciclo lungo/rete indiretta.

SEGNALI RECENTI - VERIFICABILITA' OBBLIGATORIA:
Ogni segnale del JSON DEVE essere un oggetto con i campi {testo, data, fonte_url, fonte_titolo}.
Il valore di fonte_url DEVE essere una URL reale presa dal report di intelligence (sezione SEGNALI RECENTI).
Se il report non ha URL per un evento, NON includerlo nell'array. Meglio 2 segnali verificabili che 5 senza prova.
Se nessun segnale ha fonte verificabile, restituisci array vuoto: "segnali_recenti": [].

${layerInstr}

${motionInstr}

Restituisci ESCLUSIVAMENTE JSON puro. Zero testo. Zero markdown. Zero backtick.

{"prospect":{"nome":"","settore":"","dimensione":"PMI|Mid-market|Enterprise","fatturato_stimato":"","mercati":"","persone_chiave":[{"nome":"","ruolo":"","anzianita":""}],"segnali_recenti":[{"testo":"","data":"","fonte_url":"https://...","fonte_titolo":""}],"sfide_probabili":["","",""],"maturita_digitale":"","decisore_target":"","hook":"","strumenti_suggeriti":{"core_sprint":true,"core_sprint_motivazione":"","design_sprint_tipo":"Service|CX|Brand|Digital Marketing|Website|Intranet|Brain & Identity","design_sprint_motivazione":"","preventivo_emozionale":true,"preventivo_emozionale_motivazione":""},"casi_studio":[{"cliente":"","progetto":"","kpi":"","perche_affine":"","tipo":"affine"},{"cliente":"","progetto":"","kpi":"","perche_affine":"","tipo":"settore"},{"cliente":"","progetto":"","kpi":"","perche_affine":"","tipo":"metodologia"}]},"mail":{"oggetto":"","corpo":""},"deck":{"slide_1_titolo":"","slide_1_contenuto":"","slide_2_titolo":"","slide_2_contenuto":"","slide_3_titolo":"","slide_3_contenuto":"","slide_4_titolo":"Chi lha fatto con noi","slide_4_contenuto":"","slide_5_titolo":"","slide_5_contenuto":""},"workflow":[{"giorno":1,"canale":"LinkedIn","azione":""},{"giorno":3,"canale":"Email","azione":""},{"giorno":7,"canale":"LinkedIn","azione":""},{"giorno":10,"canale":"Email","azione":""},{"giorno":14,"canale":"Telefono","azione":""}],"linkedin":{"tipo":"Richiesta connessione|InMail","messaggio":""}}`;
}

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
    if (res.status === 529 || res.status === 429) {
      if (attempt >= MAX_RETRIES) throw new Error('OVERLOADED:Claude e\' sovraccarico. Riprova tra qualche minuto.');
      const retryAfter = parseInt(res.headers.get('retry-after') || '0', 10);
      const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(1000 * Math.pow(2, attempt), 32000);
      await sleep(backoff);
      continue;
    }
    if (res.status >= 500 && res.status !== 529) {
      if (attempt >= 2) throw new Error(`OVERLOADED:Errore temporaneo del server (${res.status}). Sto riprovando...`);
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
  return data.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || '';
}

const PRODUCT_NORMALIZATIONS = [
  [/\bBrain & Identity Design Sprint\b(?!!)/g, 'Brain & Identity Design Sprint!'],
  [/\bDigital Marketing Design Sprint\b(?!!)/g, 'Digital Marketing Design Sprint!'],
  [/\bService Design Sprint\b(?!!)/g, 'Service Design Sprint!'],
  [/\bWebsite Design Sprint\b(?!!)/g, 'Website Design Sprint!'],
  [/\bIntranet Design Sprint\b(?!!)/g, 'Intranet Design Sprint!'],
  [/\bBrand Design Sprint\b(?!!)/g, 'Brand Design Sprint!'],
  [/\bCX Design Sprint\b(?!!)/g, 'CX Design Sprint!'],
  [/\bDesign Sprint\b(?!!)/g, 'Design Sprint!'],
  [/\bCore Sprint\b(?!!)/g, 'Core Sprint!'],
  [/\bBuild Sprint\b(?!!)/g, 'Build Sprint!'],
  [/\bTrainstorming\b(?![!a-zA-Z])/g, 'Trainstorming!'],
];

function normalizeProductString(s) {
  if (typeof s !== 'string') return s;
  let out = s;
  for (const [pattern, replacement] of PRODUCT_NORMALIZATIONS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function normalizeProductNames(node) {
  if (typeof node === 'string') return normalizeProductString(node);
  if (Array.isArray(node)) return node.map(normalizeProductNames);
  if (node && typeof node === 'object') {
    const out = {};
    for (const k of Object.keys(node)) out[k] = normalizeProductNames(node[k]);
    return out;
  }
  return node;
}

function isValidUrl(u) {
  if (typeof u !== 'string' || !u.trim()) return false;
  return /^https?:\/\/\S+/i.test(u.trim());
}

function normalizeSignals(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(s => {
      if (typeof s === 'string') return null;
      if (!s || typeof s !== 'object') return null;
      if (!isValidUrl(s.fonte_url)) return null;
      return {
        testo: String(s.testo || '').trim(),
        data: String(s.data || '').trim(),
        fonte_url: s.fonte_url.trim(),
        fonte_titolo: String(s.fonte_titolo || '').trim(),
      };
    })
    .filter(Boolean);
}

function parseJSON(text) {
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  let parsed = null;
  try { parsed = JSON.parse(clean); } catch {}
  if (!parsed) {
    const s = clean.indexOf('{'), e = clean.lastIndexOf('}');
    if (s !== -1 && e !== -1) { try { parsed = JSON.parse(clean.slice(s, e + 1)); } catch {} }
  }
  if (!parsed) throw new Error('JSON non valido nella risposta del modello');

  if (parsed.prospect) {
    parsed.prospect.segnali_recenti = normalizeSignals(parsed.prospect.segnali_recenti);
  }

  return normalizeProductNames(parsed);
}

async function runResearch(prospect, note) {
  const webSearch = { type: 'web_search_20250305', name: 'web_search' };
  const userContent = `Produci un dossier completo su: "${prospect}"${note ? `\nNote: ${note}` : ''}
Cerca: sito web, dati finanziari Cerved/CCIAA, news ultimi 12 mesi, LinkedIn con nomi reali, job posting, presenza digitale.
Per ogni segnale recente raccogli SEMPRE l'URL della fonte. Senza URL non includerlo.
Fai almeno 8-10 ricerche. Produci il report con tutte le sezioni.`;
  let messages = [{ role: 'user', content: userContent }];
  let data = await callClaude({ system: RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });
  let i = 0;
  while (data.stop_reason === 'tool_use' && i < 20) {
    i++;
    const toolBlocks = data.content.filter(b => b.type === 'tool_use');
    if (!toolBlocks.length) break;
    messages = [...messages, { role: 'assistant', content: data.content }];
    const feedback = i < 8
      ? 'Continua - cerca LinkedIn per nomi manager e Cerved per dati finanziari. Per ogni news recente, raccogli URL della fonte.'
      : i < 15
      ? 'Approfondisci job posting e presenza digitale. Per i segnali recenti, ricorda di raccogliere URL fonte (omettili se non li trovi).'
      : 'Hai abbastanza dati. Produci il report finale completo.';
    const results = toolBlocks.map(b => ({ type: 'tool_result', tool_use_id: b.id, content: feedback }));
    messages = [...messages, { role: 'user', content: results }];
    data = await callClaude({ system: RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });
  }
  return extractText(data);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prospect, note, layer = 'headof', motion = 'bottomup' } = req.body || {};
  if (!prospect?.trim()) return res.status(400).json({ error: 'Prospect richiesto' });
  try {
    const brain = loadBrain();
    const researchReport = await runResearch(prospect.trim(), note?.trim());
    const genData = await callClaude({
      system: buildGenerationSystem(brain, layer, motion),
      messages: [{ role: 'user', content: `Prospect: "${prospect}"\nLayer: ${layer} | Motion: ${motion}\n\nReport:\n${researchReport}\n\nGenera i materiali. Solo JSON puro.` }],
      max_tokens: 6000,
    });
    return res.status(200).json(parseJSON(extractText(genData)));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
