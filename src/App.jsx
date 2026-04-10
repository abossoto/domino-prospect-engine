import { useState } from 'react'
import PptxGenJS from 'pptxgenjs'

// ─── RELEASE ──────────────────────────────────────
const APP_RELEASE = 'v1.0'
const GEN_COUNT_KEY = 'domino_gen_count'
const ARCHIVE_KEY = 'domino_pe_archive'

function getGenCount() {
  try { return parseInt(localStorage.getItem(GEN_COUNT_KEY) || '0', 10) } catch { return 0 }
}
function incrementGenCount() {
  try { localStorage.setItem(GEN_COUNT_KEY, String(getGenCount() + 1)) } catch {}
}
function loadArchive() {
  try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]') } catch { return [] }
}
function saveToArchive(result, prospect) {
  const archive = loadArchive()
  archive.unshift({ id: Date.now(), date: new Date().toLocaleDateString('it-IT'), prospect, nome: result.prospect?.nome, settore: result.prospect?.settore, result })
  if (archive.length > 50) archive.splice(50)
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive))
  incrementGenCount()
}

// ─── EXPORT PPT ────────────────────────────────────
function exportPPT(result) {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9'
  const RED = 'E8272A', BLACK = '111111', WHITE = 'FFFFFF', LGRAY = 'F5F5F5'

  const addSlide = (titleText, bodyText, slideNum) => {
    const slide = pptx.addSlide()
    slide.background = { color: WHITE }
    slide.addShape(pptx.ShapeType.rect, { x:0, y:0, w:10, h:0.12, fill:{ color: RED } })
    slide.addShape(pptx.ShapeType.ellipse, { x:0.3, y:0.3, w:0.38, h:0.38, fill:{ color: RED } })
    slide.addText(String(slideNum), { x:0.3, y:0.3, w:0.38, h:0.38, align:'center', valign:'middle', color:WHITE, fontSize:11, bold:true })
    slide.addText(titleText || '', { x:0.85, y:0.25, w:8.8, h:0.55, fontSize:16, bold:true, color:BLACK })
    slide.addText(bodyText || '', { x:0.35, y:1.05, w:9.3, h:4.2, fontSize:11, color:'374151', valign:'top', wrap:true })
    slide.addText(`domino.it — Strategic CX Partner · ${APP_RELEASE}`, { x:0, y:5.35, w:10, h:0.28, align:'center', fontSize:8, color:'9CA3AF' })
  }

  const d = result.deck || {}
  const p = result.prospect || {}

  const cover = pptx.addSlide()
  cover.background = { color: BLACK }
  cover.addShape(pptx.ShapeType.rect, { x:0, y:0, w:0.15, h:5.625, fill:{ color: RED } })
  cover.addText('domino', { x:0.4, y:1.8, w:9, h:0.8, fontSize:36, bold:true, color:RED })
  cover.addText('Prospect Engine — ' + (p.nome || ''), { x:0.4, y:2.7, w:9, h:0.5, fontSize:16, color:WHITE })
  cover.addText(`Strategic CX Partner dal 1996 · ${APP_RELEASE}`, { x:0.4, y:3.4, w:9, h:0.4, fontSize:11, color:'9CA3AF' })

  for (let n = 1; n <= 5; n++) {
    addSlide(d[`slide_${n}_titolo`], d[`slide_${n}_contenuto`], n)
  }

  const intel = pptx.addSlide()
  intel.background = { color: LGRAY }
  intel.addShape(pptx.ShapeType.rect, { x:0, y:0, w:10, h:0.12, fill:{ color: RED } })
  intel.addText('Scheda Intelligence', { x:0.35, y:0.2, w:9.3, h:0.55, fontSize:16, bold:true, color:BLACK })
  const rows = [
    [p.settore||'—', p.dimensione||'—', p.mercati||'—'],
    [p.fatturato_stimato||'N/D', p.decisore_target||'—', p.maturita_digitale||'—'],
  ]
  const labels = ['Settore','Dimensione','Mercati','Fatturato','Decisore','Maturità digitale']
  rows.forEach((row, ri) => {
    row.forEach((val, ci) => {
      const x = 0.2 + ci * 3.26, y = 0.9 + ri * 1.5
      intel.addShape(pptx.ShapeType.rect, { x, y, w:3.1, h:1.3, fill:{ color:WHITE }, line:{ color:'E5E7EB', width:1 } })
      intel.addText(labels[ri*3+ci], { x, y:y+0.05, w:3.1, h:0.3, align:'center', fontSize:8, color:'9CA3AF', bold:true })
      intel.addText(val, { x, y:y+0.35, w:3.1, h:0.8, align:'center', valign:'middle', fontSize:10, color:BLACK, bold:true, wrap:true })
    })
  })
  intel.addText('Hook: ' + (p.hook||''), { x:0.35, y:3.2, w:9.3, h:0.7, fontSize:10, color:WHITE, fill:{ color: RED }, inset:0.1, valign:'middle', wrap:true })
  const cs = p.casi_studio || []
  if (cs.length > 0) {
    intel.addText('Case study: ' + cs.join(' · '), { x:0.35, y:4.1, w:9.3, h:0.9, fontSize:9, color:'374151', wrap:true })
  }

  pptx.writeFile({ fileName: 'Domino_' + (p.nome||'Prospect').replace(/[^a-zA-Z0-9]/g,'_') + '.pptx' })
}

