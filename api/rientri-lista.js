// api/rientri-lista.js
// Contatti HubSpot in hard bounce "Unknown user": candidati al ricontatto dopo
// un cambio di lavoro. Solo lettura.

import { applyCors } from './_shared.js';
import { hubspotToken, TOKEN_ENV, messaggioErrore } from './_hubspot.js';
import { listaRientri } from './_rientri.js';
import { rocketreachAttivo } from './_people.js';

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = hubspotToken();
  if (!token) return res.status(500).json({ error: `Token HubSpot non configurato su Vercel (variabile attesa: ${TOKEN_ENV[0]}).` });

  try {
    const contatti = await listaRientri(token);
    return res.status(200).json({ contatti, rocketreach: rocketreachAttivo() });
  } catch (err) {
    console.error('Rientri lista:', err);
    return res.status(502).json({ error: messaggioErrore(err) });
  }
}
