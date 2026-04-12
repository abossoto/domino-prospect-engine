import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Brain loader ─────────────────────────────────────────────────────────────
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
      try { return readFileSync(join(process.cwd(), 'brain', f), 'utf-8'); }
      catch { return `[ATTENZIONE: file brain/${f} non trovato]`; }
    })
    .join('\n\n---\n\n');
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
  return (data.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');
}

function parseJSON(text) {
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(clean);
}

// ─── List Agent System Prompt ─────────────────────────────────────────────────
const LIST_SYSTEM = `Sei un sales intelligence agent per Domino, agenzia CX italiana (domino.it).
Il tuo compito è trovare aziende reali che siano prospect qualificati per Domino e produrre una lista con scoring.

ICP DOMINO — PROFILO CLIENTE IDEALE:
- Settori core: Automotive, B2B Industriale/Manifatturiero, Salute & Sanità, Turismo & Cultura, Finance, PA
- Dimensione ideale: Mid-market (50-500 dip.) o Enterprise (500+)
- Segnali positivi: sito datato o assente, poca presenza digitale, crescita recente, job posting digital,
  cambio management recente, acquisizioni, espansione internazionale, prodotto complesso con rete vendita
- Escludere clienti già Domino: Rollon, Bitron, IVECO, Case IH, Stellantis, Comau, IPI, Megadyne,
  Masi, Costa Crociere, Arca Fondi, Alpitour, Biennale Venezia, Fiat, Affidea, SKF, Danieli

SCORING 1-10:
- 10: fit perfetto (settore core Domino, dimensione Mid-market/Enterprise, segnali digitali evidenti, no competitor)
- 8-9: ottimo fit (2-3 criteri positivi forti)
- 6-7: buon potenziale (1-2 criteri positivi)
- 4-5: potenziale ma incerto
- 1-3: fuori target o già cliente

PROCESSO DI RICERCA:
1. Cerca aziende reali nel settore e area geografica specificati
2. Verifica esistenza sito web e qualità presenza digitale
3. Cerca segnali di bisogno: job posting digital, news recenti, cambi management
4. Identifica il decisore probabile (CEO, CMO, Dir. Marketing/Digital/CX)
5. Assegna score motivato in 1 frase

Fai almeno 8-12 ricerche concrete. Usa query come:
"[settore] aziende [area] fatturato dipendenti"
"[azienda trovata] sito web presenza digitale"
"[azienda trovata] offerte lavoro digital marketing"
"[settore] [area] aziende crescita 2024 2025"

Produci SOLO JSON puro alla fine — zero testo, zero markdown, zero backtick.

STRUTTURA JSON RICHIESTA:
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
      "score_motivazione": "string — max 1 frase",
      "segnale_principale": "string",
      "decisore_probabile": "string"
    }
  ],
  "totale_trovate": 10,
  "criteri_applicati": "string — riepilogo filtri usati"
}`;

// ─── List Agent (agentic loop, max 15 iterations) ─────────────────────────────
async function runListAgent(settore, geografia, dimensione, keywords, numero) {
  const webSearch = { type: 'web_search_20250305', name: 'web_search' };

  const dimStr = dimensione?.length ? ` Dimensione preferita: ${dimensione.join(', ')}.` : '';
  const kwStr  = keywords ? ` Focus aggiuntivo: ${keywords}.` : '';
  const userMsg = `Trova ${numero} aziende prospect reali per Domino.
Settore: ${settore}. Area geografica: ${geografia || 'Italia'}.${dimStr}${kwStr}
Fai ricerche web concrete, verifica siti e segnali, poi produci il JSON della lista con scoring.`;

  let messages = [{ role: 'user', content: userMsg }];
  let data = await callClaude({ system: LIST_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });

  let i = 0;
  while (data.stop_reason === 'tool_use' && i < 15) {
    i++;
    const toolBlocks = data.content.filter(b => b.type === 'tool_use');
    if (!toolBlocks.length) break;
    messages = [...messages, { role: 'assistant', content: data.content }];

    const feedback =
      i < 6  ? 'Continua la ricerca — cerca altre aziende e verifica i siti di quelle trovate.' :
      i < 12 ? 'Verifica presenza digitale e job posting per le aziende trovate, poi completa la lista.' :
               `Hai abbastanza dati. Produci il JSON finale con almeno ${numero} prospect ordinati per score.`;

    const results = toolBlocks.map(b => ({
      type: 'tool_result',
      tool_use_id: b.id,
      content: feedback,
    }));
    messages = [...messages, { role: 'user', content: results }];
    data = await callClaude({ system: LIST_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });
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
    const {
      settore,
      geografia = 'Italia',
      dimensione = [],
      keywords = '',
      numero = 10,
    } = req.body;

    if (!settore) return res.status(400).json({ error: 'settore obbligatorio' });

    const text = await runListAgent(settore, geografia, dimensione, keywords, numero);
    const result = parseJSON(text);

    return res.status(200).json(result);
  } catch (err) {
    console.error('prospect-list error:', err);
    return res.status(500).json({ error: err.message });
  }
}
