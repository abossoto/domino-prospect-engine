// api/rientri-analizza.js
// Un contatto alla volta: RocketReach + web + bozza mail possono prendere un paio
// di minuti, e 36 contatti in una sola function sforerebbero il maxDuration.
// Il client li chiama in sequenza. Non scrive nulla su HubSpot.

import { applyCors, creaScadenza } from './_shared.js';
import { hubspotToken, TOKEN_ENV, messaggioErrore } from './_hubspot.js';
import { analizzaRientro } from './_rientri.js';

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = hubspotToken();
  if (!token) return res.status(500).json({ error: `Token HubSpot non configurato su Vercel (variabile attesa: ${TOKEN_ENV[0]}).` });

  const { contactId } = req.body || {};
  if (!/^\d+$/.test(String(contactId || ''))) return res.status(400).json({ error: 'contactId mancante' });

  try {
    return res.status(200).json(await analizzaRientro(token, String(contactId), creaScadenza()));
  } catch (err) {
    console.error('Rientri analisi:', err);
    return res.status(err.status ? 502 : 500).json({ error: err.status ? messaggioErrore(err) : err.message });
  }
}
