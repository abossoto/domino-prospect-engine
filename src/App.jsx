import { useState, useEffect } from 'react';
import pptxgen from 'pptxgenjs';

// ─── Design system ────────────────────────────────────────────────────────────
const C = {
  red:      '#E8272A',
  black:    '#0a0a0a',
  card:     '#141414',
  elevated: '#1e1e1e',
  border:   '#222222',
  text:     '#e8e8e8',
  muted:    '#666666',
  subtle:   '#f5f5f5',
  white:    '#FFFFFF',
};
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const DS_COLORS = {
  'Service':          { bg: 'rgba(99,102,241,0.12)',  bd: 'rgba(99,102,241,0.4)',  tx: '#a5b4fc' },
  'CX':               { bg: 'rgba(236,72,153,0.12)',  bd: 'rgba(236,72,153,0.4)',  tx: '#f9a8d4' },
  'Brand':            { bg: 'rgba(245,158,11,0.12)',  bd: 'rgba(245,158,11,0.4)',  tx: '#fcd34d' },
  'Digital Marketing':{ bg: 'rgba(16,185,129,0.12)',  bd: 'rgba(16,185,129,0.4)',  tx: '#6ee7b7' },
  'Website':          { bg: 'rgba(59,130,246,0.12)',  bd: 'rgba(59,130,246,0.4)',  tx: '#93c5fd' },
  'Intranet':         { bg: 'rgba(234,88,12,0.12)',   bd: 'rgba(234,88,12,0.4)',   tx: '#fdba74' },
};

const CANAL_COLORS = { LinkedIn: '#0077B5', Email: C.red, Telefono: '#22c55e' };

