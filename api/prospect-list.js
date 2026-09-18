// api/prospect-list.js
// Endpoint storico: ricerca + scoring in una sola chiamata.
// Resta per compatibilita'. Il frontend usa /api/prospect-search e
// /api/prospect-rank separati, cosi' nessuna delle due fasi si avvicina al
// maxDuration e un retry sullo scoring non ributta via la ricerca.

import { applyCors, creaScadenza } from './_shared.js';
import { runListAgent, rankList } from './_list.js';

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { settore, geografia, dimensione, keywords, numero = 10 } = req.body || {};
  if (!settore?.trim()) return res.status(400).json({ error: 'Settore richiesto' });

  try {
    // Una sola scadenza per le due fasi: qui stanno nella stessa function.
    const scadenza = creaScadenza();
    const report = await runListAgent(settore, geografia, dimensione, keywords, numero, scadenza);
    const lista = await rankList({ settore, geografia, dimensione, keywords, numero, report, scadenza });
    return res.status(200).json(lista);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
