// api/hubspot.js
// Push del risultato di un'analisi su HubSpot: azienda, contatti e nota.
//
// Perche' lato server: l'API HubSpot non accetta chiamate dal browser (niente
// CORS per i token di app privata / service key), quindi la vecchia versione in
// App.jsx falliva con "Failed to fetch" prima ancora di partire. Qui il token
// vive solo nelle env di Vercel e non passa mai dal client.
//
// Regola generale: su record gia' esistenti si compilano solo i campi vuoti.
// Un'azienda gia' in trattativa non deve tornare "In Progress" perche' qualcuno
// ha rilanciato un'analisi.

import { applyCors } from './_shared.js';
import {
  hubspotToken, TOKEN_ENV, hs, searchOne, estraiDominio, mappaIndustry, emailValida, esc, url, messaggioErrore,
} from './_hubspot.js';

// Tipi di associazione HubSpot-defined (v3).
const NOTE_TO_COMPANY = 190;
const NOTE_TO_CONTACT = 202;

// hs_note_body accetta al massimo 65.536 caratteri.
const MAX_NOTE = 60000;

// ── Normalizzazioni ──────────────────────────────────────────────────────────

// "Maria Rossi Bianchi" -> { firstname: "Maria", lastname: "Rossi Bianchi" }.
function dividiNome(nome) {
  const parti = String(nome || '').trim().split(/\s+/).filter(Boolean);
  if (parti.length < 2) return { firstname: parti[0] || '', lastname: '' };
  return { firstname: parti[0], lastname: parti.slice(1).join(' ') };
}

// ── Nota: stessi contenuti del dossier Word (src/dossierBuilder.js) ──────────

const nl2br = s => esc(s).replace(/\r?\n/g, '<br>');
const h = t => `<h3>${esc(t)}</h3>`;
const riga = (label, v) => (v ? `<b>${esc(label)}:</b> ${esc(v)}<br>` : '');
const lista = items => (items.length ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '');

const LAYER_LABELS  = { clevel: 'C-Level', headof: 'Head of', manager: 'Manager / Operativo' };
const MOTION_LABELS = { bottomup: 'Bottom-up', topdown: 'Top-down' };

