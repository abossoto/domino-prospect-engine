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
export const WEB_SEARCH_TOOL = { type: 'web_search_20260209', name: 'web_search', max_uses: 12 };

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

export async function callClaude({ system, messages, tools, max_tokens = 16000, timeoutMs = 180000 }) {
  const body = { model: MODEL, max_tokens, system, messages, output_config: { effort: 'low' } };
  if (tools?.length) body.tools = tools;
  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      // Timeout o errore di rete: senza questo ramo la function restava appesa
      // fino ai 300s di maxDuration e moriva senza messaggio utile.
      if (attempt >= 2) throw new Error(`OVERLOADED:Claude non risponde (${err.name}). Riprova tra qualche minuto.`);
      await sleep(2000 * (attempt + 1));
      continue;
    }
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
