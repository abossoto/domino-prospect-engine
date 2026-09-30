// api/_rientri.js
// "Rientri": contatti HubSpot in hard bounce che hanno cambiato lavoro.
//
// Pipeline per un contatto:
//   1. HubSpot   - dati del contatto, azienda precedente, owner
//   2. RocketReach - profilo attuale: nuova azienda, email verificate
//   3. Web (Claude + web_search) - solo se RocketReach non basta: nuova azienda
//      da profili pubblici/news e formato email dell'azienda
//   4. Email     - verificata > personale > ricostruita dal formato ("da verificare")
//   5. Bozza     - mail di ricontatto firmata dal contact owner
// Il salvataggio su HubSpot e' un passo separato (salvaRientro), lanciato a mano
// dopo aver visto il risultato: un'email ricostruita non va scritta sul record.
//
// LinkedIn non si interroga direttamente: non ha un'API per questo e lo
// scraping viola i suoi termini. La ricerca web legge solo pagine pubbliche.

import { callClaude, extractText, webSearchTool, loadBrain, brainBlock, tempoResiduo } from './_shared.js';
import { parseJSON } from './_generate.js';
import { rr, rocketreachAttivo, scegliEmail, scegliEmailPersonale } from './_people.js';
import { hs, searchOne, estraiDominio, emailValida, esc, url } from './_hubspot.js';

// Tutti i contatti con un motivo di hard bounce valorizzato. UNKNOWN_USER
// (casella inesistente) e' il segnale piu' forte di cambio lavoro, ma anche gli
// altri motivi vanno ricontrollati: il motivo viene mostrato in lista.

// Marcatore nelle note: permette alla lista di riconoscere i contatti gia'
// lavorati senza creare proprieta' custom sul portale.
export const MARCATORE = '[DOMINO-RIENTRO]';

const CONTACT_PROPS = [
  'firstname', 'lastname', 'email', 'company', 'jobtitle', 'hs_linkedin_url',
  'hubspot_owner_id', 'hs_email_hard_bounce_reason_enum', 'notes_last_contacted',
  'lifecyclestage', 'createdate',
];

// Tipi di associazione HubSpot-defined (v3).
const CONTACT_TO_COMPANY_PRIMARY = 1;
const CONTACT_TO_COMPANY = 279;
const NOTE_TO_CONTACT = 202;
const NOTE_TO_COMPANY = 190;
const TASK_TO_CONTACT = 204;

const MAX_CONTATTI = 1000;

// Contatti senza owner: firma la bozza e riceve il task Flavio Pedazzini.
// L'owner del contatto su HubSpot non viene cambiato.
const OWNER_PREDEFINITO_ID = '12386493';

// ── Utility ──────────────────────────────────────────────────────────────────

const nomeCompleto = c => [c.firstname, c.lastname].filter(Boolean).join(' ').trim();

// "Boscolo Tours S.p.A." -> "boscolo tours": serve a capire se l'azienda
// "nuova" trovata e' in realta' la stessa.
function normAzienda(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\b(s\.?p\.?a|s\.?r\.?l|s\.?a\.?s|s\.?n\.?c|spa|srl|group|gruppo|holding|italia|italy|ltd|inc|gmbh|sa)\b\.?/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
function stessaAzienda(a, b) {
  const x = normAzienda(a), y = normAzienda(b);
  if (!x || !y) return false;
  return x === y || x.startsWith(y) || y.startsWith(x);
}

const dominioEmail = e => String(e || '').split('@')[1]?.toLowerCase() || '';

// Parte locale di un indirizzo: minuscole, senza accenti, apostrofi e spazi.
function slugNome(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’\s-]+/g, '').replace(/[^a-z0-9]/g, '');
}

const FORMATI = {
  'nome.cognome': (n, c) => `${n}.${c}`,
  'n.cognome': (n, c) => `${n[0]}.${c}`,
  'ncognome': (n, c) => `${n[0]}${c}`,
  'nomecognome': (n, c) => `${n}${c}`,
  'nome_cognome': (n, c) => `${n}_${c}`,
  'nome-cognome': (n, c) => `${n}-${c}`,
  'cognome.nome': (n, c) => `${c}.${n}`,
  'cognome.n': (n, c) => `${c}.${n[0]}`,
  'cognomen': (n, c) => `${c}${n[0]}`,
  'nome': n => n,
  'cognome': (n, c) => c,
};
export function ricostruisciEmail(firstname, lastname, formato, dominio) {
  const f = FORMATI[formato];
  const n = slugNome(firstname), c = slugNome(lastname);
  if (!f || !n || !c || !dominio) return null;
  return `${f(n, c)}@${dominio}`;
}

