import { readFileSync } from 'fs';
import { join } from 'path';

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

// ICP Domino + scoring logic in the system prompt
function buildListSystem(brain) {
  return `${brain}

Sei un ricercatore specializzato nell'identificare prospect ad alto potenziale per Domino.

ICP DOMINO:
- Settori prioritari: Automotive, B2B Industriale, Salute & Sanità, Turismo & Cultura, Finance, PA
- Dimensione ideale: Mid-market (50-500 dip.) o Enterprise (500+)
- Segnali positivi: sito datato o assente, poca presenza digitale, crescita recente, job posting digital/marketing, cambi management
- Escludi clienti già Domino: Rollon, Bitron, IVECO, Case IH, Stellantis, Comau, IPI, Megadyne, Masi, Costa Crociere, Arca, Alpitour, Biennale Venezia

SCORING 1-10:
- 10: fit perfetto (settore Domino, dimensione giusta, segnali digitali forti, no competitor)
- 8-9: ottimo (2-3 criteri positivi forti)
- 6-7: buon potenziale
- 4-5: potenziale da verificare
- 1-3: fuori target

Restituisci ESCLUSIVAMENTE JSON puro. Zero testo. Zero markdown. Zero backtick.`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { settore, geografia = 'Italia', dimensione = [], keywords = '', numero = 10 } = body;

    const brain = loadBrain();
    const system = buildListSystem(brain);
    const webSearch = { type: 'web_search_20250305', name: 'web_search' };

    const userMsg = `Trova ${numero} aziende prospect per Domino con questi criteri:
Settore: ${settore}
Geografia: ${geografia}
Dimensione: ${dimensione.length ? dimensione.join(', ') : 'qualsiasi'}
Keywords aggiuntive: ${keywords || 'nessuna'}

Per ogni azienda trovata fai ricerche su sito, LinkedIn, news recenti. Assegna uno score 1-10.

Restituisci JSON con struttura: { "lista": [...], "totale_trovate": N, "criteri_applicati": "..." }
Ogni elemento: { nome, sito, settore, sede, dimensione, fatturato_stimato, score, score_motivazione, segnale_principale, decisore_probabile }`;

    let messages = [{ role: 'user', content: userMsg }];
    let data = await callClaude({ system, messages, tools: [webSearch], max_tokens: 8000 });

    let i = 0;
    while (data.stop_reason === 'tool_use' && i < 15) {
      i++;
      const toolBlocks = data.content.filter(b => b.type === 'tool_use');
      if (!toolBlocks.length) break;
      messages = [...messages, { role: 'assistant', content: data.content }];
      const feedback = i < 10
        ? 'Continua ricercando. Verifica siti e segnali digitali per ogni azienda trovata.'
        : 'Hai abbastanza dati. Produci il JSON finale con la lista completa e scoring.';
      const results = toolBlocks.map(b => ({ type: 'tool_result', tool_use_id: b.id, content: feedback }));
      messages = [...messages, { role: 'user', content: results }];
      data = await callClaude({ system, messages, tools: [webSearch], max_tokens: 8000 });
    }

    const result = parseJSON(extractText(data));
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
