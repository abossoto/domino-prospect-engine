// api/research.js
// Fase 1 isolata. Restituisce il report di intelligence grezzo, cosi' il
// client puo' riusarlo: cambiare layer o motion GTM sullo stesso prospect non
// rifa' la ricerca web, e un retry sulla generazione non butta via la ricerca.

import { applyCors, creaScadenza } from './_shared.js';
import { runResearch } from './_research.js';
import { raccogliPersone, bloccoReport } from './_people.js';

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prospect, note } = req.body || {};
  if (!prospect?.trim()) return res.status(400).json({ error: 'Prospect richiesto' });

  try {
    // Le due fasi girano in parallelo: RocketReach impiega ~15-25s contro i
    // ~110s della ricerca web, quindi non aggiunge latenza. raccogliPersone non
    // rigetta mai, al massimo restituisce [].
    const [ricerca, persone] = await Promise.all([
      runResearch(prospect.trim(), note?.trim(), creaScadenza()),
      raccogliPersone(prospect.trim()),
    ]);
    return res.status(200).json({
      report: ricerca.report + bloccoReport(persone),
      incompleto: ricerca.incompleto,
      persone_verificate: persone.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
