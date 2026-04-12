import { useState, useCallback } from 'react';
import pptxgen from 'pptxgenjs';

// ─── Design System ────────────────────────────────────────────────────────────
const C = {
  red:      '#E8272A',
  black:    '#0a0a0a',
  card:     '#141414',
  elevated: '#1e1e1e',
  border:   '#222222',
  text:     '#e8e8e8',
  muted:    '#666666',
  white:    '#FFFFFF',
};
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const DS_COLORS = {
  'Service':           { bg:'rgba(99,102,241,0.12)',  bd:'rgba(99,102,241,0.4)',  tx:'#a5b4fc' },
  'CX':                { bg:'rgba(236,72,153,0.12)',  bd:'rgba(236,72,153,0.4)',  tx:'#f9a8d4' },
  'Brand':             { bg:'rgba(245,158,11,0.12)',  bd:'rgba(245,158,11,0.4)',  tx:'#fcd34d' },
  'Digital Marketing': { bg:'rgba(16,185,129,0.12)',  bd:'rgba(16,185,129,0.4)',  tx:'#6ee7b7' },
  'Website':           { bg:'rgba(59,130,246,0.12)',  bd:'rgba(59,130,246,0.4)',  tx:'#93c5fd' },
  'Intranet':          { bg:'rgba(234,88,12,0.12)',   bd:'rgba(234,88,12,0.4)',   tx:'#fdba74' },
};

const CANAL_COLORS = { LinkedIn: '#0077B5', Email: C.red, Telefono: '#22c55e' };

// ─── GTM Config (v3.2) ────────────────────────────────────────────────────────
const GTM_LAYERS = [
  { id:'vision',    label:'L1 — Experience Vision', interlocutor:'CEO / C-Suite',           need:'"Inspirami"',                color:'#7C3AED', bg:'rgba(124,58,237,0.1)' },
  { id:'settori',   label:'L2 — Settori',           interlocutor:'Director / VP Marketing', need:'"Connettiti col mio mondo"', color:'#059669', bg:'rgba(5,150,105,0.1)'   },
  { id:'usecases',  label:'L3 — Use Cases',         interlocutor:'Director / Head of',      need:'"Rendilo tangibile"',        color:'#2563EB', bg:'rgba(37,99,235,0.1)'   },
  { id:'tech',      label:'L4 — Tech Categories',   interlocutor:'Manager / Specialista',   need:'"Trovami dove cerco"',       color:'#D97706', bg:'rgba(217,119,6,0.1)'   },
  { id:'salesplay', label:'L5 — Sales Play',        interlocutor:'Manager / Procurement',   need:'"Sei nell\'RFP?"',           color:'#DB2777', bg:'rgba(219,39,119,0.1)'  },
];

