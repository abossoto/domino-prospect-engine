// api/prospect-rank.js
// Fase 2 della generazione lista: dal report grezzo alla lista con scoring.

import { applyCors, creaScadenza } from './_shared.js';
import { rankList } from './_list.js';

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { settore, geografia, dimensione, keywords, numero = 10, report } = req.body || {};
  if (!settore?.trim()) return res.status(400).json({ error: 'Settore richiesto' });
  if (!report?.trim()) return res.status(400).json({ error: 'Report di ricerca richiesto' });

  try {
    const lista = await rankList({ settore, geografia, dimensione, keywords, numero, report, scadenza: creaScadenza() });
    return res.status(200).json(lista);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
