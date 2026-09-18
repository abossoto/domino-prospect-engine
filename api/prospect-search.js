// api/prospect-search.js
// Fase 1 della generazione lista: ricerca e verifica delle aziende.
// Non carica il brain, quindi resta una function leggera.

import { applyCors, creaScadenza } from './_shared.js';
import { runListAgent } from './_list.js';

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { settore, geografia, dimensione, keywords, numero = 10 } = req.body || {};
  if (!settore?.trim()) return res.status(400).json({ error: 'Settore richiesto' });

  try {
    const report = await runListAgent(settore, geografia, dimensione, keywords, numero, creaScadenza());
    return res.status(200).json({ report });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