// ── 1. HubSpot: lista e dettaglio ────────────────────────────────────────────

// Senza lo scope crm.objects.owners.read la lista funziona lo stesso, solo
// senza il nome dell'owner.
async function mappaOwner(token) {
  const d = await hs(token, '/crm/v3/owners?limit=500').catch(e => { console.warn('Owner non leggibili:', e.message); return {}; });
  const m = new Map();
  for (const o of d.results || []) {
    m.set(String(o.id), { id: String(o.id), nome: [o.firstName, o.lastName].filter(Boolean).join(' ') || o.email, email: o.email || '' });
  }
  return m;
}

// Contatti con una nota MARCATORE: gia' lavorati.
async function giaLavorati(token, ids) {
  const fatti = new Set();
  for (let i = 0; i < ids.length; i += 100) {
    const blocco = ids.slice(i, i + 100);
    const assoc = await hs(token, '/crm/v4/associations/contacts/notes/batch/read', {
      method: 'POST', body: { inputs: blocco.map(id => ({ id })) },
    });
    const notePerContatto = new Map();
    for (const r of assoc.results || []) {
      notePerContatto.set(String(r.from.id), (r.to || []).map(t => String(t.toObjectId)));
    }
    const noteIds = [...new Set([...notePerContatto.values()].flat())];
    const conMarcatore = new Set();
    for (let j = 0; j < noteIds.length; j += 100) {
      const note = await hs(token, '/crm/v3/objects/notes/batch/read', {
        method: 'POST', body: { properties: ['hs_note_body'], inputs: noteIds.slice(j, j + 100).map(id => ({ id })) },
      });
      for (const n of note.results || []) {
        if (String(n.properties?.hs_note_body || '').includes(MARCATORE)) conMarcatore.add(String(n.id));
      }
    }
    for (const [cid, nids] of notePerContatto) if (nids.some(n => conMarcatore.has(n))) fatti.add(cid);
  }
  return fatti;
}

export async function listaRientri(token) {
  const contatti = [];
  let after;
  do {
    const d = await hs(token, '/crm/v3/objects/contacts/search', {
      method: 'POST',
      body: {
        filterGroups: [{ filters: [{ propertyName: 'hs_email_hard_bounce_reason_enum', operator: 'HAS_PROPERTY' }] }],
        properties: CONTACT_PROPS,
        sorts: [{ propertyName: 'lastmodifieddate', direction: 'DESCENDING' }],
        limit: 100,
        ...(after ? { after } : {}),
      },
    });
    contatti.push(...(d.results || []));
    after = d.paging?.next?.after;
  } while (after && contatti.length < MAX_CONTATTI);

  const [owner, fatti] = await Promise.all([
    mappaOwner(token),
    giaLavorati(token, contatti.map(c => String(c.id))),
  ]);

  return contatti.map(c => {
    const p = c.properties || {};
    return {
      id: String(c.id),
      nome: nomeCompleto(p) || p.email || '(senza nome)',
      email: p.email || '',
      azienda: p.company || '',
      ruolo: p.jobtitle && p.jobtitle !== '-' ? p.jobtitle : '',
      linkedin: p.hs_linkedin_url || '',
      motivo_bounce: p.hs_email_hard_bounce_reason_enum || '',
      owner: owner.get(String(p.hubspot_owner_id)) || null,
      gia_lavorato: fatti.has(String(c.id)),
    };
  });
}

