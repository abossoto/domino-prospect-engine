// api/_hubspot.js
// Client HubSpot condiviso da /api/hubspot e dalla funzione Rientri.
// Tutte le chiamate girano lato server: l'API HubSpot non accetta CORS dal
// browser e il token vive solo nelle env di Vercel.

export const BASE = 'https://api.hubapi.com';
export const TIMEOUT_MS = 15000;

// Il nome della variabile non e' vincolato: si accetta il primo presente.
export const TOKEN_ENV = ['HUBSPOT_TOKEN', 'HUBSPOT_SERVICE_KEY', 'HUBSPOT_ACCESS_TOKEN', 'HUBSPOT_API_KEY', 'HUBSPOT_PRIVATE_APP_TOKEN'];
export function hubspotToken() {
  for (const k of TOKEN_ENV) if (process.env[k]) return process.env[k];
  return null;
}


export const sleep = ms => new Promise(r => setTimeout(r, ms));

export class HubSpotError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function hs(token, path, { method = 'GET', body } = {}) {
  for (let attempt = 0; attempt <= 3; attempt++) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // Rate limit: 10 richieste/secondo per la search API.
    if (res.status === 429 && attempt < 3) { await sleep(1000 * (attempt + 1)); continue; }
    if (res.status === 204) return {};
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new HubSpotError(res.status, data.message || `HubSpot ${method} ${path} -> ${res.status}`);
    return data;
  }
  throw new HubSpotError(429, 'HubSpot: troppe richieste, riprova tra qualche secondo.');
}

export async function searchOne(token, objectType, filters, properties) {
  const d = await hs(token, `/crm/v3/objects/${objectType}/search`, {
    method: 'POST',
    body: { filterGroups: [{ filters }], properties, limit: 1 },
  });
  return d.results?.[0] || null;
}


// "https://www.alpitour.it/chi-siamo" -> "alpitour.it". null se non e' un dominio.
export function estraiDominio(s) {
  const m = String(s || '').trim().match(/^(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,})(?:[/?#].*)?$/i);
  return m ? m[1].toLowerCase() : null;
}

// `industry` in HubSpot e' un'enumerazione chiusa: il testo libero del modello
// ("B2B Industriale / Manifatturiero") viene rifiutato con un 400. L'ordine
// conta: le voci piu' specifiche prima di quelle generiche.
export const INDUSTRY_MAP = [
  [/automotive|automobil|veicol|motori|componentist/i, 'AUTOMOTIVE'],
  [/banca|bancari|banking/i, 'BANKING'],
  [/sgr|asset management|gestione del risparmio|investiment/i, 'INVESTMENT_MANAGEMENT'],
  [/finan/i, 'FINANCIAL_SERVICES'],
  [/assicura/i, 'INSURANCE'],
  [/pubblica amministrazione|\bpa\b|ente pubblico|comune|regione/i, 'GOVERNMENT_ADMINISTRATION'],
  [/farma|pharma/i, 'PHARMACEUTICALS'],
  [/medical device|dispositivi medic|biomedical/i, 'MEDICAL_DEVICES'],
  [/beauty|cosmet/i, 'COSMETICS'],
  [/fitness|wellness|benessere/i, 'HEALTH_WELLNESS_AND_FITNESS'],
  [/salute|sanit|ospedal|clinic|health/i, 'HOSPITAL_HEALTH_CARE'],
  [/hotel|hospitality|ospitalit/i, 'HOSPITALITY'],
  [/turismo|tour operator|viagg|travel|crocier/i, 'LEISURE_TRAVEL_TOURISM'],
  [/museo|musei|cultura|fondazione cultural/i, 'MUSEUMS_AND_INSTITUTIONS'],
  [/vino|wine|spirits|distiller/i, 'WINE_AND_SPIRITS'],
  [/food|aliment|beverage/i, 'FOOD_BEVERAGES'],
  [/moda|fashion|abbigliament|calzatur/i, 'APPAREL_FASHION'],
  [/lusso|luxury|gioiell/i, 'LUXURY_GOODS_JEWELRY'],
  [/real estate|immobiliar/i, 'REAL_ESTATE'],
  [/retail|e-?commerce|gdo/i, 'RETAIL'],
  [/software|saas/i, 'COMPUTER_SOFTWARE'],
  [/tecnolog|informatic|\bit\b/i, 'INFORMATION_TECHNOLOGY_AND_SERVICES'],
  [/nautic|cantier|shipbuild/i, 'SHIPBUILDING'],
  [/aerospa|aviation/i, 'AVIATION_AEROSPACE'],
  [/elettronic/i, 'ELECTRICAL_ELECTRONIC_MANUFACTURING'],
  [/chimic/i, 'CHEMICALS'],
  [/plastic/i, 'PLASTICS'],
  [/automazione/i, 'INDUSTRIAL_AUTOMATION'],
  [/logistic/i, 'LOGISTICS_AND_SUPPLY_CHAIN'],
  [/energia|energy|oil|gas/i, 'OIL_ENERGY'],
  [/costruzion|edilizi/i, 'CONSTRUCTION'],
  [/arredo|mobili|furniture/i, 'FURNITURE'],
  [/industri|manifattur|macchin|meccanic|b2b/i, 'MACHINERY'],
];
export function mappaIndustry(settore) {
  const s = String(settore || '');
  for (const [re, v] of INDUSTRY_MAP) if (re.test(s)) return v;
  return null;
}


export function emailValida(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());
}

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const url = u => (/^https?:\/\//i.test(u || '') ? u : null);

export function messaggioErrore(err) {
  const msg = err.status === 401 ? 'Token HubSpot non valido o scaduto.'
    : err.status === 403 ? `Permessi insufficienti sul token HubSpot: ${err.message}`
    : err.message;
  return `HubSpot: ${msg}`;
}

// Associazione di default fra due record (idempotente). Tipi al singolare v4:
// contact, company, note, task.
export async function associaDefault(token, fromType, fromId, toType, toId) {
  return hs(token, `/crm/v4/objects/${fromType}/${fromId}/associations/default/${toType}/${toId}`, { method: 'PUT' });
}