// ─── HUBSPOT SYNC ─────────────────────────────────
async function syncHubSpot(result, hsToken) {
  const p = result.prospect || {}
  const companyName = p.nome || 'Prospect Domino'
  const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + hsToken },
    body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName:'name', operator:'EQ', value: companyName }] }], limit:1 })
  })
  const searchData = await searchRes.json()
  const existing = searchData.results?.[0]
  const props = {
    name: companyName, industry: p.settore||'', annualrevenue: p.fatturato_stimato||'',
    numberofemployees: p.dimensione||'',
    description: `Analisi Domino PE — ${new Date().toLocaleDateString('it-IT')}\nHook: ${p.hook||''}\nDecisore: ${p.decisore_target||''}\nMaturità: ${p.maturita_digitale||''}`,
    hs_lead_status: 'IN_PROGRESS'
  }
  let companyId
  if (existing) {
    await fetch('https://api.hubapi.com/crm/v3/objects/companies/' + existing.id, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + hsToken },
      body: JSON.stringify({ properties: props })
    })
    companyId = existing.id
  } else {
    const createRes = await fetch('https://api.hubapi.com/crm/v3/objects/companies', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + hsToken },
      body: JSON.stringify({ properties: props })
    })
    companyId = (await createRes.json()).id
  }
  const noteBody = `📊 ANALISI DOMINO PROSPECT ENGINE\n\nSettore: ${p.settore||'—'}\nDimensione: ${p.dimensione||'—'}\nFatturato: ${p.fatturato_stimato||'N/D'}\nMercati: ${p.mercati||'—'}\nMaturità digitale: ${p.maturita_digitale||'—'}\n\nDECISORE TARGET: ${p.decisore_target||'—'}\nHOOK: ${p.hook||'—'}\n\nSFIDE PROBABILI:\n${(p.sfide_probabili||[]).map(s=>'• '+s).join('\n')}\n\nSEGNALI RECENTI:\n${(p.segnali_recenti||[]).map(s=>'• '+s).join('\n')}\n\nCASE STUDY:\n${(p.casi_studio||[]).map((s,i)=>['Stesso settore','Sfida simile','Metodologia'][i]+': '+s).join('\n')}\n\nWORKFLOW:\n${(result.workflow||[]).map(s=>`Giorno ${s.giorno} [${s.canale}]: ${s.azione}`).join('\n')}`
  await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + hsToken },
    body: JSON.stringify({ properties: { hs_note_body: noteBody, hs_timestamp: Date.now().toString() }, associations: [{ to: { id: companyId }, types: [{ associationCategory:'HUBSPOT_DEFINED', associationTypeId:190 }] }] })
  })
  return { companyId, isNew: !existing }
}

// ─── UI COMPONENTS ────────────────────────────────
function DominoLogo() {
  const [imgFailed, setImgFailed] = useState(false)
  return (
    <a href="https://www.domino.it" target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', textDecoration:'none' }}>
      {!imgFailed ? (
        <img
          src="https://www.domino.it/hubfs/Domino-next/img/domino-logo-white.png"
          alt="domino"
          height="26"
          style={{ height:'26px', width:'auto', display:'block' }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span style={{ color:'#E8272A', fontWeight:'900', fontSize:'17px', letterSpacing:'0.04em' }}>domino</span>
      )}
    </a>
  )
}

function TabBtn({ active, onClick, icon, label }) {
  return <button onClick={onClick} style={{ padding:'9px 18px', background:active?'#E8272A':'white', color:active?'white':'#555', border:'1px solid '+(active?'#E8272A':'#ddd'), borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:active?'700':'400', display:'flex', alignItems:'center', gap:'6px', fontFamily:'inherit', transition:'all 0.15s' }}>{icon} {label}</button>
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false)
  return <button onClick={()=>{navigator.clipboard.writeText(text);setDone(true);setTimeout(()=>setDone(false),2000)}} style={{ padding:'6px 14px', background:done?'#16a34a':'#f3f4f6', color:done?'white':'#444', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:'inherit' }}>{done?'✓ Copiato':'Copia'}</button>
}

