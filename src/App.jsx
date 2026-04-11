import { useState, useCallback } from 'react';
import pptxgen from 'pptxgenjs';

// ─── Design System Domino ─────────────────────────────────────────────────────
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

// Design Sprint colors per tipo
const DS_COLORS = {
  'Service':          { bg: 'rgba(99,102,241,0.12)',  bd: 'rgba(99,102,241,0.4)',  tx: '#a5b4fc' },
  'CX':               { bg: 'rgba(236,72,153,0.12)',  bd: 'rgba(236,72,153,0.4)',  tx: '#f9a8d4' },
  'Brand':            { bg: 'rgba(245,158,11,0.12)',  bd: 'rgba(245,158,11,0.4)',  tx: '#fcd34d' },
  'Digital Marketing':{ bg: 'rgba(16,185,129,0.12)',  bd: 'rgba(16,185,129,0.4)',  tx: '#6ee7b7' },
  'Website':          { bg: 'rgba(59,130,246,0.12)',  bd: 'rgba(59,130,246,0.4)',  tx: '#93c5fd' },
  'Intranet':         { bg: 'rgba(234,88,12,0.12)',   bd: 'rgba(234,88,12,0.4)',   tx: '#fdba74' },
};
const CANAL_COLORS = { LinkedIn: '#0077B5', Email: C.red, Telefono: '#22c55e' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadArchive() {
  try { return JSON.parse(localStorage.getItem('domino_pe_arch') || '[]'); }
  catch { return []; }
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
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ properties: props }),
    });
    companyId = existing.id;
  } else {
    const cr = await fetch('https://api.hubapi.com/crm/v3/objects/companies', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ properties: props }),
    });
    companyId = (await cr.json()).id;
  }
  const noteLines = [
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
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      properties: { hs_note_body: noteLines, hs_timestamp: Date.now().toString() },
      associations: [{ to: { id: companyId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 190 }] }],
    }),
  });
  return { isNew: !existing };
}

