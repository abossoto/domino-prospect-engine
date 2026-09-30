import { useState, useCallback, useRef } from 'react';
// Import dinamici: pptxgenjs e docx pesano ~750 kB e servono solo al click sui
// pulsanti di export. Tenerli statici triplicava il bundle iniziale.
const exportPPT = async (...args) => (await import('./pptBuilder.js')).exportPPT(...args);
const exportDossier = async (...args) => (await import('./dossierBuilder.js')).exportDossier(...args);
import { LOGO_DATA_URI } from './logoBase64.js';

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
  'Service':          { bg: 'rgba(99,102,241,0.12)',  bd: 'rgba(99,102,241,0.4)',  tx: '#a5b4fc' },
  'CX':               { bg: 'rgba(236,72,153,0.12)',  bd: 'rgba(236,72,153,0.4)',  tx: '#f9a8d4' },
  'Brand':            { bg: 'rgba(245,158,11,0.12)',  bd: 'rgba(245,158,11,0.4)',  tx: '#fcd34d' },
  'Digital Marketing':{ bg: 'rgba(16,185,129,0.12)',  bd: 'rgba(16,185,129,0.4)',  tx: '#6ee7b7' },
  'Website':          { bg: 'rgba(59,130,246,0.12)',  bd: 'rgba(59,130,246,0.4)',  tx: '#93c5fd' },
  'Intranet':         { bg: 'rgba(234,88,12,0.12)',   bd: 'rgba(234,88,12,0.4)',   tx: '#fdba74' },
};
const CANAL_COLORS = { LinkedIn: '#0077B5', Email: C.red, Telefono: '#22c55e' };

// GTM Domino — 3 livelli (spec v4)
const GTM_LAYERS = [
  { id: 'clevel',  label: 'C-Level',          interlocutor: 'CEO / CIO / DG',              need: '"Inspirami"',                   frame: 'Il digitale come leva strategica',      color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  { id: 'headof',  label: 'Head of',           interlocutor: 'Director / VP / Resp. area',  need: '"Aiutami a fare la scelta giusta"', frame: 'Rischio zero — munizioni per il CEO', color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  { id: 'manager', label: 'Manager / Operativo', interlocutor: 'Resp. progetto / Specialista', need: '"I feel your pain"',             frame: 'Lavorerai meno e meglio',               color: '#059669', bg: 'rgba(5,150,105,0.1)' },
];
const GTM_MOTIONS = [
  { id: 'bottomup', label: '⬆ Bottom-up', desc: 'Contatto freddo o inbound — sali se sei rilevante', sub: 'Pipeline rapida' },
  { id: 'topdown',  label: '⬇ Top-down',  desc: 'Referenza CEO / evento — scendi al team con credibilità', sub: 'Deal più grandi' },
];

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

// Il push su HubSpot passa da /api/hubspot: l'API HubSpot non accetta chiamate
// dirette dal browser e il token vive solo nelle env di Vercel.
async function syncHubSpot(result, { input, layer, motion }) {
  const res = await fetch('/api/hubspot', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result, input, layer, motion, version: VERSION }),
  });
  const data = await res.json().catch(() => ({ error: `Risposta non valida dal server (${res.status})` }));
  if (!res.ok || data.error) throw new Error(data.error || `Errore ${res.status}`);
  return data;
}