async function leggiContatto(token, id) {
  const c = await hs(token, `/crm/v3/objects/contacts/${id}?properties=${CONTACT_PROPS.join(',')}&associations=companies`);
  const p = c.properties || {};
  let aziendaVecchia = { nome: p.company || '', dominio: dominioEmail(p.email) };
  const companyId = c.associations?.companies?.results?.[0]?.id;
  if (companyId) {
    try {
      const co = await hs(token, `/crm/v3/objects/companies/${companyId}?properties=name,domain,industry`);
      aziendaVecchia = {
        id: String(companyId),
        nome: co.properties?.name || aziendaVecchia.nome,
        dominio: co.properties?.domain || aziendaVecchia.dominio,
        settore: co.properties?.industry || '',
      };
    } catch { /* azienda non leggibile: resta quella dal campo company */ }
  }
  let owner = null;
  for (const [id, predefinito] of [[p.hubspot_owner_id, false], [OWNER_PREDEFINITO_ID, true]]) {
    if (owner || !id) continue;
    try {
      const o = await hs(token, `/crm/v3/owners/${id}`);
      owner = { id: String(o.id), nome: [o.firstName, o.lastName].filter(Boolean).join(' ') || o.email, email: o.email || '', predefinito };
    } catch { /* owner disattivato */ }
  }
  return {
    id: String(c.id),
    firstname: p.firstname || '',
    lastname: p.lastname || '',
    nome: nomeCompleto(p),
    email: p.email || '',
    ruolo: p.jobtitle && p.jobtitle !== '-' ? p.jobtitle : '',
    linkedin: url(p.hs_linkedin_url),
    ultimo_contatto: p.notes_last_contacted || '',
    creato: p.createdate || '',
    aziendaVecchia,
    owner,
  };
}

// ── 2. RocketReach ───────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

// person/lookup e' asincrona: si fa polling su checkStatus finche' e' completa.
async function lookupCompleto(query) {
  let d = await rr(`/person/lookup?${query}`);
  for (let i = 0; i < 6 && d?.status && d.status !== 'complete' && d.id; i++) {
    await sleep(3000);
    const lista = await rr(`/person/checkStatus?ids=${d.id}`);
    d = Array.isArray(lista) ? lista[0] : lista;
  }
  return d?.status === 'complete' || d?.current_employer ? d : null;
}

// Candidato che ha lavorato nell'azienda vecchia: search non consuma crediti,
// il lookup si'. Si prova prima con il LinkedIn salvato (match esatto).
async function trovaSuRocketReach(c) {
  if (!rocketreachAttivo()) return { esito: 'non_configurato' };
  try {
    let profilo = null;
    if (c.linkedin) profilo = await lookupCompleto(`linkedin_url=${encodeURIComponent(c.linkedin)}`);

    if (!profilo && c.nome) {
      let candidati = [];
      for (const query of [
        { name: [c.nome], previous_employer: [c.aziendaVecchia.nome] },
        { name: [c.nome], keyword: [c.aziendaVecchia.nome] },
      ]) {
        if (!c.aziendaVecchia.nome) break;
        try {
          const d = await rr('/search', { method: 'POST', body: { query, start: 1, page_size: 5 } });
          candidati = d.profiles || [];
        } catch (e) { console.warn('RocketReach search:', e.message); }
        if (candidati.length) break;
      }
      const nomeNorm = slugNome(c.nome);
      const scelto = candidati.find(p => slugNome(p.name) === nomeNorm) || null;
      if (scelto?.id) profilo = await lookupCompleto(`id=${scelto.id}`);
    }

    if (!profilo) return { esito: 'non_trovato' };

    // Le email all'indirizzo che ha fatto bounce, o al dominio vecchio, non
    // servono: sono proprio quelle morte.
    const domVecchio = (c.aziendaVecchia.dominio || dominioEmail(c.email)).toLowerCase();
    const utile = e => e && emailValida(e) && e.toLowerCase() !== c.email.toLowerCase() && dominioEmail(e) !== domVecchio;
    const pro = scegliEmail(profilo);
    const pers = scegliEmailPersonale(profilo);
    return {
      esito: 'trovato',
      azienda: profilo.current_employer || '',
      dominio: estraiDominio(profilo.current_employer_domain || profilo.current_employer_website || '') || '',
      ruolo: profilo.current_title || '',
      linkedin: url(profilo.linkedin_url),
      email_pro: utile(pro) ? pro : null,
      email_personale: utile(pers) ? pers : null,
    };
  } catch (e) {
    console.warn('RocketReach non disponibile:', e.message);
    return { esito: 'errore', errore: e.message };
  }
}

// ── 3. Ricerca web ───────────────────────────────────────────────────────────

