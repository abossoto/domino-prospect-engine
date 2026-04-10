import { useState, useEffect } from "react";

const V   = "v3.4.0";
const RED = "#D0021B";
const BG  = "#1A1714";
const C1  = "#242120";
const C2  = "#2d2b29";
const C3  = "#363330";
const BR  = "rgba(255,255,255,0.07)";
const BRH = "rgba(255,255,255,0.15)";
const T1  = "#FFFFFF";
const T2  = "rgba(255,255,255,0.58)";
const T3  = "rgba(255,255,255,0.28)";
const RD  = "rgba(208,2,27,0.15)";
const RDB = "rgba(208,2,27,0.3)";
const GN  = "rgba(34,197,94,0.15)";
const GNB = "rgba(34,197,94,0.3)";

const SECTORS = {
  salute:  { label:"Salute & Benessere", sub:["Ospedali/cliniche private","Pharma & parafarmaco","MedTech/dispositivi","Wellness premium","HealthTech scale-up"] },
  b2b:     { label:"B2B Industriale",    sub:["Meccanica di precisione","Automazione & robotica","Chimico/materiali avanzati","Logistica & supply chain","Energia & utilities B2B"] },
  turismo: { label:"Turismo & Cultura",  sub:["Tour operator & DMC","Hospitality premium","Destinazioni & DMO","Cultura & intrattenimento","Food & wine premium"] },
};
const SEGNALI = ["Job posting ruoli digital/marketing","Sito web con 3+ anni senza update","Annuncio espansione nuovi mercati","Recente cambio CMO/CDO","PE/investor nel capitale","Presenza fiere internazionali"];
const INTEL_SECTIONS = [
  {k:"PROFILO AZIENDA",icon:"🏢"},
  {k:"DATI FINANZIARI",icon:"📊"},
  {k:"PERSONE CHIAVE",icon:"👤"},
  {k:"SEGNALI RECENTI",icon:"📡"},
  {k:"JOB POSTING E PRIORITÀ STRATEGICHE",icon:"🎯"},
  {k:"PRESENZA E MATURITÀ DIGITALE",icon:"💻"},
  {k:"SFIDE PROBABILI",icon:"⚡"},
  {k:"OPPORTUNITÀ PER DOMINO",icon:"🚀"},
  {k:"⚠️ DATI NON TROVATI",icon:"⚠️"},
];
const CANAL_C = {LinkedIn:"#0a8fd1", Email:RED, Phone:"#22c55e"};
const SC = s => s>=75?{t:"#4ade80",b:"rgba(74,222,128,0.12)"}:s>=55?{t:"#fb923c",b:"rgba(251,146,60,0.12)"}:{t:"#f87171",b:"rgba(248,113,113,0.12)"};

async function api(action, payload) {
  const r = await fetch("/api/analyze", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action,payload})});
  if (!r.ok) throw new Error(`Errore server ${r.status}`);
  return (await r.json()).result;
}

function parseDossier(text) {
  const out = {};
  INTEL_SECTIONS.forEach(({k},i) => {
    const next = INTEL_SECTIONS[i+1];
    const re = new RegExp(`##\\s*${k.replace(/[⚠️()]/g,c=>"\\"+c)}[^\\n]*\\n([\\s\\S]*?)(?=##|$)`, "i");
    const m = text.match(re);
    out[k] = m ? m[1].trim() : null;
  });
  return out;
}

function dlDeck(deck, nome) {
  const txt = deck.map(s=>`SLIDE ${s.n}: ${s.titolo}\n${"─".repeat(46)}\n${s.contenuto}\n`).join("\n");
  const blob = new Blob([`DECK — ${nome}\nDomino Prospect Engine ${V}\n${"═".repeat(50)}\n\n${txt}`],{type:"text/plain;charset=utf-8"});
  const a = Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:`deck_${nome.replace(/\s+/g,"_").toLowerCase()}.txt`});
  a.click(); URL.revokeObjectURL(a.href);
}

