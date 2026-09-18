// api/_people.js
// Arricchimento dei decisori via RocketReach.
//
// È una fase OPZIONALE e non bloccante: senza ROCKETREACH_API_KEY viene saltata
// del tutto e la ricerca prosegue esattamente come prima. Nessun errore, timeout
// o rate limit di RocketReach può far fallire un'analisi — al massimo il report
// resta quello che era, con le persone dedotte dal web.

const BASE = 'https://api.rocketreach.co/api/v2';
const TIMEOUT_MS = 15000;

// Su LinkedIn i profili italiani usano entrambe le lingue: a livello nazionale
// "direttore" batte "director" (74.846 contro 64.474 profili cxo/vp/director),
// ma nelle aziende internazionali ai livelli alti prevale l'inglese. Cercare in
// entrambe non costa niente: person_search non consuma crediti.
const TITOLI_TARGET = [
  'marketing', 'digital', 'digitale', 'customer experience', 'comunicazione',
  'communication', 'innovazione', 'innovation', 'ecommerce', 'brand', 'direttore marketing',
];

// Il facet corretto è `location`: `country` restituisce sempre 0.
const PAESE = ['Italy'];

const MAX_PROFILI = 12;
const MAX_ARRICCHITI = 3;
const POLL_TENTATIVI = 5;
const POLL_ATTESA_MS = 3000;

const sleep = ms => new Promise(r => setTimeout(r, ms));

export function rocketreachAttivo() {
  return !!process.env.ROCKETREACH_API_KEY;
}

async function rr(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Api-Key': process.env.ROCKETREACH_API_KEY,
      'Content-Type': 'application/json',
      // urllib e altri UA "da script" prendono 403: meglio identificarsi.
      'User-Agent': 'domino-prospect-engine',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`RocketReach ${path} -> ${res.status}`);
  return res.json();
}

// "www.alpitour.it" / "https://alpitour.it/" -> "alpitour".
// L'utente può incollare un dominio invece del nome azienda.
function nomeAzienda(input) {
  const t = input.trim();
  const m = t.match(/^(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+)\.[a-z.]{2,}\/?$/i);
  return m ? m[1] : t;
}

async function cerca(query, pageSize) {
  const d = await rr('/search', { method: 'POST', body: { query, start: 1, page_size: pageSize } });
  return d.profiles || [];
}

// Due ricerche invece di una: la sola lista di titoli marketing/digital non
// intercetta il C-level (un CEO non ha "marketing" nel titolo), e i soli
// management_levels senza filtro di titolo restituiscono manager a caso.
async function cercaDecisori(azienda) {
  const base = { current_employer: [azienda], location: PAESE };
  const [clevel, funzione] = await Promise.all([
    cerca({ ...base, management_levels: ['cxo'] }, 6),
    cerca({ ...base, management_levels: ['vp', 'director', 'manager'], current_title: TITOLI_TARGET }, 12),
  ]);
  // I decisori di funzione vengono prima: sono il buyer tipico di Domino.
  const visti = new Set();
  return [...funzione, ...clevel]
    .filter(p => p?.id && !visti.has(p.id) && visti.add(p.id))
    .slice(0, MAX_PROFILI);
}

function scegliEmail(d) {
  if (d.recommended_professional_email) return d.recommended_professional_email;
  if (d.current_work_email) return d.current_work_email;
  const pro = (d.emails || []).filter(e => e.type === 'professional' && e.smtp_valid !== 'invalid');
  pro.sort((a, b) => String(a.grade || 'Z').localeCompare(String(b.grade || 'Z')));
  return pro[0]?.email || null;
}

// person_lookup è asincrona: la prima risposta torna quasi sempre "progress".
// Si lanciano tutti i lookup insieme e poi si fa un solo polling cumulativo su
// checkStatus, invece di aspettare un profilo alla volta.
async function arricchisci(profili) {
  const target = profili.slice(0, MAX_ARRICCHITI);
  const completi = new Map();

  await Promise.all(target.map(async p => {
    try {
      const d = await rr(`/person/lookup?id=${p.id}`);
      if (d.status === 'complete') completi.set(p.id, d);
    } catch (e) { console.warn('RocketReach lookup fallito:', e.message); }
  }));

  for (let i = 0; i < POLL_TENTATIVI; i++) {
    const mancanti = target.filter(p => !completi.has(p.id)).map(p => p.id);
    if (!mancanti.length) break;
    await sleep(POLL_ATTESA_MS);
    try {
      const lista = await rr(`/person/checkStatus?ids=${mancanti.join(',')}`);
      for (const d of (Array.isArray(lista) ? lista : [lista])) {
        if (d?.status === 'complete') completi.set(d.id, d);
      }
    } catch (e) { console.warn('RocketReach checkStatus fallito:', e.message); break; }
  }

  return completi;
}

export async function raccogliPersone(prospect) {
  if (!rocketreachAttivo()) return [];
  try {
    const profili = await cercaDecisori(nomeAzienda(prospect));
    if (!profili.length) return [];
    const completi = await arricchisci(profili);
    return profili.map(p => {
      const d = completi.get(p.id);
      return {
        nome: p.name || '',
        ruolo: p.current_title || '',
        location: p.location || '',
        linkedin_url: p.linkedin_url || '',
        email: d ? scegliEmail(d) : null,
      };
    }).filter(p => p.nome);
  } catch (e) {
    // Mai propagare: l'analisi deve funzionare anche senza RocketReach.
    console.warn('RocketReach non disponibile, proseguo senza:', e.message);
    return [];
  }
}

export function bloccoReport(persone) {
  if (!persone.length) return '';
  const righe = persone.map(p => {
    const pezzi = [`- ${p.nome} — ${p.ruolo}`];
    if (p.location) pezzi.push(`(${p.location})`);
    if (p.linkedin_url) pezzi.push(`— LinkedIn: ${p.linkedin_url}`);
    if (p.email) pezzi.push(`— email: ${p.email}`);
    return pezzi.join(' ');
  }).join('\n');

  return `\n\n## PERSONE CHIAVE — DATI VERIFICATI (RocketReach)
Questi nominativi vengono da un database di contatti B2B verificato, non dal web.
Hanno la precedenza su qualsiasi nome dedotto dalle ricerche: usa questi.
Email e URL LinkedIn vanno riportati SOLO se presenti qui sotto, mai dedotti o inventati.

${righe}\n`;
}
