// api/rientri-salva.js
// Scrive su HubSpot il risultato di un'analisi Rientri, dopo che l'utente l'ha
// visto: aggiorna il contatto esistente (email, azienda, ruolo, LinkedIn),
// collega la nuova azienda, nota e task all'owner con la bozza.

import { applyCors } from './_shared.js';
import { hubspotToken, TOKEN_ENV, messaggioErrore } from './_hubspot.js';
import { salvaRientro } from './_rientri.js';

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = hubspotToken();
  if (!token) return res.status(500).json({ error: `Token HubSpot non configurato su Vercel (variabile attesa: ${TOKEN_ENV[0]}).` });

  const { risultato } = req.body || {};
  if (!risultato?.contatto?.id || !risultato?.mail) return res.status(400).json({ error: 'Risultato di analisi mancante' });

  try {
    return res.status(200).json(await salvaRientro(token, risultato));
  } catch (err) {
    console.error('Rientri salvataggio:', err);
    return res.status(502).json({ error: messaggioErrore(err) });
  }
}
