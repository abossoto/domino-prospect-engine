import { readFileSync } from 'fs';
import { join } from 'path';

// ─── CLAUDE API HELPER (con prompt caching abilitato) ───────────────────────
async function callClaude({ system, messages, tools, max_tokens = 8000 }) {
  const body = { model: 'claude-sonnet-4-20250514', max_tokens, system, messages };
  if (tools?.length) body.tools = tools;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',   // ← CACHING ABILITATO
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── EXTRACT TEXT ────────────────────────────────────────────────────────────
function extractText(data) {
  return data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');
}

// ─── PARSE JSON (robusto) ────────────────────────────────────────────────────
function parseJSON(text) {
  // Cerca il JSON anche se c'è testo attorno
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Nessun JSON trovato nella risposta');
  const clean = match[0].replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(clean);
}

// ─── LIST SYSTEM PROMPT (con cache_control — non cambia mai) ─────────────────
const LIST_SYSTEM = [
  {
    type: 'text',
    text: `Sei un agente di sales intelligence per Domino, agenzia CX italiana (domino.it).
Il tuo compito è trovare aziende prospect qualificate per Domino usando ricerche web reali.

ICP DOMINO (Ideal Customer Profile):
- Settori target: Automotive, B2B Industriale/Manifatturiero, Salute & Sanità, Turismo & Cultura, Finance & Assicurazioni, PA
- Dimensione ideale: Mid-market (50-500 dip.) o Enterprise (500+)
- Segnali positivi: sito datato o non ottimizzato, poca presenza digitale, crescita recente,
  job posting per ruoli digital/marketing, cambi di management, espansione internazionale
- Escludi clienti già Domino: Rollon, Bitron, IVECO, Case IH, Stellantis, Comau, IPI,
  Megadyne, Masi, Costa Crociere, Arca Fondi, Alpitour, Biennale Venezia

SCORING 1-10:
- 10: fit perfetto (settore Domino, dimensione corretta, segnali digitali chiari, no competitor)
- 8-9: ottimo (2-3 criteri positivi forti)
- 6-7: buon potenziale (1-2 criteri positivi)
- 4-5: potenziale ma incerto
- 1-3: fuori target

Per ogni azienda trovata:
1. Verifica che esista realmente (cerca il sito ufficiale)
2. Stima la dimensione e il settore
3. Identifica il segnale principale di bisogno digitale
4. Individua il probabile decisore (ruolo, non nome)

REGOLA: includi solo aziende reali con sito verificabile. Se non trovi abbastanza aziende
qualificate, segnalalo nel campo criteri_applicati.

OUTPUT: JSON puro, zero testo extra, zero markdown, zero backtick.
Struttura:
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
  "criteri_applicati": "string"
}`,
    cache_control: { type: 'ephemeral' },  // ← cachato: system prompt statico
  }
];

// ─── LIST AGENT ───────────────────────────────────────────────────────────────
async function runListAgent(settore, geografia, dimensione, keywords, numero) {
  const webSearch = { type: 'web_search_20250305', name: 'web_search' };

  const dimStr = dimensione.length ? dimensione.join(', ') : 'Mid-market, Enterprise';
  const kwStr = keywords ? `\nKeyword aggiuntive: ${keywords}` : '';

  let messages = [{
    role: 'user',
    content: `Trova ${numero} aziende prospect per Domino con questi criteri:
- Settore: ${settore}
- Geografia: ${geografia}
- Dimensione: ${dimStr}${kwStr}

Fai ricerche reali per trovare aziende specifiche. Verifica i siti. Poi restituisci il JSON.`,
  }];

  let data = await callClaude({ system: LIST_SYSTEM, messages, tools: [webSearch], max_tokens: 4000 });

  let i = 0;
  while (data.stop_reason === 'tool_use' && i < 15) {
    i++;
    const toolBlocks = data.content.filter(b => b.type === 'tool_use');
    if (!toolBlocks.length) break;
    messages = [...messages, { role: 'assistant', content: data.content }];

    const feedback =
      i < 6  ? 'Continua la ricerca — cerca altre aziende e verifica i siti.' :
      i < 12 ? 'Verifica presenza digitale e job posting, poi completa la lista.' :
               `Produci il JSON finale con ${numero} prospect ordinati per score.`;

    const results = toolBlocks.map(b => ({ type: 'tool_result', tool_use_id: b.id, content: feedback }));
    messages = [...messages, { role: 'user', content: results }];
    data = await callClaude({ system: LIST_SYSTEM, messages, tools: [webSearch], max_tokens: 4000 });
  }

  return extractText(data);
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { settore, geografia = 'Italia', dimensione = [], keywords = '', numero = 10 } = req.body;
    if (!settore) return res.status(400).json({ error: 'settore obbligatorio' });

    const text = await runListAgent(settore, geografia, dimensione, keywords, numero);
    return res.status(200).json(parseJSON(text));
  } catch (err) {
    console.error('prospect-list error:', err);
    return res.status(500).json({ error: err.message });
  }
}