const WEB_SYSTEM = `Sei un ricercatore commerciale. Devi scoprire dove lavora OGGI una persona che ha lasciato la sua azienda precedente, usando solo fonti pubbliche: profilo LinkedIn pubblico (via risultati di ricerca), news, comunicati stampa, pagine "team" dei siti aziendali, relatori di eventi.

METODO:
1. Prima cerca il profilo LinkedIn pubblico: query come "Nome Cognome" site:linkedin.com/in, poi "Nome Cognome" "azienda precedente" linkedin. Dal titolo e dall'anteprima del risultato (es. "Nome Cognome - Ruolo - Azienda | LinkedIn") prendi azienda e ruolo attuali. Quella e' la fonte principale per l'azienda.
2. Se LinkedIn non basta o e' ambiguo, conferma con news, comunicati o pagine aziendali.
3. Poi cerca dominio e formato email dell'azienda attuale.

REGOLE:
- MAI inventare. Se non trovi prove, rispondi trovato=false.
- Attenzione agli omonimi: la persona giusta ha lavorato presso l'azienda precedente indicata, con un ruolo coerente.
- Il formato email dell'azienda va dedotto SOLO da indirizzi reali di altri dipendenti trovati su pagine pubbliche (es. "mario.rossi@azienda.it" in un comunicato). Se non ne trovi, formato_email = "".
- Formati ammessi per formato_email: nome.cognome, n.cognome, ncognome, nomecognome, nome_cognome, nome-cognome, cognome.nome, cognome.n, cognomen, nome, cognome.

Rispondi SOLO con JSON puro:
{"trovato":true,"nuova_azienda":"","dominio":"","ruolo":"","linkedin_url":"https://www.linkedin.com/in/...","fonte":"LinkedIn|Web","fonte_url":"https://...","confidenza":"alta|media|bassa","formato_email":"","esempio_formato":"","note":""}
linkedin_url: solo l'URL del profilo della persona giusta, se trovato. fonte: "LinkedIn" se l'azienda attuale viene dal profilo LinkedIn, altrimenti "Web".`;

async function trovaSulWeb(c, rrRes, scadenza) {
  const noto = rrRes?.azienda && !stessaAzienda(rrRes.azienda, c.aziendaVecchia.nome)
    ? `\nRocketReach indica che ora lavora presso "${rrRes.azienda}"${rrRes.dominio ? ` (${rrRes.dominio})` : ''}: verificalo e concentrati sul dominio e sul formato email.`
    : '';
  const messages = [{
    role: 'user',
    content: `Persona: ${c.nome}
Azienda precedente: ${c.aziendaVecchia.nome || 'sconosciuta'}${c.aziendaVecchia.dominio ? ` (${c.aziendaVecchia.dominio})` : ''}
Ruolo precedente: ${c.ruolo || 'sconosciuto'}
${c.linkedin ? `LinkedIn salvato: ${c.linkedin}` : ''}${noto}

${rrRes?.esito === 'trovato' ? '' : 'RocketReach non ha trovato questa persona: parti dal profilo LinkedIn pubblico.\n'}Trova azienda attuale, dominio web, ruolo attuale e formato email dell'azienda attuale.`,
  }];
  const tool = webSearchTool(8);
  let data = await callClaude({ system: WEB_SYSTEM, messages, tools: [tool], max_tokens: 4000, timeoutMs: 150000, scadenza });
  if (data.stop_reason === 'pause_turn' && tempoResiduo(scadenza) > 80000) {
    messages.push({ role: 'assistant', content: data.content });
    data = await callClaude({ system: WEB_SYSTEM, messages, tools: [tool], max_tokens: 4000, timeoutMs: 120000, scadenza });
  }
  try {
    const j = parseJSON(extractText(data));
    return {
      trovato: !!j.trovato && !!j.nuova_azienda,
      azienda: j.nuova_azienda || '',
      dominio: estraiDominio(j.dominio) || '',
      ruolo: j.ruolo || '',
      linkedin: /linkedin\.com\/in\//i.test(j.linkedin_url || '') ? url(j.linkedin_url) : null,
      fonte: j.fonte === 'LinkedIn' ? 'LinkedIn' : 'Web',
      fonte_url: url(j.fonte_url),
      confidenza: j.confidenza || 'bassa',
      formato_email: FORMATI[j.formato_email] ? j.formato_email : '',
      esempio_formato: j.esempio_formato || '',
      note: j.note || '',
    };
  } catch {
    return { trovato: false, note: 'Ricerca web senza risultato leggibile' };
  }
}

