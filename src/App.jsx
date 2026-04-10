import { useState, useEffect } from "react";

// ── DESIGN TOKENS ─────────────────────────────────────
const V   = "v3.3.0";
const RED = "#D0021B";
const BG  = "#1A1714";
const C1  = "#242120";   // card
const C2  = "#2d2b29";   // card hover / input
const C3  = "#363330";   // nested bg
const BR  = "rgba(255,255,255,0.07)";
const BRH = "rgba(255,255,255,0.14)";
const T1  = "#FFFFFF";
const T2  = "rgba(255,255,255,0.58)";
const T3  = "rgba(255,255,255,0.28)";
const RD  = "rgba(208,2,27,0.16)";
const RDB = "rgba(208,2,27,0.32)";

// ── SECTOR CONFIG ─────────────────────────────────────
const SECTORS = {
  salute:  { label: "Salute & Benessere", sub: ["Ospedali/cliniche private","Pharma & parafarmaco","MedTech/dispositivi","Wellness premium","HealthTech scale-up"] },
  b2b:     { label: "B2B Industriale",    sub: ["Meccanica di precisione","Automazione & robotica","Chimico/materiali avanzati","Logistica & supply chain","Energia & utilities B2B"] },
  turismo: { label: "Turismo & Cultura",  sub: ["Tour operator & DMC","Hospitality premium","Destinazioni & DMO","Cultura & intrattenimento","Food & wine premium"] },
};

const SEGNALI = ["Job posting ruoli digital/marketing","Sito web con 3+ anni senza update","Annuncio espansione nuovi mercati","Recente cambio CMO/CDO","PE/investor nel capitale","Presenza fiere internazionali"];

// ── INTELLIGENCE SECTIONS ─────────────────────────────
const SECTIONS = [
  { key: "PROFILO AZIENDA",                icon: "🏢" },
  { key: "DATI FINANZIARI",                icon: "📊" },
  { key: "PERSONE CHIAVE",                 icon: "👤" },
  { key: "SEGNALI RECENTI",                icon: "📡" },
  { key: "JOB POSTING E PRIORITÀ STRATEGICHE", icon: "🎯" },
  { key: "PRESENZA E MATURITÀ DIGITALE",   icon: "💻" },
  { key: "SFIDE PROBABILI",                icon: "⚡" },
  { key: "OPPORTUNITÀ PER DOMINO",         icon: "🚀" },
  { key: "⚠️ DATI NON TROVATI",            icon: "⚠️" },
];

// ── SCORE COLOR ───────────────────────────────────────
const SC = (s) => s >= 75 ? { t:"#4ade80", b:"rgba(74,222,128,0.12)" } : s >= 55 ? { t:"#fb923c", b:"rgba(251,146,60,0.12)" } : { t:"#f87171", b:"rgba(248,113,113,0.12)" };
const CANAL_C = { LinkedIn:"#0a8fd1", Email:RED, Phone:"#22c55e" };

// ── API CALL ──────────────────────────────────────────
async function api(action, payload) {
  const r = await fetch("/api/analyze", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action, payload }) });
  if (!r.ok) throw new Error(`Errore server ${r.status}`);
  return (await r.json()).result;
}

