// api/_shared.js
// Codice condiviso fra gli endpoint del Prospect Engine.
// Vercel non espone come route i file che iniziano con "_".
//
// Perche' esiste: research e generation sono due fasi separate (/api/research e
// /api/generate) ma devono usare LO STESSO identico prefisso di brain, altrimenti
// ogni endpoint pagherebbe la propria scrittura di cache. Un solo loadBrain(),
// una sola stringa, una sola entry di cache condivisa.

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export const MODEL = 'claude-sonnet-5';

// Il tool di ricerca e' server-side: Anthropic esegue le query da sola e
// restituisce blocchi server_tool_use / web_search_tool_result nella stessa
// risposta. Non esiste nessun loop client-side da orchestrare.
// max_uses va calibrato sul compito: l'analisi di un singolo prospect chiede
// "almeno 8-10 ricerche", la generazione di una lista deve trovare N aziende E
// verificare il sito di ognuna, quindi ne richiede molte di piu'. Un tetto
// troppo basso non rallenta: fa restituire al modello un risultato vuoto.
//
// Versione 20250305, non 20260209. La 20260209 fa girare le ricerche dentro
// blocchi di code_execution ("dynamic filtering"); quando il modello ne apre
// due insieme il server li tiene fermi ~95s prima di rispondere (misurato,
// sempre 95-96s, anche due volte nella stessa chiamata). Non si puo' impedire:
// disable_parallel_tool_use e' rifiutato con il programmatic tool calling.
// Con la 20250305 la ricerca di un prospect e' passata da 120-270s a 29-38s
// a parita' di qualita' del report.
// La lista resta sulla 20260209 (filtroDinamico): con 40 ricerche in una sola
// chiamata il filtro tiene il contesto piu' corto, e nell'unica prova con la
// 20250305 la lista e' uscita con 5 aziende invece di 10. Da rimisurare.
export function webSearchTool(maxUses, { filtroDinamico = false } = {}) {
  return { type: filtroDinamico ? 'web_search_20260209' : 'web_search_20250305', name: 'web_search', max_uses: maxUses };
}

// ── Budget di tempo ──────────────────────────────────────────────────────────
// I timeout per-chiamata non sanno nulla del budget totale della function: la
// somma di ricerca + riprese + generazione puo' superare di molto il maxDuration
// di vercel.json, e in quel caso Vercel chiude la connessione con un 504 grezzo
// prima che il nostro handler possa rispondere. La scadenza e' unica per
// richiesta e ogni chiamata ci si adatta.
// Ogni endpoint dichiara il proprio budget, che DEVE coincidere col maxDuration
// che ha in vercel.json.
// Nota: gli 800s del piano Pro richiedono Fluid Compute attivo sul progetto.
// Senza, un maxDuration sopra 300 fa fallire il build con "invalid maxDuration
// for plan" e Vercel non pubblica nulla - l'ultimo deploy buono resta online.
// Con il carico attuale non servono comunque: misurati 226s sul filtro PMI e
// 188s sul Mid-market, dentro i 275s di budget effettivo.
export const DURATA_DEFAULT_MS = 300000;
export const DURATA_RICERCA_MS = 300000;  // alzabile a 600000 se si attiva Fluid Compute
const MARGINE_MS = 25000;                 // tempo per serializzare e rispondere

export function creaScadenza(maxDurataMs = DURATA_DEFAULT_MS) {
  return Date.now() + maxDurataMs - MARGINE_MS;
}

export function tempoResiduo(scadenza) {
  return scadenza ? scadenza - Date.now() : Infinity;
}

// File brain esclusi dal contesto inviato al modello: descrivono il layout
// visivo di .docx e .pptx (punti tipografici, margini, colori hex) che viene
// prodotto client-side da dossierBuilder.js e pptBuilder.js a partire da
// designSystem.js, non dal JSON del modello. Restano autoritativi in brain/.
// Per rimetterli nel contesto basta svuotare questo Set.
const BRAIN_EXCLUDE = new Set([
  '14_domino_document_design.md',
  '15_domino_document_word.md',
  '16_domino_deck_pptx.md',
]);