// ── 5. Bozza mail ────────────────────────────────────────────────────────────

function sistemaMail(brain) {
  return [
    brainBlock(brain),
    { type: 'text', text: `Scrivi una mail di RICONTATTO per Domino. Non e' una cold mail: il destinatario conosce gia' Domino, era un contatto quando lavorava nell'azienda precedente.

REGOLE:
- Mittente: il contact owner indicato, in prima persona. Firma solo con nome e cognome del mittente e "Domino".
- Apertura personale: hai saputo del nuovo ruolo / della nuova azienda, complimenti sinceri e brevi. Mai dire che la mail e' rimbalzata o che l'hai cercato su database.
- Richiama in una riga il rapporto precedente (azienda e ruolo di allora) senza inventare progetti o incontri che non sono nei dati.
- Un solo aggancio Domino pertinente al settore della nuova azienda, preso dal brain. Niente elenco di servizi.
- CTA leggera: un caffe' o una call di 20 minuti per raccontarsi.
- Se l'indirizzo e' personale: tono piu' informale, nessun riferimento commerciale esplicito oltre la CTA.
- 80-130 parole. Italiano, dando del Lei salvo che il ruolo e il contesto suggeriscano il tu; se la persona o l'azienda sono chiaramente estere, in inglese.
- Rispetta la nomenclatura dei prodotti Domino (terminano con "!").
- Se la nuova azienda non e' nota, scrivi una mail che chiede come sta andando e dove e' approdato, senza pitch.

Rispondi SOLO con JSON puro: {"oggetto":"","corpo":""}` },
  ];
}

async function scriviMail(c, trovato, canale, scadenza) {
  const data = await callClaude({
    system: sistemaMail(loadBrain()),
    messages: [{
      role: 'user',
      content: `Mittente (contact owner): ${c.owner?.nome || 'il team Domino'}
Destinatario: ${c.nome}
Prima: ${c.ruolo || 'ruolo non noto'} presso ${c.aziendaVecchia.nome || 'azienda non nota'}
Ultimo contatto registrato: ${c.ultimo_contatto ? c.ultimo_contatto.slice(0, 10) : 'non registrato'}
Ora: ${trovato.azienda ? `${trovato.ruolo || 'ruolo non noto'} presso ${trovato.azienda}` : 'azienda attuale non nota'}
Indirizzo usato: ${canale === 'personale' ? 'email personale' : 'email aziendale'}

Scrivi la mail. Solo JSON puro.`,
    }],
    max_tokens: 2000, scadenza,
  });
  const j = parseJSON(extractText(data));
  return { oggetto: String(j.oggetto || '').trim(), corpo: String(j.corpo || '').trim() };
}

// ── Orchestrazione per un contatto ───────────────────────────────────────────

