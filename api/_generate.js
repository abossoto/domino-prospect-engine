// api/_generate.js
// Fase 2: dal report di intelligence ai materiali sales, in JSON.
// Qui entra il brain, ed e' l'unico punto dove entra: il blocco e' identico
// per ogni chiamata e per ogni endpoint, cosi' la cache viene condivisa.

import { callClaude, extractText, loadBrain, brainBlock } from './_shared.js';

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

export function buildGenerationSystem(brain, layer = 'headof', motion = 'bottomup') {
  const layerInstr = GTM_LAYER_INSTRUCTIONS[layer] || GTM_LAYER_INSTRUCTIONS.headof;
  const motionInstr = GTM_MOTION_INSTRUCTIONS[motion] || GTM_MOTION_INSTRUCTIONS.bottomup;

  const rest = `Sei il generatore di materiali sales di Domino.

REGOLA DI NOTAZIONE CANONICA - VINCOLO ASSOLUTO:
Tutti i prodotti Domino terminano con il punto esclamativo "!". Non e' enfasi: e' il NOME UFFICIALE del prodotto. Scrivere "Core Sprint" senza "!" e' un ERRORE che svaluta il marchio. Vale per OGNI occorrenza in OGNI campo del JSON: oggetti email, corpi mail, slide, messaggi LinkedIn, motivazioni dei badge, casi studio.

CORRETTO: "Core Sprint!", "Design Sprint!", "Build Sprint!", "Trainstorming!", "Brain & Identity Design Sprint!", "Service Design Sprint!", "CX Design Sprint!", "Brand Design Sprint!", "Digital Marketing Design Sprint!", "Website Design Sprint!", "Intranet Design Sprint!"
ERRATO: "Core Sprint", "Design Sprint", "Build Sprint", "Trainstorming", "il Core Sprint del cliente", "un Design Sprint di 4 giorni"
Eccezioni (NON portano "!"): "Preventivo Emozionale" (storico), "Audit tattico" (descrittivo).

Prima di restituire il JSON, RILEGGI ogni occorrenza dei nomi prodotto e verifica che il "!" finale sia presente.

CATALOGO 2026 - prodotti Domino (fonte canonica: brain/03_domino_metodi.md, brain/starter_kit_brain_identity.md):
- "Core Sprint!" (6.000 euro, 1-2 giorni) - allineamento strategico, NON "Foundation Sprint" (linguaggio startup, noi serviamo enterprise).
- "Design Sprint!" (10.000 euro, 4 giorni) - prototipo testato. Specializzazioni: Service / CX / Brand / Digital Marketing / Website / Intranet / Brain & Identity (variante di punta 2026, fondamenta brain aziendale + design system).
- "Sales Starter Kit" / "Internal Communication Starter Kit" / "CX Manager Starter Kit" - specializzazioni tattiche verticali del Brain & Identity Design Sprint! (solo layer brain, no identity / design system, nessuna integrazione IT). Format 4 settimane (3 gg workshop + 3 sett. build + 1 sett. QA), web app SSO Microsoft/Google, 40-80 nodi curati, pricing su richiesta. Buyer di funzione singolo che compra col proprio budget: Sales Director per Sales Starter Kit, HR/Internal Comms/CPO per Internal Communication, CX Manager per CX. Proporli quando il dolore e' concentrato in UNA funzione e si vuole partire veloce con perimetro chiuso e ROI in 4 settimane - apertura naturale al Brain & Identity Design Sprint! pieno a valle. Fonte: brain/starter_kit_brain_identity.md.
- "Build Sprint!" (20-60K euro, 8-52 settimane) - esecuzione a blocchi di 2 settimane o 1 mese, perimetro aperto. Sostituisce la voce storica "Progetto completo".
- "Trainstorming!" (da 15.000 euro, 12 mesi, 3 sessioni) - change management. Era rituale interno dal 2010, dal 2026 anche servizio venduto.
- "Preventivo Emozionale" - tool commerciale (minisite preventivo con analytics).
- "Audit tattico" (1.500 euro, 1-2 settimane) - entry point.

CORNICE TRASVERSALE: "Decision Design" - progettazione delle conseguenze (trade-off, scenari, effetti a 6-12 mesi). Slogan: "da come si naviga a come si sceglie". Citarlo come postura strategica, non come tool.

REGOLE: usa SOLO info dal report. Prima frase = problema del prospect. Tono diretto, concreto.
CASE STUDY - REGOLA DEI 3: [0] stesso settore/sfida con KPI [1] settore simile con KPI [2] metodologia specifica (es. Brain & Identity Design Sprint!, Sales/Internal Comms/CX Manager Starter Kit, Build Sprint!, Preventivo Emozionale, GEO, AI B2B). MAI solo Fiat e Costa Crociere.
BADGE: core_sprint se stakeholder multipli/no chiarezza. design_sprint_tipo = Service/CX/Brand/Digital Marketing/Website/Intranet/Brain & Identity. Se il dolore e' concentrato in UNA funzione (sales / internal comms / customer experience) con buyer di funzione disponibile, preferire uno Starter Kit verticale rispetto al Brain & Identity Design Sprint! pieno e citarlo esplicitamente in hook, mail e deck. preventivo_emozionale se ciclo lungo/rete indiretta.

PERSONE CHIAVE - DATI VERIFICATI:
Se il report contiene una sezione "PERSONE CHIAVE - DATI VERIFICATI (RocketReach)",
quei nominativi vengono da un database di contatti B2B e hanno la PRECEDENZA su
qualsiasi nome dedotto dalle ricerche web: usa quelli, con ruolo e grafia esatti.
I campi email e linkedin_url si compilano SOLO copiando un valore presente in quella
sezione. Se per una persona non c'e' email o URL, lascia il campo stringa vuota "".
Non dedurre mai un indirizzo dal dominio aziendale, non costruire nome.cognome@azienda.it.
Scegli decisore_target fra le persone verificate quando ce n'e' una coerente col layer GTM.

SEGNALI RECENTI - VERIFICABILITA' OBBLIGATORIA:
Ogni segnale del JSON DEVE essere un oggetto con i campi {testo, data, fonte_url, fonte_titolo}.
Il valore di fonte_url DEVE essere una URL reale presa dal report di intelligence (sezione SEGNALI RECENTI).
Se il report non ha URL per un evento, NON includerlo nell'array. Meglio 2 segnali verificabili che 5 senza prova.
Se nessun segnale ha fonte verificabile, restituisci array vuoto: "segnali_recenti": [].

${layerInstr}

${motionInstr}

Restituisci ESCLUSIVAMENTE JSON puro. Zero testo. Zero markdown. Zero backtick.

{"prospect":{"nome":"","settore":"","dimensione":"PMI|Mid-market|Enterprise","fatturato_stimato":"","mercati":"","persone_chiave":[{"nome":"","ruolo":"","anzianita":"","email":"","linkedin_url":""}],"segnali_recenti":[{"testo":"","data":"","fonte_url":"https://...","fonte_titolo":""}],"sfide_probabili":["","",""],"maturita_digitale":"","decisore_target":"","hook":"","strumenti_suggeriti":{"core_sprint":true,"core_sprint_motivazione":"","design_sprint_tipo":"Service|CX|Brand|Digital Marketing|Website|Intranet|Brain & Identity","design_sprint_motivazione":"","preventivo_emozionale":true,"preventivo_emozionale_motivazione":""},"casi_studio":[{"cliente":"","progetto":"","kpi":"","perche_affine":"","tipo":"affine"},{"cliente":"","progetto":"","kpi":"","perche_affine":"","tipo":"settore"},{"cliente":"","progetto":"","kpi":"","perche_affine":"","tipo":"metodologia"}]},"mail":{"oggetto":"","corpo":""},"deck":{"slide_1_titolo":"","slide_1_contenuto":"","slide_2_titolo":"","slide_2_contenuto":"","slide_3_titolo":"","slide_3_contenuto":"","slide_4_titolo":"Chi lha fatto con noi","slide_4_contenuto":"","slide_5_titolo":"","slide_5_contenuto":""},"workflow":[{"giorno":1,"canale":"LinkedIn","azione":""},{"giorno":3,"canale":"Email","azione":""},{"giorno":7,"canale":"LinkedIn","azione":""},{"giorno":10,"canale":"Email","azione":""},{"giorno":14,"canale":"Telefono","azione":""}],"linkedin":{"tipo":"Richiesta connessione|InMail","messaggio":""}}`;

  return [
    brainBlock(brain),
    { type: 'text', text: rest },
  ];
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

// Riparazione mirata di un classico bug LLM: chiusura prematura del root
// con un "}" extra, seguita dal resto dei campi (es. {"prospect":{...}},
// "mail":{...},...}). Cammina la stringa con state-tracker e rimuove i "}"
// spuri che porterebbero la profondita' a 0 mentre c'e' ancora ',"chiave":...'
// dopo. Iterativo: gestisce piu' "}" extra in sequenza.
function repairExtraRootCloses(text) {
  let result = text;
  for (let pass = 0; pass < 8; pass++) {
    let depth = 0, inString = false, escape = false, fixAt = -1;
    for (let i = 0; i < result.length; i++) {
      const c = result[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (c === '{' || c === '[') depth++;
      else if (c === '}' || c === ']') {
        depth--;
        if (depth === 0 && c === '}') {
          let j = i + 1;
          while (j < result.length && /\s/.test(result[j])) j++;
          if (result[j] === ',') { fixAt = i; break; }
        }
      }
    }
    if (fixAt === -1) return result;
    result = result.slice(0, fixAt) + result.slice(fixAt + 1);
  }
  return result;
}

export function parseJSON(text) {
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  let parsed = null;
  try { parsed = JSON.parse(clean); } catch {}
  if (!parsed) {
    const s = clean.indexOf('{'), e = clean.lastIndexOf('}');
    if (s !== -1 && e !== -1) { try { parsed = JSON.parse(clean.slice(s, e + 1)); } catch {} }
  }
  if (!parsed) {
    try { parsed = JSON.parse(repairExtraRootCloses(clean)); } catch {}
  }
  if (!parsed) throw new Error('JSON non valido nella risposta del modello');

  if (parsed.prospect) {
    parsed.prospect.segnali_recenti = normalizeSignals(parsed.prospect.segnali_recenti);
  }

  return normalizeProductNames(parsed);
}

// Errore di parsing: lo distinguiamo dagli altri per far scegliere all'handler
// il messaggio giusto, senza rifare la ricerca.
export class GenerationParseError extends Error {}

export async function generateMaterials({ prospect, layer, motion, report }) {
  const genData = await callClaude({
    system: buildGenerationSystem(loadBrain(), layer, motion),
    messages: [{
      role: 'user',
      content: `Prospect: "${prospect}"\nLayer: ${layer} | Motion: ${motion}\n\nReport:\n${report}\n\nGenera i materiali. Solo JSON puro.`,
    }],
    max_tokens: 16000,
  });

  const rawText = extractText(genData);
  try {
    return parseJSON(rawText);
  } catch (parseErr) {
    console.error('JSON parse fallito. stop_reason=', genData.stop_reason, 'len=', rawText.length);
    console.error('parseErr:', parseErr.message);
    console.error('--- raw response (primi 600 char) ---\n' + rawText.slice(0, 600));
    console.error('--- raw response (ultimi 400 char) ---\n' + rawText.slice(-400));
    const hint = genData.stop_reason === 'max_tokens'
      ? 'Output troncato (max_tokens raggiunto). Riduci il testo nelle Note o riprova.'
      : 'Il modello non ha restituito JSON valido. Riprova; se persiste, riduci/semplifica le Note.';
    throw new GenerationParseError(hint);
  }
}
