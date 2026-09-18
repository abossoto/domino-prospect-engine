// api/generate.js
// Fase 2 isolata: report di intelligence -> materiali sales in JSON.

import { applyCors } from './_shared.js';
import { generateMaterials, GenerationParseError } from './_generate.js';

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prospect, layer = 'headof', motion = 'bottomup', report } = req.body || {};
  if (!prospect?.trim()) return res.status(400).json({ error: 'Prospect richiesto' });
  if (!report?.trim()) return res.status(400).json({ error: 'Report di intelligence richiesto' });

  try {
    const materiali = await generateMaterials({ prospect: prospect.trim(), layer, motion, report });
    return res.status(200).json(materiali);
  } catch (err) {
    if (!(err instanceof GenerationParseError)) console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