// ── PARSE DOSSIER → SECTIONS ─────────────────────────
function parseDossier(text) {
  const out = {};
  SECTIONS.forEach(({ key }, i) => {
    const next = SECTIONS[i + 1];
    const re1 = new RegExp(`##\\s*${key.replace(/[⚠️]/g,"\\⚠️")}\\s*\\n([\\s\\S]*?)${next ? `##\\s*${next.key.replace(/[⚠️]/g,"\\⚠️")}` : "$"}`, "i");
    const m = text.match(re1);
    out[key] = m ? m[1].trim() : null;
  });
  return out;
}

// ── DECK DOWNLOAD ─────────────────────────────────────
function dlDeck(deck, nome) {
  const txt = deck.map(s => `SLIDE ${s.n}: ${s.titolo}\n${"─".repeat(44)}\n${s.contenuto}\n`).join("\n");
  const b = new Blob([`DECK — ${nome}\nDomino Prospect Engine ${V}\n${"═".repeat(50)}\n\n${txt}`], { type:"text/plain;charset=utf-8" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(b), download: `deck_${nome.replace(/\s+/g,"_").toLowerCase()}.txt` });
  a.click(); URL.revokeObjectURL(a.href);
}

// ── SHARED STYLES ─────────────────────────────────────
const cs = {
  card:    { background:C1, border:`1px solid ${BR}`, borderRadius:12, padding:"22px 24px", marginBottom:14 },
  cardRed: { background:RD, border:`1px solid ${RDB}`, borderRadius:12, padding:"22px 24px", marginBottom:14, cursor:"pointer" },
  label:   { fontSize:10, fontWeight:700, letterSpacing:"0.13em", color:T3, textTransform:"uppercase", display:"block", marginBottom:8 },
  input:   { width:"100%", boxSizing:"border-box", background:C2, border:`1px solid ${BR}`, borderRadius:8, padding:"12px 16px", color:T1, fontSize:14, outline:"none", fontFamily:"inherit" },
  btnP:    { background:RED, color:"#fff", border:"none", borderRadius:8, padding:"11px 28px", fontSize:14, fontWeight:600, cursor:"pointer" },
  btnO:    (a) => ({ background:a?RD:"transparent", color:a?RED:T2, border:`1px solid ${a?RDB:BR}`, borderRadius:6, padding:"8px 16px", fontSize:13, fontWeight:500, cursor:"pointer" }),
  pill:    (a) => ({ display:"inline-block", padding:"5px 13px", borderRadius:20, fontSize:12, cursor:"pointer", margin:"3px 4px 3px 0", border:`1px solid ${a?RDB:BR}`, background:a?RD:C2, color:a?"#ff7070":T2, fontWeight:500 }),
  tab:     (a) => ({ padding:"10px 18px", fontSize:13, fontWeight:600, cursor:"pointer", border:"none", background:"transparent", color:a?RED:T2, borderBottom:`2px solid ${a?RED:"transparent"}` }),
};

// ── COMPONENTS ───────────────────────────────────────
function Spinner({ msg }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, padding:"64px 0" }}>
      <div style={{ width:34, height:34, border:`2px solid ${BRH}`, borderTop:`2px solid ${RED}`, borderRadius:"50%", animation:"spin .7s linear infinite" }} />
      <span style={{ fontSize:13, color:T2 }}>{msg}</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Badge({ score }) {
  const c = SC(score);
  return <span style={{ background:c.b, color:c.t, fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:4 }}>{score}/100</span>;
}

function Logo() {
  const [e, setE] = useState(false);
  return e
    ? <div style={{ display:"flex", alignItems:"center", gap:7 }}><div style={{ width:8, height:8, background:RED, borderRadius:2 }} /><span style={{ fontSize:12, fontWeight:700, letterSpacing:"0.12em", color:RED }}>DOMINO</span></div>
    : <img src="https://www.domino.it/hubfs/Domino-next/img/dominologo_short.png" alt="Domino" style={{ height:26, objectFit:"contain" }} onError={() => setE(true)} />;
}

// Intelligence section card
function SectionCard({ icon, title, content }) {
  const [open, setOpen] = useState(true);
  const missing = !content || content.toLowerCase().includes("non trovato") || content.includes("⚠️");
  return (
    <div style={{ background:C1, border:`1px solid ${missing ? "rgba(251,146,60,0.2)" : BR}`, borderRadius:10, marginBottom:10, overflow:"hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 18px", cursor:"pointer", userSelect:"none" }}>
        <span style={{ fontSize:15 }}>{icon}</span>
        <span style={{ fontSize:13, fontWeight:600, color:missing?T3:T1, flex:1 }}>{title}</span>
        <span style={{ fontSize:12, color:T3 }}>{open?"▾":"▸"}</span>
      </div>
      {open && content && (
        <div style={{ padding:"0 18px 16px", borderTop:`1px solid ${BR}`, paddingTop:14 }}>
          <p style={{ fontSize:13, lineHeight:1.72, color:missing?T3:T2, margin:0, whiteSpace:"pre-wrap" }}>{content}</p>
        </div>
      )}
      {open && !content && (
        <div style={{ padding:"0 18px 16px", borderTop:`1px solid ${BR}`, paddingTop:14 }}>
          <p style={{ fontSize:13, color:T3, margin:0, fontStyle:"italic" }}>⚠️ Nessun dato trovato</p>
        </div>
      )}
    </div>
  );
}