const q = {
  wrap: {background:BG,minHeight:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",color:T1,paddingBottom:60},
  card: {background:C1,border:`1px solid ${BR}`,borderRadius:12,padding:"22px 24px",marginBottom:14},
  cardR:{background:RD,border:`1px solid ${RDB}`,borderRadius:12,padding:"22px 24px",marginBottom:14,cursor:"pointer"},
  lbl:  {fontSize:10,fontWeight:700,letterSpacing:"0.13em",color:T3,textTransform:"uppercase",display:"block",marginBottom:8},
  inp:  {width:"100%",boxSizing:"border-box",background:C2,border:`1px solid ${BR}`,borderRadius:8,padding:"12px 16px",color:T1,fontSize:14,outline:"none",fontFamily:"inherit"},
  btnP: {background:RED,color:"#fff",border:"none",borderRadius:8,padding:"11px 28px",fontSize:14,fontWeight:600,cursor:"pointer"},
  btnO: a=>({background:a?RD:"transparent",color:a?RED:T2,border:`1px solid ${a?RDB:BR}`,borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:500,cursor:"pointer"}),
  pill: a=>({display:"inline-block",padding:"5px 13px",borderRadius:20,fontSize:12,cursor:"pointer",margin:"3px 4px 3px 0",border:`1px solid ${a?RDB:BR}`,background:a?RD:C2,color:a?"#ff7070":T2,fontWeight:500}),
  tab:  a=>({padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",border:"none",background:"transparent",color:a?RED:T2,borderBottom:`2px solid ${a?RED:"transparent"}`}),
};

function Spinner({msg}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,padding:"64px 0"}}>
      <div style={{width:34,height:34,border:`2px solid ${BRH}`,borderTop:`2px solid ${RED}`,borderRadius:"50%",animation:"sp .7s linear infinite"}}/>
      <span style={{fontSize:13,color:T2}}>{msg}</span>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
function Badge({score}) {
  const c=SC(score);
  return <span style={{background:c.b,color:c.t,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:4}}>{score}/100</span>;
}
function Logo() {
  const [e,setE]=useState(false);
  return e
    ? <div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:8,height:8,background:RED,borderRadius:2}}/><span style={{fontSize:12,fontWeight:700,letterSpacing:"0.12em",color:RED}}>DOMINO</span></div>
    : <img src="https://www.domino.it/hubfs/Domino-next/img/dominologo_short.png" alt="Domino" style={{height:26,objectFit:"contain"}} onError={()=>setE(true)}/>;
}
function SectionCard({icon,title,content}) {
  const [open,setOpen]=useState(true);
  const miss=!content||content.includes("⚠️")||content.toLowerCase().includes("non trovato");
  return (
    <div style={{background:C1,border:`1px solid ${miss?"rgba(251,146,60,0.18)":BR}`,borderRadius:10,marginBottom:10,overflow:"hidden"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:10,padding:"13px 18px",cursor:"pointer",userSelect:"none"}}>
        <span style={{fontSize:14}}>{icon}</span>
        <span style={{fontSize:13,fontWeight:600,color:miss?T3:T1,flex:1}}>{title}</span>
        <span style={{fontSize:11,color:T3}}>{open?"▾":"▸"}</span>
      </div>
      {open && (
        <div style={{padding:"0 18px 16px",borderTop:`1px solid ${BR}`,paddingTop:14}}>
          {content
            ? <p style={{fontSize:13,lineHeight:1.75,color:miss?T3:T2,margin:0,whiteSpace:"pre-wrap"}}>{content}</p>
            : <p style={{fontSize:13,color:T3,margin:0,fontStyle:"italic"}}>⚠️ Nessun dato trovato</p>}
        </div>
      )}
    </div>
  );
}