// ─── GTM config (NUOVO) ───────────────────────────────────────────────────────
const GTM_LAYERS = [
  { id: 'vision',    label: 'L1 — Experience Vision', interlocutor: 'CEO / C-Suite',                    need: '"Inspirami"',             color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  { id: 'settori',   label: 'L2 — Settori',           interlocutor: 'Director / VP Marketing',          need: '"Connettiti col mio mondo"', color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  { id: 'usecases',  label: 'L3 — Use Cases',         interlocutor: 'Director / Head of progetto',      need: '"Rendilo tangibile"',     color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  { id: 'tech',      label: 'L4 — Tech Categories',   interlocutor: 'Manager / Specialista',            need: '"Trovami dove cerco"',    color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  { id: 'salesplay', label: 'L5 — Sales Play',        interlocutor: 'Manager / Procurement',            need: '"Sei nell\'RFP?"',        color: '#DB2777', bg: 'rgba(219,39,119,0.1)' },
];

const GTM_MOTIONS = [
  { id: 'bottomup', label: '⬆ Bottom-up', desc: 'Contatto freddo o inbound — sali se sei rilevante', sub: 'Pipeline rapida' },
  { id: 'topdown',  label: '⬇ Top-down',  desc: 'Referenza CEO / evento — scendi al team con credibilità', sub: 'Deal più grandi' },
];

// ─── Archive helpers ──────────────────────────────────────────────────────────
function loadArchive() {
  try { return JSON.parse(localStorage.getItem('domino_pe_arch') || '[]'); } catch { return []; }
}
function saveToArchive(r) {
  const a = loadArchive();
  a.unshift({ ...r, _savedAt: new Date().toISOString() });
  localStorage.setItem('domino_pe_arch', JSON.stringify(a.slice(0, 50)));
}

// ─── Loading messages ─────────────────────────────────────────────────────────
const LOADING_MSGS = [
  'Analisi sito web aziendale...',
  'Ricerca dati finanziari (Cerved/CCIAA)...',
  'Raccolta news ultimi 12 mesi...',
  'Analisi profili LinkedIn...',
  'Verifica job posting attivi...',
  'Valutazione presenza digitale...',
  'Generazione materiali sales personalizzati...',
];
const LISTA_MSGS = [
  'Ricerca aziende nel settore...',
  'Verifica siti web e presenza digitale...',
  'Analisi segnali di bisogno digitale...',
  'Ricerca decisori e struttura aziendale...',
  'Scoring e ranking prospect...',
];

const QUICK_PICKS = ['Technogym', 'Humanitas', 'Alpitour', 'Amplifon', 'Pirelli', "De'Longhi", 'Fincantieri', "Tod's"];

const SETTORI_OPTIONS = [
  'Automotive', 'B2B Industriale / Manifatturiero', 'Salute & Sanità',
  'Turismo & Cultura', 'Finance & Assicurazioni', 'Real Estate',
  'Pubblica Amministrazione', 'Retail & eCommerce', 'Tecnologia & Software', 'Altro',
];

// ─── HubSpot sync ─────────────────────────────────────────────────────────────
async function syncToHubspot(token, result) {
  const hs = (path, method, body) => fetch(`https://api.hubapi.com${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.json());

  const searchRes = await hs('/crm/v3/objects/companies/search', 'POST', {
    filterGroups: [{ filters: [{ propertyName: 'name', operator: 'EQ', value: result.prospect.nome }] }],
  });

  const props = {
    name: result.prospect.nome,
    industry: result.prospect.settore,
    description: result.prospect.sfide_probabili?.join(' | ') || '',
    hs_lead_status: 'IN_PROGRESS',
  };

  let companyId;
  if (searchRes.results?.length) {
    companyId = searchRes.results[0].id;
    await hs(`/crm/v3/objects/companies/${companyId}`, 'PATCH', { properties: props });
  } else {
    const created = await hs('/crm/v3/objects/companies', 'POST', { properties: props });
    companyId = created.id;
  }

  const noteBody = [
    `**Settore:** ${result.prospect.settore}`,
    `**Dimensione:** ${result.prospect.dimensione}`,
    `**Fatturato:** ${result.prospect.fatturato_stimato || 'n.d.'}`,
    `**Decisore:** ${result.prospect.decisore_target}`,
    `**Maturità digitale:** ${result.prospect.maturita_digitale}`,
    '',
    `**Hook:** ${result.prospect.hook}`,
    '',
    '**Sfide probabili:**',
    ...(result.prospect.sfide_probabili || []).map(s => `• ${s}`),
    '',
    '**Segnali recenti:**',
    ...(result.prospect.segnali_recenti || []).map(s => `• ${s}`),
    '',
    '**Casi studio Domino:**',
    ...(result.prospect.casi_studio || []).map(c => `• ${c.cliente}: ${c.kpi}`),
    '',
    '**Workflow:**',
    ...(result.workflow || []).map(w => `Gg${w.giorno} [${w.canale}]: ${w.azione}`),
  ].join('\n');

  await hs('/crm/v3/objects/notes', 'POST', {
    properties: { hs_note_body: noteBody, hs_timestamp: Date.now() },
    associations: [{ to: { id: companyId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 190 }] }],
  });

  return searchRes.results?.length ? 'aggiornata' : 'creata';
}

// ─── PPT export ───────────────────────────────────────────────────────────────
async function exportPPT(result) {
  const prs = new pptxgen();
  prs.layout = 'LAYOUT_WIDE';
  const today = new Date().toLocaleDateString('it-IT');
  const nome = result.prospect.nome;
  const deck = result.deck;
  const cases = result.prospect.casi_studio || [];

  const slides = [
    { bg: '#111111', titleColor: '#FFFFFF', type: 'cover',     num: 1, title: deck.slide_1_titolo, content: deck.slide_1_contenuto },
    { bg: '#FFFFFF', titleColor: '#111111', type: 'white_bar', num: 2, title: deck.slide_2_titolo, content: deck.slide_2_contenuto },
    { bg: '#FFFFFF', titleColor: '#111111', type: 'white_bar', num: 3, title: deck.slide_3_titolo, content: deck.slide_3_contenuto, tools: result.prospect.strumenti_suggeriti },
    { bg: '#f5f5f5', titleColor: C.red,     type: 'cases',     num: 4, title: deck.slide_4_titolo },
    { bg: C.red,     titleColor: '#FFFFFF', type: 'nextstep',  num: 5, title: deck.slide_5_titolo, content: deck.slide_5_contenuto },
  ];

  slides.forEach(s => {
    const slide = prs.addSlide();
    slide.background = { color: s.bg.replace('#', '') };

    // Logo
    slide.addText('domino', { x: 0.4, y: 0.25, fontSize: 11, bold: true, color: C.red.replace('#',''), charSpacing: 2 });
    // Slide number
    slide.addText(String(s.num), { x: 12.7, y: 0.25, fontSize: 9, color: C.red.replace('#',''), align: 'right' });
    // Footer
    slide.addText(`${today}  ·  domino.it`, { x: 0.4, y: 7.1, w: 12.5, fontSize: 9, color: '444444', align: 'left' });

    if (s.type === 'cover') {
      slide.addText(nome, { x: 0.4, y: 0.9, fontSize: 11, color: '666666' });
      slide.addText(s.title, { x: 0.4, y: 1.8, w: 11, fontSize: 34, bold: true, color: 'FFFFFF', charSpacing: -1 });
      slide.addText(s.content, { x: 0.4, y: 4.2, w: 11, fontSize: 15, color: 'AAAAAA' });
    }

    if (s.type === 'white_bar') {
      slide.addShape(prs.ShapeType.rect, { x: 0.4, y: 0.65, w: 0.05, h: 0.7, fill: { color: C.red.replace('#','') } });
      slide.addText(s.title, { x: 0.6, y: 0.6, w: 12, fontSize: 26, bold: true, color: '111111', charSpacing: -0.5 });
      slide.addText(s.content, { x: 0.6, y: 1.6, w: 12, fontSize: 15, color: '444444', lineSpacingMultiple: 1.4 });

      const tools = s.tools || {};
      const toolBadges = [];
      if (tools.foundation_sprint) toolBadges.push('Foundation Sprint');
      if (tools.design_sprint_tipo) toolBadges.push(`${tools.design_sprint_tipo} Design Sprint!`);
      if (tools.preventivo_emozionale) toolBadges.push('Preventivo Emozionale');
      if (toolBadges.length) {
        slide.addShape(prs.ShapeType.line, { x: 0.4, y: 5.8, w: 12.5, h: 0, line: { color: 'CCCCCC', width: 0.5 } });
        slide.addText(`Strumenti suggeriti: ${toolBadges.join(' · ')}`, { x: 0.4, y: 6.0, fontSize: 11, bold: true, color: C.red.replace('#','') });
      }
    }

    if (s.type === 'cases') {
      slide.addText(s.title, { x: 6.4, y: 0.5, w: 6.5, fontSize: 20, bold: true, color: C.red.replace('#','') });
      slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 6.2, h: 7.5, fill: { color: '111111' } });
      const barColors = [C.red, '#3B82F6', '#666666'];
      cases.forEach((c, i) => {
        const y = 0.6 + i * 2.1;
        slide.addShape(prs.ShapeType.rect, { x: 0.2, y, w: 0.04, h: 1.5, fill: { color: barColors[i].replace('#','') } });
        slide.addText(c.cliente, { x: 0.4, y, w: 5.5, fontSize: 14, bold: true, color: 'FFFFFF' });
        slide.addText(c.progetto, { x: 0.4, y: y + 0.35, w: 5.5, fontSize: 12, color: 'AAAAAA' });
        slide.addText(c.kpi, { x: 0.4, y: y + 0.75, w: 5.5, fontSize: 13, bold: true, color: '4ADE80' });
        slide.addText(c.perche_affine, { x: 0.4, y: y + 1.15, w: 5.5, fontSize: 11, color: '888888', italic: true });
      });
    }

    if (s.type === 'nextstep') {
      slide.addText('domino', { x: 0.4, y: 0.25, fontSize: 11, bold: true, color: 'FFFFFF', charSpacing: 2 });
      slide.addText(s.title, { x: 0.4, y: 1.5, w: 12, fontSize: 36, bold: true, color: 'FFFFFF' });
      slide.addText(s.content, { x: 0.4, y: 3.2, w: 12, fontSize: 16, color: 'FFCCCC', lineSpacingMultiple: 1.4 });
      slide.addText('domino.it  ·  +39 011 544770  ·  Torino & Venezia', { x: 0.4, y: 6.6, fontSize: 11, color: 'FFAAAA' });
    }
  });

  const filename = `domino-prospect-${nome.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pptx`;
  prs.writeFile({ fileName: filename });
}

// ─── Small components ─────────────────────────────────────────────────────────
function CopyBtn({ text, label = 'Copia' }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 12, color: copied ? '#4ADE80' : C.muted, cursor: 'pointer', fontFamily: FONT }}>
      {copied ? '✓ Copiato' : label}
    </button>
  );
}

function TabBtn({ id, label, active, onClick }) {
  return (
    <button onClick={() => onClick(id)}
      style={{ background: 'none', border: 'none', borderBottom: `2px solid ${active ? C.red : 'transparent'}`, padding: '8px 14px', fontSize: 13, cursor: 'pointer', color: active ? C.white : C.muted, fontFamily: FONT, fontWeight: active ? 600 : 400, transition: 'all .15s', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
}

// ─── Tab components ───────────────────────────────────────────────────────────
function IntelTab({ result }) {
  const p = result.prospect;
  const metrics = [
    { label: 'Settore', value: p.settore },
    { label: 'Dimensione', value: p.dimensione },
    { label: 'Fatturato stimato', value: p.fatturato_stimato || '⚠️ n.d.' },
    { label: 'Mercati', value: p.mercati },
    { label: 'Decisore target', value: p.decisore_target },
    { label: 'Maturità digitale', value: p.maturita_digitale },
  ];
  const caseColors = [C.red, '#3B82F6', C.muted];
  const caseTags = ['Più affine', 'Stesso settore', 'Metodologia'];

  return (
    <div>
      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 13, color: C.text }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Hook */}
      <div style={{ background: 'rgba(232,39,42,0.08)', border: `1px solid rgba(232,39,42,0.2)`, borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: C.text }}>🎯 {p.hook}</span>
      </div>

      {/* Strumenti */}
      {(p.strumenti_suggeriti?.foundation_sprint || p.strumenti_suggeriti?.design_sprint_tipo || p.strumenti_suggeriti?.preventivo_emozionale) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {p.strumenti_suggeriti.foundation_sprint && (
            <span style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>Foundation Sprint</span>
          )}
          {p.strumenti_suggeriti.design_sprint_tipo && (() => {
            const dc = DS_COLORS[p.strumenti_suggeriti.design_sprint_tipo] || DS_COLORS['Service'];
            return (
              <div>
                <span style={{ background: dc.bg, border: `1px solid ${dc.bd}`, color: dc.tx, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{p.strumenti_suggeriti.design_sprint_tipo} Design Sprint!</span>
                {p.strumenti_suggeriti.design_sprint_motivazione && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{p.strumenti_suggeriti.design_sprint_motivazione}</div>}
              </div>
            );
          })()}
          {p.strumenti_suggeriti.preventivo_emozionale && (
            <div>
              <span style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>Preventivo Emozionale</span>
              {p.strumenti_suggeriti.preventivo_emozionale_motivazione && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{p.strumenti_suggeriti.preventivo_emozionale_motivazione}</div>}
            </div>
          )}
        </div>
      )}

      {/* Casi studio */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {(p.casi_studio || []).map((c, i) => (
          <div key={i} style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${caseColors[i]}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: caseColors[i] }}>{c.cliente}</span>
              <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '2px 8px', color: C.muted }}>{caseTags[i]}</span>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>{c.progetto}</div>
            <div style={{ fontSize: 13, color: '#4ADE80', fontWeight: 600, marginBottom: 2 }}>{c.kpi}</div>
            <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>{c.perche_affine}</div>
          </div>
        ))}
      </div>

      {/* Persone chiave */}
      {(p.persone_chiave || []).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Persone chiave</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {p.persone_chiave.map((pk, i) => (
              <div key={i} style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(232,39,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.red, flexShrink: 0 }}>
                  {(pk.nome || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{pk.nome}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{pk.ruolo}{pk.anzianita ? ` · ${pk.anzianita}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segnali */}
      {(p.segnali_recenti || []).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Segnali recenti</div>
          {p.segnali_recenti.map((s, i) => (
            <div key={i} style={{ fontSize: 13, color: C.text, padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.red, marginRight: 8 }}>→</span>{s}
            </div>
          ))}
        </div>
      )}

      {/* Sfide probabili */}
      {(p.sfide_probabili || []).length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Sfide probabili</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {p.sfide_probabili.map((s, i) => (
              <div key={i} style={{ background: C.elevated, border: `1px solid rgba(232,39,42,0.15)`, borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 10 }}>
                <span style={{ color: C.red, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: C.text }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MailTab({ mail }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em' }}>Mail di primo contatto · i casi studio selezionati sono nel corpo</span>
        <CopyBtn text={`${mail.oggetto}\n\n${mail.corpo}`} label="Copia tutto" />
      </div>
      <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Oggetto</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{mail.oggetto}</div>
      </div>
      <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', marginBottom: 8 }}>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.75, color: C.text, fontFamily: FONT, margin: 0 }}>{mail.corpo}</pre>
      </div>
      <CopyBtn text={mail.corpo} label="Copia corpo" />
    </div>
  );
}

function DeckTab({ deck, onExport }) {
  const slides = [
    { key: 'slide_1', bg: '#0a0a0a', titleColor: C.white },
    { key: 'slide_2', bg: C.white, titleColor: '#111111', bar: true },
    { key: 'slide_3', bg: C.white, titleColor: '#111111', bar: true },
    { key: 'slide_4', bg: '#f5f5f5', titleColor: C.red },
    { key: 'slide_5', bg: C.red, titleColor: C.white },
  ];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em' }}>5 slide · struttura narrativa</span>
        <button onClick={onExport}
          style={{ background: C.red, color: C.white, border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
          ⬇ Scarica PPT
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {slides.map((s, i) => {
          const title = deck[`${s.key}_titolo`];
          const content = deck[`${s.key}_contenuto`];
          return (
            <div key={s.key} style={{ background: s.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', borderLeft: s.bar ? `4px solid ${C.red}` : undefined }}>
              <div style={{ fontSize: 10, color: s.bg === C.white ? '#999' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Slide {i + 1}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.titleColor, marginBottom: 8 }}>{title}</div>
              {content && <div style={{ fontSize: 13, color: s.bg === C.white ? '#444' : 'rgba(255,255,255,0.7)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{content}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkflowTab({ workflow }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Sequenza multicanale · 14 giorni</div>
      {workflow.map((w, i) => (
        <div key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
            <div style={{ minWidth: 36, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.red, lineHeight: 1 }}>Gg{w.giorno}</div>
            </div>
            <div style={{ background: CANAL_COLORS[w.canale] || C.muted, color: C.white, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, flexShrink: 0 }}>{w.canale}</div>
            <div style={{ fontSize: 14, color: C.text, flex: 1 }}>{w.azione}</div>
          </div>
          {i < workflow.length - 1 && <div style={{ borderTop: `1px solid ${C.border}` }} />}
        </div>
      ))}
    </div>
  );
}

function LinkedInTab({ linkedin }) {
  const len = (linkedin.messaggio || '').length;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ background: 'rgba(0,119,181,0.15)', border: '1px solid rgba(0,119,181,0.4)', color: '#93c5fd', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>{linkedin.tipo}</span>
        <CopyBtn text={linkedin.messaggio} />
        <span style={{ fontSize: 12, color: len > 300 ? C.red : C.muted, marginLeft: 'auto' }}>{len} / 300 caratteri</span>
      </div>
      <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px' }}>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.75, color: C.text, fontFamily: FONT, margin: 0 }}>{linkedin.messaggio}</pre>
      </div>
    </div>
  );
}

function FontiTab({ fonti }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Report grezzo della research — verificabile, usabile per approfondimenti manuali</div>
      <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', maxHeight: 520, overflowY: 'auto' }}>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.6, color: C.muted, fontFamily: 'monospace', margin: 0 }}>{fonti}</pre>
      </div>
    </div>
  );
}

// ─── Archive Modal ────────────────────────────────────────────────────────────
function ArchiveModal({ onClose, onSelect }) {
  const archive = loadArchive();
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, width: 480, maxHeight: '75vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, color: C.text }}>Archivio analisi</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18, fontFamily: FONT }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {archive.length === 0 && <div style={{ padding: 24, color: C.muted, textAlign: 'center' }}>Nessuna analisi salvata</div>}
          {archive.map((item, i) => (
            <div key={i} onClick={() => { onSelect(item); onClose(); }}
              style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', transition: 'border-left .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderLeft = `3px solid ${C.red}`}
              onMouseLeave={e => e.currentTarget.style.borderLeft = ''}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.prospect?.nome || 'Sconosciuto'}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{item.prospect?.settore} · {new Date(item._savedAt).toLocaleDateString('it-IT')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── HubSpot Modal ────────────────────────────────────────────────────────────
function HsModal({ token, setToken, onClose, onSync, syncing, hsMsg }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, width: 440, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontWeight: 600, color: C.text }}>Configura HubSpot</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18, fontFamily: FONT }}>×</button>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Token privato (pat-eu1-...) con permessi Companies + Notes</div>
        <input value={token} onChange={e => { setToken(e.target.value); localStorage.setItem('domino_hs_token', e.target.value); }}
          placeholder="pat-eu1-xxxxxxxx..."
          style={{ width: '100%', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, fontFamily: 'monospace', marginBottom: 12, outline: 'none' }} />
        <button onClick={onSync} disabled={syncing || !token}
          style={{ background: syncing ? C.border : C.red, color: C.white, border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
          {syncing ? 'Sincronizzazione...' : '↗ Sincronizza su HubSpot'}
        </button>
        {hsMsg && <div style={{ marginTop: 10, fontSize: 13, color: '#4ADE80' }}>{hsMsg}</div>}
      </div>
    </div>
  );
}

// ─── GTM Selector (NUOVO) ────────────────────────────────────────────────────
function GtmSelector({ layer, setLayer, motion, setMotion }) {
  return (
    <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>GTM Layer — chi è il destinatario?</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {GTM_LAYERS.map(l => (
          <div key={l.id} onClick={() => setLayer(l.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: `1px solid ${layer === l.id ? l.color : C.border}`, background: layer === l.id ? l.bg : 'transparent', cursor: 'pointer', transition: 'all .12s' }}>
            <div style={{ width: 3, height: 28, borderRadius: 2, background: l.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{l.label}</span>
              <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{l.interlocutor}</span>
            </div>
            <span style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>{l.need}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Motion — come stai entrando?</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {GTM_MOTIONS.map(m => (
          <div key={m.id} onClick={() => setMotion(m.id)}
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `1px solid ${motion === m.id ? C.text : C.border}`, background: motion === m.id ? 'rgba(255,255,255,0.05)' : 'transparent', cursor: 'pointer', transition: 'all .12s' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{m.desc}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2, opacity: .7 }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Lista prospect view ──────────────────────────────────────────────────────
function ListaView({ onAnalyze }) {
  const [settore, setSettore] = useState('');
  const [geo, setGeo] = useState('Italia');
  const [dim, setDim] = useState([]);
  const [keywords, setKeywords] = useState('');
  const [numero, setNumero] = useState(10);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const iv = setInterval(() => { setLoadMsg(LISTA_MSGS[i % LISTA_MSGS.length]); i++; }, 8000);
    setLoadMsg(LISTA_MSGS[0]);
    return () => clearInterval(iv);
  }, [loading]);

  async function handleGenera() {
    if (!settore) { setError('Seleziona un settore'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const res = await fetch('/api/prospect-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settore, geografia: geo, dimensione: dim, keywords, numero }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const toggleDim = d => setDim(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const input = { background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, fontFamily: FONT, width: '100%', outline: 'none' };

  return (
    <div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Settore</div>
        <select value={settore} onChange={e => setSettore(e.target.value)} style={input}>
          <option value="">Seleziona settore...</option>
          {SETTORI_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Geografia</div>
            <input value={geo} onChange={e => setGeo(e.target.value)} style={input} placeholder="Italia" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Numero prospect</div>
            <select value={numero} onChange={e => setNumero(Number(e.target.value))} style={input}>
              {[5, 10, 20].map(n => <option key={n} value={n}>{n} aziende</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Dimensione</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['PMI', 'Mid-market', 'Enterprise'].map(d => (
              <button key={d} onClick={() => toggleDim(d)}
                style={{ border: `1px solid ${dim.includes(d) ? C.red : C.border}`, background: dim.includes(d) ? 'rgba(232,39,42,0.1)' : 'transparent', color: dim.includes(d) ? C.red : C.muted, borderRadius: 20, padding: '4px 14px', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Keywords aggiuntive</div>
          <input value={keywords} onChange={e => setKeywords(e.target.value)} style={input} placeholder="es. export, digital transformation, B2B..." />
        </div>

        {error && <div style={{ color: C.red, fontSize: 12, marginTop: 10 }}>⚠️ {error}</div>}
        <button onClick={handleGenera} disabled={loading || !settore}
          style={{ marginTop: 14, background: loading ? C.border : C.red, color: C.white, border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
          {loading ? loadMsg : '🔍 Genera lista prospect'}
        </button>
      </div>

      {result && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{result.totale_trovate} prospect trovati</span>
            <span style={{ fontSize: 12, color: C.muted }}>{result.criteri_applicati}</span>
          </div>
          {(result.lista || []).map((p, i) => (
            <div key={i} style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{p.nome}</span>
                  <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>{p.settore} · {p.sede}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: p.score >= 8 ? 'rgba(74,222,128,0.1)' : p.score >= 6 ? 'rgba(232,39,42,0.1)' : 'rgba(102,102,102,0.1)', border: `1px solid ${p.score >= 8 ? 'rgba(74,222,128,0.4)' : p.score >= 6 ? 'rgba(232,39,42,0.3)' : C.border}`, borderRadius: 20, padding: '2px 12px', fontSize: 13, fontWeight: 700, color: p.score >= 8 ? '#4ADE80' : p.score >= 6 ? C.red : C.muted }}>
                    {p.score}/10
                  </div>
                  <button onClick={() => onAnalyze(p.sito || p.nome)}
                    style={{ background: C.red, color: C.white, border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                    Analizza →
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>{p.segnale_principale}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontStyle: 'italic' }}>{p.score_motivazione}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState('analizza');
  const [input, setInput] = useState('');
  const [note, setNote] = useState('');
  const [gtmLayer, setGtmLayer] = useState('usecases');   // NUOVO
  const [gtmMotion, setGtmMotion] = useState('bottomup'); // NUOVO
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('intel');
  const [hsToken, setHsToken] = useState(() => localStorage.getItem('domino_hs_token') || '');
  const [hsSyncing, setHsSyncing] = useState(false);
  const [hsMsg, setHsMsg] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [showHs, setShowHs] = useState(false);
  const [archCount, setArchCount] = useState(() => loadArchive().length);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const iv = setInterval(() => { setLoadMsg(LOADING_MSGS[i % LOADING_MSGS.length]); i++; }, 7500);
    setLoadMsg(LOADING_MSGS[0]);
    return () => clearInterval(iv);
  }, [loading]);

  async function handleAnalyze(overrideInput) {
    const target = overrideInput || input;
    if (!target.trim()) { setError('Inserisci il nome o URL del prospect'); return; }
    setError(''); setLoading(true); setResult(null); setTab('intel');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect: target, note, layer: gtmLayer, motion: gtmMotion }), // NUOVO: layer + motion
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      saveToArchive(data);
      setArchCount(loadArchive().length);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleHsSync() {
    if (!result || !hsToken) return;
    setHsSyncing(true); setHsMsg('');
    try {
      const action = await syncToHubspot(hsToken, result);
      setHsMsg(`✓ Azienda ${action} su HubSpot`);
    } catch (e) { setHsMsg(`⚠️ Errore: ${e.message}`); }
    finally { setHsSyncing(false); }
  }

  const s = (v) => ({
    background: C.black, color: C.text, fontFamily: FONT, minHeight: '100vh', padding: '0 0 80px',
  });

  const cardStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px', marginBottom: 14 };
  const inputStyle = { background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 14, color: C.text, fontFamily: FONT, width: '100%', outline: 'none' };

  return (
    <div style={s()}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: C.black, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 16, letterSpacing: 2 }}>
            <span style={{ color: C.red }}>●</span><span style={{ color: C.card }}>○</span><span style={{ color: C.red }}>●</span><span style={{ color: C.card }}>○</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: -.3 }}>Domino <span style={{ color: C.muted, fontWeight: 400 }}>| Prospect Engine</span></span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowArchive(true)}
            style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, color: C.muted, cursor: 'pointer', fontFamily: FONT }}>
            📁 Archivio {archCount > 0 && `(${archCount})`}
          </button>
          {result && (
            <button onClick={() => setShowHs(true)}
              style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, color: C.muted, cursor: 'pointer', fontFamily: FONT }}>
              ↗ HubSpot
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px' }}>
        {/* Mode switch */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[['analizza','🔍 Analizza prospect'], ['lista','📋 Genera lista']].map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)}
              style={{ background: mode === m ? C.red : 'none', border: `1px solid ${mode === m ? C.red : C.border}`, color: mode === m ? C.white : C.muted, borderRadius: 8, padding: '7px 18px', fontSize: 13, fontWeight: mode === m ? 600 : 400, cursor: 'pointer', fontFamily: FONT }}>
              {label}
            </button>
          ))}
        </div>

        {/* Lista mode */}
        {mode === 'lista' && <ListaView onAnalyze={inp => { setInput(inp); setMode('analizza'); }} />}

        {/* Analizza mode */}
        {mode === 'analizza' && (
          <>
            {!loading && !result && (
              <div style={cardStyle}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Prospect</div>
                  <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                    style={inputStyle} placeholder="Nome azienda o URL (es. technogym.com)" autoFocus />
                </div>

                {/* Quick picks */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {QUICK_PICKS.map(q => (
                    <button key={q} onClick={() => setInput(q)}
                      style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 20, padding: '3px 12px', fontSize: 12, color: C.muted, cursor: 'pointer', fontFamily: FONT }}>
                      {q}
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Note (opzionale)</div>
                  <textarea value={note} onChange={e => setNote(e.target.value)}
                    style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }}
                    placeholder="Es. contatto è il CMO, stanno cercando partner per rifare il sito..." />
                </div>

                {/* GTM Selector (NUOVO) */}
                <GtmSelector layer={gtmLayer} setLayer={setGtmLayer} motion={gtmMotion} setMotion={setGtmMotion} />

                {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 10 }}>⚠️ {error}</div>}
                <button onClick={() => handleAnalyze()} disabled={!input.trim()}
                  style={{ background: input.trim() ? C.red : C.border, color: C.white, border: 'none', borderRadius: 8, padding: '11px 24px', fontSize: 14, fontWeight: 700, cursor: input.trim() ? 'pointer' : 'not-allowed', fontFamily: FONT }}>
                  Analizza →
                </button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 32, marginBottom: 16, animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⚙</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>Analisi in corso: {input}</div>
                <div style={{ fontSize: 13, color: C.muted }}>{loadMsg}</div>
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <div style={cardStyle}>
                {/* Result header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{result.prospect.nome}</span>
                  <span style={{ background: 'rgba(232,39,42,0.1)', border: `1px solid rgba(232,39,42,0.3)`, color: C.red, borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>{result.prospect.settore}</span>
                  {/* GTM badge */}
                  {(() => {
                    const l = GTM_LAYERS.find(x => x.id === gtmLayer);
                    const m = GTM_MOTIONS.find(x => x.id === gtmMotion);
                    return l && m ? (
                      <>
                        <span style={{ background: l.bg, border: `1px solid ${l.color}`, color: l.color, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{l.label}</span>
                        <span style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>{m.label}</span>
                      </>
                    ) : null;
                  })()}
                  <button onClick={() => { setResult(null); setError(''); }} style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, color: C.muted, cursor: 'pointer', fontFamily: FONT }}>Nuova analisi</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 16, overflowX: 'auto' }}>
                  {[['intel','🔍 Intelligence'], ['mail','✉️ Mail'], ['deck','📊 Deck'], ['workflow','📅 Workflow'], ['linkedin','💼 LinkedIn'], ['fonti','📋 Fonti']].map(([id, label]) => (
                    <TabBtn key={id} id={id} label={label} active={tab === id} onClick={setTab} />
                  ))}
                </div>

                {tab === 'intel'    && <IntelTab result={result} />}
                {tab === 'mail'     && <MailTab mail={result.mail} />}
                {tab === 'deck'     && <DeckTab deck={result.deck} onExport={() => exportPPT(result)} />}
                {tab === 'workflow' && <WorkflowTab workflow={result.workflow} />}
                {tab === 'linkedin' && <LinkedInTab linkedin={result.linkedin} />}
                {tab === 'fonti'    && <FontiTab fonti={result.fonti_ricerca} />}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showArchive && <ArchiveModal onClose={() => setShowArchive(false)} onSelect={r => { setResult(r); setMode('analizza'); }} />}
      {showHs && <HsModal token={hsToken} setToken={setHsToken} onClose={() => setShowHs(false)} onSync={handleHsSync} syncing={hsSyncing} hsMsg={hsMsg} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