export async function analizzaRientro(token, contactId, scadenza) {
  const c = await leggiContatto(token, contactId);
  const rrRes = await trovaSuRocketReach(c);

  const rrNuova = rrRes.esito === 'trovato' && rrRes.azienda && !stessaAzienda(rrRes.azienda, c.aziendaVecchia.nome);
  // Il web serve se RocketReach non ha una nuova azienda, oppure se ce l'ha ma
  // senza email aziendale e senza dominio (serve il formato per ricostruirla).
  const serveWeb = !rrNuova || (!rrRes.email_pro && tempoResiduo(scadenza) > 120000);
  const web = serveWeb ? await trovaSulWeb(c, rrRes, scadenza) : null;

  // Nuova azienda: RocketReach vince sul web (dato strutturato), il web completa.
  let trovato = { azienda: '', dominio: '', ruolo: '', linkedin: c.linkedin, fonte: '', fonte_url: null, confidenza: '' };
  if (rrNuova) {
    trovato = { azienda: rrRes.azienda, dominio: rrRes.dominio || web?.dominio || '', ruolo: rrRes.ruolo, linkedin: rrRes.linkedin || c.linkedin, fonte: 'RocketReach', fonte_url: null, confidenza: 'alta' };
  } else if (web?.trovato && !stessaAzienda(web.azienda, c.aziendaVecchia.nome)) {
    trovato = { azienda: web.azienda, dominio: web.dominio, ruolo: web.ruolo, linkedin: rrRes.linkedin || web.linkedin || c.linkedin, fonte: web.fonte, fonte_url: web.fonte_url, confidenza: web.confidenza };
  }

  // Email: verificata aziendale > personale > ricostruita dal formato.
  let email = null;
  if (rrRes.email_pro) {
    email = { indirizzo: rrRes.email_pro, tipo: 'aziendale', stato: 'verificata', fonte: 'RocketReach' };
  } else if (trovato.dominio && web?.formato_email) {
    const ric = ricostruisciEmail(c.firstname, c.lastname, web.formato_email, trovato.dominio);
    if (ric) email = { indirizzo: ric, tipo: 'aziendale', stato: 'da_verificare', fonte: `formato ${web.formato_email}${web.esempio_formato ? ` (es. ${web.esempio_formato})` : ''}` };
  }
  if (!email && rrRes.email_personale) {
    email = { indirizzo: rrRes.email_personale, tipo: 'personale', stato: 'verificata', fonte: 'RocketReach' };
  }

  const mail = await scriviMail(c, trovato, email?.tipo === 'personale' ? 'personale' : 'aziendale', scadenza);

  return {
    contatto: { id: c.id, nome: c.nome, firstname: c.firstname, lastname: c.lastname, email_vecchia: c.email, ruolo: c.ruolo, azienda: c.aziendaVecchia, owner: c.owner },
    trovato,
    email,
    mail,
    diagnostica: {
      rocketreach: rrRes.esito,
      rocketreach_errore: rrRes.errore || null,
      web: web ? (web.trovato ? `trovato (${web.confidenza})` : 'non trovato') : 'non necessario',
      web_note: web?.note || '',
    },
  };
}

// ── Salvataggio su HubSpot ───────────────────────────────────────────────────

function notaHtml(r) {
  const { contatto: c, trovato: t, email: e, mail: m } = r;
  const righe = [
    `<p><b>${MARCATORE} Ricontatto dopo cambio lavoro</b><br>Rilevato dal Domino Prospect Engine il ${new Date().toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })}</p>`,
    `<p><b>Prima:</b> ${esc(c.ruolo || 'ruolo n/d')} presso ${esc(c.azienda?.nome || 'n/d')} — email ${esc(c.email_vecchia)} (hard bounce)<br>`,
    `<b>Ora:</b> ${t.azienda ? `${esc(t.ruolo || 'ruolo n/d')} presso ${esc(t.azienda)}${t.dominio ? ` (${esc(t.dominio)})` : ''}` : 'azienda attuale non trovata'}<br>`,
    t.fonte ? `<b>Fonte:</b> ${esc(t.fonte)}${t.confidenza ? `, confidenza ${esc(t.confidenza)}` : ''}${t.fonte_url ? ` — <a href="${esc(t.fonte_url)}">link</a>` : ''}<br>` : '',
    t.linkedin ? `<b>LinkedIn:</b> <a href="${esc(t.linkedin)}">${esc(t.linkedin)}</a><br>` : '',
    `<b>Email:</b> ${e ? `${esc(e.indirizzo)} — ${e.tipo}, ${e.stato === 'verificata' ? 'verificata' : '<b>DA VERIFICARE</b>'} (${esc(e.fonte)})` : 'nessuna trovata'}</p>`,
    `<h3>Bozza di ricontatto</h3><p><b>Oggetto:</b> ${esc(m.oggetto)}</p><p>${esc(m.corpo).replace(/\r?\n/g, '<br>')}</p>`,
  ];
  return righe.join('');
}

async function upsertAzienda(token, t, ownerId) {
  let ex = null;
  if (t.dominio) ex = await searchOne(token, 'companies', [{ propertyName: 'domain', operator: 'EQ', value: t.dominio }], ['name']);
  if (!ex) ex = await searchOne(token, 'companies', [{ propertyName: 'name', operator: 'EQ', value: t.azienda }], ['name']);
  if (ex) return { id: String(ex.id), isNew: false };
  const props = { name: t.azienda };
  if (t.dominio) props.domain = t.dominio;
  if (ownerId) props.hubspot_owner_id = ownerId;
  const cr = await hs(token, '/crm/v3/objects/companies', { method: 'POST', body: { properties: props } });
  return { id: String(cr.id), isNew: true };
}

