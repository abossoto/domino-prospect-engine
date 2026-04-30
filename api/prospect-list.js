import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// ─── Brain cache — persists across warm invocations ───────────────────────────
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

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function callClaude({ system, messages, tools, max_tokens = 8000 }) {
  const body = { model: 'claude-sonnet-4-6', max_tokens, system, messages, output_config: { effort: 'low' } };
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

function parseJSON(text) {
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(clean);
}

const LIST_RESEARCH_SYSTEM = `Sei un analista commerciale senior per Domino, agenzia CX italiana.
Il tuo compito è identificare aziende prospect qualificate usando ricerche web reali.

PROFILO ICP DI DOMINO (Ideal Customer Profile):
- Settori: Automotive, B2B Industriale, Salute & Sanità, Turismo & Cultura, Finance, PA
- Dimensione ideale: Mid-market (50-500 dipendenti) o Enterprise (500+)
- Caratteristiche: presenza digitale migliorabile, processi complessi, mercati multipli
- Segnali positivi: sito datato, poca presenza digitale, crescita recente, job posting digital, cambi management
- Segnali negativi: già cliente Domino, già dotata di agency strutturata dedicata

REGOLE:
- Cerca SOLO aziende reali — mai inventare nomi
- Per ogni azienda: verifica che esista davvero cercando il sito
- Segnala "⚠️ Non verificato" se non riesci a trovare dati sufficienti
- Priorità a aziende italiane (o con sede in Italia) a meno che non specificato diversamente`;

function buildListGenSystem(brain) {
  return `${brain}

Sei il generatore di liste prospect per Domino. Ricevi una lista di aziende trovate nella research e produci l'output strutturato.

SCORING (1-10) — basato su fit con Domino:
10: Fit perfetto — settore Domino, dimensione giusta, segnali digitali chiari, nessun competitor evidente
8-9: Ottimo fit — 2-3 criteri positivi forti
6-7: Buon potenziale — fit di settore ma meno segnali
4-5: Potenziale — settore adiacente o segnali deboli
1-3: Poco probabile — fuori target o già ben servito

Restituisci ESCLUSIVAMENTE JSON puro. Zero testo. Zero markdown. Zero backtick.

{
  "lista": [
    {
      "nome": "string",
      "sito": "string | null",
      "settore": "string",
      "sede": "string",
      "dimensione": "PMI | Mid-market | Enterprise",
      "fatturato_stimato": "string | null",
      "score": 8,
      "score_motivazione": "string — max 1 frase, perché è un buon prospect",
      "segnale_principale": "string — il segnale più rilevante trovato",
      "decisore_probabile": "string — es. Direttore Marketing, CMO, CDO"
    }
  ],
  "totale_trovate": 10,
  "criteri_applicati": "string — riassunto breve dei criteri usati nella ricerca"
}`;
}

async function runListAgent(settore, geografia, dimensione, keywords, numero, brain) {
  const webSearch = { type: 'web_search_20250305', name: 'web_search' };
  const dimLabel = dimensione?.length ? dimensione.join(' o ') : 'qualsiasi dimensione';

  const userMsg = `Trova ${numero} aziende prospect qualificate per Domino con questi criteri:

SETTORE: ${settore}
AREA GEOGRAFICA: ${geografia || 'Italia'}
DIMENSIONE: ${dimLabel}
PAROLE CHIAVE: ${keywords || 'nessuna specifica'}

PROCEDURA:
1. Cerca aziende del settore indicato nell'area geografica specificata
2. Per ogni azienda trovata, verifica che esista realmente cercando il sito web
3. Valuta la qualità della loro presenza digitale (sito, social, news)
4. Cerca segnali di bisogno: sito datato, job posting digital, crescita recente, riorganizzazioni
5. Identifica il probabile decisore da contattare (CMO, Direttore Marketing, CDO, ecc.)

Fai almeno 6-8 ricerche per trovare e verificare le aziende.
Priorità: aziende con segnali chiari di bisogno digitale e dimensione coerente con progetti Domino (budget tipico 20K-200K€).
Escludi clienti Domino già noti: Rollon, Bitron, IVECO, Case IH, Stellantis, Comau, IPI, Megadyne, Masi, Costa Crociere, Arca, Alpitour, Biennale Venezia.`;

  let messages = [{ role: 'user', content: userMsg }];
  let data = await callClaude({ system: LIST_RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 6000 });

  let i = 0;
  while (data.stop_reason === 'tool_use' && i < 8) {
    i++;
    const toolBlocks = data.content.filter(b => b.type === 'tool_use');
    if (!toolBlocks.length) break;
    messages = [...messages, { role: 'assistant', content: data.content }];
    const feedback = i < 5
      ? `Continua — cerca altre aziende del settore ${settore}. Verifica i siti di quelle già trovate.`
      : 'Hai trovato abbastanza aziende. Ora hai tutti i dati per produrre la lista finale.';
    const results = toolBlocks.map(b => ({ type: 'tool_result', tool_use_id: b.id, content: feedback }));
    messages = [...messages, { role: 'user', content: results }];
    data = await callClaude({ system: LIST_RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 6000 });
  }

  return extractText(data);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { settore, geografia, dimensione, keywords, numero = 10 } = req.body || {};
  if (!settore?.trim()) return res.status(400).json({ error: 'Settore richiesto' });

  try {
    const brain = loadBrain(); // cached after first cold start
    const researchReport = await runListAgent(settore, geografia, dimensione, keywords, numero, brain);
    const genSystem = buildListGenSystem(brain);

    const genData = await callClaude({
      system: genSystem,
      messages: [{
        role: 'user',
        content: `Criteri: settore=${settore}, area=${geografia || 'Italia'}, dimensione=${dimensione?.join(',')}, keywords=${keywords}, numero=${numero}\n\nRisultati della ricerca:\n${researchReport}\n\nGenera la lista strutturata. Solo JSON puro.`,
      }],
      max_tokens: 4000,
    });

    const result = parseJSON(extractText(genData));
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