function ToolBadge({ type }) {
  const cfg = { sprint:{bg:'#fff7ed',fg:'#c2410c',border:'#fed7aa',icon:'⚡',label:'Design Sprint!'}, pe:{bg:'#f0fdf4',fg:'#15803d',border:'#bbf7d0',icon:'✨',label:'Preventivo Emozionale'} }
  const c = cfg[type]
  return <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:c.bg, color:c.fg, border:`1px solid ${c.border}`, padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700' }}>{c.icon} {c.label}</span>
}

function DigitalBadge({ level }) {
  const map = { 'Bassa':['#fef2f2','#dc2626'], 'Media':['#fffbeb','#d97706'], 'Alta':['#f0fdf4','#16a34a'] }
  const key = Object.keys(map).find(k=>level?.startsWith(k))||'Media'
  return <span style={{ background:map[key][0], color:map[key][1], padding:'2px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700' }}>{level}</span>
}

function SlideCard({ n, titolo, contenuto }) {
  return <div style={{ border:'1px solid #e5e7eb', borderRadius:'10px', overflow:'hidden', marginBottom:'10px' }}>
    <div style={{ background:'#111', padding:'11px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
      <span style={{ background:'#E8272A', color:'white', width:'22px', height:'22px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', flexShrink:0 }}>{n}</span>
      <span style={{ color:'white', fontWeight:'600', fontSize:'13px' }}>{titolo}</span>
    </div>
    <div style={{ padding:'12px 16px', fontSize:'13px', color:'#374151', lineHeight:'1.6' }}>{contenuto}</div>
  </div>
}

function WorkflowStep({ step, last }) {
  const colors = { LinkedIn:'#0077B5', Email:'#E8272A', Telefono:'#059669' }
  const icons = { LinkedIn:'💼', Email:'✉️', Telefono:'📞' }
  return <div style={{ display:'flex', gap:'14px', alignItems:'flex-start', marginBottom:last?0:'14px' }}>
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, width:'72px' }}>
      <div style={{ background:colors[step.canale]||'#888', color:'white', borderRadius:'7px', padding:'3px 8px', fontSize:'11px', fontWeight:'700', whiteSpace:'nowrap' }}>Giorno {step.giorno}</div>
      {!last && <div style={{ width:'2px', height:'18px', background:'#e5e7eb', marginTop:'4px' }} />}
    </div>
    <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:'9px', padding:'10px 14px', flex:1 }}>
      <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'4px' }}>
        <span>{icons[step.canale]}</span>
        <span style={{ fontSize:'11px', fontWeight:'700', color:colors[step.canale]||'#888', textTransform:'uppercase' }}>{step.canale}</span>
      </div>
      <p style={{ margin:0, fontSize:'13px', color:'#374151', lineHeight:'1.5' }}>{step.azione}</p>
    </div>
  </div>
}

function StatusDot({ done, active }) {
  return <div style={{ width:'18px', height:'18px', borderRadius:'50%', flexShrink:0, background:done?'#16a34a':active?'#E8272A':'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', animation:active?'pulse-dot 1s ease-in-out infinite':'none' }}>
    {done && <span style={{ color:'white', fontSize:'9px', fontWeight:'700' }}>✓</span>}
  </div>
}