function costruisciNota(result, { layer, motion, version }) {
  const p = result.prospect || {};
  const ss = p.strumenti_suggeriti || {};
  const d = result.deck || {};
  const oggi = new Date().toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
  const layerLabel = LAYER_LABELS[layer] || layer || '';
  const motionLabel = MOTION_LABELS[motion] || motion || '';
  const out = [];

  out.push(`<p><b>📊 DOMINO PROSPECT ENGINE — Dossier ${esc(p.nome)}</b><br>`
    + `Generato il ${esc(oggi)} · Layer ${esc(layerLabel)} · Motion ${esc(motionLabel)}${version ? ` · ${esc(version)}` : ''}</p>`);

  // 1. Sintesi esecutiva
  const play = [
    ss.core_sprint && `Core Sprint!${ss.core_sprint_motivazione ? ` — ${esc(ss.core_sprint_motivazione)}` : ''}`,
    ss.design_sprint_tipo && `${esc(ss.design_sprint_tipo)} Design Sprint!${ss.design_sprint_motivazione ? ` — ${esc(ss.design_sprint_motivazione)}` : ''}`,
    ss.preventivo_emozionale && `Preventivo Emozionale${ss.preventivo_emozionale_motivazione ? ` — ${esc(ss.preventivo_emozionale_motivazione)}` : ''}`,
  ].filter(Boolean);
  out.push(h('1. Sintesi esecutiva'), `<p>${riga('Hook strategico', p.hook)}${riga('Decisore target', p.decisore_target)}</p>`);
  if (play.length) out.push('<p><b>Sales play consigliato:</b></p>', lista(play));

  // 2. Profilo aziendale
  out.push(h('2. Profilo aziendale'), '<p>'
    + riga('Ragione sociale', p.nome) + riga('Settore', p.settore) + riga('Dimensione', p.dimensione)
    + riga('Fatturato stimato', p.fatturato_stimato) + riga('Mercati', p.mercati)
    + riga('Maturità digitale', p.maturita_digitale) + '</p>');
  const persone = (p.persone_chiave || []).filter(pk => pk?.nome).map(pk => {
    const meta = [pk.ruolo, pk.anzianita].filter(Boolean).map(esc).join(' · ');
    const contatti = [pk.email && esc(pk.email), url(pk.linkedin_url) && `<a href="${esc(pk.linkedin_url)}">LinkedIn</a>`].filter(Boolean).join(' · ');
    return `<b>${esc(pk.nome)}</b>${meta ? ` — ${meta}` : ''}${contatti ? ` (${contatti})` : ''}`;
  });
  if (persone.length) out.push('<p><b>Persone chiave:</b></p>', lista(persone));

  // 3. Sfide probabili
  const sfide = (p.sfide_probabili || []).filter(Boolean).map(esc);
  if (sfide.length) out.push(h('3. Sfide probabili'), lista(sfide));

  // 4. Segnali recenti
  const segnali = (p.segnali_recenti || []).filter(s => s?.testo).map(s => {
    const fonte = url(s.fonte_url) ? ` — <a href="${esc(s.fonte_url)}">${esc(s.fonte_titolo || 'fonte')}</a>` : '';
    return `${esc(s.testo)}${s.data ? ` <i>(${esc(s.data)})</i>` : ''}${fonte}`;
  });
  if (segnali.length) out.push(h('4. Segnali recenti'), lista(segnali));

  // 5. Proof attivabili
  const casi = (p.casi_studio || []).filter(c => c?.cliente).map(c =>
    `<b>${esc(c.cliente)}</b>${c.progetto ? ` — ${esc(c.progetto)}` : ''}${c.kpi ? `<br>KPI: ${esc(c.kpi)}` : ''}${c.perche_affine ? `<br><i>${esc(c.perche_affine)}</i>` : ''}`);
  if (casi.length) out.push(h('5. Proof attivabili (casi studio)'), lista(casi));

  // 6. Mail di primo contatto
  const mail = result.mail || {};
  if (mail.oggetto || mail.corpo) {
    out.push(h('6. Mail di primo contatto'), `<p><b>Oggetto:</b> ${esc(mail.oggetto)}</p><p>${nl2br(mail.corpo)}</p>`);
  }

  // 7. LinkedIn
  const li = result.linkedin || {};
  if (li.messaggio) out.push(h(`7. Messaggio LinkedIn${li.tipo ? ` (${li.tipo})` : ''}`), `<p>${nl2br(li.messaggio)}</p>`);

  // 8. Deck
  const slide = [1, 2, 3, 4, 5]
    .filter(n => d[`slide_${n}_titolo`] || d[`slide_${n}_contenuto`])
    .map(n => `<b>${n}. ${esc(d[`slide_${n}_titolo`])}</b><br>${nl2br(d[`slide_${n}_contenuto`])}`);
  if (slide.length) out.push(h('8. Deck 5 slide — sintesi'), lista(slide));

  // 9. Workflow
  const wf = (result.workflow || []).map(w => `<b>Gg ${esc(w.giorno)} [${esc(w.canale)}]</b> ${esc(w.azione)}`);
  if (wf.length) out.push(h('9. Workflow di sequenza — 14 giorni'), lista(wf));

  let html = out.join('');
  if (html.length > MAX_NOTE) html = html.slice(0, MAX_NOTE) + '<p><i>[nota troncata: il testo completo è nel dossier Word]</i></p>';
  return html;
}

// ── Azienda ──────────────────────────────────────────────────────────────────

const COMPANY_PROPS = ['name', 'domain', 'industry', 'description', 'hs_lead_status'];

async function upsertCompany(token, p, dominio) {
  let existing = null;
  if (dominio) existing = await searchOne(token, 'companies', [{ propertyName: 'domain', operator: 'EQ', value: dominio }], COMPANY_PROPS);
  if (!existing) existing = await searchOne(token, 'companies', [{ propertyName: 'name', operator: 'EQ', value: p.nome }], COMPANY_PROPS);

  const industry = mappaIndustry(p.settore);
  const descrizione = [
    `Domino Prospect Engine — ${new Date().toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })}`,
    p.hook && `Hook: ${p.hook}`,
    p.decisore_target && `Decisore: ${p.decisore_target}`,
  ].filter(Boolean).join('\n');

  if (!existing) {
    const props = { name: p.nome, description: descrizione, hs_lead_status: 'IN_PROGRESS' };
    if (dominio) props.domain = dominio;
    if (industry) props.industry = industry;
    const cr = await hs(token, '/crm/v3/objects/companies', { method: 'POST', body: { properties: props } });
    return { id: cr.id, isNew: true };
  }

  const cur = existing.properties || {};
  const patch = {};
  if (!cur.domain && dominio) patch.domain = dominio;
  if (!cur.industry && industry) patch.industry = industry;
  if (!cur.description) patch.description = descrizione;
  if (!cur.hs_lead_status) patch.hs_lead_status = 'IN_PROGRESS';
  if (Object.keys(patch).length) {
    await hs(token, `/crm/v3/objects/companies/${existing.id}`, { method: 'PATCH', body: { properties: patch } });
  }
  return { id: existing.id, isNew: false };
}