const GTM_MOTIONS = [
  { id:'bottomup', label:'⬆ Bottom-up', desc:'Contatto freddo o inbound — sali se sei rilevante',       sub:'Pipeline rapida' },
  { id:'topdown',  label:'⬇ Top-down',  desc:'Referenza CEO / evento — scendi al team con credibilità', sub:'Deal più grandi'  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadArchive() {
  try { return JSON.parse(localStorage.getItem('domino_pe_arch') || '[]'); } catch { return []; }
}
function saveToArchive(r) {
  const a = loadArchive();
  a.unshift({ ...r, _savedAt: new Date().toISOString() });
  localStorage.setItem('domino_pe_arch', JSON.stringify(a.slice(0, 50)));
}

async function syncHubSpot(token, result) {
  const p = result.prospect;
  const search = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: 'name', operator: 'EQ', value: p.nome }] }] }),
  });
  const existing = (await search.json()).results?.[0];
  const props = {
    name: p.nome, industry: p.settore || '',
    description: `Domino PE — ${new Date().toLocaleDateString('it-IT')}\nHook: ${p.hook || ''}\nDecisore: ${p.decisore_target || ''}\nMaturità: ${p.maturita_digitale || ''}`,
    hs_lead_status: 'IN_PROGRESS',
  };
  let companyId;
  if (existing) {
    await fetch(`https://api.hubapi.com/crm/v3/objects/companies/${existing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ properties: props }),
    });
    companyId = existing.id;
  } else {
    const cr = await fetch('https://api.hubapi.com/crm/v3/objects/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ properties: props }),
    });
    companyId = (await cr.json()).id;
  }
  const noteBody = [
    `📊 ANALISI DOMINO PROSPECT ENGINE — ${new Date().toLocaleDateString('it-IT')}`,
    `Settore: ${p.settore} | Dimensione: ${p.dimensione} | Fatturato: ${p.fatturato_stimato || 'N/D'}`,
    `Decisore: ${p.decisore_target} | Maturità digitale: ${p.maturita_digitale}`,
    `\nHOOK: ${p.hook}`,
    `\nSFIDE:\n${(p.sfide_probabili || []).map(s => `• ${s}`).join('\n')}`,
    `\nSEGNALI:\n${(p.segnali_recenti || []).map(s => `• ${s}`).join('\n')}`,
    `\nCASI STUDIO:\n${(p.casi_studio || []).map((c, i) => `${i + 1}. ${c.cliente} — ${c.kpi}`).join('\n')}`,
    `\nWORKFLOW:\n${(result.workflow || []).map(w => `Gg${w.giorno} [${w.canale}]: ${w.azione}`).join('\n')}`,
  ].join('\n');
  await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      properties: { hs_note_body: noteBody, hs_timestamp: Date.now().toString() },
      associations: [{ to: { id: companyId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 190 }] }],
    }),
  });
  return { isNew: !existing };
}

// ─── PPT Export ───────────────────────────────────────────────────────────────
function exportPPT(result) {
  const prs = new pptxgen();
  prs.layout = 'LAYOUT_WIDE';
  const p = result.prospect, d = result.deck;
  const addNum  = (sl, n) => sl.addText(String(n), { x: 12, y: .15, w: .8, h: .3, fontSize: 9, bold: true, color: 'E8272A', fontFace: 'Helvetica', align: 'right' });
  const addLogo = (sl)    => sl.addText('domino',   { x: .4, y: .18, w: 1.2, h: .3, fontSize: 11, bold: true, color: 'E8272A', fontFace: 'Helvetica', charSpacing: 2 });

  const s1 = prs.addSlide(); s1.background = { color: '111111' }; addLogo(s1); addNum(s1, 1);
  s1.addText(p.nome,           { x: .4, y: .6,  w: 12,   h: .4,  fontSize: 11, color: '666666', fontFace: 'Helvetica' });
  s1.addText(d.slide_1_titolo, { x: .4, y: 1.4, w: 11.5, h: 2.2, fontSize: 34, bold: true, color: 'FFFFFF', fontFace: 'Helvetica', charSpacing: -1 });
  s1.addText(d.slide_1_contenuto, { x: .4, y: 3.8, w: 10, h: 2.2, fontSize: 15, color: 'AAAAAA', fontFace: 'Helvetica', breakLine: true });
  s1.addText(`${new Date().toLocaleDateString('it-IT')} · domino.it`, { x: .4, y: 6.8, w: 8, h: .3, fontSize: 9, color: '444444', fontFace: 'Helvetica' });

  const s2 = prs.addSlide(); s2.background = { color: 'FFFFFF' }; addLogo(s2); addNum(s2, 2);
  s2.addShape(prs.ShapeType.rect, { x: .4, y: .65, w: .05, h: .7, fill: { color: 'E8272A' } });
  s2.addText(d.slide_2_titolo,    { x: .6, y: .6,  w: 11.5, h: .9,  fontSize: 26, bold: true, color: '111111', fontFace: 'Helvetica', charSpacing: -.5 });
  s2.addText(d.slide_2_contenuto, { x: .4, y: 1.8, w: 12,   h: 4.5, fontSize: 15, color: '444444', fontFace: 'Helvetica', breakLine: true, lineSpacingMultiple: 1.4 });

  const s3 = prs.addSlide(); s3.background = { color: 'FFFFFF' }; addLogo(s3); addNum(s3, 3);
  s3.addShape(prs.ShapeType.rect, { x: .4, y: .65, w: .05, h: .7, fill: { color: 'E8272A' } });
  s3.addText(d.slide_3_titolo,    { x: .6, y: .6,  w: 11.5, h: .9,  fontSize: 26, bold: true, color: '111111', fontFace: 'Helvetica', charSpacing: -.5 });
  s3.addText(d.slide_3_contenuto, { x: .4, y: 1.8, w: 12,   h: 3.5, fontSize: 15, color: '444444', fontFace: 'Helvetica', breakLine: true, lineSpacingMultiple: 1.4 });
  const ss = p.strumenti_suggeriti || {};
  const tools = [ss.foundation_sprint && 'Foundation Sprint', ss.design_sprint_tipo && `${ss.design_sprint_tipo} Design Sprint!`, ss.preventivo_emozionale && 'Preventivo Emozionale'].filter(Boolean);
  if (tools.length) {
    s3.addShape(prs.ShapeType.rect, { x: .4, y: 5.4, w: 12, h: .06, fill: { color: 'E5E7EB' } });
    s3.addText('Strumenti suggeriti: ' + tools.join('  ·  '), { x: .4, y: 5.6, w: 12, h: .4, fontSize: 11, bold: true, color: 'E8272A', fontFace: 'Helvetica' });
  }

  const s4 = prs.addSlide(); s4.background = { color: 'FFFFFF' };
  s4.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 6.2, h: 7.5, fill: { color: '111111' } }); addNum(s4, 4);
  s4.addText('domino', { x: .4, y: .18, w: 1.5, h: .3, fontSize: 11, bold: true, color: 'E8272A', fontFace: 'Helvetica' });
  s4.addText(d.slide_4_titolo, { x: 6.4, y: .4, w: 6.6, h: .7, fontSize: 20, bold: true, color: 'E8272A', fontFace: 'Helvetica' });
  (p.casi_studio || []).forEach((cs, i) => {
    const yb = .9 + i * 2;
    s4.addShape(prs.ShapeType.rect, { x: .4, y: yb, w: .04, h: 1.4, fill: { color: i === 0 ? 'E8272A' : i === 1 ? '3B82F6' : '888888' } });
    s4.addText(cs.cliente, { x: .6, y: yb,       w: 5.4, h: .4,  fontSize: 13, bold: true, color: 'FFFFFF', fontFace: 'Helvetica' });
    s4.addText(cs.progetto, { x: .6, y: yb + .38, w: 5.4, h: .35, fontSize: 11, color: 'AAAAAA', fontFace: 'Helvetica' });
    if (cs.kpi)          s4.addText('📊 ' + cs.kpi,          { x: .6, y: yb + .72, w: 5.4, h: .3,  fontSize: 10, color: '4ADE80', fontFace: 'Helvetica' });
    if (cs.perche_affine) s4.addText('→ ' + cs.perche_affine, { x: .6, y: yb + 1,   w: 5.4, h: .35, fontSize: 9,  color: '888888', fontFace: 'Helvetica' });
  });
  s4.addText(d.slide_4_contenuto, { x: 6.4, y: 1.2, w: 6.4, h: 5.5, fontSize: 13, color: '444444', fontFace: 'Helvetica', breakLine: true, lineSpacingMultiple: 1.5 });

  const s5 = prs.addSlide(); s5.background = { color: 'E8272A' }; addNum(s5, 5);
  s5.addText('domino',           { x: .4, y: .18, w: 1.2,  h: .3,  fontSize: 11, bold: true, color: 'FFFFFF', fontFace: 'Helvetica', charSpacing: 2 });
  s5.addText(d.slide_5_titolo,   { x: .4, y: 1.6, w: 12.2, h: 1.8, fontSize: 36, bold: true, color: 'FFFFFF', fontFace: 'Helvetica', charSpacing: -1 });
  s5.addText(d.slide_5_contenuto,{ x: .4, y: 3.6, w: 10,   h: 2.5, fontSize: 16, color: 'FFCCCC', fontFace: 'Helvetica', breakLine: true, lineSpacingMultiple: 1.5 });
  s5.addText('domino.it  ·  +39 011 544770  ·  Torino & Venezia', { x: .4, y: 6.8, w: 10, h: .3, fontSize: 10, color: 'FFAAAA', fontFace: 'Helvetica' });

  prs.writeFile({ fileName: `domino-prospect-${(p.nome || 'export').replace(/\s+/g, '-').toLowerCase()}.pptx` });
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: '8px' }}>{children}</div>;
}

function InfoBox({ label, value }) {
  return (
    <div style={{ background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 12px' }}>
      <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{value || '—'}</div>
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px', ...style }}>{children}</div>;
}

function Btn({ children, onClick, disabled, variant = 'primary', style }) {
  const base = { padding: '9px 20px', borderRadius: '7px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: FONT, border: 'none', transition: 'opacity 0.15s', ...style };
  const v = {
    primary: { background: disabled ? C.elevated : C.red, color: disabled ? C.muted : C.white },
    ghost:   { background: 'transparent', border: `1px solid ${C.border}`, color: C.muted },
    hs:      { background: 'rgba(255,122,89,0.1)', border: '1px solid rgba(255,122,89,0.3)', color: '#ff7a59' },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...v[variant] }}>{children}</button>;
}

function TabBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{ padding: '7px 14px', background: active ? C.red : 'transparent', color: active ? C.white : C.muted, border: `1px solid ${active ? C.red : C.border}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: active ? 700 : 400, fontFamily: FONT, transition: 'all 0.15s' }}>
      {label}
    </button>
  );
}

