// api/research.js
// Fase 1 isolata. Restituisce il report di intelligence grezzo, cosi' il
// client puo' riusarlo: cambiare layer o motion GTM sullo stesso prospect non
// rifa' la ricerca web, e un retry sulla generazione non butta via la ricerca.

import { applyCors } from './_shared.js';
import { runResearch } from './_research.js';

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prospect, note } = req.body || {};
  if (!prospect?.trim()) return res.status(400).json({ error: 'Prospect richiesto' });

  try {
    const { report, incompleto } = await runResearch(prospect.trim(), note?.trim());
    return res.status(200).json({ report, incompleto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