export async function salvaRientro(token, r) {
  const { contatto: c, trovato: t, email: e, mail: m } = r;
  if (!c?.id) throw new Error('Risultato di analisi mancante');
  const ownerId = c.owner?.id || null;

  // Si aggiorna il contatto esistente: niente duplicati. I dati precedenti
  // (azienda, ruolo, email rimbalzata) restano nella nota come storico.
  const azienda = t.azienda ? await upsertAzienda(token, t, ownerId) : null;

  // Un'email ricostruita non va nel campo email: se e' sbagliata rimbalzerebbe
  // di nuovo e rovinerebbe la reputazione di invio. Resta nella nota e nel task.
  // Se l'indirizzo verificato e' gia' su un altro contatto, HubSpot rifiuterebbe
  // l'aggiornamento: si lascia il campo com'e' e lo si segnala.
  let emailCampo = e?.stato === 'verificata' ? e.indirizzo.toLowerCase() : null;
  let emailInUso = null;
  if (emailCampo && emailCampo !== String(c.email_vecchia || '').toLowerCase()) {
    const altro = await searchOne(token, 'contacts', [
      { propertyName: 'email', operator: 'EQ', value: emailCampo },
      { propertyName: 'hs_object_id', operator: 'NEQ', value: c.id },
    ], ['email']);
    if (altro) { emailInUso = String(altro.id); emailCampo = null; }
  } else emailCampo = null;

  const props = {};
  if (emailCampo) props.email = emailCampo;
  if (t.azienda) {
    props.company = t.azienda;
    props.jobtitle = t.ruolo || '';
  }
  if (url(t.linkedin)) props.hs_linkedin_url = t.linkedin;
  if (Object.keys(props).length) {
    await hs(token, `/crm/v3/objects/contacts/${c.id}`, { method: 'PATCH', body: { properties: props } });
  }
  // La nuova azienda diventa la primaria; quella vecchia resta associata.
  if (azienda) {
    await hs(token, `/crm/v4/objects/contact/${c.id}/associations/company/${azienda.id}`, {
      method: 'PUT',
      body: [CONTACT_TO_COMPANY_PRIMARY, CONTACT_TO_COMPANY].map(id => ({ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: id })),
    });
  }

  const body = notaHtml(r);
  const aziendeNota = [...new Set([azienda?.id, c.azienda?.id].filter(Boolean).map(String))];
  const assocNota = [
    { to: { id: c.id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: NOTE_TO_CONTACT }] },
    ...aziendeNota.map(id => ({ to: { id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: NOTE_TO_COMPANY }] })),
  ];
  await hs(token, '/crm/v3/objects/notes', {
    method: 'POST',
    body: { properties: { hs_note_body: body, hs_timestamp: new Date().toISOString() }, associations: assocNota },
  });

  // Task all'owner con la bozza: la mail non parte mai in automatico.
  const scadenzaTask = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString();
  const taskProps = {
    hs_task_subject: `Ricontatta ${c.nome}${t.azienda ? ` (ora in ${t.azienda})` : ''}`,
    hs_task_body: `${e ? `<p><b>A:</b> ${esc(e.indirizzo)}${e.stato !== 'verificata' ? ' — <b>email da verificare prima dell\'invio</b>' : ''}</p>` : '<p><b>Nessuna email trovata</b>: valuta LinkedIn.</p>'}<p><b>Oggetto:</b> ${esc(m.oggetto)}</p><p>${esc(m.corpo).replace(/\r?\n/g, '<br>')}</p>`,
    hs_task_status: 'NOT_STARTED',
    hs_task_type: e ? 'EMAIL' : 'TODO',
    hs_task_priority: 'MEDIUM',
    hs_timestamp: scadenzaTask,
  };
  if (ownerId) taskProps.hubspot_owner_id = ownerId;
  await hs(token, '/crm/v3/objects/tasks', {
    method: 'POST',
    body: {
      properties: taskProps,
      associations: [{ to: { id: c.id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: TASK_TO_CONTACT }] }],
    },
  });

  return { contatto: { id: String(c.id), aggiornati: Object.keys(props), email_in_uso: emailInUso }, azienda };
}