function Pill({ children, color }) {
  const c = color || { bg: 'rgba(255,255,255,0.05)', bd: C.border, tx: C.muted };
  return <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: c.bg, border: `1px solid ${c.bd}`, color: c.tx }}>{children}</span>;
}

function CopyBtn({ text, label = 'Copia' }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}
      style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontFamily: FONT }}>
      {done ? '✓ Copiato' : label}
    </button>
  );
}

// ─── GTM Selector ─────────────────────────────────────────────────────────────
// Spec §10a: posizionato tra il campo Note e il bottone Analizza
function GtmSelector({ layer, setLayer, motion, setMotion }) {
  return (
    <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>

      <div style={{ fontSize: '10px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '10px' }}>
        GTM Layer — chi è il destinatario?
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
        {GTM_LAYERS.map(l => (
          <div key={l.id} onClick={() => setLayer(l.id)} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
            border: `1px solid ${layer === l.id ? l.color : C.border}`,
            background: layer === l.id ? l.bg : 'transparent',
            transition: 'all .12s',
          }}>
            <div style={{ width: '3px', height: '28px', borderRadius: '2px', background: l.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: C.text }}>{l.label}</span>
              <span style={{ fontSize: '11px', color: C.muted, marginLeft: '8px' }}>{l.interlocutor}</span>
            </div>
            <span style={{ fontSize: '11px', color: C.muted, fontStyle: 'italic', whiteSpace: 'nowrap' }}>{l.need}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '10px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>
        Motion — come stai entrando?
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {GTM_MOTIONS.map(m => (
          <div key={m.id} onClick={() => setMotion(m.id)} style={{
            flex: 1, padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
            border: `1px solid ${motion === m.id ? C.text : C.border}`,
            background: motion === m.id ? 'rgba(255,255,255,0.05)' : 'transparent',
            transition: 'all .12s',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: C.text, marginBottom: '2px' }}>{m.label}</div>
            <div style={{ fontSize: '11px', color: C.muted, lineHeight: 1.4 }}>{m.desc}</div>
            <div style={{ fontSize: '10px', color: C.muted, marginTop: '3px', opacity: .6 }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab Intelligence ─────────────────────────────────────────────────────────
function IntelTab({ p }) {
  const ss    = p.strumenti_suggeriti || {};
  const dsType = ss.design_sprint_tipo;
  const dsCol  = dsType && DS_COLORS[dsType] ? DS_COLORS[dsType] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Profilo — 6 InfoBox su griglia */}
      <div>
        <SectionLabel>Profilo</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          <InfoBox label="Settore"           value={p.settore} />
          <InfoBox label="Dimensione"        value={p.dimensione} />
          <InfoBox label="Fatturato"         value={p.fatturato_stimato || '⚠️ N/D'} />
          <InfoBox label="Mercati"           value={p.mercati} />
          <InfoBox label="Decisore target"   value={p.decisore_target} />
          <InfoBox label="Maturità digitale" value={p.maturita_digitale} />
        </div>
      </div>

      {/* Hook */}
      <div style={{ background: 'rgba(232,39,42,0.07)', border: '1px solid rgba(232,39,42,0.25)', borderRadius: '10px', padding: '14px 16px' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,39,42,0.8)', marginBottom: '6px' }}>
          Hook — osservazione chiave
        </div>
        <div style={{ fontSize: '14px', color: '#ff9999', lineHeight: 1.6 }}>🎯 {p.hook}</div>
      </div>

      {/* Strumenti suggeriti */}
      {(ss.foundation_sprint || dsType || ss.preventivo_emozionale) && (
        <div>
          <SectionLabel>Strumenti suggeriti</SectionLabel>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {ss.foundation_sprint && (
              <div style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', padding: '10px 14px' }}>
                <Pill color={{ bg: 'rgba(168,85,247,0.12)', bd: 'rgba(168,85,247,0.35)', tx: '#c084fc' }}>Foundation Sprint</Pill>
              </div>
            )}
            {dsType && dsCol && (
              <div style={{ background: dsCol.bg, border: `1px solid ${dsCol.bd}`, borderRadius: '8px', padding: '10px 14px' }}>
                <Pill color={dsCol}>{dsType} Design Sprint!</Pill>
                {ss.design_sprint_motivazione && <div style={{ fontSize: '11px', color: C.muted, marginTop: '6px' }}>{ss.design_sprint_motivazione}</div>}
              </div>
            )}
            {ss.preventivo_emozionale && (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '10px 14px' }}>
                <Pill color={{ bg: 'rgba(34,197,94,0.12)', bd: 'rgba(34,197,94,0.35)', tx: '#4ade80' }}>Preventivo Emozionale</Pill>
                {ss.preventivo_emozionale_motivazione && <div style={{ fontSize: '11px', color: C.muted, marginTop: '6px' }}>{ss.preventivo_emozionale_motivazione}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Casi studio */}
      <div>
        <SectionLabel>3 Casi studio selezionati</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(p.casi_studio || []).map((cs, i) => {
            const accent = i === 0 ? C.red : i === 1 ? '#3b82f6' : '#888';
            const tagCol  = i === 0
              ? { bg: 'rgba(232,39,42,0.08)',  bd: 'rgba(232,39,42,0.25)',  tx: '#ff9999' }
              : i === 1
              ? { bg: 'rgba(59,130,246,0.08)', bd: 'rgba(59,130,246,0.25)', tx: '#93c5fd' }
              : { bg: 'rgba(255,255,255,0.04)', bd: C.border, tx: C.muted };
            return (
              <div key={i} style={{ display: 'flex', background: '#0d0d0d', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                <div style={{ width: '4px', background: accent, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: accent }}>{cs.cliente}</span>
                    <Pill color={tagCol}>{['Più affine', 'Stesso settore', 'Metodologia'][i]}</Pill>
                  </div>
                  <div style={{ fontSize: '13px', color: C.text, marginBottom: '4px' }}>{cs.progetto}</div>
                  {cs.kpi         && <div style={{ fontSize: '11px', color: '#4ade80', marginBottom: '2px' }}>📊 {cs.kpi}</div>}
                  {cs.perche_affine && <div style={{ fontSize: '11px', color: C.muted, fontStyle: 'italic' }}>→ {cs.perche_affine}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Persone chiave */}
      {(p.persone_chiave || []).length > 0 && (
        <div>
          <SectionLabel>Persone chiave</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {p.persone_chiave.map((pk, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 14px' }}>
                <div style={{ width: '32px', height: '32px', background: C.elevated, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: C.muted, flexShrink: 0 }}>
                  {pk.nome?.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{pk.nome}</div>
                  <div style={{ fontSize: '11px', color: C.muted }}>{pk.ruolo}{pk.anzianita ? ` · ${pk.anzianita}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segnali recenti */}
      {(p.segnali_recenti || []).length > 0 && (
        <div>
          <SectionLabel>Segnali recenti</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {p.segnali_recenti.map((sg, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 14px' }}>
                <span style={{ color: C.red, fontWeight: 700, flexShrink: 0 }}>→</span>
                <span style={{ fontSize: '13px', color: C.text, lineHeight: 1.5 }}>{sg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sfide probabili */}
      {(p.sfide_probabili || []).length > 0 && (
        <div>
          <SectionLabel>Sfide probabili</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {p.sfide_probabili.map((sfida, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(232,39,42,0.04)', border: '1px solid rgba(232,39,42,0.12)', borderRadius: '8px', padding: '10px 14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: C.red, flexShrink: 0, minWidth: '16px' }}>{i + 1}.</span>
                <span style={{ fontSize: '13px', color: C.text, lineHeight: 1.5 }}>{sfida}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab Mail ─────────────────────────────────────────────────────────────────
function MailTab({ mail }) {
  if (!mail) return null;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '12px', color: C.muted }}>Mail di primo contatto · i casi studio selezionati sono nel corpo</span>
        <CopyBtn text={`Oggetto: ${mail.oggetto}\n\n${mail.corpo}`} label="Copia tutto" />
      </div>
      <Card style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: '6px' }}>Oggetto</div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>{mail.oggetto}</div>
      </Card>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}><CopyBtn text={mail.corpo} /></div>
        <div style={{ fontSize: '14px', color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{mail.corpo}</div>
      </Card>
    </div>
  );
}

// ─── Tab Deck ─────────────────────────────────────────────────────────────────
function DeckTab({ deck }) {
  if (!deck) return null;
  const slides = [
    { n: 1, bg: C.black,   t: deck.slide_1_titolo, c: deck.slide_1_contenuto, dark: true  },
    { n: 2, bg: C.white,   t: deck.slide_2_titolo, c: deck.slide_2_contenuto              },
    { n: 3, bg: C.white,   t: deck.slide_3_titolo, c: deck.slide_3_contenuto              },
    { n: 4, bg: '#f5f5f5', t: deck.slide_4_titolo, c: deck.slide_4_contenuto, highlight: true },
    { n: 5, bg: C.red,     t: deck.slide_5_titolo, c: deck.slide_5_contenuto, red: true   },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {slides.map(({ n, bg, t, c, dark, red, highlight }) => (
        <div key={n} style={{ background: bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px 16px', display: 'flex', gap: '12px' }}>
          {!dark && !red && <div style={{ width: '4px', borderRadius: '2px', background: C.red, flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: red ? 'rgba(255,255,255,0.5)' : C.muted, textTransform: 'uppercase', marginBottom: '4px' }}>
              Slide {n}{highlight ? ' — Casi studio' : ''}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: red || dark ? C.white : '#111', marginBottom: '4px' }}>{t}</div>
            <div style={{ fontSize: '12px', color: red ? 'rgba(255,255,255,0.8)' : dark ? C.muted : '#555', lineHeight: 1.6 }}>{c}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab Workflow ─────────────────────────────────────────────────────────────
function WorkflowTab({ workflow }) {
  if (!workflow) return null;
  return (
    <div>
      <div style={{ fontSize: '12px', color: C.muted, marginBottom: '14px' }}>Sequenza multicanale · 14 giorni</div>
      {workflow.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ minWidth: '44px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>GG</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: C.text, lineHeight: 1 }}>{step.giorno}</div>
          </div>
          <div>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, background: `${CANAL_COLORS[step.canale]}18`, color: CANAL_COLORS[step.canale], marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {step.canale}
            </span>
            <div style={{ fontSize: '13px', color: C.text, lineHeight: 1.55 }}>{step.azione}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab LinkedIn ─────────────────────────────────────────────────────────────
function LinkedInTab({ linkedin }) {
  if (!linkedin) return null;
  const len = linkedin.messaggio?.length || 0;
  const over = len > 300;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <Pill color={{ bg: 'rgba(0,119,181,0.1)', bd: 'rgba(0,119,181,0.3)', tx: '#60a5fa' }}>{linkedin.tipo}</Pill>
        <CopyBtn text={linkedin.messaggio} />
      </div>
      <Card>
        <div style={{ fontSize: '14px', color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap', marginBottom: '10px' }}>{linkedin.messaggio}</div>
        <div style={{ fontSize: '11px', color: over ? '#f87171' : C.muted }}>{len} / 300 caratteri{over ? ' ⚠️ sopra limite' : ''}</div>
      </Card>
    </div>
  );
}

// ─── Tab Fonti ────────────────────────────────────────────────────────────────
function FontiTab({ fonti }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: C.muted, marginBottom: '12px' }}>Report grezzo della research — verificabile, usabile per approfondimenti manuali</div>
      <Card>
        <div style={{ fontSize: '12px', color: '#999', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: '520px', overflowY: 'auto' }}>
          {fonti || '⚠️ Nessuna fonte disponibile'}
        </div>
      </Card>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function Modal({ onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '24px', maxHeight: '85vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

function ArchiveModal({ onClose, onLoad }) {
  const items = loadArchive();
  return (
    <Modal onClose={onClose}>
      <div style={{ width: '560px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: C.text }}>📁 Archivio analisi</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>
        {items.length === 0
          ? <div style={{ textAlign: 'center', color: C.muted, padding: '40px 0', fontSize: '14px' }}>Nessuna analisi salvata ancora.</div>
          : items.map((item, i) => (
            <div key={i} onClick={() => { onLoad(item); onClose(); }}
              style={{ padding: '12px', background: '#0d0d0d', borderRadius: '8px', marginBottom: '6px', cursor: 'pointer', border: `1px solid ${C.border}`, transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.red}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: C.text }}>{item.prospect?.nome || 'N/D'}</div>
              <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{item.prospect?.settore} · {new Date(item._savedAt).toLocaleDateString('it-IT')}</div>
            </div>
          ))}
      </div>
    </Modal>
  );
}

function HsModal({ current, onClose, onSave }) {
  const [val, setVal] = useState(current || '');
  return (
    <Modal onClose={onClose}>
      <div style={{ width: '440px' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: C.text, marginBottom: '6px' }}>Configura HubSpot</div>
        <div style={{ fontSize: '12px', color: C.muted, marginBottom: '16px', lineHeight: 1.6 }}>
          Private App Token con permessi su Companies e Notes.<br />
          Crea su <span style={{ color: '#ff7a59' }}>app.hubspot.com/private-apps</span>
        </div>
        <input value={val} onChange={e => setVal(e.target.value)} placeholder="pat-eu1-xxxxxxxx..."
          style={{ width: '100%', background: '#0d0d0d', border: `1px solid ${C.border}`, color: C.text, padding: '10px 12px', borderRadius: '7px', fontSize: '12px', fontFamily: 'monospace', marginBottom: '14px', outline: 'none', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={onClose}>Annulla</Btn>
          <Btn onClick={() => { onSave(val); onClose(); }}>Salva token</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const VERSION = 'v3.2.0';
const QUICK_PICKS    = ['Technogym', 'Humanitas', 'Alpitour', 'Amplifon', 'Pirelli', "De'Longhi", 'Fincantieri', "Tod's"];
const SETTORI_OPTIONS = ['Automotive', 'B2B Industriale / Manifatturiero', 'Salute & Sanità', 'Turismo & Cultura', 'Finance & Assicurazioni', 'Real Estate', 'Pubblica Amministrazione', 'Retail & eCommerce', 'Tecnologia & Software', 'Altro'];
const LOADING_MSGS   = ['Analisi sito web aziendale...', 'Ricerca dati finanziari (Cerved/CCIAA)...', 'Raccolta news ultimi 12 mesi...', 'Analisi profili LinkedIn...', 'Verifica job posting attivi...', 'Valutazione presenza digitale...', 'Generazione materiali sales personalizzati...'];
const LISTA_MSGS     = ['Ricerca aziende nel settore...', 'Verifica siti web e presenza digitale...', 'Analisi segnali di bisogno digitale...', 'Ricerca decisori e struttura aziendale...', 'Scoring e ranking prospect...'];

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // — mode
  const [mode, setMode] = useState('analizza');
  // — analisi
  const [input,      setInput]      = useState('');
  const [note,       setNote]       = useState('');
  const [gtmLayer,   setGtmLayer]   = useState('usecases');
  const [gtmMotion,  setGtmMotion]  = useState('bottomup');
  const [loading,    setLoading]    = useState(false);
  const [loadMsg,    setLoadMsg]    = useState('');
  const [result,     setResult]     = useState(null);
  const [tab,        setTab]        = useState('intel');
  // — lista
  const [listaSettore,  setListaSettore]  = useState('');
  const [listaGeo,      setListaGeo]      = useState('Italia');
  const [listaDim,      setListaDim]      = useState([]);
  const [listaKeywords, setListaKeywords] = useState('');
  const [listaNumero,   setListaNumero]   = useState(10);
  const [listaLoading,  setListaLoading]  = useState(false);
  const [listaMsg,      setListaMsg]      = useState('');
  const [listaResult,   setListaResult]   = useState(null);
  // — hubspot
  const [hsToken,   setHsToken]   = useState(() => localStorage.getItem('domino_hs_token') || '');
  const [hsSyncing, setHsSyncing] = useState(false);
  const [hsMsg,     setHsMsg]     = useState('');
  // — ui
  const [showArchive, setShowArchive] = useState(false);
  const [showHs,      setShowHs]      = useState(false);
  const [archCount,   setArchCount]   = useState(() => loadArchive().length);

  const analyze = useCallback(async () => {
    if (!input.trim() || loading) return;
    setLoading(true); setResult(null); setTab('intel'); setHsMsg('');
    let mi = 0; setLoadMsg(LOADING_MSGS[0]);
    const iv = setInterval(() => { mi = Math.min(mi + 1, LOADING_MSGS.length - 1); setLoadMsg(LOADING_MSGS[mi]); }, 7500);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect: input.trim(), note: note.trim(), layer: gtmLayer, motion: gtmMotion }),
      });
      if (!res.ok) throw new Error(`Errore ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setResult(data); saveToArchive(data); setArchCount(loadArchive().length);
    } catch (err) { alert(`Errore: ${err.message}`); }
    finally { clearInterval(iv); setLoading(false); setLoadMsg(''); }
  }, [input, note, gtmLayer, gtmMotion, loading]);

  const generateLista = useCallback(async () => {
    if (!listaSettore || listaLoading) return;
    setListaLoading(true); setListaResult(null);
    let mi = 0; setListaMsg(LISTA_MSGS[0]);
    const iv = setInterval(() => { mi = Math.min(mi + 1, LISTA_MSGS.length - 1); setListaMsg(LISTA_MSGS[mi]); }, 8000);
    try {
      const res = await fetch('/api/prospect-list', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settore: listaSettore, geografia: listaGeo, dimensione: listaDim, keywords: listaKeywords, numero: listaNumero }),
      });
      if (!res.ok) throw new Error(`Errore ${res.status}: ${await res.text()}`);
      setListaResult(await res.json());
    } catch (err) { alert(`Errore: ${err.message}`); }
    finally { clearInterval(iv); setListaLoading(false); setListaMsg(''); }
  }, [listaSettore, listaGeo, listaDim, listaKeywords, listaNumero, listaLoading]);

  const doHsSync = async () => {
    if (!hsToken) { setShowHs(true); return; }
    setHsSyncing(true); setHsMsg('');
    try { const { isNew } = await syncHubSpot(hsToken, result); setHsMsg(isNew ? '✓ Azienda creata' : '✓ Azienda aggiornata'); }
    catch (err) { setHsMsg(`⚠️ ${err.message}`); }
    finally { setHsSyncing(false); }
  };

  const p = result?.prospect;

  return (
    <div style={{ minHeight: '100vh', background: C.black, color: C.text, fontFamily: FONT }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div style={{ background: '#080808', borderBottom: `1px solid ${C.border}`, height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            {[1, 0, 1, 0].map((r, i) => <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: r ? C.red : '#2a2a2a' }} />)}
          </div>
          <span style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Domino</span>
          <span style={{ color: C.border }}>|</span>
          <span style={{ color: C.muted, fontSize: '12px' }}>Prospect Engine</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Btn variant="ghost" onClick={() => setShowArchive(true)} style={{ padding: '4px 12px', fontSize: '11px' }}>
            📁 Archivio ({archCount})
          </Btn>
          <Btn variant={hsToken ? 'hs' : 'ghost'} onClick={() => setShowHs(true)} style={{ padding: '4px 12px', fontSize: '11px' }}>
            {hsToken ? '● HubSpot' : '○ HubSpot'}
          </Btn>
        </div>
      </div>

      <div style={{ maxWidth: '920px', margin: '0 auto', padding: '28px 20px' }}>

        {/* Mode switcher */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {[['analizza', '🔍 Analizza Prospect'], ['lista', '📋 Genera Lista Prospect']].map(([m, lbl]) => (
            <button key={m} onClick={() => setMode(m)} style={{ padding: '9px 20px', background: mode === m ? C.red : C.card, color: mode === m ? C.white : C.muted, border: `1px solid ${mode === m ? C.red : C.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: mode === m ? 700 : 400, fontFamily: FONT, transition: 'all 0.15s' }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* ══════ LISTA ═══════════════════════════════════════════════════ */}
        {mode === 'lista' && (
          <>
            <Card style={{ marginBottom: '20px' }}>
              <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>Genera Lista Prospect</h1>
              <p style={{ margin: '0 0 20px', color: C.muted, fontSize: '13px' }}>Scegli settore e filtri → l'AI costruisce una lista qualificata con scoring. Da ogni riga puoi lanciare l'analisi approfondita.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: '6px' }}>Settore *</div>
                  <select value={listaSettore} onChange={e => setListaSettore(e.target.value)}
                    style={{ width: '100%', background: '#0d0d0d', border: `1px solid ${C.border}`, color: listaSettore ? C.text : C.muted, padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontFamily: FONT, outline: 'none', cursor: 'pointer' }}>
                    <option value="">Seleziona settore...</option>
                    {SETTORI_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: '6px' }}>Area geografica</div>
                  <input value={listaGeo} onChange={e => setListaGeo(e.target.value)} placeholder="es. Italia, Nord Italia, Piemonte..."
                    style={{ width: '100%', background: '#0d0d0d', border: `1px solid ${C.border}`, color: C.text, padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: '6px' }}>Dimensione</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['PMI', 'Mid-market', 'Enterprise'].map(d => (
                      <button key={d} onClick={() => setListaDim(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                        style={{ flex: 1, padding: '8px 6px', background: listaDim.includes(d) ? 'rgba(232,39,42,0.12)' : '#0d0d0d', border: `1px solid ${listaDim.includes(d) ? C.red : C.border}`, color: listaDim.includes(d) ? C.red : C.muted, borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: listaDim.includes(d) ? 700 : 400, fontFamily: FONT }}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: '6px' }}>Numero prospect</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[5, 10, 20].map(n => (
                      <button key={n} onClick={() => setListaNumero(n)}
                        style={{ flex: 1, padding: '10px', background: listaNumero === n ? 'rgba(232,39,42,0.12)' : '#0d0d0d', border: `1px solid ${listaNumero === n ? C.red : C.border}`, color: listaNumero === n ? C.red : C.muted, borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: listaNumero === n ? 700 : 400, fontFamily: FONT }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: '6px' }}>Parole chiave / focus specifico (opzionale)</div>
                <input value={listaKeywords} onChange={e => setListaKeywords(e.target.value)} placeholder="es. 'export internazionale', 'in crescita', 'rete vendita indiretta'"
                  style={{ width: '100%', background: '#0d0d0d', border: `1px solid ${C.border}`, color: C.text, padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <Btn onClick={generateLista} disabled={listaLoading || !listaSettore} style={{ width: '100%', fontSize: '14px', padding: '12px' }}>
                {listaLoading ? 'Generazione lista...' : `Genera ${listaNumero} prospect qualificati →`}
              </Btn>
            </Card>

            {listaLoading && (
              <Card style={{ textAlign: 'center', padding: '36px 24px', marginBottom: '20px' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📋</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>{listaMsg}</div>
                <div style={{ fontSize: '12px', color: C.muted, marginBottom: '20px' }}>Ricerca e scoring in corso — circa 1-2 minuti</div>
                <div style={{ background: C.elevated, borderRadius: '4px', height: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '3px', background: C.red, borderRadius: '4px', animation: 'scan 2.5s ease-in-out infinite' }} />
                </div>
                <style>{`@keyframes scan{0%,100%{width:20%;opacity:0.4}50%{width:75%;opacity:1}}`}</style>
              </Card>
            )}

            {listaResult && !listaLoading && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: C.text }}>{listaResult.lista?.length || 0} prospect trovati</div>
                    <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>{listaResult.criteri_applicati}</div>
                  </div>
                  <Btn variant="ghost" onClick={() => setListaResult(null)} style={{ padding: '5px 12px', fontSize: '11px' }}>Nuova ricerca</Btn>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(listaResult.lista || []).sort((a, b) => (b.score || 0) - (a.score || 0)).map((item, i) => {
                    const score = item.score || 0;
                    const scoreColor = score >= 8 ? '#22c55e' : score >= 6 ? '#f59e0b' : C.muted;
                    return (
                      <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ textAlign: 'center', minWidth: '52px', background: '#0d0d0d', borderRadius: '8px', padding: '8px 6px' }}>
                          <div style={{ fontSize: '22px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</div>
                          <div style={{ fontSize: '9px', color: C.muted, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>score</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>{item.nome}</div>
                            {item.sito && <a href={item.sito.startsWith('http') ? item.sito : `https://${item.sito}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: C.muted, textDecoration: 'none' }}>↗ {item.sito}</a>}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            {[item.settore, item.dimensione, item.sede].filter(Boolean).map((tag, ti) => (
                              <span key={ti} style={{ fontSize: '10px', color: C.muted, background: C.elevated, padding: '2px 7px', borderRadius: '3px' }}>{tag}</span>
                            ))}
                            {item.decisore_probabile && (
                              <span style={{ fontSize: '10px', color: '#93c5fd', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '2px 7px', borderRadius: '3px' }}>👤 {item.decisore_probabile}</span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '3px' }}><span style={{ color: scoreColor }}>●</span> {item.score_motivazione}</div>
                          {item.segnale_principale && <div style={{ fontSize: '11px', color: C.muted, fontStyle: 'italic' }}>→ {item.segnale_principale}</div>}
                        </div>
                        <button onClick={() => { setMode('analizza'); setInput(item.sito || item.nome); setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          style={{ background: C.red, border: 'none', color: C.white, padding: '8px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: FONT, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          Analizza →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════ ANALIZZA ════════════════════════════════════════════════ */}
        {mode === 'analizza' && (
          <>
            {/* Form */}
            <Card style={{ marginBottom: '20px' }}>
              <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>Analizza un prospect</h1>
              <p style={{ margin: '0 0 16px', color: C.muted, fontSize: '13px' }}>
                Ricerca approfondita su sito · Cerved/bilanci · news · LinkedIn · job posting → materiali sales con il DNA Domino.
              </p>

              {/* 1. Input azienda */}
              <input
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && analyze()}
                disabled={loading}
                placeholder="es. Technogym · Gruppo Humanitas · www.alpitour.it"
                style={{ width: '100%', background: '#0d0d0d', border: `2px solid ${C.border}`, color: C.text, padding: '12px 14px', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: FONT, transition: 'border-color 0.15s', boxSizing: 'border-box', marginBottom: '10px' }}
                onFocus={e => e.target.style.borderColor = C.red}
                onBlur={e => e.target.style.borderColor = C.border}
              />

              {/* 2. Note commerciali */}
              <textarea
                value={note} onChange={e => setNote(e.target.value)} disabled={loading}
                placeholder="Note per il commerciale (opzionale) — es. 'ci hanno contattato a un evento', 'competitor è X'"
                style={{ width: '100%', background: '#0d0d0d', border: `1px solid ${C.border}`, color: C.text, padding: '9px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: FONT, resize: 'vertical', minHeight: '54px', boxSizing: 'border-box', marginBottom: '14px' }}
              />

              {/* 3. GTM Selector — spec §10a: tra Note e bottone Analizza */}
              <GtmSelector layer={gtmLayer} setLayer={setGtmLayer} motion={gtmMotion} setMotion={setGtmMotion} />

              {/* 4. Bottone Analizza — DOPO GTM selector */}
              <Btn onClick={analyze} disabled={loading || !input.trim()} style={{ width: '100%', fontSize: '14px', padding: '12px', marginBottom: '14px' }}>
                {loading ? 'Analisi in corso…' : 'Analizza →'}
              </Btn>

              {/* 5. Quick picks */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: C.muted }}>Quick picks:</span>
                {QUICK_PICKS.map(q => (
                  <button key={q} onClick={() => setInput(q)}
                    style={{ background: C.elevated, border: `1px solid ${C.border}`, color: C.muted, padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontFamily: FONT }}>
                    {q}
                  </button>
                ))}
              </div>
            </Card>

            {/* Loading */}
            {loading && (
              <Card style={{ marginBottom: '20px', textAlign: 'center', padding: '36px 24px' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>{loadMsg}</div>
                <div style={{ fontSize: '12px', color: C.muted, marginBottom: '20px' }}>Analisi approfondita · sito, Cerved, news, LinkedIn, job posting…</div>
                <div style={{ background: C.elevated, borderRadius: '4px', height: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '3px', background: C.red, borderRadius: '4px', animation: 'scan 2.5s ease-in-out infinite' }} />
                </div>
                <style>{`@keyframes scan{0%,100%{width:20%;opacity:0.4}50%{width:75%;opacity:1}}`}</style>
              </Card>
            )}

            {/* Result */}
            {result && p && (
              <>
                {/* Result header */}
                <div style={{ background: '#080808', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: '3px' }}>Prospect</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: C.text }}>{p.nome}</div>
                  </div>
                  <div style={{ width: '1px', height: '30px', background: C.border }} />
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: '3px' }}>Settore</div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>{p.settore}</div>
                  </div>
                  <div style={{ width: '1px', height: '30px', background: C.border }} />
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: '3px' }}>Decisore</div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>{p.decisore_target}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Btn variant="ghost" onClick={() => exportPPT(result)} style={{ padding: '5px 12px', fontSize: '11px' }}>⬇ PPT</Btn>
                    <Btn variant="hs" onClick={doHsSync} disabled={hsSyncing} style={{ padding: '5px 12px', fontSize: '11px' }}>
                      {hsSyncing ? 'Sync…' : '→ HubSpot'}
                    </Btn>
                    {hsMsg && <span style={{ fontSize: '11px', color: hsMsg.startsWith('✓') ? '#4ade80' : '#f87171' }}>{hsMsg}</span>}
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {[['intel', '🔍 Intelligence'], ['mail', '✉️ Mail'], ['deck', '📊 Deck'], ['workflow', '📅 Workflow'], ['linkedin', '💼 LinkedIn'], ['fonti', '📋 Fonti']].map(([id, lbl]) => (
                    <TabBtn key={id} active={tab === id} onClick={() => setTab(id)} label={lbl} />
                  ))}
                </div>

                <Card>
                  {tab === 'intel'    && <IntelTab    p={p} />}
                  {tab === 'mail'     && <MailTab     mail={result.mail} />}
                  {tab === 'deck'     && <DeckTab     deck={result.deck} />}
                  {tab === 'workflow' && <WorkflowTab workflow={result.workflow} />}
                  {tab === 'linkedin' && <LinkedInTab linkedin={result.linkedin} />}
                  {tab === 'fonti'    && <FontiTab    fonti={result.fonti_ricerca} />}
                </Card>
              </>
            )}
          </>
        )}
      </div>

      {showArchive && <ArchiveModal onClose={() => setShowArchive(false)} onLoad={d => { setResult(d); setTab('intel'); setMode('analizza'); }} />}
      {showHs && <HsModal current={hsToken} onClose={() => setShowHs(false)} onSave={t => { setHsToken(t); localStorage.setItem('domino_hs_token', t); }} />}

      <div style={{ textAlign: 'center', padding: '24px 0 16px', fontSize: '11px', color: '#333' }}>
        {VERSION} · Domino Prospect Engine · domino.it
      </div>
    </div>
  );
}
