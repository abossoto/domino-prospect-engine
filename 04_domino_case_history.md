import { readFileSync } from 'fs';
import { join } from 'path';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function callClaude({ system, messages, tools, max_tokens = 4000 }) {
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
  return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
}

// FIX: parseJSON robusto — estrae il JSON anche se c'è testo prima/dopo
function parseJSON(text) {
  let clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    clean = clean.slice(start, end + 1);
  }
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error('JSON parse failed. Preview:', clean.slice(0, 300));
    throw new Error(`JSON non valido: ${e.message}`);
  }
}

const LIST_RESEARCH_SYSTEM = `Sei un analista di intelligence commerciale per Domino, agenzia CX italiana.
Il tuo compito è trovare aziende prospect qualificate per Domino usando ricerche web reali.

ICP DOMINO:
- Settori: Automotive, B2B Industriale/Manifatturiero, Salute & Sanità, Turismo & Cultura, Finance & Assicurazioni, PA
- Dimensione: Mid-market (50-500 dip.) o Enterprise (500+)
- Segnali positivi: sito datato, poca presenza digitale, crescita recente, job posting digital/marketing, cambi management
- Escludere clienti già Domino: Rollon, Bitron, IVECO, Case IH, Stellantis, Comau, IPI, Megadyne, Masi, Costa Crociere, Arca, Alpitour, Biennale Venezia

CRITERI DI SCORING (1-10):
- 10: fit perfetto (settore Domino, dimensione target, segnali digitali chiari, non cliente Domino)
- 8-9: ottimo (2-3 criteri positivi forti)
- 6-7: buon potenziale (1-2 criteri positivi)
- 4-5: potenziale debole
- 1-3: fuori target

ISTRUZIONI:
1. Fai ricerche web reali per trovare aziende nel settore/geografia richiesti
2. Verifica sito web e presenza digitale per ciascuna
3. Cerca segnali di bisogno (sito datato, job posting digital, news di crescita)
4. Assegna score motivato per ciascuna
5. USA SOLO aziende reali trovate sul web — mai inventare`;

const LIST_GENERATION_SYSTEM = `Sei il generatore di liste prospect per Domino.
Ricevi un report di ricerca e produci ESCLUSIVAMENTE un oggetto JSON valido.

IMPORTANTE: 
- Produci SOLO il JSON, senza testo prima o dopo, senza markdown fences
- Se non hai trovato abbastanza aziende, riduci la lista ma mantieni il JSON valido e completo
- Non lasciare il JSON incompleto: meglio 5 prospect completi che 10 troncati

Il JSON deve seguire ESATTAMENTE questa struttura:
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
  "criteri_applicati": "string"
}`;

async function runListResearch(settore, geografia, dimensione, keywords, numero) {
  const webSearch = { type: 'web_search_20250305', name: 'web_search' };
  const dimText = dimensione?.length ? dimensione.join(', ') : 'Mid-market o Enterprise';
  const kwText = keywords?.trim() ? `\nKeyword aggiuntive: ${keywords}` : '';

  const userMsg = `Trova ${numero} aziende prospect per Domino con questi criteri:
- Settore: ${settore}
- Geografia: ${geografia}
- Dimensione: ${dimText}${kwText}

Fai ricerche web reali per trovare aziende specifiche, verifica i loro siti e presenza digitale.`;

  let messages = [{ role: 'user', content: userMsg }];
  let data = await callClaude({ system: LIST_RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 6000 });

  let i = 0;
  while (data.stop_reason === 'tool_use' && i < 15) {
    i++;
    const toolBlocks = data.content.filter(b => b.type === 'tool_use');
    if (!toolBlocks.length) break;
    messages = [...messages, { role: 'assistant', content: data.content }];

    const feedback =
      i < 8  ? 'Continua — cerca altre aziende nel settore e verifica i loro siti web e presenza digitale.' :
      i < 12 ? 'Approfondisci le aziende più promettenti, poi produci il report con scoring.' :
               'Hai abbastanza dati. Produci il report finale con tutte le aziende trovate e il loro scoring.';

    const results = toolBlocks.map(b => ({ type: 'tool_result', tool_use_id: b.id, content: feedback }));
    messages = [...messages, { role: 'user', content: results }];
    data = await callClaude({ system: LIST_RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 6000 });
  }
  return extractText(data);
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { settore, geografia = 'Italia', dimensione = [], keywords = '', numero = 10 } = req.body;
    if (!settore?.trim()) return res.status(400).json({ error: 'settore richiesto' });

    // Step 1: Research
    const report = await runListResearch(settore, geografia, dimensione, keywords, numero);

    // Step 2: Generate JSON list — FIX: max_tokens aumentato a 4000
    const genData = await callClaude({
      system: LIST_GENERATION_SYSTEM,
      messages: [{
        role: 'user',
        content: `Report ricerca:\n\n${report}\n\nGenera la lista di ${numero} prospect in JSON. Produci SOLO il JSON, niente altro.`
      }],
      max_tokens: 4000, // era 1000 — troppo basso per liste di 10-20 prospect
    });

    const generatedText = extractText(genData);
    const result = parseJSON(generatedText);

    return res.status(200).json(result);
  } catch (err) {
    console.error('prospect-list error:', err);
    return res.status(500).json({ error: err.message });
  }
}