// Mail tab
function MailTab({ mail }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(`Oggetto: ${mail.oggetto}\n\n${mail.corpo}`); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div>
      <div style={{ background:C2, border:`1px solid ${BR}`, borderRadius:8, padding:"18px 20px", marginBottom:12 }}>
        <span style={cs.label}>Oggetto</span>
        <p style={{ fontSize:15, fontWeight:600, margin:0, color:T1 }}>{mail.oggetto}</p>
      </div>
      <div style={{ background:C2, border:`1px solid ${BR}`, borderRadius:8, padding:"18px 20px", marginBottom:16 }}>
        <span style={cs.label}>Corpo</span>
        <p style={{ fontSize:14, lineHeight:1.8, color:T2, margin:0, whiteSpace:"pre-wrap" }}>{mail.corpo}</p>
      </div>
      <button onClick={copy} style={cs.btnO(false)}>{copied?"✓ Copiata":"Copia email"}</button>
    </div>
  );
}

// Deck tab
function DeckTab({ deck, nome }) {
  return (
    <div>
      {deck.map(sl => (
        <div key={sl.n} style={{ background:C2, border:`1px solid ${BR}`, borderRadius:8, padding:"16px 20px", marginBottom:10, display:"flex", gap:16 }}>
          <span style={{ fontSize:30, fontWeight:800, color:RED, lineHeight:1, minWidth:28, letterSpacing:"-0.04em" }}>{sl.n}</span>
          <div>
            <p style={{ fontSize:14, fontWeight:600, margin:"0 0 7px", color:T1 }}>{sl.titolo}</p>
            <p style={{ fontSize:13, color:T2, margin:0, lineHeight:1.65, whiteSpace:"pre-wrap" }}>{sl.contenuto}</p>
          </div>
        </div>
      ))}
      <button onClick={() => dlDeck(deck, nome)} style={cs.btnP}>↓ Scarica deck (.txt)</button>
    </div>
  );
}

// LinkedIn tab
function LinkedInTab({ linkedin }) {
  const [cp, setCp] = useState(null);
  return (
    <div style={{ display:"grid", gap:12 }}>
      {linkedin.map((m,i) => (
        <div key={i} style={{ background:C2, border:`1px solid ${BR}`, borderRadius:8, padding:"16px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ background:RD, color:RED, fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:4 }}>Giorno {m.giorno}</span>
              <span style={{ fontSize:12, color:T3 }}>{m.tipo}</span>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(m.testo); setCp(i); setTimeout(()=>setCp(null),2000); }} style={{ ...cs.btnO(false), padding:"4px 12px", fontSize:11 }}>{cp===i?"✓":"Copia"}</button>
          </div>
          <p style={{ fontSize:13, color:T2, lineHeight:1.65, margin:0 }}>{m.testo}</p>
        </div>
      ))}
    </div>
  );
}