// ─── UI Primitives ────────────────────────────────────────────────────────────
function Label({ children }) { return <div style={{ fontSize:'10px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted,marginBottom:'4px' }}>{children}</div>; }
function Val({ children }) { return <div style={{ fontSize:'13px',fontWeight:600,color:C.text }}>{children}</div>; }
function Card({ children, style }) { return <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:'12px',padding:'20px',...style }}>{children}</div>; }
function Btn({ children, onClick, disabled, variant='primary', style }) {
  const base = { padding:'9px 20px',borderRadius:'7px',cursor:disabled?'not-allowed':'pointer',fontSize:'13px',fontWeight:700,fontFamily:FONT,border:'none',transition:'opacity 0.15s',...style };
  const vs = { primary:{ background:disabled?C.elevated:C.red,color:disabled?C.muted:C.white }, ghost:{ background:'transparent',border:`1px solid ${C.border}`,color:C.muted }, hs:{ background:'rgba(255,122,89,0.1)',border:'1px solid rgba(255,122,89,0.3)',color:'#ff7a59' } };
  return <button onClick={onClick} disabled={disabled} style={{...base,...vs[variant]}}>{children}</button>;
}
function Tab({ active, onClick, label }) {
  return <button onClick={onClick} style={{ padding:'7px 14px',background:active?C.red:'transparent',color:active?C.white:C.muted,border:`1px solid ${active?C.red:C.border}`,borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:active?700:400,fontFamily:FONT,transition:'all 0.15s' }}>{label}</button>;
}
function Pill({ children, color }) {
  const c = color || { bg:'rgba(255,255,255,0.05)',bd:C.border,tx:C.muted };
  return <span style={{ display:'inline-block',padding:'3px 9px',borderRadius:'4px',fontSize:'10px',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',background:c.bg,border:`1px solid ${c.bd}`,color:c.tx }}>{children}</span>;
}
function CopyBtn({ text, label='Copia' }) {
  const [done, setDone] = useState(false);
  return <button onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(()=>setDone(false),1500); }} style={{ background:'transparent',border:`1px solid ${C.border}`,color:C.muted,padding:'4px 10px',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontFamily:FONT }}>{done?'✓ Copiato':label}</button>;
}

// ─── GTM Selector ─────────────────────────────────────────────────────────────
function GtmSelector({ layer, setLayer, motion, setMotion }) {
  return (
    <div style={{ background:C.elevated,border:`1px solid ${C.border}`,borderRadius:10,padding:'14px 16px',marginBottom:14 }}>
      <div style={{ fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10 }}>A chi ti rivolgi?</div>
      <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:14 }}>
        {GTM_LAYERS.map(l => (
          <div key={l.id} onClick={() => setLayer(l.id)}
            style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,border:`1px solid ${layer===l.id?l.color:C.border}`,background:layer===l.id?l.bg:'transparent',cursor:'pointer',transition:'all .12s' }}>
            <div style={{ width:3,height:38,borderRadius:2,background:l.color,flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <span style={{ fontSize:13,fontWeight:700,color:C.text }}>{l.label}</span>
              <span style={{ fontSize:11,color:C.muted,marginLeft:8 }}>{l.interlocutor}</span>
              <div style={{ fontSize:11,color:l.color,marginTop:2 }}>{l.frame}</div>
            </div>
            <span style={{ fontSize:11,color:C.muted,fontStyle:'italic',whiteSpace:'nowrap' }}>{l.need}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8 }}>Come stai entrando?</div>
      <div style={{ display:'flex',gap:8 }}>
        {GTM_MOTIONS.map(m => (
          <div key={m.id} onClick={() => setMotion(m.id)}
            style={{ flex:1,padding:'10px 12px',borderRadius:8,border:`1px solid ${motion===m.id?C.text:C.border}`,background:motion===m.id?'rgba(255,255,255,0.05)':'transparent',cursor:'pointer',transition:'all .12s' }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:2 }}>{m.label}</div>
            <div style={{ fontSize:11,color:C.muted }}>{m.desc}</div>
            <div style={{ fontSize:10,color:C.muted,marginTop:2,opacity:.7 }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab Panels ───────────────────────────────────────────────────────────────
function IntelTab({ p }) {
  const ss = p.strumenti_suggeriti || {};
  const dsCol = ss.design_sprint_tipo && DS_COLORS[ss.design_sprint_tipo];
  return (
    <div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'18px' }}>
        {[['Settore',p.settore],['Dimensione',p.dimensione],['Fatturato',p.fatturato_stimato||'⚠️ N/D'],['Mercati',p.mercati],['Decisore target',p.decisore_target],['Maturità digitale',p.maturita_digitale]].map(([l,v]) => (
          <div key={l} style={{ background:'#0d0d0d',borderRadius:'8px',padding:'10px 12px' }}>
            <Label>{l}</Label><Val>{v}</Val>
          </div>
        ))}
      </div>

      <div style={{ background:'rgba(232,39,42,0.07)',border:'1px solid rgba(232,39,42,0.2)',borderRadius:'8px',padding:'12px 14px',marginBottom:'18px' }}>
        <Label>Hook — osservazione chiave</Label>
        <div style={{ fontSize:'14px',color:'#ff9999',lineHeight:1.55,marginTop:'4px' }}>🎯 {p.hook}</div>
      </div>

      <div style={{ marginBottom:'18px' }}>
        <Label>Strumenti suggeriti</Label>
        <div style={{ display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'8px' }}>
          {ss.core_sprint && <div><Pill color={{ bg:'rgba(168,85,247,0.12)',bd:'rgba(168,85,247,0.35)',tx:'#c084fc' }}>Core Sprint</Pill>{ss.core_sprint_motivazione && <div style={{ fontSize:'11px',color:C.muted,marginTop:'4px' }}>{ss.core_sprint_motivazione}</div>}</div>}
          {ss.design_sprint_tipo && dsCol && <div><Pill color={dsCol}>{ss.design_sprint_tipo} Design Sprint!</Pill>{ss.design_sprint_motivazione && <div style={{ fontSize:'11px',color:C.muted,marginTop:'4px' }}>{ss.design_sprint_motivazione}</div>}</div>}
          {ss.preventivo_emozionale && <div><Pill color={{ bg:'rgba(34,197,94,0.12)',bd:'rgba(34,197,94,0.35)',tx:'#4ade80' }}>Preventivo Emozionale</Pill>{ss.preventivo_emozionale_motivazione && <div style={{ fontSize:'11px',color:C.muted,marginTop:'4px' }}>{ss.preventivo_emozionale_motivazione}</div>}</div>}
        </div>
      </div>

      <div style={{ marginBottom:'18px' }}>
        <Label>3 Casi studio selezionati</Label>
        <div style={{ marginTop:'8px',display:'flex',flexDirection:'column',gap:'8px' }}>
          {(p.casi_studio||[]).map((cs,i) => {
            const acc = [C.red,'#3b82f6','#888'][i];
            return (
              <div key={i} style={{ display:'flex',gap:'12px',background:'#0d0d0d',borderRadius:'8px',padding:'12px' }}>
                <div style={{ width:'4px',borderRadius:'2px',background:acc,flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'3px' }}>
                    <span style={{ fontSize:'12px',fontWeight:700,color:acc }}>{cs.cliente}</span>
                    <Pill color={i===0?{bg:'rgba(232,39,42,0.08)',bd:'rgba(232,39,42,0.25)',tx:'#ff9999'}:i===1?{bg:'rgba(59,130,246,0.08)',bd:'rgba(59,130,246,0.25)',tx:'#93c5fd'}:{bg:'rgba(255,255,255,0.05)',bd:C.border,tx:C.muted}}>{['Più affine','Stesso settore','Metodologia'][i]}</Pill>
                  </div>
                  <div style={{ fontSize:'12px',color:C.text,marginBottom:'3px' }}>{cs.progetto}</div>
                  {cs.kpi && <div style={{ fontSize:'11px',color:'#4ade80' }}>📊 {cs.kpi}</div>}
                  {cs.perche_affine && <div style={{ fontSize:'11px',color:C.muted,marginTop:'3px',fontStyle:'italic' }}>→ {cs.perche_affine}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(p.persone_chiave||[]).length > 0 && (
        <div style={{ marginBottom:'18px' }}>
          <Label>Persone chiave</Label>
          {p.persone_chiave.map((pk,i) => (
            <div key={i} style={{ display:'flex',gap:'10px',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${C.border}` }}>
              <div style={{ width:'30px',height:'30px',background:C.elevated,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:C.muted,flexShrink:0 }}>{pk.nome?.charAt(0)||'?'}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:'13px',fontWeight:600,color:C.text }}>{pk.nome}</div>
                <div style={{ fontSize:'11px',color:C.muted }}>{pk.ruolo}{pk.anzianita?` · ${pk.anzianita}`:''}</div>
              </div>
              {(pk.email || pk.linkedin_url) && (
                <div style={{ display:'flex',gap:'6px',alignItems:'center',flexShrink:0 }}>
                  {pk.linkedin_url && <a href={pk.linkedin_url} target="_blank" rel="noopener noreferrer" title="Profilo LinkedIn"
                    style={{ color:'#0077B5',fontSize:'11px',textDecoration:'none',border:`1px solid ${C.border}`,borderRadius:'5px',padding:'4px 8px' }}>in</a>}
                  {pk.email && <>
                    <span style={{ fontSize:'11px',color:C.muted,fontFamily:'ui-monospace, monospace' }}>{pk.email}</span>
                    <CopyBtn text={pk.email} label="Copia" />
                  </>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(p.segnali_recenti||[]).length > 0 && (
        <div style={{ marginBottom:'18px' }}>
          <Label>Segnali recenti</Label>
          {p.segnali_recenti.map((sg,i) => (
            <div key={i} style={{ display:'flex',gap:'8px',padding:'7px 0',borderBottom:`1px solid ${C.border}`,fontSize:'13px',color:C.text,alignItems:'baseline' }}>
              <span style={{ color:C.red,flexShrink:0 }}>→</span>
              <div style={{ flex:1,lineHeight:1.45 }}>
                <span>{sg.testo}</span>
                {sg.data && <span style={{ marginLeft:'8px',fontSize:'11px',color:C.muted }}>· {sg.data}</span>}
                {sg.fonte_url && (
                  <a href={sg.fonte_url} target="_blank" rel="noopener noreferrer"
                     style={{ marginLeft:'8px',fontSize:'11px',color:C.red,textDecoration:'none',whiteSpace:'nowrap' }}>
                    [{sg.fonte_titolo || 'fonte'} ↗]
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Label>Sfide probabili</Label>
      <div style={{ marginTop:'8px',display:'flex',flexDirection:'column',gap:'6px' }}>
        {(p.sfide_probabili||[]).map((s,i) => (
          <div key={i} style={{ background:'rgba(232,39,42,0.04)',border:'1px solid rgba(232,39,42,0.12)',borderRadius:'7px',padding:'8px 12px',fontSize:'13px',color:C.text }}>
            <span style={{ color:C.red,marginRight:'8px',fontWeight:700 }}>{i+1}.</span>{s}
          </div>
        ))}
      </div>
    </div>
  );
}

function MailTab({ mail }) {
  if (!mail) return null;
  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px' }}>
        <span style={{ fontSize:'12px',color:C.muted }}>Mail di primo contatto</span>
        <CopyBtn text={`Oggetto: ${mail.oggetto}\n\n${mail.corpo}`} label="Copia tutto" />
      </div>
      <Card style={{ marginBottom:'10px' }}><Label>Oggetto</Label><div style={{ fontSize:'15px',fontWeight:700,color:C.text,marginTop:'4px' }}>{mail.oggetto}</div></Card>
      <Card><div style={{ display:'flex',justifyContent:'flex-end',marginBottom:'10px' }}><CopyBtn text={mail.corpo} /></div><div style={{ fontSize:'14px',color:C.text,lineHeight:1.75,whiteSpace:'pre-wrap' }}>{mail.corpo}</div></Card>
    </div>
  );
}

function DeckTab({ deck }) {
  if (!deck) return null;
  const slides = [
    { n:1, bg:C.black,   t:deck.slide_1_titolo, c:deck.slide_1_contenuto, accent:false },
    { n:2, bg:C.white,   t:deck.slide_2_titolo, c:deck.slide_2_contenuto, accent:true },
    { n:3, bg:C.white,   t:deck.slide_3_titolo, c:deck.slide_3_contenuto, accent:true },
    { n:4, bg:'#f5f5f5', t:deck.slide_4_titolo, c:deck.slide_4_contenuto, accent:true, sub:'Casi studio' },
    { n:5, bg:C.red,     t:deck.slide_5_titolo, c:deck.slide_5_contenuto, accent:false },
  ];
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
      {slides.map(({ n,bg,t,c,accent,sub }) => (
        <div key={n} style={{ background:bg,border:`1px solid ${C.border}`,borderRadius:'8px',padding:'14px 16px',display:'flex',gap:'12px' }}>
          {accent && <div style={{ width:'4px',borderRadius:'2px',background:C.red,flexShrink:0 }} />}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'10px',fontWeight:700,letterSpacing:'0.1em',color:n===5?'rgba(255,255,255,0.6)':C.muted,textTransform:'uppercase',marginBottom:'4px' }}>SLIDE {n}{sub?` — ${sub}`:''}</div>
            <div style={{ fontSize:'14px',fontWeight:800,color:n===5?C.white:n<=1?C.white:'#111',marginBottom:'5px' }}>{t}</div>
            <div style={{ fontSize:'12px',color:n===5?'rgba(255,255,255,0.8)':n<=1?C.muted:'#555',lineHeight:1.6 }}>{c}</div>
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
      <div style={{ fontSize:'12px',color:C.muted,marginBottom:'14px' }}>Sequenza multicanale · 14 giorni</div>
      {workflow.map((step,i) => (
        <div key={i} style={{ display:'flex',gap:'14px',padding:'12px 0',borderBottom:`1px solid ${C.border}` }}>
          <div style={{ minWidth:'44px',textAlign:'center' }}>
            <div style={{ fontSize:'9px',color:C.muted,textTransform:'uppercase' }}>GG</div>
            <div style={{ fontSize:'22px',fontWeight:800,color:C.text,lineHeight:1 }}>{step.giorno}</div>
          </div>
          <div>
            <span style={{ display:'inline-block',padding:'2px 8px',borderRadius:'3px',fontSize:'10px',fontWeight:700,background:`${CANAL_COLORS[step.canale]}18`,color:CANAL_COLORS[step.canale],marginBottom:'5px',textTransform:'uppercase' }}>{step.canale}</span>
            <div style={{ fontSize:'13px',color:C.text,lineHeight:1.55 }}>{step.azione}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LinkedInTab({ linkedin }) {
  if (!linkedin) return null;
  const len = linkedin.messaggio?.length || 0;
  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px' }}>
        <Pill color={{ bg:'rgba(0,119,181,0.1)',bd:'rgba(0,119,181,0.3)',tx:'#60a5fa' }}>{linkedin.tipo}</Pill>
        <CopyBtn text={linkedin.messaggio} />
      </div>
      <Card>
        <div style={{ fontSize:'14px',color:C.text,lineHeight:1.75,whiteSpace:'pre-wrap',marginBottom:'10px' }}>{linkedin.messaggio}</div>
        <div style={{ fontSize:'11px',color:len>300?'#f87171':C.muted }}>{len} / 300 caratteri{len>300?' ⚠️ sopra limite':''}</div>
      </Card>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function Modal({ onClose, children }) {
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:'14px',padding:'24px',maxHeight:'85vh',overflowY:'auto' }}>{children}</div>
    </div>
  );
}

function ArchiveModal({ onClose, onLoad }) {
  const items = loadArchive();
  return (
    <Modal onClose={onClose}>
      <div style={{ width:'560px' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px' }}>
          <div style={{ fontWeight:700,fontSize:'15px',color:C.text }}>📁 Archivio analisi</div>
          <button onClick={onClose} style={{ background:'transparent',border:'none',color:C.muted,cursor:'pointer',fontSize:'20px' }}>×</button>
        </div>
        {items.length===0
          ? <div style={{ textAlign:'center',color:C.muted,padding:'40px 0' }}>Nessuna analisi salvata.</div>
          : items.map((item,i) => (
            <div key={i} onClick={() => { onLoad(item); onClose(); }} style={{ padding:'12px',background:'#0d0d0d',borderRadius:'8px',marginBottom:'6px',cursor:'pointer',border:`1px solid ${C.border}` }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.red} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{ fontWeight:700,fontSize:'14px',color:C.text }}>{item.prospect?.nome||'N/D'}</div>
              <div style={{ fontSize:'11px',color:C.muted,marginTop:'2px' }}>{item.prospect?.settore} · {new Date(item._savedAt).toLocaleDateString('it-IT')}</div>
            </div>
          ))}
      </div>
    </Modal>
  );
}

// ─── Ricontatto Hard bounce (internamente "rientri"): contatti in hard bounce ─
// Un'analisi per volta (RocketReach + web + bozza richiedono 1-2 minuti a
// contatto). Il salvataggio su HubSpot e' sempre un click esplicito: l'email
// ricostruita va controllata prima.
const EMAIL_BADGE = {
  verificata:    { bg:'rgba(34,197,94,0.12)',  bd:'rgba(34,197,94,0.35)',  tx:'#4ade80' },
  da_verificare: { bg:'rgba(245,158,11,0.12)', bd:'rgba(245,158,11,0.35)', tx:'#fcd34d' },
};

// Contatti senza owner: il backend propone Flavio, qui si puo' scegliere tra
// questi. Cambiare owner cambia anche la firma della bozza e l'assegnatario del task.
const OWNER_SCELTA = [
  { id:'12386493', nome:'Flavio Pedazzini' },
  { id:'6624973',  nome:'Andrea Bosso' },
  { id:'6828683',  nome:'Giovanni Borgna' },
  { id:'7474862',  nome:'Emiliano Cianci' },
];

const HUBSPOT_PORTAL = '1752790';
const hubspotContatto = id => `https://app.hubspot.com/contacts/${HUBSPOT_PORTAL}/record/0-1/${id}`;

// La firma e' l'ultima occorrenza del nome del mittente nel corpo.
function cambiaFirma(corpo, vecchio, nuovo) {
  const i = vecchio ? corpo.lastIndexOf(vecchio) : -1;
  return i < 0 ? corpo : corpo.slice(0, i) + nuovo + corpo.slice(i + vecchio.length);
}

function RientroRisultato({ r, stato, onSalva, onOwner }) {
  const { contatto: c, trovato: t, email: e, mail: m, diagnostica: d } = r;
  const salvato = stato.salvataggio==='in_corso' || stato.salvataggio==='fatto';
  return (
    <div style={{ marginTop:'12px',paddingTop:'12px',borderTop:`1px solid ${C.border}` }}>
      {c.owner?.predefinito && (
        <div style={{ display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap',marginBottom:'12px',fontSize:'12px',color:C.muted }}>
          <span>Contatto senza owner — firma e task a:</span>
          <select value={c.owner.id} disabled={salvato} onChange={ev => onOwner(OWNER_SCELTA.find(o => o.id === ev.target.value))}
            style={{ background:'#0d0d0d',color:C.text,border:`1px solid ${C.border}`,borderRadius:'6px',padding:'4px 8px',fontSize:'12px',fontFamily:FONT }}>
            {!OWNER_SCELTA.some(o => o.id === c.owner.id) && <option value={c.owner.id}>{c.owner.nome}</option>}
            {OWNER_SCELTA.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </div>
      )}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px' }}>
        <div style={{ background:'#0d0d0d',borderRadius:'8px',padding:'10px 12px' }}>
          <Label>Ora</Label>
          {t.azienda
            ? <><Val>{t.azienda}</Val><div style={{ fontSize:'11px',color:C.muted,marginTop:'2px' }}>{[t.ruolo, t.dominio].filter(Boolean).join(' · ')}</div>
                <div style={{ fontSize:'10px',color:C.muted,marginTop:'4px' }}>Fonte: {t.fonte}{t.confidenza?` · confidenza ${t.confidenza}`:''}{t.fonte_url && <> · <a href={t.fonte_url} target="_blank" rel="noopener noreferrer" style={{ color:C.red }}>link ↗</a></>}</div></>
            : <div style={{ fontSize:'12px',color:'#fcd34d' }}>Nuova azienda non trovata</div>}
          {t.linkedin && <a href={t.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize:'11px',color:'#0077B5',textDecoration:'none' }}>Profilo LinkedIn ↗</a>}
        </div>
        <div style={{ background:'#0d0d0d',borderRadius:'8px',padding:'10px 12px' }}>
          <Label>Email</Label>
          {e
            ? <><div style={{ display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap' }}>
                  <span style={{ fontSize:'12px',color:C.text,fontFamily:'ui-monospace, monospace' }}>{e.indirizzo}</span>
                  <CopyBtn text={e.indirizzo} />
                </div>
                <div style={{ marginTop:'6px',display:'flex',gap:'6px',flexWrap:'wrap' }}>
                  <Pill color={EMAIL_BADGE[e.stato]}>{e.stato==='verificata'?'Verificata':'Da verificare'}</Pill>
                  <Pill>{e.tipo}</Pill>
                </div>
                <div style={{ fontSize:'10px',color:C.muted,marginTop:'4px' }}>{e.fonte}</div></>
            : <div style={{ fontSize:'12px',color:'#fcd34d' }}>Nessuna email trovata — valuta LinkedIn</div>}
        </div>
      </div>
      <div style={{ background:'#0d0d0d',borderRadius:'8px',padding:'12px 14px',marginBottom:'10px' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px' }}>
          <Label>Bozza di ricontatto</Label>
          <CopyBtn text={`Oggetto: ${m.oggetto}\n\n${m.corpo}`} label="Copia tutto" />
        </div>
        <div style={{ fontSize:'13px',fontWeight:700,color:C.text,marginBottom:'6px' }}>{m.oggetto}</div>
        <div style={{ fontSize:'13px',color:C.text,lineHeight:1.65,whiteSpace:'pre-wrap' }}>{m.corpo}</div>
      </div>
      <div style={{ display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap' }}>
        <Btn variant="hs" onClick={onSalva} disabled={stato.salvataggio==='in_corso'||stato.salvataggio==='fatto'} style={{ padding:'5px 12px',fontSize:'11px' }}>
          {stato.salvataggio==='in_corso'?'Salvataggio…':stato.salvataggio==='fatto'?'✓ In HubSpot':'→ HubSpot (aggiorna contatto + task owner)'}
        </Btn>
        {stato.msgSalva && <span style={{ fontSize:'11px',color:stato.salvataggio==='fatto'?'#4ade80':'#f87171' }}>{stato.msgSalva}</span>}
        <span style={{ fontSize:'10px',color:C.muted,marginLeft:'auto' }}>RocketReach: {d.rocketreach} · Web: {d.web}</span>
      </div>
    </div>
  );
}

function RientriPanel() {
  const [contatti, setContatti]   = useState(null);
  const [rrAttivo, setRrAttivo]   = useState(true);
  const [caricando, setCaricando] = useState(false);
  const [errore, setErrore]       = useState('');
  const [stati, setStati]         = useState({});
  const [inCoda, setInCoda]       = useState(false);
  const [mostraFatti, setMostraFatti] = useState(false);
  const stop = useRef(false);

  const aggiorna = (id, patch) => setStati(s => ({ ...s, [id]: { ...s[id], ...patch } }));

  const carica = async () => {
    setCaricando(true); setErrore('');
    try {
      const r = await fetch('/api/rientri-lista', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:'{}' });
      const d = await r.json().catch(() => ({ error:`Risposta non valida (${r.status})` }));
      if (d.error) throw new Error(d.error);
      setContatti(d.contatti); setRrAttivo(d.rocketreach);
    } catch (e) { setErrore(e.message); }
    finally { setCaricando(false); }
  };

  const analizza = async (id) => {
    aggiorna(id, { fase:'analisi', errore:'', r:null, salvataggio:null, msgSalva:'' });
    try {
      const r = await postWithRetry('/api/rientri-analizza', { contactId:id }, 1);
      aggiorna(id, { fase:'fatto', r, aperto:true });
    } catch (e) { aggiorna(id, { fase:'errore', errore:e.message }); }
  };

  const analizzaTutti = async () => {
    stop.current = false; setInCoda(true);
    for (const c of visibili) {
      if (stop.current) break;
      if (stati[c.id]?.fase === 'fatto') continue;
      await analizza(c.id);
    }
    setInCoda(false);
  };

  const cambiaOwner = (id, nuovo) => setStati(s => {
    const r = s[id].r, vecchio = r.contatto.owner;
    return { ...s, [id]: { ...s[id], r: {
      ...r,
      contatto: { ...r.contatto, owner: { ...vecchio, id: nuovo.id, nome: nuovo.nome, email: '' } },
      mail: { ...r.mail, corpo: cambiaFirma(r.mail.corpo, vecchio.nome, nuovo.nome) },
    } } };
  });

  const salva = async (id) => {
    aggiorna(id, { salvataggio:'in_corso', msgSalva:'' });
    try {
      const r = await fetch('/api/rientri-salva', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ risultato:stati[id].r }) });
      const d = await r.json().catch(() => ({ error:`Risposta non valida (${r.status})` }));
      if (d.error) throw new Error(d.error);
      const agg = d.contatto.aggiornati.length ? `aggiornato (${d.contatto.aggiornati.join(', ')})` : 'invariato';
      aggiorna(id, { salvataggio:'fatto', msgSalva:`Contatto ${agg}${d.azienda?` · azienda ${d.azienda.isNew?'creata':'collegata'}`:''} · nota + task all'owner${d.contatto.email_in_uso?` · ⚠️ email già usata dal contatto ${d.contatto.email_in_uso}: non scritta`:''}` });
    } catch (e) { aggiorna(id, { salvataggio:'errore', msgSalva:`⚠️ ${e.message}` }); }
  };

  const visibili = (contatti || []).filter(c => mostraFatti || !c.gia_lavorato);
  const nFatti = (contatti || []).filter(c => c.gia_lavorato).length;

  return (
    <>
      <Card style={{ marginBottom:'20px' }}>
        <h1 style={{ margin:'0 0 4px',fontSize:'20px',fontWeight:800,letterSpacing:'-0.02em' }}>Ricontatto Hard bounce</h1>
        <p style={{ margin:'0 0 16px',color:C.muted,fontSize:'13px',lineHeight:1.55 }}>
          Contatti HubSpot con un motivo di hard bounce registrato ("Unknown user" è il segnale più forte di cambio lavoro).
          Per ognuno: nuova azienda da RocketReach e fonti web pubbliche, email, bozza di ricontatto firmata dal contact owner.
          Nessuna mail viene inviata: in HubSpot il contatto esistente viene aggiornato (nessun duplicato), con nota e task per l'owner.
        </p>
        {!rrAttivo && <div style={{ background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px',fontSize:'13px',color:'#fcd34d' }}>⚠️ ROCKETREACH_API_KEY non configurata su Vercel: la ricerca userà solo il web.</div>}
        {errore && <div style={{ background:'rgba(232,39,42,0.1)',border:'1px solid rgba(232,39,42,0.3)',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px',fontSize:'13px',color:'#ff9999' }}>⚠️ {errore}</div>}
        <div style={{ display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center' }}>
          <Btn onClick={carica} disabled={caricando||inCoda}>{caricando?'Caricamento…':contatti?'↻ Ricarica da HubSpot':'Carica contatti da HubSpot'}</Btn>
          {contatti && visibili.length > 0 && (inCoda
            ? <Btn variant="ghost" onClick={() => { stop.current = true; }}>■ Ferma dopo quello in corso</Btn>
            : <Btn variant="ghost" onClick={analizzaTutti}>Analizza tutti ({visibili.filter(c => stati[c.id]?.fase !== 'fatto').length})</Btn>)}
          {nFatti > 0 && <label style={{ fontSize:'12px',color:C.muted,display:'flex',gap:'6px',alignItems:'center',cursor:'pointer' }}>
            <input type="checkbox" checked={mostraFatti} onChange={e=>setMostraFatti(e.target.checked)} /> Mostra anche i {nFatti} già lavorati
          </label>}
        </div>
        {contatti && <div style={{ fontSize:'11px',color:C.muted,marginTop:'10px' }}>Ogni analisi usa fino a 1 credito RocketReach e 1-2 minuti.</div>}
      </Card>

      {contatti && visibili.length === 0 && <Card style={{ textAlign:'center',color:C.muted }}>Nessun contatto da lavorare.</Card>}

      <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
        {visibili.map(c => {
          const st = stati[c.id] || {};
          return (
            <div key={c.id} style={{ background:C.card,border:`1px solid ${st.fase==='analisi'?C.red:C.border}`,borderRadius:'12px',padding:'14px 16px' }}>
              <div style={{ display:'flex',gap:'12px',alignItems:'center' }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:'14px',fontWeight:700,color:C.text }}>{c.nome}
                    <a href={hubspotContatto(c.id)} target="_blank" rel="noopener noreferrer" style={{ fontSize:'11px',fontWeight:600,color:'#ff7a59',textDecoration:'none',marginLeft:'8px' }}>HubSpot ↗</a>
                    {c.gia_lavorato && <span style={{ fontSize:'10px',color:C.muted,marginLeft:'8px' }}>già lavorato</span>}</div>
                  <div style={{ fontSize:'11px',color:C.muted,marginTop:'2px' }}>
                    {[c.ruolo, c.azienda].filter(Boolean).join(' · ') || 'azienda non indicata'}
                    {' · '}<span style={{ textDecoration:'line-through' }}>{c.email}</span>
                    {c.motivo_bounce && <span style={{ marginLeft:'8px',fontSize:'10px',color:c.motivo_bounce==='UNKNOWN_USER'?'#fcd34d':C.muted }}>{c.motivo_bounce}</span>}
                  </div>
                  <div style={{ fontSize:'11px',color:C.muted,marginTop:'2px' }}>Owner: {c.owner?.nome || <span style={{ color:'#fcd34d' }}>nessuno → firma e task a {st.r?.contatto.owner?.nome || 'Flavio Pedazzini'}</span>}</div>
                </div>
                {st.fase==='fatto' && <button onClick={() => aggiorna(c.id, { aperto:!st.aperto })} style={{ background:'transparent',border:'none',color:C.muted,cursor:'pointer',fontSize:'12px',fontFamily:FONT }}>{st.aperto?'▲ Chiudi':'▼ Apri'}</button>}
                <Btn variant={st.fase==='fatto'?'ghost':'primary'} onClick={() => analizza(c.id)} disabled={st.fase==='analisi'||inCoda} style={{ padding:'6px 14px',fontSize:'12px',flexShrink:0 }}>
                  {st.fase==='analisi'?'Ricerca…':st.fase==='fatto'?'Rifai':'Analizza →'}
                </Btn>
              </div>
              {st.fase==='errore' && <div style={{ fontSize:'12px',color:'#ff9999',marginTop:'8px' }}>⚠️ {st.errore}</div>}
              {st.fase==='fatto' && st.aperto && st.r && <RientroRisultato r={st.r} stato={st} onSalva={() => salva(c.id)} onOwner={o => cambiaOwner(c.id, o)} />}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const VERSION = 'v4.8.0';
const QUICK_PICKS = ['Technogym','Humanitas','Alpitour','Amplifon','Pirelli',"De'Longhi",'Fincantieri',"Tod's"];
// Soglie identiche a quelle dei prompt in api/_list.js: se cambiano li', vanno
// cambiate anche qui, altrimenti l'interfaccia promette un filtro diverso da
// quello che il modello applica. Il valore inviato all'API resta l'etichetta.
const DIMENSIONI = [['PMI','< 50 dip.'],['Mid-market','50-500 dip.'],['Enterprise','> 500 dip.']];
const SETTORI_OPTIONS = ['Automotive','B2B Industriale / Manifatturiero','Salute & Sanità','Turismo & Cultura','Finance & Assicurazioni','Real Estate','Pubblica Amministrazione','Retail & eCommerce','Tecnologia & Software','Altro'];
const LOADING_MSGS = ['Analisi sito web aziendale...','Ricerca dati finanziari (Cerved/CCIAA)...','Raccolta news ultimi 12 mesi...','Analisi profili LinkedIn...','Verifica job posting attivi...','Valutazione presenza digitale...'];

// Retry condiviso dalle chiamate API. Il server ha gia' il suo backoff sui 429/529:
// questo copre solo i casi che sopravvivono a quello.
async function postWithRetry(url, body, maxRetries, onRetry) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      onRetry?.(attempt + 1);
      await new Promise(r => setTimeout(r, Math.min(4000 * Math.pow(2, attempt - 1), 16000)));
    }
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({ error: `Risposta non valida dal server (${res.status})` }));
    if (data.error?.startsWith('OVERLOADED:')) {
      if (attempt >= maxRetries) throw new Error(data.error.replace('OVERLOADED:', ''));
      continue;
    }
    if (data.error) throw new Error(data.error);
    return data;
  }
  throw new Error('Troppi tentativi falliti. Riprova tra qualche minuto.');
}
const LISTA_MSGS = ['Ricerca aziende nel settore...','Verifica siti web e presenza digitale...','Analisi segnali di bisogno digitale...','Ricerca decisori e struttura aziendale...'];

export default function App() {
  const [mode, setMode]               = useState('lista');
  const [input, setInput]             = useState('');
  const [note, setNote]               = useState('');
  const [gtmLayer, setGtmLayer]       = useState('headof');
  const [gtmMotion, setGtmMotion]     = useState('bottomup');
  const [loading, setLoading]         = useState(false);
  const [loadMsg, setLoadMsg]         = useState('');
  const [result, setResult]           = useState(null);
  const [tab, setTab]                 = useState('intel');
  const [error, setError]             = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [hsSyncing, setHsSyncing]     = useState(false);
  const [hsMsg, setHsMsg]             = useState('');
  const [archCount, setArchCount]     = useState(() => loadArchive().length);
  const [dossierBusy, setDossierBusy] = useState(false);
  const [report, setReport]           = useState(null);
  const [reportKey, setReportKey]     = useState('');
  const [reportIncompleto, setReportIncompleto] = useState(false);

  const [listaSettore, setListaSettore]   = useState('');
  const [listaGeo, setListaGeo]           = useState('Italia');
  const [listaDim, setListaDim]           = useState([]);
  const [listaKeywords, setListaKeywords] = useState('');
  const [listaNumero, setListaNumero]     = useState(10);
  const [listaLoading, setListaLoading]   = useState(false);
  const [listaMsg, setListaMsg]           = useState('');
  const [listaResult, setListaResult]     = useState(null);
  const [listaError, setListaError]       = useState('');
  const [listaReport, setListaReport]     = useState(null);
  const [listaReportKey, setListaReportKey] = useState('');

  const analyze = useCallback(async (overrideInput) => {
    const target = (overrideInput || input).trim();
    if (!target || loading) return;
    setError(''); setLoading(true); setResult(null); setTab('intel'); setHsMsg('');

    // Chiave del report: finche' prospect e note non cambiano, la ricerca web
    // gia' fatta vale ancora. Cambiare layer o motion GTM rigenera solo i
    // materiali invece di rifare 8-10 ricerche.
    const key = `${target}||${note.trim()}`;
    const cached = reportKey === key ? report : null;

    let mi = 0; setLoadMsg(cached ? '' : LOADING_MSGS[0]);
    let iv = cached ? null : setInterval(() => { mi = Math.min(mi+1, LOADING_MSGS.length-1); setLoadMsg(LOADING_MSGS[mi]); }, 7500);
    const onRetry = n => setLoadMsg(`Claude è sovraccarico, sto riprovando (tentativo ${n})…`);

    try {
      let rep = cached;
      if (!rep) {
        const r = await postWithRetry('/api/research', { prospect: target, note: note.trim() }, 2, onRetry);
        rep = r.report;
        setReport(rep); setReportKey(key); setReportIncompleto(!!r.incompleto);
      }
      if (iv) { clearInterval(iv); iv = null; }
      setLoadMsg(cached
        ? 'Intelligence già raccolta — rigenero solo i materiali per questo layer…'
        : 'Generazione materiali sales personalizzati…');

      const data = await postWithRetry(
        '/api/generate',
        { prospect: target, layer: gtmLayer, motion: gtmMotion, report: rep },
        3, onRetry,
      );
      // _input: il testo cercato (spesso il sito), serve al push HubSpot per il dominio.
      const withInput = { ...data, _input: target };
      setResult(withInput); saveToArchive(withInput); setArchCount(loadArchive().length);
    } catch (e) {
      setError(e.message);
    } finally {
      if (iv) clearInterval(iv);
      setLoading(false);
    }
  }, [input, note, gtmLayer, gtmMotion, loading, report, reportKey]);

  const generateLista = useCallback(async () => {
    if (!listaSettore || listaLoading) return;
    setListaError(''); setListaLoading(true); setListaResult(null);

    // Come per l'analisi: finche' i criteri non cambiano, la ricerca gia' fatta
    // vale ancora, e un retry sullo scoring non rifa' 40 ricerche web.
    const criteri = { settore: listaSettore, geografia: listaGeo, dimensione: listaDim, keywords: listaKeywords, numero: listaNumero };
    const key = JSON.stringify(criteri);
    const cached = listaReportKey === key ? listaReport : null;

    let mi = 0; setListaMsg(cached ? '' : LISTA_MSGS[0]);
    let iv = cached ? null : setInterval(() => { mi = Math.min(mi+1, LISTA_MSGS.length-1); setListaMsg(LISTA_MSGS[mi]); }, 8000);
    const onRetry = n => setListaMsg(`Claude è sovraccarico, sto riprovando (tentativo ${n})…`);

    try {
      let rep = cached;
      if (!rep) {
        const r = await postWithRetry('/api/prospect-search', criteri, 2, onRetry);
        rep = r.report;
        setListaReport(rep); setListaReportKey(key);
      }
      if (iv) { clearInterval(iv); iv = null; }
      setListaMsg(cached
        ? 'Aziende già trovate — rifaccio solo scoring e ranking…'
        : 'Scoring e ranking prospect…');

      const data = await postWithRetry('/api/prospect-rank', { ...criteri, report: rep }, 3, onRetry);
      setListaResult(data);
    } catch (e) {
      setListaError(e.message);
    } finally {
      if (iv) clearInterval(iv);
      setListaLoading(false);
    }
  }, [listaSettore, listaGeo, listaDim, listaKeywords, listaNumero, listaLoading, listaReport, listaReportKey]);

  const doDossier = async () => {
    if (!result || dossierBusy) return;
    setDossierBusy(true);
    try {
      await exportDossier(result, { layer: gtmLayer, motion: gtmMotion });
    } catch (e) {
      setError(`Esportazione dossier fallita: ${e.message}`);
    } finally {
      setDossierBusy(false);
    }
  };

  const doHsSync = async () => {
    if (!result || hsSyncing) return;
    setHsSyncing(true); setHsMsg('');
    try {
      const r = await syncHubSpot(result, { input: result._input, layer: gtmLayer, motion: gtmMotion });
      const n = r.contatti_creati + r.contatti_aggiornati;
      let msg = `✓ Azienda ${r.company.isNew ? 'creata' : 'aggiornata'} · ${n} contatt${n === 1 ? 'o' : 'i'} · nota aggiunta`;
      if (r.errori_contatti?.length) msg += ` · ⚠️ ${r.errori_contatti.length} contatti non salvati`;
      setHsMsg(msg);
    }
    catch (e) { setHsMsg(`⚠️ ${e.message}`); }
    finally { setHsSyncing(false); }
  };

  const p = result?.prospect;

  return (
    <div style={{ minHeight:'100vh',background:C.black,color:C.text,fontFamily:FONT }}>
      {/* Header */}
      <div style={{ background:'#080808',borderBottom:`1px solid ${C.border}`,height:'56px',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',position:'sticky',top:0,zIndex:100 }}>
        <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
          <img src={LOGO_DATA_URI} alt="Domino" style={{ height:'38px',objectFit:'contain',objectPosition:'left center',maxWidth:'120px' }} />
          <span style={{ color:C.border }}>|</span>
          <span style={{ color:C.muted,fontSize:'12px',fontWeight:500,letterSpacing:'0.04em' }}>Prospect Engine</span>
        </div>
        <div style={{ display:'flex',gap:'8px',alignItems:'center' }}>
          <span style={{ fontSize:'10px',color:'#333',fontFamily:'monospace' }}>{VERSION}</span>
          <Btn variant="ghost" onClick={() => setShowArchive(true)} style={{ padding:'4px 12px',fontSize:'11px' }}>📁 Archivio ({archCount})</Btn>
        </div>
      </div>

      <div style={{ maxWidth:'920px',margin:'0 auto',padding:'28px 20px' }}>
        {/* Mode switcher */}
        <div style={{ display:'flex',gap:'6px',marginBottom:'20px' }}>
          {[['lista','📋 Genera Lista Prospect'],['analizza','🔍 Analizza Prospect'],['rientri','🔁 Ricontatto Hard bounce']].map(([m,label]) => (
            <button key={m} onClick={() => setMode(m)} style={{ padding:'9px 20px',background:mode===m?C.red:C.card,color:mode===m?C.white:C.muted,border:`1px solid ${mode===m?C.red:C.border}`,borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:mode===m?700:400,fontFamily:FONT,transition:'all 0.15s' }}>{label}</button>
          ))}
        </div>

        {/* ─── LISTA PROSPECT ─────────────────────────────────────────────── */}
        {mode==='lista' && (
          <>
            <Card style={{ marginBottom:'20px' }}>
              <h1 style={{ margin:'0 0 4px',fontSize:'20px',fontWeight:800,letterSpacing:'-0.02em' }}>Genera Lista Prospect</h1>
              <p style={{ margin:'0 0 20px',color:C.muted,fontSize:'13px' }}>Scegli settore e filtri → l'AI costruisce una lista qualificata con scoring.</p>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px' }}>
                <div>
                  <div style={{ fontSize:'11px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.muted,marginBottom:'6px' }}>Settore *</div>
                  <select value={listaSettore} onChange={e=>setListaSettore(e.target.value)} style={{ width:'100%',background:'#0d0d0d',border:`1px solid ${C.border}`,color:listaSettore?C.text:C.muted,padding:'10px 12px',borderRadius:'8px',fontSize:'13px',fontFamily:FONT,outline:'none',cursor:'pointer' }}>
                    <option value="">Seleziona settore...</option>
                    {SETTORI_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:'11px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.muted,marginBottom:'6px' }}>Area geografica</div>
                  <input value={listaGeo} onChange={e=>setListaGeo(e.target.value)} placeholder="es. Italia, Nord Italia, Milano..." style={{ width:'100%',background:'#0d0d0d',border:`1px solid ${C.border}`,color:C.text,padding:'10px 12px',borderRadius:'8px',fontSize:'13px',fontFamily:FONT,outline:'none',boxSizing:'border-box' }} />
                </div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px' }}>
                <div>
                  <div style={{ fontSize:'11px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.muted,marginBottom:'6px' }}>Dimensione</div>
                  <div style={{ display:'flex',gap:'6px' }}>
                    {DIMENSIONI.map(([d,soglia])=>(
                      <button key={d} onClick={()=>setListaDim(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d])} style={{ flex:1,padding:'7px 6px',background:listaDim.includes(d)?'rgba(232,39,42,0.12)':'#0d0d0d',border:`1px solid ${listaDim.includes(d)?C.red:C.border}`,color:listaDim.includes(d)?C.red:C.muted,borderRadius:'7px',cursor:'pointer',fontSize:'11px',fontWeight:listaDim.includes(d)?700:400,fontFamily:FONT,lineHeight:1.3 }}>
                        {d}<div style={{ fontSize:'9px',fontWeight:400,opacity:0.7,marginTop:'1px' }}>{soglia}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:'11px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.muted,marginBottom:'6px' }}>Numero</div>
                  <div style={{ display:'flex',gap:'6px' }}>
                    {[5,10,20].map(n=>(
                      <button key={n} onClick={()=>setListaNumero(n)} style={{ flex:1,padding:'10px',background:listaNumero===n?'rgba(232,39,42,0.12)':'#0d0d0d',border:`1px solid ${listaNumero===n?C.red:C.border}`,color:listaNumero===n?C.red:C.muted,borderRadius:'7px',cursor:'pointer',fontSize:'13px',fontWeight:listaNumero===n?700:400,fontFamily:FONT }}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginBottom:'16px' }}>
                <div style={{ fontSize:'11px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.muted,marginBottom:'6px' }}>Parole chiave (opzionale)</div>
                <input value={listaKeywords} onChange={e=>setListaKeywords(e.target.value)} placeholder="es. 'export internazionale', 'rete vendita indiretta'" style={{ width:'100%',background:'#0d0d0d',border:`1px solid ${C.border}`,color:C.text,padding:'10px 12px',borderRadius:'8px',fontSize:'13px',fontFamily:FONT,outline:'none',boxSizing:'border-box' }} />
              </div>
              {listaError && <div style={{ background:'rgba(232,39,42,0.1)',border:'1px solid rgba(232,39,42,0.3)',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px',fontSize:'13px',color:'#ff9999' }}>⚠️ {listaError}</div>}
              <Btn onClick={generateLista} disabled={listaLoading||!listaSettore} style={{ width:'100%',fontSize:'14px',padding:'12px' }}>
                {listaLoading ? 'Generazione lista...' : `Genera ${listaNumero} prospect qualificati →`}
              </Btn>
            </Card>

            {listaLoading && (
              <Card style={{ textAlign:'center',padding:'36px 24px',marginBottom:'20px' }}>
                <div style={{ fontSize:'28px',marginBottom:'12px' }}>📋</div>
                <div style={{ fontSize:'14px',fontWeight:700,color:C.text,marginBottom:'6px' }}>{listaMsg}</div>
                <div style={{ fontSize:'12px',color:C.muted,marginBottom:'20px' }}>Ricerca e scoring in corso — circa 1-2 minuti</div>
                <div style={{ background:C.elevated,borderRadius:'4px',height:'3px',overflow:'hidden' }}>
                  <div style={{ height:'3px',background:C.red,borderRadius:'4px',animation:'scan 2.5s ease-in-out infinite' }} />
                </div>
              </Card>
            )}

            {listaResult && !listaLoading && (
              <div>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px' }}>
                  <div><div style={{ fontSize:'15px',fontWeight:800,color:C.text }}>{listaResult.lista?.length||0} prospect trovati</div><div style={{ fontSize:'12px',color:C.muted,marginTop:'2px' }}>{listaResult.criteri_applicati}</div></div>
                  <Btn variant="ghost" onClick={()=>setListaResult(null)} style={{ padding:'5px 12px',fontSize:'11px' }}>Nuova ricerca</Btn>
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
                  {(listaResult.lista||[]).sort((a,b)=>(b.score||0)-(a.score||0)).map((item,i) => {
                    const score = item.score||0;
                    const sc = score>=8?'#22c55e':score>=6?'#f59e0b':C.muted;
                    return (
                      <div key={i} style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:'12px',padding:'16px',display:'flex',alignItems:'flex-start',gap:'16px' }}>
                        <div style={{ textAlign:'center',minWidth:'52px',background:'#0d0d0d',borderRadius:'8px',padding:'8px 6px' }}>
                          <div style={{ fontSize:'22px',fontWeight:800,color:sc,lineHeight:1 }}>{score}</div>
                          <div style={{ fontSize:'9px',color:C.muted,marginTop:'2px',textTransform:'uppercase' }}>score</div>
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px',flexWrap:'wrap' }}>
                            <div style={{ fontSize:'14px',fontWeight:800,color:C.text }}>{item.nome}</div>
                            {item.sito && <a href={item.sito.startsWith('http')?item.sito:`https://${item.sito}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:'11px',color:C.muted,textDecoration:'none' }}>↗ {item.sito}</a>}
                          </div>
                          <div style={{ display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'6px' }}>
                            {[item.settore,item.dimensione,item.sede].filter(Boolean).map((t,ti)=><span key={ti} style={{ fontSize:'10px',color:C.muted,background:C.elevated,padding:'2px 7px',borderRadius:'3px' }}>{t}</span>)}
                          </div>
                          <div style={{ fontSize:'12px',color:'#aaa',marginBottom:'3px' }}><span style={{ color:sc }}>●</span> {item.score_motivazione}</div>
                          {item.segnale_principale && <div style={{ fontSize:'11px',color:C.muted,fontStyle:'italic' }}>→ {item.segnale_principale}</div>}
                        </div>
                        <button onClick={()=>{ setMode('analizza'); setInput(item.sito||item.nome); setResult(null); window.scrollTo({top:0,behavior:'smooth'}); }} style={{ background:C.red,border:'none',color:C.white,padding:'8px 14px',borderRadius:'7px',cursor:'pointer',fontSize:'12px',fontWeight:700,fontFamily:FONT,whiteSpace:'nowrap',flexShrink:0 }}>Analizza →</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {mode==='rientri' && <RientriPanel />}

        {/* ─── ANALIZZA PROSPECT ──────────────────────────────────────────── */}
        {mode==='analizza' && (
          <>
            <Card style={{ marginBottom:'20px' }}>
              <h1 style={{ margin:'0 0 4px',fontSize:'20px',fontWeight:800,letterSpacing:'-0.02em' }}>Analizza un prospect</h1>
              <p style={{ margin:'0 0 20px',color:C.muted,fontSize:'13px' }}>Ricerca su sito · Cerved/bilanci · news · LinkedIn · job posting → materiali sales con il DNA Domino.</p>

              {error && (
                <div style={{ background:'rgba(232,39,42,0.1)',border:'1px solid rgba(232,39,42,0.3)',borderRadius:'8px',padding:'10px 14px',marginBottom:'14px',fontSize:'13px',color:'#ff9999',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <span>⚠️ {error}</span>
                  <button onClick={()=>setError('')} style={{ background:'transparent',border:'none',color:C.muted,cursor:'pointer',fontSize:'16px',lineHeight:1 }}>×</button>
                </div>
              )}

              {reportIncompleto && !loading && (
                <div style={{ background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:'8px',padding:'10px 14px',marginBottom:'14px',fontSize:'13px',color:'#fcd34d' }}>
                  ⚠️ La ricerca si è fermata prima di completare tutte le fonti: il report di intelligence potrebbe essere parziale. Rilancia l'analisi per riprovare.
                </div>
              )}

              <div style={{ display:'flex',gap:'10px',marginBottom:'10px' }}>
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&analyze()} disabled={loading}
                  placeholder="es. Technogym · Gruppo Humanitas · www.alpitour.it"
                  style={{ flex:1,background:'#0d0d0d',border:`2px solid ${C.border}`,color:C.text,padding:'11px 14px',borderRadius:'8px',fontSize:'14px',outline:'none',fontFamily:FONT,transition:'border-color 0.15s' }}
                  onFocus={e=>e.target.style.borderColor=C.red} onBlur={e=>e.target.style.borderColor=C.border} />
                <Btn onClick={()=>analyze()} disabled={loading||!input.trim()} style={{ minWidth:'120px',fontSize:'14px' }}>{loading?'Analisi…':'Analizza →'}</Btn>
              </div>
              <textarea value={note} onChange={e=>setNote(e.target.value)} disabled={loading}
                placeholder="Note (opzionale) — es. 'ci hanno contattato a un evento', 'competitor è X'"
                style={{ width:'100%',background:'#0d0d0d',border:`1px solid ${C.border}`,color:C.text,padding:'9px 14px',borderRadius:'8px',fontSize:'13px',outline:'none',fontFamily:FONT,resize:'vertical',minHeight:'54px',boxSizing:'border-box',marginBottom:'14px' }} />

              <GtmSelector layer={gtmLayer} setLayer={setGtmLayer} motion={gtmMotion} setMotion={setGtmMotion} />

              <div style={{ display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center' }}>
                <span style={{ fontSize:'11px',color:C.muted }}>Quick picks:</span>
                {QUICK_PICKS.map(q=><button key={q} onClick={()=>setInput(q)} style={{ background:C.elevated,border:`1px solid ${C.border}`,color:C.muted,padding:'4px 12px',borderRadius:'20px',cursor:'pointer',fontSize:'11px',fontFamily:FONT }}>{q}</button>)}
              </div>
            </Card>

            {loading && (
              <Card style={{ marginBottom:'20px',textAlign:'center',padding:'36px 24px' }}>
                <div style={{ fontSize:'28px',marginBottom:'12px' }}>🔍</div>
                <div style={{ fontSize:'14px',fontWeight:700,color:C.text,marginBottom:'6px' }}>{loadMsg}</div>
                <div style={{ fontSize:'12px',color:C.muted,marginBottom:'20px' }}>Analisi approfondita · sito, Cerved, news, LinkedIn, job posting…</div>
                <div style={{ background:C.elevated,borderRadius:'4px',height:'3px',overflow:'hidden' }}>
                  <div style={{ height:'3px',background:C.red,borderRadius:'4px',animation:'scan 2.5s ease-in-out infinite' }} />
                </div>
                <style>{`@keyframes scan{0%,100%{width:20%;opacity:0.4}50%{width:75%;opacity:1}}`}</style>
              </Card>
            )}

            {result && p && (
              <>
                <div style={{ background:'#080808',border:`1px solid ${C.border}`,borderRadius:'12px',padding:'12px 18px',marginBottom:'12px',display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap' }}>
                  <div><Label>Prospect</Label><div style={{ fontSize:'15px',fontWeight:800,color:C.text }}>{p.nome}</div></div>
                  <div style={{ width:'1px',height:'30px',background:C.border }} />
                  <div><Label>Settore</Label><div style={{ fontSize:'12px',color:'#aaa' }}>{p.settore}</div></div>
                  <div style={{ width:'1px',height:'30px',background:C.border }} />
                  <div><Label>Decisore</Label><div style={{ fontSize:'12px',color:'#aaa' }}>{p.decisore_target}</div></div>
                  <div style={{ marginLeft:'auto',display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap' }}>
                    <Btn variant="ghost" onClick={()=>exportPPT(result)} style={{ padding:'5px 12px',fontSize:'11px' }}>⬇ PPT</Btn>
                    <Btn variant="ghost" onClick={doDossier} disabled={dossierBusy} style={{ padding:'5px 12px',fontSize:'11px' }}>{dossierBusy?'Dossier…':'⬇ Dossier Word'}</Btn>
                    <Btn variant="hs" onClick={doHsSync} disabled={hsSyncing} style={{ padding:'5px 12px',fontSize:'11px' }}>{hsSyncing?'Sync…':'→ HubSpot'}</Btn>
                    {hsMsg && <span style={{ fontSize:'11px',color:hsMsg.startsWith('✓')?'#4ade80':'#f87171' }}>{hsMsg}</span>}
                  </div>
                </div>

                <div style={{ display:'flex',gap:'6px',marginBottom:'12px',flexWrap:'wrap' }}>
                  {[['intel','🔍 Intelligence'],['mail','✉️ Mail'],['deck','📊 Deck'],['workflow','📅 Workflow'],['linkedin','💼 LinkedIn']].map(([id,label])=>(
                    <Tab key={id} active={tab===id} onClick={()=>setTab(id)} label={label} />
                  ))}
                </div>

                <Card>
                  {tab==='intel'    && <IntelTab p={p} />}
                  {tab==='mail'     && <MailTab mail={result.mail} />}
                  {tab==='deck'     && <DeckTab deck={result.deck} />}
                  {tab==='workflow' && <WorkflowTab workflow={result.workflow} />}
                  {tab==='linkedin' && <LinkedInTab linkedin={result.linkedin} />}
                </Card>
              </>
            )}
          </>
        )}
      </div>

      {showArchive && <ArchiveModal onClose={()=>setShowArchive(false)} onLoad={d=>{setResult(d);setTab('intel');setMode('analizza');}} />}
      <div style={{ textAlign:'center',padding:'24px 0 16px',fontSize:'11px',color:'#333' }}>{VERSION} · Domino Prospect Engine · domino.it</div>
    </div>
  );
}