// ── MAIL TAB ──────────────────────────────────────────
function MailTab({mail}) {
  const [active,setActive]=useState(0);
  const [cp,setCp]=useState(false);
  const v=mail.varianti[active];
  const copy=()=>{navigator.clipboard.writeText(`Oggetto: ${v.oggetto}\n\n${v.corpo}`);setCp(true);setTimeout(()=>setCp(false),2000);};
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        {mail.varianti.map((vv,i)=>(
          <button key={i} onClick={()=>{setActive(i);setCp(false);}} style={{...q.btnO(active===i),fontSize:12,padding:"6px 14px"}}>{vv.tipo}</button>
        ))}
      </div>
      <div style={{background:C2,border:`1px solid ${BR}`,borderRadius:8,padding:"16px 20px",marginBottom:10}}>
        <span style={q.lbl}>Oggetto</span>
        <p style={{fontSize:15,fontWeight:600,margin:0,color:T1}}>{v.oggetto}</p>
      </div>
      <div style={{background:C2,border:`1px solid ${BR}`,borderRadius:8,padding:"16px 20px",marginBottom:14}}>
        <span style={q.lbl}>Corpo</span>
        <p style={{fontSize:14,lineHeight:1.8,color:T2,margin:0,whiteSpace:"pre-wrap"}}>{v.corpo}</p>
      </div>
      <button onClick={copy} style={q.btnO(false)}>{cp?"✓ Copiata":"Copia email"}</button>
    </div>
  );
}

// ── DECK TAB ──────────────────────────────────────────
function DeckTab({deck,nome}) {
  return (
    <div>
      {deck.map(sl=>(
        <div key={sl.n} style={{background:C2,border:`1px solid ${BR}`,borderRadius:8,padding:"16px 20px",marginBottom:10,display:"flex",gap:16}}>
          <span style={{fontSize:28,fontWeight:800,color:RED,lineHeight:1,minWidth:24,letterSpacing:"-0.04em"}}>{sl.n}</span>
          <div>
            <p style={{fontSize:14,fontWeight:600,margin:"0 0 7px",color:T1}}>{sl.titolo}</p>
            <p style={{fontSize:13,color:T2,margin:0,lineHeight:1.68,whiteSpace:"pre-wrap"}}>{sl.contenuto}</p>
          </div>
        </div>
      ))}
      <button onClick={()=>dlDeck(deck,nome)} style={q.btnP}>↓ Scarica deck (.txt)</button>
    </div>
  );
}