function ProgressPanel({ searchCount }) {
  const steps = [
    {label:'Sito web aziendale',t:0},{label:'Dati finanziari (Cerved, bilanci)',t:2},
    {label:'News e comunicati stampa',t:4},{label:'LinkedIn e persone chiave',t:6},
    {label:'Job posting e strategia',t:9},{label:'Presenza digitale e social',t:12},
  ]
  return <div style={{ background:'white', borderRadius:'14px', padding:'32px', border:'1px solid #e5e7eb' }}>
    <div style={{ display:'flex', justifyContent:'center', gap:'7px', marginBottom:'28px' }}>
      {[0,1,2].map(i=><div key={i} style={{ width:'10px', height:'10px', background:'#E8272A', borderRadius:'50%', animation:`bounce 1s ease-in-out ${i*0.18}s infinite` }} />)}
    </div>
    <div style={{ maxWidth:'340px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'12px' }}>
      {steps.map((s,i)=>{
        const done=searchCount>s.t+1, active=!done&&searchCount>=s.t
        return <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', opacity:done||active?1:0.35 }}>
          <StatusDot done={done} active={active} />
          <span style={{ fontSize:'13px', color:done?'#16a34a':active?'#E8272A':'#6b7280', fontWeight:active||done?'600':'400' }}>{s.label}</span>
        </div>
      })}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', opacity:searchCount>=15?1:0.35, marginTop:'4px', paddingTop:'12px', borderTop:'1px solid #f3f4f6' }}>
        <StatusDot done={false} active={searchCount>=15} />
        <span style={{ fontSize:'13px', color:searchCount>=15?'#E8272A':'#6b7280', fontWeight:searchCount>=15?'600':'400' }}>Generazione materiali sales</span>
      </div>
    </div>
    <p style={{ color:'#9ca3af', margin:'20px 0 0', textAlign:'center', fontSize:'12px' }}>{searchCount} ricerche completate · ~3-4 minuti</p>
  </div>
}

function ScarsezzaBanner({ msg }) {
  if (!msg) return null
  return <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px', display:'flex', gap:'10px' }}>
    <span style={{ fontSize:'16px', flexShrink:0 }}>⚠️</span>
    <div>
      <div style={{ fontWeight:'700', fontSize:'12px', color:'#92400e', marginBottom:'3px' }}>Dati parziali — azione consigliata</div>
      <div style={{ fontSize:'12px', color:'#78350f', lineHeight:'1.5' }}>{msg}</div>
    </div>
  </div>
}

function HubSpotBadge({ token, onConfigure }) {
  if (!token) return <button onClick={onConfigure} style={{ background:'transparent', border:'1px solid #ff7a59', color:'#ff7a59', padding:'4px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'11px', fontFamily:'inherit' }}>+ Collega HubSpot</button>
  return <span style={{ background:'#fff4f2', border:'1px solid #ff7a59', color:'#ff7a59', padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:'600' }}>🔶 HubSpot</span>
}

function ArchiveView({ onSelect, onClose }) {
  const archive = loadArchive()
  return <div style={{ minHeight:'100vh', background:'#f7f7f7', padding:'20px' }}>
    <div style={{ maxWidth:'860px', margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h2 style={{ fontSize:'20px', fontWeight:'800', color:'#111' }}>📁 Archivio analisi</h2>
        <button onClick={onClose} style={{ background:'transparent', border:'1px solid #ddd', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', color:'#777', fontFamily:'inherit' }}>← Torna all'analisi</button>
      </div>
      {archive.length === 0
        ? <div style={{ background:'white', borderRadius:'14px', padding:'48px', textAlign:'center', border:'1px solid #e5e7eb', color:'#9ca3af' }}>Nessuna analisi salvata ancora.</div>
        : archive.map(item => <div key={item.id} style={{ background:'white', borderRadius:'12px', padding:'16px 20px', marginBottom:'10px', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px' }}>
          <div>
            <div style={{ fontWeight:'700', fontSize:'14px', color:'#111' }}>{item.nome || item.prospect}</div>
            <div style={{ fontSize:'12px', color:'#6b7280', marginTop:'2px' }}>{item.settore || '—'} · {item.date}</div>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={()=>onSelect(item.result)} style={{ background:'#E8272A', color:'white', border:'none', padding:'7px 14px', borderRadius:'7px', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:'inherit' }}>Visualizza</button>
            <button onClick={()=>exportPPT(item.result)} style={{ background:'#f3f4f6', color:'#444', border:'none', padding:'7px 14px', borderRadius:'7px', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:'inherit' }}>PPT ↓</button>
          </div>
        </div>)
      }
    </div>
  </div>
}

// ─── MAIN APP ─────────────────────────────────────
export default function App() {
  const [hsToken, setHsToken] = useState(() => localStorage.getItem('domino_hs_token') || '')
  const [input, setInput] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchCount, setSearchCount] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('intel')
  const [showArchive, setShowArchive] = useState(false)
  const [showHsModal, setShowHsModal] = useState(false)
  const [hsStatus, setHsStatus] = useState(null)
  const [hsTempToken, setHsTempToken] = useState('')
  const [genCount, setGenCount] = useState(getGenCount)

  if (showArchive) return <ArchiveView onSelect={r=>{setResult(r);setShowArchive(false);setTab('intel')}} onClose={()=>setShowArchive(false)} />

  const analyze = async () => {
    if (!input.trim() || loading) return
    setLoading(true); setError(''); setResult(null); setSearchCount(0)
    // Simulated progress while backend works
    const timer = setInterval(() => setSearchCount(n => n < 14 ? n + 1 : n), 12000)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect: input.trim(), note: note.trim() })
      })
      clearInterval(timer)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Errore dal server')
      }
      setSearchCount(15)
      const parsed = await res.json()
      setResult(parsed)
      setTab('intel')
      saveToArchive(parsed, input.trim())
      setGenCount(getGenCount())
    } catch(err) {
      clearInterval(timer)
      setError(err.message || 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  const handleHsSync = async () => {
    if (!hsToken) { setShowHsModal(true); return }
    setHsStatus('saving')
    try {
      await syncHubSpot(result, hsToken)
      setHsStatus('ok')
      setTimeout(() => setHsStatus(null), 3000)
    } catch(e) { setHsStatus('error'); setTimeout(() => setHsStatus(null), 4000) }
  }

  const p = result?.prospect || {}
  const strumenti = p.strumenti_rilevanti || []
  const hasSprint = strumenti.some(s => s?.toLowerCase().includes('sprint'))
  const hasPE = strumenti.some(s => s?.toLowerCase().includes('emozionale') || s?.toLowerCase().includes('preventivo'))
  const casiStudio = p.casi_studio || []
  const SL = (label) => <div style={{ fontSize:'11px', fontWeight:'700', color:'#374151', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</div>

  return <div style={{ minHeight:'100vh', background:'#f7f7f7', fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", display:'flex', flexDirection:'column' }}>
    <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

    {/* HubSpot modal */}
    {showHsModal && <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:'14px', padding:'28px', maxWidth:'420px', width:'90%', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin:'0 0 8px', fontSize:'16px', fontWeight:'700' }}>🔶 Collega HubSpot</h3>
        <p style={{ color:'#6b7280', fontSize:'13px', marginBottom:'16px', lineHeight:'1.5' }}>Inserisci un Private App Token con permessi su <b>CRM → Companies</b> e <b>CRM → Notes</b>.</p>
        <input value={hsTempToken} onChange={e=>setHsTempToken(e.target.value)} type="password" placeholder="pat-eu1-..." style={{ width:'100%', padding:'11px 14px', border:'2px solid #e5e7eb', borderRadius:'9px', fontSize:'13px', outline:'none', fontFamily:'monospace', boxSizing:'border-box', marginBottom:'12px' }} />
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={()=>{if(hsTempToken.trim()){localStorage.setItem('domino_hs_token',hsTempToken.trim());setHsToken(hsTempToken.trim())}setShowHsModal(false)}} style={{ flex:1, padding:'11px', background:'#ff7a59', color:'white', border:'none', borderRadius:'9px', cursor:'pointer', fontSize:'13px', fontWeight:'700', fontFamily:'inherit' }}>Salva</button>
          <button onClick={()=>setShowHsModal(false)} style={{ padding:'11px 16px', background:'#f3f4f6', color:'#555', border:'none', borderRadius:'9px', cursor:'pointer', fontSize:'13px', fontFamily:'inherit' }}>Annulla</button>
        </div>
        <p style={{ marginTop:'12px', fontSize:'11px', color:'#9ca3af', lineHeight:'1.5' }}>Crea un Private App su <a href="https://app.hubspot.com/private-apps" target="_blank" rel="noreferrer" style={{ color:'#ff7a59' }}>app.hubspot.com/private-apps</a>.</p>
      </div>
    </div>}

    {/* ── NAVBAR ── */}
    <div style={{ background:'#111', height:'54px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', position:'sticky', top:0, zIndex:99 }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <DominoLogo />
        <span style={{ color:'#444', fontSize:'13px' }}>/ Prospect Engine</span>
      </div>
      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
        <HubSpotBadge token={hsToken} onConfigure={()=>setShowHsModal(true)} />
        <button onClick={()=>setShowArchive(true)} style={{ background:'transparent', border:'1px solid #333', color:'#aaa', padding:'4px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'11px', fontFamily:'inherit' }}>📁 Archivio ({loadArchive().length})</button>
      </div>
    </div>

    {/* ── MAIN CONTENT ── */}
    <div style={{ flex:1 }}>
      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'28px 20px' }}>

        {/* Input card */}
        <div style={{ background:'white', borderRadius:'14px', padding:'24px', marginBottom:'20px', border:'1px solid #e5e7eb', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <h1 style={{ margin:'0 0 4px', fontSize:'20px', fontWeight:'800', color:'#111', letterSpacing:'-0.02em' }}>Analizza un prospect</h1>
          <p style={{ margin:'0 0 20px', color:'#6b7280', fontSize:'13px' }}>Ricerca su sito web · Cerved/bilanci · news · LinkedIn · job posting — materiali sales con dati reali.</p>
          <div style={{ display:'flex', gap:'10px', marginBottom:'10px' }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&analyze()} placeholder="es. Technogym · Gruppo Humanitas · www.alpitour.it" disabled={loading} style={{ flex:1, padding:'11px 14px', border:'2px solid #e5e7eb', borderRadius:'9px', fontSize:'14px', outline:'none', fontFamily:'inherit' }} onFocus={e=>e.target.style.borderColor='#E8272A'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
            <button onClick={analyze} disabled={loading||!input.trim()} style={{ padding:'11px 24px', background:loading||!input.trim()?'#e5e7eb':'#E8272A', color:loading||!input.trim()?'#9ca3af':'white', border:'none', borderRadius:'9px', cursor:loading||!input.trim()?'not-allowed':'pointer', fontSize:'14px', fontWeight:'700', fontFamily:'inherit', whiteSpace:'nowrap' }}>{loading?'…':'Analizza →'}</button>
          </div>
          <textarea value={note} onChange={e=>setNote(e.target.value)} disabled={loading} placeholder="Note opzionali — es. '200 dealer' · 'Target: CMO' · 'Lanciano prodotto a settembre'" rows={2} style={{ width:'100%', padding:'11px 14px', border:'2px solid #e5e7eb', borderRadius:'9px', fontSize:'13px', outline:'none', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box', color:'#374151' }} onFocus={e=>e.target.style.borderColor='#E8272A'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
        </div>

        {loading && <ProgressPanel searchCount={searchCount} />}
        {error && !loading && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'14px 18px', color:'#dc2626', fontSize:'13px', marginBottom:'20px' }}>⚠️ {error}</div>}

        {result && !loading && <>
          {/* Summary bar */}
          <div style={{ background:'#111', borderRadius:'11px', padding:'14px 22px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
            <div>
              <div style={{ color:'#555', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Prospect</div>
              <div style={{ color:'white', fontWeight:'800', fontSize:'15px' }}>{p.nome}</div>
            </div>
            <div style={{ width:'1px', height:'36px', background:'#333' }} />
            <div>
              <div style={{ color:'#555', fontSize:'10px', textTransform:'uppercase' }}>Settore</div>
              <div style={{ color:'#ccc', fontSize:'13px' }}>{p.settore}</div>
            </div>
            <div style={{ width:'1px', height:'36px', background:'#333' }} />
            <div>
              <div style={{ color:'#555', fontSize:'10px', textTransform:'uppercase' }}>Target</div>
              <div style={{ color:'#ccc', fontSize:'13px' }}>{p.decisore_target}</div>
            </div>
            {(hasSprint||hasPE) && <>
              <div style={{ width:'1px', height:'36px', background:'#333' }} />
              <div style={{ display:'flex', gap:'6px' }}>
                {hasSprint && <ToolBadge type="sprint" />}
                {hasPE && <ToolBadge type="pe" />}
              </div>
            </>}
            <div style={{ marginLeft:'auto', display:'flex', gap:'8px', flexWrap:'wrap' }}>
              <button onClick={()=>exportPPT(result)} style={{ background:'#E8272A', color:'white', border:'none', padding:'8px 14px', borderRadius:'7px', cursor:'pointer', fontSize:'12px', fontWeight:'700', fontFamily:'inherit' }}>⬇ PPT</button>
              <button onClick={handleHsSync} style={{ background: hsStatus==='ok'?'#16a34a': hsStatus==='error'?'#dc2626': hsStatus==='saving'?'#e5e7eb':'#ff7a59', color: hsStatus==='saving'?'#9ca3af':'white', border:'none', padding:'8px 14px', borderRadius:'7px', cursor:hsStatus==='saving'?'not-allowed':'pointer', fontSize:'12px', fontWeight:'700', fontFamily:'inherit' }}>
                {hsStatus==='saving'?'…':hsStatus==='ok'?'✓ HubSpot':hsStatus==='error'?'✗ Errore':'🔶 → HubSpot'}
              </button>
            </div>
          </div>

          <ScarsezzaBanner msg={p.scarsezza_dati} />

          {/* Tabs */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
            {[['intel','🔍','Intelligence'],['mail','✉️','Mail'],['deck','📊','Deck'],['workflow','📅','Workflow'],['linkedin','💼','LinkedIn'],['fonti','📋','Fonti']].map(([t,i,l])=><TabBtn key={t} active={tab===t} onClick={()=>setTab(t)} icon={i} label={l} />)}
          </div>

          <div style={{ background:'white', borderRadius:'14px', padding:'26px', border:'1px solid #e5e7eb', minHeight:'280px' }}>

            {/* INTELLIGENCE */}
            {tab==='intel' && <div>
              <h2 style={{ margin:'0 0 18px', fontSize:'17px', fontWeight:'700', color:'#111' }}>Intelligence — {p.nome}</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
                {[['Settore',p.settore],['Dimensione',p.dimensione],['Mercati',p.mercati],['Fatturato',p.fatturato_stimato],['Decisore target',p.decisore_target],['Maturità digitale',null]].map(([l,v],idx)=>
                  <div key={l} style={{ background:'#f9fafb', borderRadius:'9px', padding:'11px 14px' }}>
                    <div style={{ fontSize:'10px', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'3px' }}>{l}</div>
                    {idx===5 ? <DigitalBadge level={p.maturita_digitale} /> : <div style={{ fontSize:'13px', color:!v||v==='null'?'#bbb':'#111', fontWeight:'600', fontStyle:!v||v==='null'?'italic':'normal' }}>{v||'Non trovato'}</div>}
                  </div>
                )}
              </div>
              {p.persone_chiave?.length>0 && <div style={{ marginBottom:'16px' }}>
                {SL('Persone chiave')}
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {p.persone_chiave.map((pk,i)=><div key={i} style={{ background:'#f0f8ff', border:'1px solid #bfdbfe', borderRadius:'8px', padding:'8px 12px', fontSize:'12px' }}>
                    <div style={{ fontWeight:'700', color:'#1d4ed8' }}>{pk.nome}</div>
                    <div style={{ color:'#6b7280' }}>{pk.ruolo}</div>
                  </div>)}
                </div>
              </div>}
              {p.segnali_recenti?.length>0 && <div style={{ marginBottom:'16px' }}>
                {SL('Segnali recenti')}
                {p.segnali_recenti.map((s,i)=><div key={i} style={{ display:'flex', gap:'9px', padding:'9px 13px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'7px', marginBottom:'6px', fontSize:'13px', color:'#374151' }}>
                  <span style={{ color:'#16a34a', fontWeight:'700', flexShrink:0 }}>↑</span>{s}
                </div>)}
              </div>}
              <div style={{ marginBottom:'16px' }}>
                {SL('Sfide probabili')}
                {p.sfide_probabili?.map((s,i)=><div key={i} style={{ display:'flex', gap:'9px', padding:'9px 13px', background:'#fef2f2', borderRadius:'7px', marginBottom:'6px', fontSize:'13px', color:'#374151' }}>
                  <span style={{ color:'#E8272A', fontWeight:'700', flexShrink:0 }}>→</span>{s}
                </div>)}
              </div>
              {casiStudio.length>0 && <div style={{ marginBottom:'16px' }}>
                {SL('Case study consigliati (3)')}
                {casiStudio.map((cs,i)=><div key={i} style={{ display:'flex', gap:'9px', padding:'9px 13px', background:'#fafafa', border:'1px solid #e5e7eb', borderRadius:'7px', marginBottom:'6px', fontSize:'13px', color:'#374151' }}>
                  <span style={{ background:'#E8272A', color:'white', borderRadius:'4px', padding:'1px 7px', fontSize:'10px', fontWeight:'700', flexShrink:0, alignSelf:'flex-start', marginTop:'1px' }}>{['Stesso settore','Sfida simile','Metodologia'][i]||i+1}</span>
                  {cs}
                </div>)}
              </div>}
              {strumenti.length>0 && <div style={{ marginBottom:'16px' }}>
                {SL('Strumenti consigliati')}
                <div style={{ display:'flex', gap:'8px' }}>
                  {hasSprint && <ToolBadge type="sprint" />}
                  {hasPE && <ToolBadge type="pe" />}
                </div>
              </div>}
              <div style={{ background:'#111', borderRadius:'9px', padding:'14px 18px' }}>
                <div style={{ fontSize:'10px', color:'#888', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'5px' }}>Hook di apertura</div>
                <div style={{ color:'white', fontSize:'14px', fontStyle:'italic' }}>"{p.hook}"</div>
              </div>
            </div>}

            {/* MAIL */}
            {tab==='mail' && <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
                <h2 style={{ margin:0, fontSize:'17px', fontWeight:'700', color:'#111' }}>Mail introduttiva</h2>
                <CopyBtn text={'Oggetto: '+result.mail?.oggetto+'\n\n'+result.mail?.corpo} />
              </div>
              <div style={{ border:'1px solid #e5e7eb', borderRadius:'11px', overflow:'hidden' }}>
                <div style={{ background:'#f3f4f6', padding:'11px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', gap:'8px', alignItems:'center' }}>
                  <span style={{ fontSize:'11px', color:'#6b7280', fontWeight:'700' }}>OGGETTO:</span>
                  <span style={{ fontSize:'14px', color:'#111', fontWeight:'700' }}>{result.mail?.oggetto}</span>
                </div>
                <div style={{ padding:'18px 16px', fontSize:'14px', color:'#374151', lineHeight:'1.7', whiteSpace:'pre-wrap' }}>{result.mail?.corpo}</div>
              </div>
            </div>}

            {/* DECK */}
            {tab==='deck' && <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
                <h2 style={{ margin:0, fontSize:'17px', fontWeight:'700', color:'#111' }}>Struttura deck — 5 slide</h2>
                <button onClick={()=>exportPPT(result)} style={{ background:'#E8272A', color:'white', border:'none', padding:'7px 14px', borderRadius:'7px', cursor:'pointer', fontSize:'12px', fontWeight:'700', fontFamily:'inherit' }}>⬇ Esporta PPT</button>
              </div>
              {[1,2,3,4,5].map(n=><SlideCard key={n} n={n} titolo={result.deck?.[`slide_${n}_titolo`]} contenuto={result.deck?.[`slide_${n}_contenuto`]} />)}
            </div>}

            {/* WORKFLOW */}
            {tab==='workflow' && <div>
              <h2 style={{ margin:'0 0 22px', fontSize:'17px', fontWeight:'700', color:'#111' }}>Workflow primo contatto</h2>
              {result.workflow?.map((step,i)=><WorkflowStep key={i} step={step} last={i===result.workflow.length-1} />)}
            </div>}

            {/* LINKEDIN */}
            {tab==='linkedin' && <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
                <h2 style={{ margin:0, fontSize:'17px', fontWeight:'700', color:'#111' }}>Messaggio LinkedIn</h2>
                <CopyBtn text={result.linkedin_connection} />
              </div>
              <div style={{ background:'#f0f8ff', border:'1px solid #bfdbfe', borderRadius:'11px', padding:'18px' }}>
                <div style={{ display:'flex', gap:'12px' }}>
                  <div style={{ width:'38px', height:'38px', background:'#0077B5', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'800', fontSize:'15px', flexShrink:0 }}>D</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:'700', fontSize:'13px', color:'#1d4ed8', marginBottom:'6px' }}>Domino — Strategic CX Partner</div>
                    <div style={{ fontSize:'13px', color:'#374151', lineHeight:'1.6' }}>{result.linkedin_connection}</div>
                  </div>
                </div>
              </div>
              <p style={{ marginTop:'12px', fontSize:'11px', color:'#9ca3af' }}>Max 200 caratteri · Personalizzato sul prospect.</p>
            </div>}

            {/* FONTI */}
            {tab==='fonti' && <div>
              <h2 style={{ margin:'0 0 18px', fontSize:'17px', fontWeight:'700', color:'#111' }}>Report di intelligence completo</h2>
              <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'9px', padding:'18px', fontSize:'13px', color:'#374151', lineHeight:'1.7', whiteSpace:'pre-wrap', maxHeight:'600px', overflowY:'auto' }}>
                {result._research_report || 'Report non disponibile.'}
              </div>
            </div>}

          </div>
        </>}
      </div>
    </div>

    {/* ── FOOTER ── */}
    <div style={{ background:'#111', borderTop:'1px solid #1f1f1f', padding:'12px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px' }}>
      <span style={{ color:'#444', fontSize:'11px' }}>
        © {new Date().getFullYear()} Domino srl Società Benefit · <a href="https://www.domino.it" target="_blank" rel="noreferrer" style={{ color:'#555', textDecoration:'none' }}>domino.it</a>
      </span>
      <span style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'11px' }}>
        <span style={{ color:'#E8272A', fontWeight:'700' }}>Prospect Engine</span>
        <span style={{ color:'#333' }}>·</span>
        <span style={{ color:'#555', fontWeight:'600' }}>{APP_RELEASE}</span>
        <span style={{ color:'#333' }}>·</span>
        <span style={{ color:'#444' }}>{genCount} {genCount === 1 ? 'analisi generata' : 'analisi generate'}</span>
      </span>
    </div>

  </div>
}