// ─── PPT Export — brand Domino ────────────────────────────────────────────────
function exportPPT(result) {
  const prs = new pptxgen();
  prs.layout = 'LAYOUT_WIDE';
  const p = result.prospect;
  const d = result.deck;

  // helpers
  const addSlideNumber = (slide, n) =>
    slide.addText(String(n), { x: 12.0, y: 0.15, w: 0.8, h: 0.3, fontSize: 9, bold: true, color: 'E8272A', fontFace: 'Helvetica', align: 'right' });

  const addLogo = (slide, dark = true) =>
    slide.addText('domino', { x: 0.4, y: 0.18, w: 1.2, h: 0.3, fontSize: 11, bold: true, color: dark ? 'E8272A' : 'E8272A', fontFace: 'Helvetica', charSpacing: 2 });

  // Slide 1 — Cover dark
  const s1 = prs.addSlide();
  s1.background = { color: '111111' };
  addLogo(s1, true);
  addSlideNumber(s1, 1);
  s1.addText(p.nome, { x: 0.4, y: 0.6, w: 12, h: 0.4, fontSize: 11, color: '666666', fontFace: 'Helvetica' });
  s1.addText(d.slide_1_titolo, { x: 0.4, y: 1.4, w: 11.5, h: 2.2, fontSize: 34, bold: true, color: 'FFFFFF', fontFace: 'Helvetica', charSpacing: -1 });
  s1.addText(d.slide_1_contenuto, { x: 0.4, y: 3.8, w: 10, h: 2.2, fontSize: 15, color: 'AAAAAA', fontFace: 'Helvetica', breakLine: true });
  s1.addText(`${new Date().toLocaleDateString('it-IT')} · domino.it`, { x: 0.4, y: 6.8, w: 8, h: 0.3, fontSize: 9, color: '444444', fontFace: 'Helvetica' });

  // Slide 2 — Problema (white)
  const s2 = prs.addSlide();
  s2.background = { color: 'FFFFFF' };
  addLogo(s2, false);
  addSlideNumber(s2, 2);
  s2.addShape(prs.ShapeType.rect, { x: 0.4, y: 0.65, w: 0.05, h: 0.7, fill: { color: 'E8272A' } });
  s2.addText(d.slide_2_titolo, { x: 0.6, y: 0.6, w: 11.5, h: 0.9, fontSize: 26, bold: true, color: '111111', fontFace: 'Helvetica', charSpacing: -0.5 });
  s2.addText(d.slide_2_contenuto, { x: 0.4, y: 1.8, w: 12, h: 4.5, fontSize: 15, color: '444444', fontFace: 'Helvetica', breakLine: true, lineSpacingMultiple: 1.4 });

  // Slide 3 — Soluzione (white)
  const s3 = prs.addSlide();
  s3.background = { color: 'FFFFFF' };
  addLogo(s3, false);
  addSlideNumber(s3, 3);
  s3.addShape(prs.ShapeType.rect, { x: 0.4, y: 0.65, w: 0.05, h: 0.7, fill: { color: 'E8272A' } });
  s3.addText(d.slide_3_titolo, { x: 0.6, y: 0.6, w: 11.5, h: 0.9, fontSize: 26, bold: true, color: '111111', fontFace: 'Helvetica', charSpacing: -0.5 });
  s3.addText(d.slide_3_contenuto, { x: 0.4, y: 1.8, w: 12, h: 3.5, fontSize: 15, color: '444444', fontFace: 'Helvetica', breakLine: true, lineSpacingMultiple: 1.4 });
  const ss = p.strumenti_suggeriti || {};
  const tools = [ss.foundation_sprint && 'Foundation Sprint', ss.design_sprint_tipo && `${ss.design_sprint_tipo} Design Sprint!`, ss.preventivo_emozionale && 'Preventivo Emozionale'].filter(Boolean);
  if (tools.length) {
    s3.addShape(prs.ShapeType.rect, { x: 0.4, y: 5.4, w: 12, h: 0.06, fill: { color: 'E5E7EB' } });
    s3.addText('Strumenti suggeriti: ' + tools.join('  ·  '), { x: 0.4, y: 5.6, w: 12, h: 0.4, fontSize: 11, bold: true, color: 'E8272A', fontFace: 'Helvetica' });
  }

  // Slide 4 — Case studies (split dark/white)
  const s4 = prs.addSlide();
  s4.background = { color: 'FFFFFF' };
  s4.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 6.2, h: 7.5, fill: { color: '111111' } });
  addSlideNumber(s4, 4);
  s4.addText('domino', { x: 0.4, y: 0.18, w: 1.5, h: 0.3, fontSize: 11, bold: true, color: 'E8272A', fontFace: 'Helvetica' });
  s4.addText(d.slide_4_titolo, { x: 6.4, y: 0.4, w: 6.6, h: 0.7, fontSize: 20, bold: true, color: 'E8272A', fontFace: 'Helvetica' });
  (p.casi_studio || []).forEach((cs, i) => {
    const yBase = 0.9 + i * 2.0;
    s4.addShape(prs.ShapeType.rect, { x: 0.4, y: yBase, w: 0.04, h: 1.4, fill: { color: i === 0 ? 'E8272A' : i === 1 ? '3B82F6' : '888888' } });
    s4.addText(cs.cliente, { x: 0.6, y: yBase, w: 5.4, h: 0.4, fontSize: 13, bold: true, color: 'FFFFFF', fontFace: 'Helvetica' });
    s4.addText(cs.progetto, { x: 0.6, y: yBase + 0.38, w: 5.4, h: 0.35, fontSize: 11, color: 'AAAAAA', fontFace: 'Helvetica' });
    if (cs.kpi) s4.addText('📊 ' + cs.kpi, { x: 0.6, y: yBase + 0.72, w: 5.4, h: 0.3, fontSize: 10, color: '4ADE80', fontFace: 'Helvetica' });
    if (cs.perche_affine) s4.addText('→ ' + cs.perche_affine, { x: 0.6, y: yBase + 1.0, w: 5.4, h: 0.35, fontSize: 9, color: '888888', fontFace: 'Helvetica' });
  });
  s4.addText(d.slide_4_contenuto, { x: 6.4, y: 1.2, w: 6.4, h: 5.5, fontSize: 13, color: '444444', fontFace: 'Helvetica', breakLine: true, lineSpacingMultiple: 1.5 });

  // Slide 5 — Next step (red)
  const s5 = prs.addSlide();
  s5.background = { color: 'E8272A' };
  addSlideNumber(s5, 5);
  s5.addText('domino', { x: 0.4, y: 0.18, w: 1.2, h: 0.3, fontSize: 11, bold: true, color: 'FFFFFF', fontFace: 'Helvetica', charSpacing: 2 });
  s5.addText(d.slide_5_titolo, { x: 0.4, y: 1.6, w: 12.2, h: 1.8, fontSize: 36, bold: true, color: 'FFFFFF', fontFace: 'Helvetica', charSpacing: -1 });
  s5.addText(d.slide_5_contenuto, { x: 0.4, y: 3.6, w: 10, h: 2.5, fontSize: 16, color: 'FFCCCC', fontFace: 'Helvetica', breakLine: true, lineSpacingMultiple: 1.5 });
  s5.addText('domino.it  ·  +39 011 544770  ·  Torino & Venezia', { x: 0.4, y: 6.8, w: 10, h: 0.3, fontSize: 10, color: 'FFAAAA', fontFace: 'Helvetica' });

  prs.writeFile({ fileName: `domino-prospect-${(p.nome || 'export').replace(/\s+/g, '-').toLowerCase()}.pptx` });
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
const s = {
  label: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: '4px' },
  val: { fontSize: '13px', fontWeight: 600, color: C.text },
};