// ── BRIEFING TAB ─────────────────────────────────────
function BriefingTab({b}) {
  const row=(label,val)=>(
    <div style={{borderTop:`1px solid ${BR}`,paddingTop:14,marginTop:14}}>
      <span style={q.lbl}>{label}</span>
      <p style={{fontSize:13,color:T2,margin:0,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{val}</p>
    </div>
  );
  return (
    <div style={{background:C1,border:`1px solid ${BR}`,borderRadius:12,padding:"22px 24px"}}>
      <div style={{marginBottom:14}}>
        <span style={q.lbl}>Tono rilevato</span>
        <p style={{fontSize:13,color:T2,margin:0}}>{b.tono}</p>
      </div>
      {row("Hook principale",b.hook_principale||b.angolo_di_attacco)}
      {row("Decisore target",b.decisore)}
      {row("Problema principale",b.problema_principale)}
      <div style={{borderTop:`1px solid ${BR}`,paddingTop:14,marginTop:14}}>
        <span style={q.lbl}>3 domande aperte per la call</span>
        {(b["3_domande_aperte"]||[]).map((d,i)=>(
          <div key={i} style={{display:"flex",gap:10,marginBottom:8}}>
            <span style={{color:RED,fontWeight:700,fontSize:13}}>{i+1}.</span>
            <p style={{fontSize:13,color:T2,margin:0,lineHeight:1.6}}>{d}</p>
          </div>
        ))}
      </div>
      <div style={{borderTop:`1px solid ${BR}`,paddingTop:14,marginTop:14}}>
        <span style={q.lbl}>Obiezioni probabili</span>
        {(b.obiezioni_probabili||[]).map((o,i)=>(
          <p key={i} style={{fontSize:13,color:T2,margin:"0 0 8px",lineHeight:1.6}}>• {o}</p>
        ))}
      </div>
      {row("Case study da citare",b.case_study_da_citare)}
      {b.red_flags&&row("⚠️ Red flags",b.red_flags)}
    </div>
  );
}

// ── LINKEDIN TAB ──────────────────────────────────────
function LinkedInTab({linkedin}) {
  const [cp,setCp]=useState(null);
  return (
    <div style={{display:"grid",gap:12}}>
      {linkedin.map((m,i)=>(
        <div key={i} style={{background:C2,border:`1px solid ${BR}`,borderRadius:8,padding:"16px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{background:RD,color:RED,fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:4}}>Giorno {m.giorno}</span>
              <span style={{fontSize:12,color:T3}}>{m.tipo}</span>
            </div>
            <button onClick={()=>{navigator.clipboard.writeText(m.testo);setCp(i);setTimeout(()=>setCp(null),2000);}} style={{...q.btnO(false),padding:"4px 12px",fontSize:11}}>{cp===i?"✓":"Copia"}</button>
          </div>
          <p style={{fontSize:13,color:T2,lineHeight:1.68,margin:0}}>{m.testo}</p>
        </div>
      ))}
    </div>
  );
}

// ── WORKFLOW TAB ──────────────────────────────────────
function WorkflowTab({workflow,mailVarianti}) {
  const recEmail=workflow.find(w=>w.canale==="Email");
  return (
    <div>
      {recEmail&&mailVarianti&&(
        <div style={{background:C2,border:`1px solid ${BR}`,borderRadius:8,padding:"14px 18px",marginBottom:18}}>
          <span style={{...q.lbl,marginBottom:4}}>Variante mail consigliata</span>
          <p style={{fontSize:13,color:T2,margin:0}}>{recEmail.note}</p>
        </div>
      )}
      <div style={{position:"relative"}}>
        <div style={{position:"absolute",left:21,top:24,bottom:24,width:1,background:BR}}/>
        {workflow.map((w,i)=>(
          <div key={i} style={{display:"flex",gap:14,marginBottom:16,position:"relative"}}>
            <div style={{width:42,height:42,minWidth:42,background:C2,border:`1px solid ${BR}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1}}>
              <span style={{fontSize:11,fontWeight:700,color:CANAL_C[w.canale]||T2}}>{w.giorno}</span>
            </div>
            <div style={{background:C2,border:`1px solid ${BR}`,borderRadius:8,padding:"12px 16px",flex:1}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:w.note?6:0}}>
                <span style={{fontSize:10,fontWeight:700,color:CANAL_C[w.canale]||T2,letterSpacing:"0.08em",textTransform:"uppercase"}}>{w.canale}</span>
                <span style={{fontSize:13,fontWeight:600,color:T1}}>{w.azione}</span>
              </div>
              {w.note&&<p style={{fontSize:12,color:T3,margin:0}}>{w.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────
export default function App() {
  const [step,setStep]=useState("entry");
  const [sector,setSector]=useState(null);
  const [subs,setSubs]=useState([]);
  const [fatt,setFatt]=useState("20");
  const [seg,setSeg]=useState([]);
  const [prospects,setProspects]=useState([]);
  const [selected,setSelected]=useState(null);
  const [manual,setManual]=useState("");
  const [loading,setLoading]=useState(false);
  const [loadMsg,setLoadMsg]=useState("");
  const [dossier,setDossier]=useState("");
  const [parsed,setParsed]=useState({});
  const [mats,setMats]=useState(null);
  const [tab,setTab]=useState("intelligence");
  const [err,setErr]=useState(null);

  useEffect(()=>{
    const l=document.createElement("link");
    l.rel="stylesheet";
    l.href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap";
    document.head.appendChild(l);
  },[]);

  const nome=typeof selected==="string"?selected:selected?.nome||"";
  const tSub=x=>setSubs(p=>p.includes(x)?p.filter(s=>s!==x):[...p,x]);
  const tSeg=x=>setSeg(p=>p.includes(x)?p.filter(s=>s!==x):[...p,x]);

  async function genList() {
    if(!sector)return;
    setLoading(true);setErr(null);setLoadMsg("Genero lista prospect con AI...");
    try {
      const raw=await api("generate_list",{sectorLabel:SECTORS[sector].label,subsectors:subs,minFatturato:fatt,segnali:seg});
      const i=raw.indexOf("["),j=raw.lastIndexOf("]");
      if(i<0||j<0)throw new Error("Lista non generata dal modello");
      setProspects(JSON.parse(raw.slice(i,j+1)).sort((a,b)=>b.score-a.score));
      setStep("list");
    } catch(e){setErr(e.message);}
    setLoading(false);
  }

  async function research(p) {
    setSelected(p);setStep("results");setLoading(true);setErr(null);
    setMats(null);setTab("intelligence");setDossier("");setParsed({});
    setLoadMsg("Research agent in esecuzione — analisi fonti reali...");
    try {
      const r=await api("research",{nome:p.nome||p,settore:p.settore||"",citta:p.citta||"",hook:p.hook||""});
      setDossier(r);setParsed(parseDossier(r));
    } catch(e){setErr(e.message);}
    setLoading(false);
  }

  async function genMats() {
    setLoading(true);setErr(null);setLoadMsg("Genero mail, deck, briefing e workflow...");
    try {
      const r=await api("generate_materials",{dossier,nomeAzienda:nome});
      setMats(r);setTab("mail");
    } catch(e){setErr(e.message);}
    setLoading(false);
  }

  function reset() {
    setStep("entry");setSector(null);setSubs([]);setFatt("20");setSeg([]);
    setProspects([]);setSelected(null);setManual("");setDossier("");setParsed({});
    setMats(null);setTab("intelligence");setErr(null);
  }

  const TABS=[
    {k:"intelligence",l:"Intelligence"},
    {k:"mail",l:"Mail (3 varianti)"},
    {k:"deck",l:"Deck"},
    {k:"briefing",l:"Briefing"},
    {k:"linkedin",l:"LinkedIn"},
    {k:"workflow",l:"Workflow"},
  ];

  return (
    <div style={q.wrap}>
      {/* HEADER */}
      <header style={{borderBottom:`1px solid ${BR}`,padding:"18px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:BG,zIndex:10}}>
        <Logo/>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {step!=="entry"&&<button onClick={reset} style={{...q.btnO(false),fontSize:12,padding:"6px 14px"}}>← Ricomincia</button>}
          <span style={{fontSize:11,color:T3,fontFamily:"monospace"}}>{V}</span>
        </div>
      </header>

      <div style={{maxWidth:760,margin:"0 auto",padding:"32px 24px"}}>
        {err&&<div style={{background:"rgba(208,2,27,0.13)",border:"1px solid rgba(208,2,27,0.35)",borderRadius:8,padding:"12px 16px",marginBottom:20,fontSize:13,color:"#ff8888"}}>⚠️ {err}</div>}

        {/* ENTRY */}
        {step==="entry"&&(
          <div>
            <h1 style={{fontSize:28,fontWeight:800,margin:"0 0 6px",letterSpacing:"-0.025em"}}>Prospect Engine</h1>
            <p style={{fontSize:14,color:T2,margin:"0 0 36px"}}>Intelligenza commerciale e materiali sales per il team Domino</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div onClick={()=>setStep("filter")} style={{...q.cardR,padding:26}}>
                <span style={{fontSize:22,display:"block",marginBottom:14}}>🔍</span>
                <p style={{fontWeight:700,fontSize:16,margin:"0 0 8px",color:T1}}>Genera lista prospect</p>
                <p style={{fontSize:13,color:T2,margin:0,lineHeight:1.6}}>Scelgo settore e filtri, l'AI costruisce una lista qualificata con scoring</p>
              </div>
              <div onClick={()=>setStep("manual")} style={{...q.card,cursor:"pointer",padding:26}}>
                <span style={{fontSize:22,display:"block",marginBottom:14}}>🎯</span>
                <p style={{fontWeight:700,fontSize:16,margin:"0 0 8px"}}>Ho un prospect</p>
                <p style={{fontSize:13,color:T2,margin:0,lineHeight:1.6}}>Inserisco il nome e genero intelligence + tutti i materiali sales</p>
              </div>
            </div>
          </div>
        )}

        {/* MANUAL */}
        {step==="manual"&&(
          <div style={q.card}>
            <span style={q.lbl}>Nome azienda prospect</span>
            <input style={{...q.inp,marginBottom:18}} type="text" value={manual} onChange={e=>setManual(e.target.value)} placeholder="es. Humanitas, NH Hotels, Mapei, Fastweb..." onKeyDown={e=>e.key==="Enter"&&manual.trim()&&research(manual.trim())} autoFocus/>
            <button onClick={()=>research(manual.trim())} disabled={!manual.trim()} style={{...q.btnP,opacity:manual.trim()?1:0.4}}>Analizza prospect →</button>
          </div>
        )}

        {/* FILTER */}
        {step==="filter"&&(
          <div style={q.card}>
            <div style={{marginBottom:24}}>
              <span style={q.lbl}>Settore target</span>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {Object.entries(SECTORS).map(([k,v])=><button key={k} onClick={()=>{setSector(k);setSubs([]);}} style={q.btnO(sector===k)}>{v.label}</button>)}
              </div>
            </div>
            {sector&&(
              <div style={{marginBottom:24}}>
                <span style={q.lbl}>Sottosettori (opzionale)</span>
                <div>{SECTORS[sector].sub.map(x=><span key={x} onClick={()=>tSub(x)} style={q.pill(subs.includes(x))}>{x}</span>)}</div>
              </div>
            )}
            <div style={{marginBottom:24}}>
              <span style={q.lbl}>Fatturato minimo</span>
              <div style={{display:"flex",gap:8}}>
                {["15","20","50","100"].map(v=><button key={v} onClick={()=>setFatt(v)} style={q.btnO(fatt===v)}>{`>${v}M€`}</button>)}
              </div>
            </div>
            <div style={{marginBottom:24}}>
              <span style={q.lbl}>Segnali di acquisto (opzionale)</span>
              <div>{SEGNALI.map(x=><span key={x} onClick={()=>tSeg(x)} style={q.pill(seg.includes(x))}>{x}</span>)}</div>
            </div>
            <button onClick={genList} disabled={!sector||loading} style={{...q.btnP,opacity:sector?1:0.4}}>Genera lista →</button>
          </div>
        )}

        {/* LIST */}
        {step==="list"&&!loading&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <p style={{fontSize:13,color:T2,margin:0}}>{prospects.length} prospect qualificati · ordine per score</p>
              <button onClick={()=>setStep("filter")} style={{...q.btnO(false),fontSize:12,padding:"6px 14px"}}>Modifica filtri</button>
            </div>
            {prospects.length===0
              ?<div style={{...q.card,textAlign:"center",color:T2,padding:40}}>Nessun prospect generato. Modifica i filtri e riprova.</div>
              :prospects.map((p,i)=>(
                <div key={i} onClick={()=>research(p)} style={{...q.card,cursor:"pointer",transition:"border-color .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=BRH}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=BR}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                        <span style={{fontWeight:700,fontSize:16}}>{p.nome}</span>
                        <Badge score={p.score}/>
                      </div>
                      <p style={{fontSize:12,color:T3,margin:"0 0 6px"}}>{p.settore} · {p.citta} · {p.fatturato_est} · {p.dipendenti_est} dip.</p>
                      <p style={{fontSize:13,color:T2,margin:"0 0 4px",lineHeight:1.5}}>{p.hook}</p>
                      {p.gap&&<p style={{fontSize:12,color:"rgba(251,146,60,0.75)",margin:0}}>Gap: {p.gap}</p>}
                    </div>
                    <span style={{color:T3,marginLeft:14,fontSize:16}}>→</span>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {loading&&<Spinner msg={loadMsg}/>}

        {/* RESULTS */}
        {step==="results"&&!loading&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:26}}>
              <div style={{width:44,height:44,background:RD,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🏢</div>
              <div>
                <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 4px",letterSpacing:"-0.02em"}}>{nome}</h2>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {selected?.score&&<Badge score={selected.score}/>}
                  {selected?.settore&&<span style={{fontSize:12,color:T3}}>{selected.settore}</span>}
                </div>
              </div>
            </div>

            {/* TABS */}
            <div style={{display:"flex",borderBottom:`1px solid ${BR}`,marginBottom:22,gap:2,overflowX:"auto"}}>
              {TABS.map(t=>(
                <button key={t.k} onClick={()=>(!mats&&t.k!=="intelligence")||setTab(t.k)}
                  style={{...q.tab(tab===t.k),opacity:(!mats&&t.k!=="intelligence")?0.3:1,cursor:(!mats&&t.k!=="intelligence")?"default":"pointer",whiteSpace:"nowrap"}}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* INTELLIGENCE */}
            {tab==="intelligence"&&dossier&&(
              <div>
                {INTEL_SECTIONS.map(({k,icon})=><SectionCard key={k} icon={icon} title={k} content={parsed[k]}/>)}
                <div style={{background:C1,border:`1px solid ${BR}`,borderRadius:12,padding:"20px 24px",marginTop:8,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
                  <div>
                    <p style={{fontWeight:600,fontSize:15,margin:"0 0 4px"}}>Genera materiali sales</p>
                    <p style={{fontSize:13,color:T2,margin:0}}>Mail (3 varianti), deck scaricabile, briefing call, sequenza LinkedIn, workflow di contatto</p>
                  </div>
                  {!mats
                    ?<button onClick={genMats} style={{...q.btnP,whiteSpace:"nowrap"}}>Genera →</button>
                    :<button onClick={()=>setTab("mail")} style={{...q.btnP,background:"#22c55e",whiteSpace:"nowrap"}}>Vedi materiali →</button>
                  }
                </div>
              </div>
            )}

            {tab==="mail"&&mats?.mail&&<MailTab mail={mats.mail}/>}
            {tab==="deck"&&mats?.deck&&<DeckTab deck={mats.deck} nome={nome}/>}
            {tab==="briefing"&&mats&&<BriefingTab b={mats}/>}
            {tab==="linkedin"&&mats?.linkedin&&<LinkedInTab linkedin={mats.linkedin}/>}
            {tab==="workflow"&&mats?.workflow&&<WorkflowTab workflow={mats.workflow} mailVarianti={mats?.mail?.varianti}/>}

            <div style={{display:"flex",gap:10,marginTop:28}}>
              <button onClick={reset} style={{...q.btnO(false),fontSize:13}}>Nuovo prospect</button>
              {prospects.length>0&&<button onClick={()=>{setStep("list");setDossier("");setParsed({});setMats(null);}} style={{...q.btnO(false),fontSize:13}}>← Lista</button>}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{borderTop:`1px solid ${BR}`,padding:"14px 32px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:7,height:7,background:RED,borderRadius:1}}/>
          <span style={{fontSize:11,color:RED,fontWeight:700,letterSpacing:"0.1em"}}>DOMINO</span>
          <span style={{fontSize:11,color:T3}}>Prospect Engine</span>
        </div>
        <span style={{fontSize:11,color:T3,fontFamily:"monospace"}}>{V}</span>
      </div>
    </div>
  );
}