// Workflow tab
function WorkflowTab({ workflow }) {
  return (
    <div style={{ position:"relative" }}>
      <div style={{ position:"absolute", left:22, top:24, bottom:24, width:1, background:BR }} />
      {workflow.map((w,i) => (
        <div key={i} style={{ display:"flex", gap:14, marginBottom:16, position:"relative" }}>
          <div style={{ width:44, height:44, minWidth:44, background:C2, border:`1px solid ${BR}`, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1 }}>
            <span style={{ fontSize:11, fontWeight:700, color:CANAL_C[w.canale]||T2 }}>{w.giorno}</span>
          </div>
          <div style={{ background:C2, border:`1px solid ${BR}`, borderRadius:8, padding:"12px 16px", flex:1 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom: w.note ? 6 : 0 }}>
              <span style={{ fontSize:10, fontWeight:700, color:CANAL_C[w.canale]||T2, letterSpacing:"0.08em", textTransform:"uppercase" }}>{w.canale}</span>
              <span style={{ fontSize:13, fontWeight:600, color:T1 }}>{w.azione}</span>
            </div>
            {w.note && <p style={{ fontSize:12, color:T3, margin:0 }}>{w.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────
export default function App() {
  const [step, setStep]       = useState("entry");
  const [sector, setSector]   = useState(null);
  const [subs, setSubs]       = useState([]);
  const [fatt, setFatt]       = useState("20");
  const [seg, setSeg]         = useState([]);
  const [prospects, setProspects] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [manual, setManual]   = useState("");
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [dossier, setDossier] = useState("");
  const [parsed, setParsed]   = useState({});
  const [mats, setMats]       = useState(null);
  const [tab, setTab]         = useState("intelligence");
  const [err, setErr]         = useState(null);

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap";
    document.head.appendChild(l);
  }, []);

  const nome = typeof selected === "string" ? selected : selected?.nome || "";

  const tSub = (x) => setSubs(p => p.includes(x) ? p.filter(s=>s!==x) : [...p,x]);
  const tSeg = (x) => setSeg(p => p.includes(x) ? p.filter(s=>s!==x) : [...p,x]);

  async function genList() {
    if (!sector) return;
    setLoading(true); setErr(null); setLoadMsg("Genero lista prospect...");
    try {
      const raw = await api("generate_list", { sectorLabel:SECTORS[sector].label, subsectors:subs, minFatturato:fatt, segnali:seg });
      const i = raw.indexOf("["), j = raw.lastIndexOf("]");
      if (i<0||j<0) throw new Error("Lista non generata");
      setProspects(JSON.parse(raw.slice(i,j+1)).sort((a,b)=>b.score-a.score));
      setStep("list");
    } catch(e) { setErr(e.message); }
    setLoading(false);
  }

  async function research(p) {
    setSelected(p); setStep("results"); setLoading(true); setErr(null);
    setMats(null); setTab("intelligence"); setDossier(""); setParsed({});
    setLoadMsg("Research agent in esecuzione...");
    try {
      const r = await api("research", { nome:p.nome||p, settore:p.settore||"", citta:p.citta||"", hook:p.hook||"" });
      setDossier(r);
      setParsed(parseDossier(r));
    } catch(e) { setErr(e.message); }
    setLoading(false);
  }

  async function genMats() {
    setLoading(true); setErr(null); setLoadMsg("Genero mail, deck, LinkedIn e workflow...");
    try {
      const r = await api("generate_materials", { dossier, nomeAzienda:nome });
      setMats(r); setTab("mail");
    } catch(e) { setErr(e.message); }
    setLoading(false);
  }

  function reset() {
    setStep("entry"); setSector(null); setSubs([]); setFatt("20"); setSeg([]);
    setProspects([]); setSelected(null); setManual(""); setDossier(""); setParsed({});
    setMats(null); setTab("intelligence"); setErr(null);
  }

  const TABS = [
    { k:"intelligence", l:"Intelligence" },
    { k:"mail",         l:"Mail" },
    { k:"deck",         l:"Deck" },
    { k:"linkedin",     l:"LinkedIn" },
    { k:"workflow",     l:"Workflow" },
  ];

  return (
    <div style={{ background:BG, minHeight:"100vh", fontFamily:"'DM Sans', system-ui, sans-serif", color:T1, paddingBottom:60 }}>

      {/* ── HEADER ── */}
      <header style={{ borderBottom:`1px solid ${BR}`, padding:"18px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:BG, zIndex:10 }}>
        <Logo />
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {step !== "entry" && <button onClick={reset} style={{ ...cs.btnO(false), fontSize:12, padding:"6px 14px" }}>← Ricomincia</button>}
          <span style={{ fontSize:11, color:T3, fontFamily:"monospace" }}>{V}</span>
        </div>
      </header>

      <div style={{ maxWidth:740, margin:"0 auto", padding:"32px 24px" }}>

        {/* ── ERROR ── */}
        {err && <div style={{ background:"rgba(208,2,27,0.14)", border:"1px solid rgba(208,2,27,0.35)", borderRadius:8, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#ff8888" }}>⚠️ {err}</div>}

        {/* ── ENTRY ── */}
        {step === "entry" && (
          <div>
            <h1 style={{ fontSize:28, fontWeight:800, margin:"0 0 6px", letterSpacing:"-0.025em" }}>Prospect Engine</h1>
            <p style={{ fontSize:14, color:T2, margin:"0 0 36px" }}>Intelligenza commerciale per il sales team Domino</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div onClick={() => setStep("filter")} style={{ ...cs.cardRed, padding:26 }}>
                <span style={{ fontSize:22, display:"block", marginBottom:14 }}>🔍</span>
                <p style={{ fontWeight:700, fontSize:16, margin:"0 0 8px", color:T1 }}>Genera lista prospect</p>
                <p style={{ fontSize:13, color:T2, margin:0, lineHeight:1.6 }}>Scelgo settore e filtri, l'AI costruisce una lista qualificata con scoring</p>
              </div>
              <div onClick={() => setStep("manual")} style={{ ...cs.card, cursor:"pointer", padding:26 }}>
                <span style={{ fontSize:22, display:"block", marginBottom:14 }}>🎯</span>
                <p style={{ fontWeight:700, fontSize:16, margin:"0 0 8px" }}>Ho un prospect</p>
                <p style={{ fontSize:13, color:T2, margin:0, lineHeight:1.6 }}>Inserisco il nome e genero intelligence + tutti i materiali sales</p>
              </div>
            </div>
          </div>
        )}

        {/* ── MANUAL INPUT ── */}
        {step === "manual" && (
          <div style={cs.card}>
            <span style={cs.label}>Nome azienda prospect</span>
            <input style={{ ...cs.input, marginBottom:18 }} type="text" value={manual} onChange={e=>setManual(e.target.value)} placeholder="es. Humanitas, NH Hotels, Mapei..." onKeyDown={e=>e.key==="Enter"&&manual.trim()&&research(manual.trim())} autoFocus />
            <button onClick={()=>research(manual.trim())} disabled={!manual.trim()} style={{ ...cs.btnP, opacity:manual.trim()?1:0.4 }}>Analizza prospect →</button>
          </div>
        )}

        {/* ── FILTER ── */}
        {step === "filter" && (
          <div style={cs.card}>
            <div style={{ marginBottom:24 }}>
              <span style={cs.label}>Settore target</span>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {Object.entries(SECTORS).map(([k,v]) => <button key={k} onClick={()=>{setSector(k);setSubs([]);}} style={cs.btnO(sector===k)}>{v.label}</button>)}
              </div>
            </div>
            {sector && (
              <div style={{ marginBottom:24 }}>
                <span style={cs.label}>Sottosettori (opzionale)</span>
                <div>{SECTORS[sector].sub.map(x=><span key={x} onClick={()=>tSub(x)} style={cs.pill(subs.includes(x))}>{x}</span>)}</div>
              </div>
            )}
            <div style={{ marginBottom:24 }}>
              <span style={cs.label}>Fatturato minimo</span>
              <div style={{ display:"flex", gap:8 }}>
                {["15","20","50","100"].map(v=><button key={v} onClick={()=>setFatt(v)} style={cs.btnO(fatt===v)}>{`>${v}M€`}</button>)}
              </div>
            </div>
            <div style={{ marginBottom:24 }}>
              <span style={cs.label}>Segnali di acquisto (opzionale)</span>
              <div>{SEGNALI.map(x=><span key={x} onClick={()=>tSeg(x)} style={cs.pill(seg.includes(x))}>{x}</span>)}</div>
            </div>
            <button onClick={genList} disabled={!sector||loading} style={{ ...cs.btnP, opacity:sector?1:0.4 }}>Genera lista →</button>
          </div>
        )}

        {/* ── LIST ── */}
        {step === "list" && !loading && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <p style={{ fontSize:13, color:T2, margin:0 }}>{prospects.length} prospect qualificati · ordine per score</p>
              <button onClick={()=>setStep("filter")} style={{ ...cs.btnO(false), fontSize:12, padding:"6px 14px" }}>Modifica filtri</button>
            </div>
            {prospects.length === 0
              ? <div style={{ ...cs.card, textAlign:"center", color:T2, padding:40 }}>Nessun prospect generato. Modifica i filtri e riprova.</div>
              : prospects.map((p,i) => (
                <div key={i} onClick={()=>research(p)}
                  style={{ ...cs.card, cursor:"pointer", transition:"border-color .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=BRH}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=BR}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                        <span style={{ fontWeight:700, fontSize:16 }}>{p.nome}</span>
                        <Badge score={p.score} />
                      </div>
                      <p style={{ fontSize:12, color:T3, margin:"0 0 6px" }}>{p.settore} · {p.citta} · {p.fatturato_est} · {p.dipendenti_est} dip.</p>
                      <p style={{ fontSize:13, color:T2, margin:"0 0 4px", lineHeight:1.5 }}>{p.hook}</p>
                      {p.gap && <p style={{ fontSize:12, color:"rgba(251,146,60,0.75)", margin:0 }}>Gap digitale: {p.gap}</p>}
                    </div>
                    <span style={{ color:T3, marginLeft:14, fontSize:16 }}>→</span>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && <Spinner msg={loadMsg} />}

        {/* ── RESULTS ── */}
        {step === "results" && !loading && (
          <div>
            {/* Prospect header */}
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:26 }}>
              <div style={{ width:44, height:44, background:RD, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>🏢</div>
              <div>
                <h2 style={{ fontSize:22, fontWeight:800, margin:"0 0 4px", letterSpacing:"-0.02em" }}>{nome}</h2>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  {selected?.score && <Badge score={selected.score} />}
                  {selected?.settore && <span style={{ fontSize:12, color:T3 }}>{selected.settore}</span>}
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display:"flex", borderBottom:`1px solid ${BR}`, marginBottom:22, gap:2 }}>
              {TABS.map(t => (
                <button key={t.k} onClick={()=>(!mats&&t.k!=="intelligence")||setTab(t.k)}
                  style={{ ...cs.tab(tab===t.k), opacity:(!mats&&t.k!=="intelligence")?0.32:1, cursor:(!mats&&t.k!=="intelligence")?"default":"pointer" }}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* ── INTELLIGENCE TAB ── */}
            {tab === "intelligence" && dossier && (
              <div>
                {SECTIONS.map(({ key, icon }) => (
                  <SectionCard key={key} icon={icon} title={key} content={parsed[key]} />
                ))}

                {/* CTA generate materials */}
                <div style={{ background:C1, border:`1px solid ${BR}`, borderRadius:12, padding:"22px 24px", marginTop:6, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
                  <div>
                    <p style={{ fontWeight:600, fontSize:15, margin:"0 0 4px" }}>Genera i materiali sales</p>
                    <p style={{ fontSize:13, color:T2, margin:0 }}>Mail, deck (scaricabile), messaggi LinkedIn e workflow di contatto</p>
                  </div>
                  {!mats
                    ? <button onClick={genMats} style={{ ...cs.btnP, whiteSpace:"nowrap" }}>Genera →</button>
                    : <button onClick={()=>setTab("mail")} style={{ ...cs.btnP, background:"#22c55e", whiteSpace:"nowrap" }}>Vedi materiali →</button>
                  }
                </div>
              </div>
            )}

            {/* ── MAIL TAB ── */}
            {tab === "mail" && mats?.mail && <MailTab mail={mats.mail} />}

            {/* ── DECK TAB ── */}
            {tab === "deck" && mats?.deck && <DeckTab deck={mats.deck} nome={nome} />}

            {/* ── LINKEDIN TAB ── */}
            {tab === "linkedin" && mats?.linkedin && <LinkedInTab linkedin={mats.linkedin} />}

            {/* ── WORKFLOW TAB ── */}
            {tab === "workflow" && mats?.workflow && <WorkflowTab workflow={mats.workflow} />}

            {/* Bottom nav */}
            <div style={{ display:"flex", gap:10, marginTop:28 }}>
              <button onClick={reset} style={{ ...cs.btnO(false), fontSize:13 }}>Nuovo prospect</button>
              {prospects.length > 0 && (
                <button onClick={()=>{setStep("list");setDossier("");setParsed({});setMats(null);}} style={{ ...cs.btnO(false), fontSize:13 }}>← Lista prospect</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop:`1px solid ${BR}`, padding:"14px 32px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:7, height:7, background:RED, borderRadius:1 }} />
          <span style={{ fontSize:11, color:RED, fontWeight:700, letterSpacing:"0.1em" }}>DOMINO</span>
          <span style={{ fontSize:11, color:T3 }}>Prospect Engine</span>
        </div>
        <span style={{ fontSize:11, color:T3, fontFamily:"monospace" }}>{V}</span>
      </div>
    </div>
  );
}
