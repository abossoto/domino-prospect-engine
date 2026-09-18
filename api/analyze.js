// api/analyze.js
// Endpoint storico: ricerca + generazione in una sola chiamata.
// Resta per compatibilita' (integrazioni esterne, chiamate dirette). Il
// frontend usa /api/research e /api/generate separati, cosi' il report si
// puo' riusare fra layer GTM diversi.

import { applyCors } from './_shared.js';
import { runResearch } from './_research.js';
import { raccogliPersone, bloccoReport } from './_people.js';
import { generateMaterials, GenerationParseError } from './_generate.js';

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prospect, note, layer = 'headof', motion = 'bottomup' } = req.body || {};
  if (!prospect?.trim()) return res.status(400).json({ error: 'Prospect richiesto' });

  try {
    const [ricerca, persone] = await Promise.all([
      runResearch(prospect.trim(), note?.trim()),
      raccogliPersone(prospect.trim()),
    ]);
    const report = ricerca.report + bloccoReport(persone);
    const materiali = await generateMaterials({ prospect: prospect.trim(), layer, motion, report });
    return res.status(200).json(materiali);
  } catch (err) {
    if (!(err instanceof GenerationParseError)) console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