// ── Contatti ─────────────────────────────────────────────────────────────────

const CONTACT_PROPS = ['firstname', 'lastname', 'email', 'jobtitle', 'hs_linkedin_url', 'hs_lead_status'];

async function upsertContact(token, pk, companyId) {
  const { firstname, lastname } = dividiNome(pk.nome);
  const email = emailValida(pk.email) ? pk.email.trim().toLowerCase() : null;
  const linkedin = url(pk.linkedin_url);
  // Solo il nome di battesimo e nessuna email: impossibile deduplicare, ogni
  // push creerebbe un contatto nuovo. Meglio saltarlo e segnalarlo.
  if (!email && !lastname) throw new Error('nome incompleto e nessuna email, contatto non creato');

  // Dedup: prima per email, poi per nome + cognome. Senza email il match per
  // nome e' l'unico possibile, ed e' meglio di un duplicato a ogni analisi.
  let existing = null;
  if (email) existing = await searchOne(token, 'contacts', [{ propertyName: 'email', operator: 'EQ', value: email }], CONTACT_PROPS);
  if (!existing && firstname && lastname) {
    existing = await searchOne(token, 'contacts', [
      { propertyName: 'firstname', operator: 'EQ', value: firstname },
      { propertyName: 'lastname', operator: 'EQ', value: lastname },
    ], CONTACT_PROPS);
  }

  let id, isNew;
  if (!existing) {
    const props = { firstname, lastname, hs_lead_status: 'NEW' };
    if (email) props.email = email;
    if (pk.ruolo) props.jobtitle = pk.ruolo;
    if (linkedin) props.hs_linkedin_url = linkedin;
    const cr = await hs(token, '/crm/v3/objects/contacts', { method: 'POST', body: { properties: props } });
    id = cr.id; isNew = true;
  } else {
    const cur = existing.properties || {};
    const patch = {};
    if (!cur.email && email) patch.email = email;
    if (!cur.jobtitle && pk.ruolo) patch.jobtitle = pk.ruolo;
    if (!cur.hs_linkedin_url && linkedin) patch.hs_linkedin_url = linkedin;
    if (Object.keys(patch).length) {
      await hs(token, `/crm/v3/objects/contacts/${existing.id}`, { method: 'PATCH', body: { properties: patch } });
    }
    id = existing.id; isNew = false;
  }

  // Associazione di default contatto -> azienda (idempotente).
  await hs(token, `/crm/v4/objects/contact/${id}/associations/default/company/${companyId}`, { method: 'PUT' });
  return { id, isNew, nome: pk.nome };
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = hubspotToken();
  if (!token) {
    return res.status(500).json({ error: `Token HubSpot non configurato su Vercel (variabile attesa: ${TOKEN_ENV[0]}).` });
  }

  const { result, input, layer, motion, version } = req.body || {};
  const p = result?.prospect;
  if (!p?.nome?.trim()) return res.status(400).json({ error: 'Risultato dell\'analisi mancante o senza nome azienda' });

  try {
    const company = await upsertCompany(token, p, estraiDominio(input));

    // Un contatto che fallisce non deve bloccare gli altri ne' la nota.
    const contatti = [];
    const erroriContatti = [];
    for (const pk of (p.persone_chiave || []).filter(x => x?.nome?.trim())) {
      try { contatti.push(await upsertContact(token, pk, company.id)); }
      catch (e) { erroriContatti.push(`${pk.nome}: ${e.message}`); }
    }

    const associations = [
      { to: { id: company.id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: NOTE_TO_COMPANY }] },
      ...contatti.map(c => ({ to: { id: c.id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: NOTE_TO_CONTACT }] })),
    ];
    await hs(token, '/crm/v3/objects/notes', {
      method: 'POST',
      body: {
        properties: { hs_note_body: costruisciNota(result, { layer, motion, version }), hs_timestamp: new Date().toISOString() },
        associations,
      },
    });

    return res.status(200).json({
      company,
      contatti_creati: contatti.filter(c => c.isNew).length,
      contatti_aggiornati: contatti.filter(c => !c.isNew).length,
      errori_contatti: erroriContatti,
    });
  } catch (err) {
    console.error('HubSpot sync:', err);
    return res.status(502).json({ error: messaggioErrore(err) });
  }
}
