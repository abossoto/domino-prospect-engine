import { readFileSync } from 'fs';
import { join } from 'path';

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
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
}

function parseJSON(text) {
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(clean);
}

const LIST_SYSTEM = `Sei un sales intelligence agent per Domino, agenzia CX italiana (domino.it).
Trova aziende reali prospect qualificati per Domino e produci una lista con scoring.

ICP DOMINO — PROFILO CLIENTE IDEALE:
- Settori core: Automotive, B2B Industriale/Manifatturiero, Salute & Sanità, Turismo & Cultura, Finance, PA
- Dimensione ideale: Mid-market (50-500 dip.) o Enterprise (500+)
- Segnali positivi: sito datato, poca presenza digitale, crescita recente, job posting digital, cambio management
- Escludi clienti già Domino: Rollon, Bitron, IVECO, Case IH, Stellantis, Comau, IPI, Megadyne, Masi,
  Costa Crociere, Arca Fondi, Alpitour, Biennale Venezia, Fiat, Affidea, SKF, Danieli

SCORING 1-10:
- 10: fit perfetto (settore core, Mid-market/Enterprise, segnali digitali evidenti, no competitor)
- 8-9: ottimo (2-3 criteri positivi forti)
- 6-7: buon potenziale
- 4-5: potenziale incerto
- 1-3: fuori target

Fai 8-12 ricerche concrete. Query tipo:
"[settore] aziende [area] fatturato dipendenti"
"[azienda] sito web presenza digitale"
"[azienda] offerte lavoro digital marketing 2024 2025"
"[settore] [area] aziende crescita 2024 2025"

Produci SOLO JSON puro alla fine — zero testo, zero markdown, zero backtick.
{
  "lista": [{
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
  }],
  "totale_trovate": 10,
  "criteri_applicati": "string — riepilogo filtri usati"
}`;

async function runListAgent(settore, geografia, dimensione, keywords, numero) {
  const webSearch = { type: 'web_search_20250305', name: 'web_search' };
  const dimStr    = dimensione?.length ? ` Dimensione preferita: ${dimensione.join(', ')}.` : '';
  const kwStr     = keywords ? ` Focus aggiuntivo: ${keywords}.` : '';
  const userMsg   = `Trova ${numero} aziende prospect reali per Domino. Settore: ${settore}. Area: ${geografia || 'Italia'}.${dimStr}${kwStr}`;

  let messages = [{ role: 'user', content: userMsg }];
  let data = await callClaude({ system: LIST_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });

  let i = 0;
  while (data.stop_reason === 'tool_use' && i < 15) {
    i++;
    const toolBlocks = data.content.filter(b => b.type === 'tool_use');
    if (!toolBlocks.length) break;
    messages = [...messages, { role: 'assistant', content: data.content }];

    const feedback =
      i < 6  ? 'Continua la ricerca — cerca altre aziende e verifica siti e presenza digitale.' :
      i < 12 ? 'Verifica job posting per le aziende trovate, poi completa la lista.' :
               `Hai abbastanza dati. Produci il JSON finale con ${numero} prospect ordinati per score.`;

    const results = toolBlocks.map(b => ({ type: 'tool_result', tool_use_id: b.id, content: feedback }));
    messages = [...messages, { role: 'user', content: results }];
    data = await callClaude({ system: LIST_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });
  }
  return extractText(data);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { settore, geografia = 'Italia', dimensione = [], keywords = '', numero = 10 } = req.body;
    if (!settore) return res.status(400).json({ error: 'settore obbligatorio' });

    const text   = await runListAgent(settore, geografia, dimensione, keywords, numero);
    const result = parseJSON(text);
    return res.status(200).json(result);
  } catch (err) {
    console.error('prospect-list error:', err);
    return res.status(500).json({ error: err.message });
  }
}