let _brainCache = null;

export function loadBrain() {
  if (_brainCache) return _brainCache;
  const brainDir = join(process.cwd(), 'brain');
  const files = readdirSync(brainDir)
    .filter(f => f.endsWith('.md') && !BRAIN_EXCLUDE.has(f))
    .sort();
  _brainCache = files.map(f => {
    try { return readFileSync(join(brainDir, f), 'utf-8'); }
    catch { return `[ATTENZIONE: file brain/${f} non trovato]`; }
  }).join('\n\n---\n\n');
  return _brainCache;
}

// Blocco di sistema del brain, identico ovunque. ttl 1h invece dei 5 minuti di
// default: l'uso reale e' a raffica (piu' prospect di fila, piu' layer GTM sullo
// stesso prospect) ma distribuito su decine di minuti, quindi con 5 minuti la
// cache era quasi sempre fredda.
export function brainBlock(brain) {
  return { type: 'text', text: brain, cache_control: { type: 'ephemeral', ttl: '1h' } };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Le risposte arrivano in streaming. Senza, la connessione resta muta per tutto
// il tempo in cui Claude cerca e scrive (anche oltre un minuto) e ogni tanto
// la risposta non arrivava mai: misurato su 8 chiamate di ricerca identiche,
// 3 appese fino al timeout, mentre le stesse in streaming finivano tutte in
// 50-80s. Con lo streaming arrivano eventi (e ping) continui, e un flusso
// fermo si riconosce subito.
const STREAM_FERMO_MS = 60000;

// Ricostruisce dallo stream lo stesso oggetto della risposta non-streaming
// (content, stop_reason, usage). I blocchi devono essere identici a quelli
// originali: in caso di pause_turn vengono rimandati tali e quali.
async function leggiStream(res, vivo) {
  const msg = { content: [], stop_reason: null, usage: {} };
  const json = new Map();   // indice blocco -> input JSON parziale
  const dec = new TextDecoder();
  let buf = '';
  for await (const chunk of res.body) {
    vivo();
    buf += dec.decode(chunk, { stream: true });
    let fine;
    while ((fine = buf.indexOf('\n\n')) >= 0) {
      const evento = buf.slice(0, fine);
      buf = buf.slice(fine + 2);
      const riga = evento.split('\n').find(l => l.startsWith('data:'));
      if (!riga) continue;
      const d = JSON.parse(riga.slice(5));
      switch (d.type) {
        case 'message_start':
          Object.assign(msg, d.message, { content: [] });
          break;
        case 'content_block_start':
          msg.content[d.index] = { ...d.content_block };
          if ('input' in d.content_block) json.set(d.index, '');
          break;
        case 'content_block_delta': {
          const b = msg.content[d.index], x = d.delta;
          if (x.type === 'text_delta') b.text = (b.text || '') + x.text;
          else if (x.type === 'input_json_delta') json.set(d.index, json.get(d.index) + x.partial_json);
          else if (x.type === 'thinking_delta') b.thinking = (b.thinking || '') + x.thinking;
          else if (x.type === 'signature_delta') b.signature = x.signature;
          else if (x.type === 'citations_delta') (b.citations ||= []).push(x.citation);
          break;
        }
        case 'content_block_stop':
          if (json.has(d.index)) {
            const raw = json.get(d.index);
            msg.content[d.index].input = raw ? JSON.parse(raw) : (msg.content[d.index].input || {});
            json.delete(d.index);
          }
          break;
        case 'message_delta':
          Object.assign(msg, d.delta);
          Object.assign(msg.usage, d.usage);
          break;
        case 'error': {
          // Errore a stream gia' aperto (tipicamente overloaded_error): lo si
          // tratta come il corrispondente codice HTTP.
          const tipo = d.error?.type;
          const e = new Error(d.error?.message || tipo || 'errore nello stream');
          e.status = tipo === 'overloaded_error' ? 529 : tipo === 'rate_limit_error' ? 429 : 500;
          throw e;
        }
      }
    }
  }
  if (!msg.stop_reason) throw new Error('stream interrotto prima della fine');
  return msg;
}

// signal: interruzione dall'esterno, per le chiamate lanciate in parallelo
// "per sicurezza" che diventano inutili (es. la ricerca web dei Rientri quando
// RocketReach ha gia' trovato tutto). Un'interruzione voluta non si ritenta.
export async function callClaude({ system, messages, tools, max_tokens = 16000, timeoutMs = 180000, scadenza, signal }) {
  const body = { model: MODEL, max_tokens, system, messages, output_config: { effort: 'low' }, stream: true };
  if (tools?.length) body.tools = tools;
  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Il timeout effettivo non puo' mai eccedere quel che resta del budget.
    const residuo = tempoResiduo(scadenza);
    if (residuo <= 10000) {
      throw new Error('OVERLOADED:Tempo massimo della richiesta esaurito. Riprova, oppure riduci il numero di aziende richieste.');
    }
    const timeoutEffettivo = Math.min(timeoutMs, residuo - 5000);
    signal?.throwIfAborted();

    const fermo = new AbortController();
    let timerFermo;
    const vivo = () => {
      clearTimeout(timerFermo);
      timerFermo = setTimeout(() => fermo.abort(Object.assign(new Error('stream fermo'), { name: 'StreamFermo' })), STREAM_FERMO_MS);
    };
    const segnali = [AbortSignal.timeout(timeoutEffettivo), fermo.signal];
    if (signal) segnali.push(signal);

    let status, retryAfter = 0;
    try {
      vivo();
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.any(segnali),
      });
      if (res.ok) return await leggiStream(res, vivo);
      status = res.status;
      retryAfter = parseInt(res.headers.get('retry-after') || '0', 10);
      if (status < 500 && status !== 429) {
        const e = await res.json().catch(() => ({}));
        throw Object.assign(new Error(e?.error?.message || `Claude API ${status}`), { definitivo: true });
      }
    } catch (err) {
      if (signal?.aborted) throw signal.reason;
      if (err.definitivo) throw err;
      if (err.status) status = err.status;
      else {
        // Timeout, stream fermo o errore di rete: senza questo ramo la function
        // restava appesa fino ai 300s di maxDuration e moriva senza messaggio utile.
        const nome = fermo.signal.aborted ? 'StreamFermo' : err.name;
        if (attempt >= 2) throw new Error(`OVERLOADED:Claude non risponde (${nome}). Riprova tra qualche minuto.`);
        await sleep(2000 * (attempt + 1));
        continue;
      }
    } finally {
      clearTimeout(timerFermo);
    }

    if (status === 529 || status === 429) {
      if (attempt >= MAX_RETRIES) throw new Error('OVERLOADED:Claude e\' sovraccarico. Riprova tra qualche minuto.');
      const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(1000 * Math.pow(2, attempt), 32000);
      if (backoff >= tempoResiduo(scadenza)) {
        throw new Error('OVERLOADED:Claude e\' sovraccarico e non c\'e\' piu\' tempo per riprovare. Riprova fra qualche minuto.');
      }
      await sleep(backoff);
      continue;
    }
    // 5xx diversi da 529
    if (attempt >= 2) throw new Error(`OVERLOADED:Errore temporaneo del server (${status}). Sto riprovando...`);
    await sleep(2000 * (attempt + 1));
  }
  throw new Error('OVERLOADED:Claude non ha risposto dopo piu\' tentativi. Riprova tra qualche minuto.');
}

export function extractText(data) {
  return data.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || '';
}

export function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