function Label({ children }) { return <div style={s.label}>{children}</div>; }
function Val({ children }) { return <div style={s.val}>{children}</div>; }
function Div({ style, children, ...p }) { return <div style={style} {...p}>{children}</div>; }

function Card({ children, style }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px', ...style }}>{children}</div>;
}

function Btn({ children, onClick, disabled, variant = 'primary', style }) {
  const base = { padding: '9px 20px', borderRadius: '7px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: FONT, border: 'none', transition: 'opacity 0.15s', ...style };
  const variants = {
    primary: { background: disabled ? C.elevated : C.red, color: disabled ? C.muted : C.white },
    ghost:   { background: 'transparent', border: `1px solid ${C.border}`, color: C.muted },
    hs:      { background: 'rgba(255,122,89,0.1)', border: '1px solid rgba(255,122,89,0.3)', color: '#ff7a59' },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>{children}</button>;
}

function Tab({ active, onClick, label }) {
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

function AccentLine() {
  return <div style={{ width: '4px', borderRadius: '2px', background: C.red, flexShrink: 0 }} />;
}

// ─── Tab Panels ───────────────────────────────────────────────────────────────
function IntelTab({ p }) {
  const ss = p.strumenti_suggeriti || {};
  const dsType = ss.design_sprint_tipo;
  const dsCol = dsType && DS_COLORS[dsType] ? DS_COLORS[dsType] : null;

  return (
    <div>
      {/* Grid info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '18px' }}>
        {[['Settore', p.settore], ['Dimensione', p.dimensione], ['Fatturato', p.fatturato_stimato || '⚠️ N/D'], ['Mercati', p.mercati], ['Decisore target', p.decisore_target], ['Maturità digitale', p.maturita_digitale]].map(([l, v]) => (
          <div key={l} style={{ background: '#0d0d0d', borderRadius: '8px', padding: '10px 12px' }}>
            <Label>{l}</Label><Val>{v}</Val>
          </div>
        ))}
      </div>

      {/* Hook */}
      <div style={{ background: 'rgba(232,39,42,0.07)', border: '1px solid rgba(232,39,42,0.2)', borderRadius: '8px', padding: '12px 14px', marginBottom: '18px' }}>
        <Label>Hook — osservazione chiave</Label>
        <div style={{ fontSize: '14px', color: '#ff9999', lineHeight: 1.55, marginTop: '4px' }}>🎯 {p.hook}</div>
      </div>

      {/* Tool badges */}
      <div style={{ marginBottom: '18px' }}>
        <Label>Strumenti suggeriti</Label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
          {ss.foundation_sprint && <Pill color={{ bg: 'rgba(168,85,247,0.12)', bd: 'rgba(168,85,247,0.35)', tx: '#c084fc' }}>Foundation Sprint</Pill>}
          {dsType && dsCol && (
            <div>
              <Pill color={dsCol}>{dsType} Design Sprint!</Pill>
              {ss.design_sprint_motivazione && <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>{ss.design_sprint_motivazione}</div>}
            </div>
          )}
          {ss.preventivo_emozionale && (
            <div>
              <Pill color={{ bg: 'rgba(34,197,94,0.12)', bd: 'rgba(34,197,94,0.35)', tx: '#4ade80' }}>Preventivo Emozionale</Pill>
              {ss.preventivo_emozionale_motivazione && <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>{ss.preventivo_emozionale_motivazione}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Case studies */}
      <div style={{ marginBottom: '18px' }}>
        <Label>3 Casi studio selezionati</Label>
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(p.casi_studio || []).map((cs, i) => {
            const accentColor = i === 0 ? C.red : i === 1 ? '#3b82f6' : '#888';
            return (
              <div key={i} style={{ display: 'flex', gap: '12px', background: '#0d0d0d', borderRadius: '8px', padding: '12px', alignItems: 'stretch' }}>
                <div style={{ width: '4px', borderRadius: '2px', background: accentColor, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: accentColor }}>{cs.cliente}</span>
                    <Pill color={i === 0 ? { bg: 'rgba(232,39,42,0.08)', bd: 'rgba(232,39,42,0.25)', tx: '#ff9999' } : i === 1 ? { bg: 'rgba(59,130,246,0.08)', bd: 'rgba(59,130,246,0.25)', tx: '#93c5fd' } : { bg: 'rgba(255,255,255,0.05)', bd: C.border, tx: C.muted }}>
                      {['Più affine', 'Stesso settore', 'Metodologia'][i]}
                    </Pill>
                  </div>
                  <div style={{ fontSize: '12px', color: C.text, marginBottom: '3px' }}>{cs.progetto}</div>
                  {cs.kpi && <div style={{ fontSize: '11px', color: '#4ade80' }}>📊 {cs.kpi}</div>}
                  {cs.perche_affine && <div style={{ fontSize: '11px', color: C.muted, marginTop: '3px', fontStyle: 'italic' }}>→ {cs.perche_affine}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* People */}
      {(p.persone_chiave || []).length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Label>Persone chiave</Label>
          <div style={{ marginTop: '8px' }}>
            {p.persone_chiave.map((pk, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: '30px', height: '30px', background: C.elevated, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: C.muted, flexShrink: 0 }}>{pk.nome?.charAt(0) || '?'}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{pk.nome}</div>
                  <div style={{ fontSize: '11px', color: C.muted }}>{pk.ruolo}{pk.anzianita ? ` · ${pk.anzianita}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signals */}
      {(p.segnali_recenti || []).length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Label>Segnali recenti</Label>
          <div style={{ marginTop: '8px' }}>
            {p.segnali_recenti.map((sg, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', padding: '7px 0', borderBottom: `1px solid ${C.border}`, fontSize: '13px', color: C.text }}>
                <span style={{ color: C.red, flexShrink: 0 }}>→</span>{sg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Challenges */}
      <div>
        <Label>Sfide probabili</Label>
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(p.sfide_probabili || []).map((s, i) => (
            <div key={i} style={{ background: 'rgba(232,39,42,0.04)', border: `1px solid rgba(232,39,42,0.12)`, borderRadius: '7px', padding: '8px 12px', fontSize: '13px', color: C.text }}>
              <span style={{ color: C.red, marginRight: '8px', fontWeight: 700 }}>{i + 1}.</span>{s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MailTab({ mail }) {
  if (!mail) return null;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '12px', color: C.muted }}>Mail di primo contatto · i casi studio selezionati sono nel corpo</span>
        <CopyBtn text={`Oggetto: ${mail.oggetto}\n\n${mail.corpo}`} label="Copia tutto" />
      </div>
      <Card style={{ marginBottom: '10px' }}>
        <Label>Oggetto</Label>
        <div style={{ fontSize: '15px', fontWeight: 700, color: C.text, marginTop: '4px' }}>{mail.oggetto}</div>
      </Card>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <CopyBtn text={mail.corpo} />
        </div>
        <div style={{ fontSize: '14px', color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{mail.corpo}</div>
      </Card>
    </div>
  );
}

function DeckTab({ deck }) {
  if (!deck) return null;
  const slides = [
    { n: 1, bg: C.black, t: deck.slide_1_titolo, c: deck.slide_1_contenuto, accent: false },
    { n: 2, bg: C.white, t: deck.slide_2_titolo, c: deck.slide_2_contenuto, accent: true },
    { n: 3, bg: C.white, t: deck.slide_3_titolo, c: deck.slide_3_contenuto, accent: true },
    { n: 4, bg: '#f5f5f5', t: deck.slide_4_titolo, c: deck.slide_4_contenuto, accent: true, highlight: true },
    { n: 5, bg: C.red,   t: deck.slide_5_titolo, c: deck.slide_5_contenuto, accent: false },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {slides.map(({ n, bg, t, c, accent, highlight }) => (
        <div key={n} style={{ background: bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'stretch' }}>
          {accent && <AccentLine />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: n === 5 ? 'rgba(255,255,255,0.6)' : C.muted, textTransform: 'uppercase', marginBottom: '4px' }}>
              SLIDE {n}{highlight ? ' — Casi studio' : ''}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: n === 5 ? C.white : n <= 1 ? C.white : '#111', marginBottom: '5px' }}>{t}</div>
            <div style={{ fontSize: '12px', color: n === 5 ? 'rgba(255,255,255,0.8)' : n <= 1 ? C.muted : '#555', lineHeight: 1.6 }}>{c}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

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
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, background: `${CANAL_COLORS[step.canale]}18`, color: CANAL_COLORS[step.canale], marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{step.canale}</span>
            <div style={{ fontSize: '13px', color: C.text, lineHeight: 1.55 }}>{step.azione}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LinkedInTab({ linkedin }) {
  if (!linkedin) return null;
  const len = linkedin.messaggio?.length || 0;
  const overLimit = len > 300;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <Pill color={{ bg: 'rgba(0,119,181,0.1)', bd: 'rgba(0,119,181,0.3)', tx: '#60a5fa' }}>{linkedin.tipo}</Pill>
        <CopyBtn text={linkedin.messaggio} />
      </div>
      <Card>
        <div style={{ fontSize: '14px', color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap', marginBottom: '10px' }}>{linkedin.messaggio}</div>
        <div style={{ fontSize: '11px', color: overLimit ? '#f87171' : C.muted }}>{len} / 300 caratteri{overLimit ? ' ⚠️ sopra limite' : ''}</div>
      </Card>
    </div>
  );
}

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

// ─── Main App ─────────────────────────────────────────────────────────────────
const QUICK_PICKS = ['Technogym', 'Humanitas', 'Alpitour', 'Amplifon', 'Pirelli', 'De\'Longhi', 'Fincantieri', 'Tod\'s'];

const LOADING_MSGS = [
  'Analisi sito web aziendale...',
  'Ricerca dati finanziari (Cerved/CCIAA)...',
  'Raccolta news ultimi 12 mesi...',
  'Analisi profili LinkedIn...',
  'Verifica job posting attivi...',
  'Valutazione presenza digitale...',
  'Generazione materiali sales personalizzati...',
];

export default function App() {
  const [input, setInput] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('intel');
  const [showArchive, setShowArchive] = useState(false);
  const [showHs, setShowHs] = useState(false);
  const [hsToken, setHsToken] = useState(() => localStorage.getItem('domino_hs_token') || '');
  const [hsSyncing, setHsSyncing] = useState(false);
  const [hsMsg, setHsMsg] = useState('');
  const [archCount, setArchCount] = useState(() => loadArchive().length);

  const analyze = useCallback(async () => {
    if (!input.trim() || loading) return;
    setLoading(true); setResult(null); setTab('intel'); setHsMsg('');
    let mi = 0;
    setLoadMsg(LOADING_MSGS[0]);
    const iv = setInterval(() => { mi = Math.min(mi + 1, LOADING_MSGS.length - 1); setLoadMsg(LOADING_MSGS[mi]); }, 7500);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect: input.trim(), note: note.trim() }),
      });
      if (!res.ok) throw new Error(`Errore ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setResult(data);
      saveToArchive(data);
      setArchCount(loadArchive().length);
    } catch (err) {
      alert(`Errore: ${err.message}`);
    } finally {
      clearInterval(iv); setLoading(false); setLoadMsg('');
    }
  }, [input, note, loading]);

  const doHsSync = async () => {
    if (!hsToken) { setShowHs(true); return; }
    setHsSyncing(true); setHsMsg('');
    try {
      const { isNew } = await syncHubSpot(hsToken, result);
      setHsMsg(isNew ? '✓ Azienda creata' : '✓ Azienda aggiornata');
    } catch (err) { setHsMsg(`⚠️ ${err.message}`); }
    finally { setHsSyncing(false); }
  };

  const p = result?.prospect;

  return (
    <div style={{ minHeight: '100vh', background: C.black, color: C.text, fontFamily: FONT }}>
      {/* Header */}
      <div style={{ background: '#080808', borderBottom: `1px solid ${C.border}`, height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            {[1,0,1,0].map((r,i) => <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: r ? C.red : '#2a2a2a' }} />)}
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
        {/* Input */}
        <Card style={{ marginBottom: '20px' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>Analizza un prospect</h1>
          <p style={{ margin: '0 0 20px', color: C.muted, fontSize: '13px' }}>Ricerca approfondita su sito · Cerved/bilanci · news · LinkedIn · job posting → materiali sales con il DNA Domino.</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && analyze()} disabled={loading}
              placeholder="es. Technogym · Gruppo Humanitas · www.alpitour.it"
              style={{ flex: 1, background: '#0d0d0d', border: `2px solid ${C.border}`, color: C.text, padding: '11px 14px', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: FONT, transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
            <Btn onClick={analyze} disabled={loading || !input.trim()} style={{ minWidth: '120px', fontSize: '14px' }}>
              {loading ? 'Analisi…' : 'Analizza →'}
            </Btn>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)} disabled={loading}
            placeholder="Note per il commerciale (opzionale) — es. 'ci hanno contattato a un evento', 'competitor è X'"
            style={{ width: '100%', background: '#0d0d0d', border: `1px solid ${C.border}`, color: C.text, padding: '9px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: FONT, resize: 'vertical', minHeight: '54px', boxSizing: 'border-box', marginBottom: '14px' }} />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: C.muted }}>Quick picks:</span>
            {QUICK_PICKS.map(q => (
              <button key={q} onClick={() => setInput(q)} style={{ background: C.elevated, border: `1px solid ${C.border}`, color: C.muted, padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontFamily: FONT }}>
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
                <Label>Prospect</Label>
                <div style={{ fontSize: '15px', fontWeight: 800, color: C.text }}>{p.nome}</div>
              </div>
              <div style={{ width: '1px', height: '30px', background: C.border }} />
              <div><Label>Settore</Label><div style={{ fontSize: '12px', color: '#aaa' }}>{p.settore}</div></div>
              <div style={{ width: '1px', height: '30px', background: C.border }} />
              <div><Label>Decisore</Label><div style={{ fontSize: '12px', color: '#aaa' }}>{p.decisore_target}</div></div>
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
              {[['intel','🔍 Intelligence'],['mail','✉️ Mail'],['deck','📊 Deck'],['workflow','📅 Workflow'],['linkedin','💼 LinkedIn'],['fonti','📋 Fonti']].map(([id, label]) => (
                <Tab key={id} active={tab === id} onClick={() => setTab(id)} label={label} />
              ))}
            </div>

            <Card>
              {tab === 'intel' && <IntelTab p={p} />}
              {tab === 'mail' && <MailTab mail={result.mail} />}
              {tab === 'deck' && <DeckTab deck={result.deck} />}
              {tab === 'workflow' && <WorkflowTab workflow={result.workflow} />}
              {tab === 'linkedin' && <LinkedInTab linkedin={result.linkedin} />}
              {tab === 'fonti' && <FontiTab fonti={result.fonti_ricerca} />}
            </Card>
          </>
        )}
      </div>

      {showArchive && <ArchiveModal onClose={() => setShowArchive(false)} onLoad={d => { setResult(d); setTab('intel'); }} />}
      {showHs && <HsModal current={hsToken} onClose={() => setShowHs(false)} onSave={t => { setHsToken(t); localStorage.setItem('domino_hs_token', t); }} />}
    </div>
  );
}
