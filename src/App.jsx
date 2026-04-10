import { useState, useEffect } from "react";

const V   = "v3.7.0";
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
const AM  = "rgba(251,146,60,0.13)";
const AMB = "rgba(251,146,60,0.32)";
const GN  = "rgba(34,197,94,0.12)";
const GNB = "rgba(34,197,94,0.3)";
const BL  = "rgba(10,143,209,0.12)";
const BLB = "rgba(10,143,209,0.3)";

const SECTORS = {
  salute:  { label:"Salute & Benessere", sub:["Ospedali/cliniche private","Pharma & parafarmaco","MedTech/dispositivi","Wellness premium","HealthTech scale-up"] },
  b2b:     { label:"B2B Industriale",    sub:["Meccanica di precisione","Automazione & robotica","Chimico/materiali avanzati","Logistica & supply chain","Energia & utilities B2B"] },
  turismo: { label:"Turismo & Cultura",  sub:["Tour operator & DMC","Hospitality premium","Destinazioni & DMO","Cultura & intrattenimento","Food & wine premium"] },
};
const SEGNALI = ["Job posting ruoli digital/marketing","Sito web con 3+ anni senza update","Annuncio espansione nuovi mercati","Recente cambio CMO/CDO","PE/investor nel capitale","Presenza fiere internazionali"];
const CANAL_C = {LinkedIn:"#0a8fd1",Email:RED,Phone:"#22c55e"};
const SC = s => s>=75?{t:"#4ade80",b:"rgba(74,222,128,0.12)"}:s>=55?{t:"#fb923c",b:"rgba(251,146,60,0.12)"}:{t:"#f87171",b:"rgba(248,113,113,0.12)"};
const ARCHIVE_KEY = "domino_prospect_archive";

// ── HELPERS ──────────────────────────────────────────
async function api(action, payload) {
  const r = await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,payload})});
  if(!r.ok) throw new Error(`Errore server ${r.status}`);
  return (await r.json()).result;
}

function parseDossier(text) {
  const keys = ["PROFILO AZIENDA","DATI FINANZIARI","PERSONE CHIAVE","SEGNALI RECENTI","JOB POSTING E PRIORITÀ STRATEGICHE","PRESENZA E MATURITÀ DIGITALE","SFIDE PROBABILI","OPPORTUNITÀ PER DOMINO","CASE HISTORY CONSIGLIATI","DATI NON TROVATI","⚠️ DATI NON TROVATI"];
  const out = {};
  keys.forEach((k,i) => {
    const esc = k.replace(/[⚠️()]/g,c=>"\\"+c);
    const nextEsc = keys[i+1]?.replace(/[⚠️()]/g,c=>"\\"+c);
    const re = new RegExp(`##\\s*${esc}[^\\n]*\\n([\\s\\S]*?)(?=##\\s*${nextEsc||"$"}|$)`,"i");
    const m = text.match(re);
    out[k] = m ? m[1].trim() : null;
  });
  return out;
}

function parseBullets(text) {
  if(!text) return [];
  return text.split("\n")
    .map(l=>l.replace(/^[\s\-\*\•·▸▹►]+/,"").trim())
    .filter(l=>l.length>10);
}

async function exportPptx(deck, nome) {
  // Load PptxGenJS from CDN if not loaded
  if (!window.PptxGenJS) {
    await new Promise((res,rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const pptx = new window.PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = `${nome} — Domino Prospect Engine`;

  const DARK = "1A1714";
  const RED_H = "D0021B";
  const WHITE = "FFFFFF";
  const GRAY = "AAAAAA";

  deck.forEach((sl, idx) => {
    const slide = pptx.addSlide();
    slide.background = { color: DARK };

    // Red accent bar top
    slide.addShape(pptx.ShapeType.rect, { x:0, y:0, w:"100%", h:0.06, fill:{color:RED_H} });

    // Slide number — top right
    slide.addText(`${sl.n}`, { x:11.8, y:0.15, w:0.5, h:0.3, fontSize:11, color:RED_H, bold:true, align:"right" });

    // Title
    slide.addText(sl.titolo, {
      x:0.6, y:0.7, w:11.5, h:1.0,
      fontSize: idx===0 ? 32 : 26,
      bold:true, color:WHITE,
      fontFace:"Calibri",
      breakLine:false,
    });

    // Divider line
    slide.addShape(pptx.ShapeType.line, { x:0.6, y:1.75, w:11.0, h:0, line:{color:RED_H, width:1.5} });

    // Content — split bullets
    const bullets = sl.contenuto.split(/
|;/).map(b=>b.replace(/^[-•*\s]+/,"").trim()).filter(b=>b.length>3);
    if(bullets.length > 1) {
      bullets.forEach((b, bi) => {
        slide.addText(`${b}`, {
          x:0.6, y:2.0 + bi*0.75, w:11.0, h:0.65,
          fontSize:15, color:"DDDDDD", fontFace:"Calibri",
          bullet:{type:"number", color:RED_H},
        });
      });
    } else {
      slide.addText(sl.contenuto, {
        x:0.6, y:2.0, w:11.0, h:4.0,
        fontSize:16, color:"DDDDDD", fontFace:"Calibri",
        valign:"top", breakLine:true,
      });
    }

    // Footer
    slide.addText(`Domino Prospect Engine — ${nome}`, {
      x:0.6, y:6.9, w:10.0, h:0.25,
      fontSize:9, color:"555555", fontFace:"Calibri"
    });
    slide.addShape(pptx.ShapeType.rect, { x:0, y:7.1, w:"100%", h:0.05, fill:{color:RED_H} });
  });

  pptx.writeFile({ fileName: `deck_${nome.replace(/\s+/g,"_").toLowerCase()}.pptx` });
}

function loadArchive() {
  try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY)||"[]"); }
  catch { return []; }
}
function saveToArchive(entry) {
  const arr = loadArchive();
  const exists = arr.findIndex(e=>e.id===entry.id);
  if(exists>=0) arr[exists]=entry; else arr.unshift(entry);
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(arr.slice(0,50)));
}
function removeFromArchive(id) {
  const arr = loadArchive().filter(e=>e.id!==id);
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(arr));
}

// ── SHARED STYLES ─────────────────────────────────────
const q = {
  card: {background:C1,border:`1px solid ${BR}`,borderRadius:12,padding:"20px 22px",marginBottom:14},
  cardR:{background:RD,border:`1px solid ${RDB}`,borderRadius:12,padding:"22px 24px",marginBottom:14,cursor:"pointer"},
  lbl:  {fontSize:10,fontWeight:700,letterSpacing:"0.13em",color:T3,textTransform:"uppercase",display:"block",marginBottom:8},
  inp:  {width:"100%",boxSizing:"border-box",background:C2,border:`1px solid ${BR}`,borderRadius:8,padding:"12px 16px",color:T1,fontSize:14,outline:"none",fontFamily:"inherit"},
  btnP: {background:RED,color:"#fff",border:"none",borderRadius:8,padding:"11px 28px",fontSize:14,fontWeight:600,cursor:"pointer"},
  btnO: a=>({background:a?RD:"transparent",color:a?RED:T2,border:`1px solid ${a?RDB:BR}`,borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:500,cursor:"pointer"}),
  pill: a=>({display:"inline-block",padding:"5px 13px",borderRadius:20,fontSize:12,cursor:"pointer",margin:"3px 4px 3px 0",border:`1px solid ${a?RDB:BR}`,background:a?RD:C2,color:a?"#ff7070":T2,fontWeight:500}),
  tab:  a=>({padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",border:"none",background:"transparent",color:a?RED:T2,borderBottom:`2px solid ${a?RED:"transparent"}`}),
};

// ── BASE COMPONENTS ───────────────────────────────────
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

// ── INTELLIGENCE PAGE ─────────────────────────────────
function IntelligencePage({parsed, onGenerateMats, mats, onViewMats}) {
  const sfide   = parseBullets(parsed["SFIDE PROBABILI"]).slice(0,3);
  const opps    = parseBullets(parsed["OPPORTUNITA PER DOMINO"]||parsed["OPPORTUNITÀ PER DOMINO"]).slice(0,3);
  const jobs    = parseBullets(parsed["JOB POSTING E PRIORITA STRATEGICHE"]||parsed["JOB POSTING E PRIORITÀ STRATEGICHE"]).slice(0,3);
  const segnali = parseBullets(parsed["SEGNALI RECENTI"]).slice(0,3);
  const persone = parseBullets(parsed["PERSONE CHIAVE"]);
  const missing = parsed["DATI NON TROVATI"]||parsed["⚠️ DATI NON TROVATI"];
  const caseHist= parsed["CASE HISTORY CONSIGLIATI"];

  return (
    <div>
      {parsed["PROFILO AZIENDA"]&&(()=>{
        const raw=parsed["PROFILO AZIENDA"]||"";
        const get=(key)=>{const m=raw.match(new RegExp(key+":\\s*([^\\n]+)","i"));return m?m[1].trim():null;};
        const descrizione=get("DESCRIZIONE");
        const fatturato=get("FATTURATO");
        const dipendenti=get("DIPENDENTI");
        const internaz=get("INTERNAZIONALIZZAZIONE");
        const strategia=get("STRATEGIA");
        const hasStructured=descrizione||fatturato||dipendenti||internaz||strategia;
        return hasStructured?(
          <div style={{background:C1,border:`1px solid ${BR}`,borderRadius:12,padding:"20px 22px",marginBottom:14}}>
            <span style={q.lbl}>Scheda azienda</span>
            {descrizione&&<p style={{fontSize:14,lineHeight:1.75,color:T2,margin:"0 0 16px",whiteSpace:"pre-wrap"}}>{descrizione}</p>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {fatturato&&<div style={{background:C2,borderRadius:8,padding:"10px 14px"}}><span style={{...q.lbl,marginBottom:4}}>Fatturato</span><p style={{fontSize:14,fontWeight:600,color:T1,margin:0}}>{fatturato}</p></div>}
              {dipendenti&&<div style={{background:C2,borderRadius:8,padding:"10px 14px"}}><span style={{...q.lbl,marginBottom:4}}>Dipendenti</span><p style={{fontSize:14,fontWeight:600,color:T1,margin:0}}>{dipendenti}</p></div>}
              {internaz&&<div style={{background:C2,borderRadius:8,padding:"10px 14px",gridColumn:internaz.length>40?"1/-1":"auto"}}><span style={{...q.lbl,marginBottom:4}}>Presenza internazionale</span><p style={{fontSize:13,color:T2,margin:0}}>{internaz}</p></div>}
              {strategia&&<div style={{background:C2,borderRadius:8,padding:"10px 14px",gridColumn:"1/-1"}}><span style={{...q.lbl,marginBottom:4}}>Strategia attuale</span><p style={{fontSize:13,color:T2,margin:0,lineHeight:1.6}}>{strategia}</p></div>}
            </div>
          </div>
        ):(
          <div style={{background:C1,border:`1px solid ${BR}`,borderRadius:12,padding:"20px 22px",marginBottom:14}}>
            <span style={q.lbl}>Profilo azienda</span>
            <p style={{fontSize:14,lineHeight:1.78,color:T2,margin:0,whiteSpace:"pre-wrap"}}>{raw}</p>
          </div>
        );
      })()}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div style={{background:C1,border:`1px solid ${BR}`,borderRadius:12,padding:"18px 20px"}}>
          <span style={q.lbl}>📊 Dati finanziari</span>
          {parsed["DATI FINANZIARI"]
            ?<p style={{fontSize:13,color:T2,lineHeight:1.7,margin:0,whiteSpace:"pre-wrap"}}>{parsed["DATI FINANZIARI"]}</p>
            :<p style={{fontSize:12,color:T3,margin:0,fontStyle:"italic"}}>⚠️ Non trovato</p>}
        </div>
        <div style={{background:C1,border:`1px solid ${BR}`,borderRadius:12,padding:"18px 20px"}}>
          <span style={q.lbl}>👤 Persone chiave</span>
          {persone.length>0
            ?persone.map((p,i)=>{
                const initials=(p.split(/[—\-,]/)[0]||"?").trim().split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
                return(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:i<persone.length-1?10:0}}>
                  <div style={{width:28,height:28,minWidth:28,background:BL,border:`1px solid ${BLB}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#60b3f0",marginTop:2}}>{initials||"?"}</div>
                  <p style={{fontSize:12,color:T2,margin:0,lineHeight:1.5,paddingTop:6}}>{p}</p>
                </div>);
              })
            :<p style={{fontSize:12,color:T3,margin:0,fontStyle:"italic"}}>⚠️ Non trovato</p>}
        </div>
      </div>
      {segnali.length>0&&(
        <div style={{background:C1,border:`1px solid ${BR}`,borderRadius:12,padding:"18px 20px",marginBottom:14}}>
          <span style={q.lbl}>📡 Segnali recenti</span>
          {segnali.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:i<segnali.length-1?10:0}}>
              <div style={{width:6,height:6,minWidth:6,background:RED,borderRadius:"50%",marginTop:6}}/>
              <p style={{fontSize:13,color:T2,margin:0,lineHeight:1.6}}>{s}</p>
            </div>
          ))}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div style={{background:C1,border:`1px solid ${BR}`,borderRadius:12,padding:"18px 20px"}}>
          <span style={q.lbl}>🎯 Job posting attivi</span>
          {jobs.length>0
            ?<div>{jobs.map((j,i)=>(
                <span key={i} style={{display:"inline-block",background:BL,border:`1px solid ${BLB}`,borderRadius:4,padding:"4px 10px",fontSize:11,color:"#60b3f0",fontWeight:500,margin:"3px 4px 3px 0"}}>{j.length>55?j.slice(0,55)+"...":j}</span>
              ))}</div>
            :<p style={{fontSize:12,color:T3,margin:0,fontStyle:"italic"}}>⚠️ Non trovato</p>}
        </div>
        <div style={{background:C1,border:`1px solid ${BR}`,borderRadius:12,padding:"18px 20px"}}>
          <span style={q.lbl}>💻 Maturità digitale</span>
          {(parsed["PRESENZA E MATURITA DIGITALE"]||parsed["PRESENZA E MATURITÀ DIGITALE"])
            ?<p style={{fontSize:13,color:T2,lineHeight:1.7,margin:0,whiteSpace:"pre-wrap"}}>{parsed["PRESENZA E MATURITA DIGITALE"]||parsed["PRESENZA E MATURITÀ DIGITALE"]}</p>
            :<p style={{fontSize:12,color:T3,margin:0,fontStyle:"italic"}}>⚠️ Non trovato</p>}
        </div>
      </div>
      {sfide.length>0&&(
        <div style={{marginBottom:14}}>
          <span style={{...q.lbl,color:"rgba(251,146,60,0.7)"}}>⚡ Sfide probabili</span>
          <div style={{display:"grid",gap:8}}>
            {sfide.map((s,i)=>(
              <div key={i} style={{background:AM,border:`1px solid ${AMB}`,borderRadius:8,padding:"12px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
                <span style={{background:"rgba(251,146,60,0.2)",color:"rgba(251,146,60,0.9)",fontWeight:700,fontSize:12,borderRadius:4,padding:"2px 8px",flexShrink:0,marginTop:1}}>{i+1}</span>
                <p style={{fontSize:13,color:T1,margin:0,lineHeight:1.65}}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {opps.length>0&&(
        <div style={{marginBottom:14}}>
          <span style={{...q.lbl,color:"rgba(74,222,128,0.75)"}}>🚀 Opportunità per Domino</span>
          <div style={{display:"grid",gap:8}}>
            {opps.map((o,i)=>(
              <div key={i} style={{background:GN,border:`1px solid ${GNB}`,borderRadius:8,padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{width:22,height:22,minWidth:22,background:"rgba(34,197,94,0.22)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                  <span style={{color:"#4ade80",fontWeight:700,fontSize:11}}>✓</span>
                </div>
                <p style={{fontSize:13,color:T1,margin:0,lineHeight:1.65}}>{o}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {caseHist&&(
        <div style={{marginBottom:14}}>
          <span style={{...q.lbl,color:"rgba(10,143,209,0.75)"}}>📚 Case history consigliati</span>
          <div style={{display:"grid",gap:8}}>
            {parseBullets(caseHist).slice(0,2).map((ch,i)=>{
              const isS=i===0;
              return(
                <div key={i} style={{background:isS?BL:"rgba(139,92,246,0.1)",border:`1px solid ${isS?BLB:"rgba(139,92,246,0.28)"}`,borderRadius:8,padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
                  <span style={{background:isS?BL:"rgba(139,92,246,0.15)",color:isS?"#60b3f0":"rgba(167,139,250,0.9)",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:4,whiteSpace:"nowrap",flexShrink:0,marginTop:2,border:`1px solid ${isS?BLB:"rgba(139,92,246,0.3)"}`}}>{isS?"Settore":"Complessità"}</span>
                  <p style={{fontSize:13,color:T1,margin:0,lineHeight:1.65}}>{ch.replace(/^\[(SETTORE|COMPLESSIT[A-Z]+)\]:\s*/i,"").trim()}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {missing&&missing.length>10&&<MissingData text={missing}/>}
      <div style={{background:C1,border:`1px solid ${BR}`,borderRadius:12,padding:"20px 22px",marginTop:8,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
        <div>
          <p style={{fontWeight:600,fontSize:15,margin:"0 0 4px"}}>Genera materiali sales</p>
          <p style={{fontSize:13,color:T2,margin:0}}>Mail x 3 varianti - Deck scaricabile - Briefing call - LinkedIn - Workflow</p>
        </div>
        {!mats
          ?<button onClick={onGenerateMats} style={{...q.btnP,whiteSpace:"nowrap"}}>Genera</button>
          :<button onClick={onViewMats} style={{...q.btnP,background:"#22c55e",whiteSpace:"nowrap"}}>Vedi materiali</button>
        }
      </div>
    </div>
  );
}

function MissingData({text}) {
  const [open,setOpen]=useState(false);
  return (
    <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${BR}`,borderRadius:8,overflow:"hidden",marginBottom:14}}>
      <div onClick={()=>setOpen(o=>!o)} style={{padding:"10px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,color:T3,fontWeight:600}}>Dati non trovati</span>
        <span style={{fontSize:11,color:T3}}>{open?"v":">"}</span>
      </div>
      {open&&<div style={{padding:"0 16px 12px",borderTop:`1px solid ${BR}`,paddingTop:12}}>
        <p style={{fontSize:12,color:T3,margin:0,lineHeight:1.65,whiteSpace:"pre-wrap"}}>{text}</p>
      </div>}
    </div>
  );
}

// ── MAIL TAB ──────────────────────────────────────────
function MailTab({mail, parsedPersone}) {
  const [active,setActive]=useState(0);
  const [cp,setCp]=useState(false);
  const [targetName,setTargetName]=useState("");
  const persone = parseBullets(parsedPersone||"");
  const v=mail.varianti[active];

  function applyName(text) {
    if(!targetName) return text;
    const fn = targetName.split(/[,\-—]/)[0].trim().split(" ")[0];
    // Replace generic salutations and decisore references
    return text
      .replace(/Gentile\s+\w+/gi, `Gentile ${fn}`)
      .replace(/\b(il\/la\s+)?(decisore|responsabile marketing|responsabile digital|direttore|direttrice|cmo|cdo|ceo|cto)\b/gi, fn)
      .replace(/\bVoi\b/g, "Voi")
      .replace(/^(Buongiorno|Salve|Ciao),?\s*/i, `Buongiorno ${fn},\n\n`);
  }

  const bodyText = applyName(v.corpo);
  const copy=()=>{navigator.clipboard.writeText(`Oggetto: ${v.oggetto}\n\n${bodyText}`);setCp(true);setTimeout(()=>setCp(false),2000);};

  return (
    <div>
      {/* Variant selector */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {mail.varianti.map((vv,i)=>(
          <button key={i} onClick={()=>{setActive(i);setCp(false);}} style={{...q.btnO(active===i),fontSize:12,padding:"6px 14px"}}>{vv.tipo}</button>
        ))}
      </div>

      {/* Person selector */}
      {persone.length>0&&(
        <div style={{background:C1,border:`1px solid ${BR}`,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
          <span style={q.lbl}>Personalizza per</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:targetName?"8px":"0"}}>
            {persone.map((p,i)=>{
              const name=(p.split(/[—\-,]/)[0]||"").trim();
              return <span key={i} onClick={()=>setTargetName(targetName===name?"":name)} style={q.pill(targetName===name)}>{name}</span>;
            })}
          </div>
          {targetName&&<p style={{fontSize:11,color:"#60b3f0",margin:"6px 0 0"}}>Mail personalizzata per {targetName}</p>}
        </div>
      )}

      <div style={{background:C2,border:`1px solid ${BR}`,borderRadius:8,padding:"16px 20px",marginBottom:10}}>
        <span style={q.lbl}>Oggetto</span>
        <p style={{fontSize:15,fontWeight:600,margin:0,color:T1}}>{v.oggetto}</p>
      </div>
      <div style={{background:C2,border:`1px solid ${BR}`,borderRadius:8,padding:"16px 20px",marginBottom:14}}>
        <span style={q.lbl}>Corpo</span>
        <p style={{fontSize:14,lineHeight:1.85,color:T2,margin:0,whiteSpace:"pre-wrap"}}>{bodyText}</p>
      </div>
      <button onClick={copy} style={q.btnO(false)}>{cp?"✓ Copiata":"Copia email"}</button>
    </div>
  );
}

// ── DECK TAB ──────────────────────────────────────────
function DeckTab({deck,nome}) {
  const [exporting,setExporting]=useState(false);
  const doExport=async()=>{setExporting(true);try{await exportPptx(deck,nome);}catch(e){alert("Errore export: "+e.message);}setExporting(false);};
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
      <button onClick={doExport} disabled={exporting} style={{...q.btnP,opacity:exporting?0.6:1}}>
        {exporting?"Generazione in corso...":"↓ Esporta deck (.pptx)"}
      </button>
    </div>
  );
}

// ── BRIEFING TAB ─────────────────────────────────────
function BriefingTab({b}) {
  const row=(label,val,accent)=>{
    if(!val) return null;
    const c = accent==="green"?{bg:GN,br:GNB}:accent==="amber"?{bg:AM,br:AMB}:{bg:C2,br:BR};
    return (
      <div style={{background:c.bg,border:`1px solid ${c.br}`,borderRadius:8,padding:"14px 16px",marginBottom:10}}>
        <span style={q.lbl}>{label}</span>
        <p style={{fontSize:13,color:T2,margin:0,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{val}</p>
      </div>
    );
  };
  return (
    <div>
      {row("Tono rilevato",b.tono)}
      {row("Hook principale",b.hook_principale||b.angolo_di_attacco,"green")}
      {row("Decisore target",b.decisore)}
      {row("Problema principale",b.problema_principale,"amber")}
      <div style={{background:C2,border:`1px solid ${BR}`,borderRadius:8,padding:"14px 16px",marginBottom:10}}>
        <span style={q.lbl}>3 domande aperte per la call</span>
        {(b["3_domande_aperte"]||[]).map((d,i)=>(
          <div key={i} style={{display:"flex",gap:10,marginBottom:8}}>
            <span style={{color:RED,fontWeight:700,fontSize:13,minWidth:16}}>{i+1}.</span>
            <p style={{fontSize:13,color:T2,margin:0,lineHeight:1.6}}>{d}</p>
          </div>
        ))}
      </div>
      <div style={{background:C2,border:`1px solid ${BR}`,borderRadius:8,padding:"14px 16px",marginBottom:10}}>
        <span style={q.lbl}>Obiezioni probabili + risposta</span>
        {(b.obiezioni_probabili||[]).map((o,i)=>(
          <p key={i} style={{fontSize:13,color:T2,margin:"0 0 8px",lineHeight:1.6}}>• {o}</p>
        ))}
      </div>
      {row("Case study da citare",b.case_study_da_citare,"green")}
      {b.red_flags && row("⚠️ Red flags",b.red_flags,"amber")}
    </div>
  );
}

// ── LINKEDIN TAB ──────────────────────────────────────
function LinkedInTab({linkedin, parsedPersone}) {
  const [cp,setCp]=useState(null);
  const [targetName,setTargetName]=useState("");
  const persone = parseBullets(parsedPersone||"");

  function applyName(msg) {
    if(!targetName) return msg;
    const fn = targetName.split(/[,\-—]/)[0].trim().split(" ")[0];
    return msg.replace(/\b(decisore|il\/la responsabile|il responsabile|il direttore|la direttrice|il ceo|il cmo|il cdo|il manager)\b/gi, fn);
  }

  return (
    <div>
      {persone.length>0&&(
        <div style={{background:C1,border:`1px solid ${BR}`,borderRadius:10,padding:"16px 18px",marginBottom:18}}>
          <span style={q.lbl}>Seleziona il destinatario</span>
          <p style={{fontSize:12,color:T3,margin:"0 0 10px"}}>Scegli dalla lista o scrivi il nome per personalizzare i messaggi</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
            {persone.map((p,i)=>{
              const name=(p.split(/[—\-,]/)[0]||"").trim();
              return <span key={i} onClick={()=>setTargetName(targetName===name?"":name)} style={q.pill(targetName===name)}>{name}</span>;
            })}
          </div>
          <input style={{...q.inp,fontSize:12}} type="text" value={targetName} onChange={e=>setTargetName(e.target.value)} placeholder="oppure scrivi nome e cognome..." />
        </div>
      )}
      <div style={{display:"grid",gap:12}}>
        {linkedin.map((m,i)=>{
          const txt=applyName(m.testo);
          return(
            <div key={i} style={{background:C2,border:`1px solid ${BR}`,borderRadius:8,padding:"16px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{background:RD,color:RED,fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:4}}>Giorno {m.giorno}</span>
                  <span style={{fontSize:12,color:T3}}>{m.tipo}</span>
                  {targetName&&<span style={{fontSize:11,color:"#60b3f0",background:BL,border:`1px solid ${BLB}`,borderRadius:4,padding:"1px 7px"}}>a {targetName.split(" ")[0]}</span>}
                </div>
                <button onClick={()=>{navigator.clipboard.writeText(txt);setCp(i);setTimeout(()=>setCp(null),2000);}} style={{...q.btnO(false),padding:"4px 12px",fontSize:11}}>{cp===i?"✓":"Copia"}</button>
              </div>
              <p style={{fontSize:13,color:T2,lineHeight:1.68,margin:0}}>{txt}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── WORKFLOW TAB ──────────────────────────────────────
function WorkflowTab({workflow}) {
  return (
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
            {w.note && <p style={{fontSize:12,color:T3,margin:0}}>{w.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ARCHIVE VIEW ──────────────────────────────────────
function ArchiveView({onRestore}) {
  const [entries,setEntries]=useState(loadArchive());
  const remove=(id)=>{removeFromArchive(id);setEntries(loadArchive());};
  if(entries.length===0) return (
    <div style={{textAlign:"center",padding:"60px 0"}}>
      <p style={{fontSize:32,marginBottom:16}}>📂</p>
      <p style={{fontSize:14,color:T2}}>Nessun prospect archiviato.</p>
      <p style={{fontSize:13,color:T3}}>Usa "Salva in archivio" dopo aver analizzato un prospect.</p>
    </div>
  );
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <p style={{fontSize:13,color:T2,margin:0}}>{entries.length} prospect archiviati</p>
      </div>
      {entries.map(e=>(
        <div key={e.id} style={{...q.card,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
          <div style={{flex:1,cursor:"pointer"}} onClick={()=>onRestore(e)}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <span style={{fontWeight:700,fontSize:16}}>{e.nome}</span>
              {e.score && <Badge score={e.score}/>}
              {e.mats && <span style={{background:GN,color:"#4ade80",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4}}>COMPLETO</span>}
            </div>
            <p style={{fontSize:12,color:T3,margin:0}}>{e.settore||""}{e.settore&&e.data?" · ":""}{e.data}</p>
          </div>
          <button onClick={()=>remove(e.id)} style={{...q.btnO(false),fontSize:12,padding:"5px 12px",color:"rgba(255,100,100,0.6)",borderColor:"rgba(255,100,100,0.2)"}}>Elimina</button>
        </div>
      ))}
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
  const [saved,setSaved]=useState(false);
  const [ruoloContatto,setRuoloContatto]=useState("");
  const [noteAggiuntive,setNoteAggiuntive]=useState("");

  useEffect(()=>{
    const l=document.createElement("link");
    l.rel="stylesheet";
    l.href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap";
    document.head.appendChild(l);
  },[]);

  const nome=typeof selected==="string"?selected:selected?.nome||"";
  const tSub=x=>setSubs(p=>p.includes(x)?p.filter(s=>s!==x):[...p,x]);
  const tSeg=x=>setSeg(p=>p.includes(x)?p.filter(s=>s!==x):[...p,x]);

  function doSave() {
    const id = `${nome}_${Date.now()}`.replace(/\s+/g,"_");
    saveToArchive({
      id,
      nome,
      score: selected?.score,
      settore: selected?.settore||"",
      data: new Date().toLocaleDateString("it-IT"),
      dossier,
      parsed,
      mats,
    });
    setSaved(true);
  }

  function restoreEntry(e) {
    setSelected({nome:e.nome,score:e.score,settore:e.settore});
    setDossier(e.dossier||"");
    setParsed(e.parsed||{});
    setMats(e.mats||null);
    setTab("intelligence");
    setStep("results");
    setSaved(true);
  }

  async function genList() {
    if(!sector)return;
    setLoading(true);setErr(null);setLoadMsg("Genero lista prospect con AI...");
    try {
      const raw=await api("generate_list",{sectorLabel:SECTORS[sector].label,subsectors:subs,minFatturato:fatt,segnali:seg});
      const i=raw.indexOf("["),j=raw.lastIndexOf("]");
      if(i<0||j<0) throw new Error("Lista non generata");
      setProspects(JSON.parse(raw.slice(i,j+1)).sort((a,b)=>b.score-a.score));
      setStep("list");
    } catch(e){setErr(e.message);}
    setLoading(false);
  }

  async function research(p) {
    const pObj = typeof p==="string" ? {nome:p} : p;
    setSelected(pObj);setStep("results");setLoading(true);setErr(null);
    setMats(null);setTab("intelligence");setDossier("");setParsed({});setSaved(false);
    setLoadMsg("Research agent — analisi fonti reali in corso...");
    try {
      const r=await api("research",{nome:pObj.nome||pObj,settore:pObj.settore||"",citta:pObj.citta||"",hook:pObj.hook||"",ruoloContatto:pObj.ruoloContatto||ruoloContatto||"",noteAggiuntive:pObj.noteAggiuntive||noteAggiuntive||""});
      setDossier(r);setParsed(parseDossier(r));
    } catch(e){setErr(e.message);}
    setLoading(false);
  }

  async function genMats() {
    setLoading(true);setErr(null);setLoadMsg("Genero mail, deck, briefing e workflow...");
    try {
      const r=await api("generate_materials",{dossier,nomeAzienda:nome});
      setMats(r);setTab("mail");setSaved(false);
    } catch(e){setErr(e.message);}
    setLoading(false);
  }

  function reset() {
    setStep("entry");setSector(null);setSubs([]);setFatt("20");setSeg([]);
    setProspects([]);setSelected(null);setManual("");setDossier("");setParsed({});
    setMats(null);setTab("intelligence");setErr(null);setSaved(false);
    setRuoloContatto("");setNoteAggiuntive("");
  }

  const archiveCount = loadArchive().length;
  const TABS=[
    {k:"intelligence",l:"Intelligence"},
    {k:"mail",l:"Mail × 3"},
    {k:"deck",l:"Deck"},
    {k:"briefing",l:"Briefing"},
    {k:"linkedin",l:"LinkedIn"},
    {k:"workflow",l:"Workflow"},
  ];

  return (
    <div style={{background:BG,minHeight:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",color:T1,paddingBottom:60}}>

      {/* HEADER */}
      <header style={{borderBottom:`1px solid ${BR}`,padding:"18px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:BG,zIndex:10}}>
        <Logo/>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setStep("archive")} style={{...q.btnO(step==="archive"),fontSize:12,padding:"6px 14px",position:"relative"}}>
            Archivio {archiveCount>0&&<span style={{marginLeft:4,background:RED,color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{archiveCount}</span>}
          </button>
          {step!=="entry"&&step!=="archive"&&<button onClick={reset} style={{...q.btnO(false),fontSize:12,padding:"6px 14px"}}>← Home</button>}
          <span style={{fontSize:11,color:T3,fontFamily:"monospace"}}>{V}</span>
        </div>
      </header>

      <div style={{maxWidth:760,margin:"0 auto",padding:"32px 24px"}}>
        {err&&<div style={{background:"rgba(208,2,27,0.13)",border:"1px solid rgba(208,2,27,0.35)",borderRadius:8,padding:"12px 16px",marginBottom:20,fontSize:13,color:"#ff8888"}}>⚠️ {err}</div>}

        {/* ARCHIVE */}
        {step==="archive"&&(
          <div>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 6px",letterSpacing:"-0.02em"}}>Archivio prospect</h2>
            <p style={{fontSize:13,color:T2,margin:"0 0 28px"}}>Prospect salvati — clicca per ripristinare</p>
            <ArchiveView onRestore={restoreEntry}/>
            <button onClick={reset} style={{...q.btnO(false),marginTop:16,fontSize:13}}>← Torna alla home</button>
          </div>
        )}

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
            <div style={{marginBottom:18}}>
              <span style={q.lbl}>Nome azienda prospect</span>
              <input style={q.inp} type="text" value={manual} onChange={e=>setManual(e.target.value)} placeholder="es. Humanitas, NH Hotels, Mapei, Fastweb..." onKeyDown={e=>e.key==="Enter"&&manual.trim()&&research({nome:manual.trim(),ruoloContatto,noteAggiuntive})} autoFocus/>
            </div>
            <div style={{marginBottom:18}}>
              <span style={q.lbl}>Ruolo del contatto interno (opzionale)</span>
              <p style={{fontSize:12,color:T3,margin:"0 0 8px"}}>Indica il tipo di interlocutore che già conosci o vuoi raggiungere</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                {["Marketing Director","Digital Marketing","CMO","CPO","CEO","CTO","IT Director","Sales Director","Comunicazione","HR / Internal Comm","Nessun contatto"].map(r=>(
                  <span key={r} onClick={()=>setRuoloContatto(ruoloContatto===r?"":r)} style={q.pill(ruoloContatto===r)}>{r}</span>
                ))}
              </div>
              <input style={q.inp} type="text" value={ruoloContatto} onChange={e=>setRuoloContatto(e.target.value)} placeholder="oppure scrivi liberamente il ruolo..." />
            </div>
            <div style={{marginBottom:20}}>
              <span style={q.lbl}>Contesto aggiuntivo (opzionale)</span>
              <textarea style={{...q.inp,resize:"vertical",minHeight:72,lineHeight:1.6}} value={noteAggiuntive} onChange={e=>setNoteAggiuntive(e.target.value)} placeholder="es. Hanno appena lanciato un nuovo prodotto, stanno aprendo in Francia, siamo già in contatto con il loro CTO..."/>
            </div>
            <button onClick={()=>research({nome:manual.trim(),ruoloContatto,noteAggiuntive})} disabled={!manual.trim()} style={{...q.btnP,opacity:manual.trim()?1:0.4}}>Analizza prospect →</button>
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
              ?<div style={{...q.card,textAlign:"center",color:T2,padding:40}}>Nessun prospect. Modifica i filtri e riprova.</div>
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
            {/* Prospect header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:44,height:44,background:RD,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🏢</div>
                <div>
                  <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 4px",letterSpacing:"-0.02em"}}>{nome}</h2>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    {selected?.score&&<Badge score={selected.score}/>}
                    {selected?.settore&&<span style={{fontSize:12,color:T3}}>{selected.settore}</span>}
                  </div>
                </div>
              </div>
              <button onClick={doSave} style={{...q.btnO(saved),fontSize:12,padding:"6px 14px"}}>
                {saved?"✓ Salvato":"Salva in archivio"}
              </button>
            </div>

            {/* Tab bar */}
            <div style={{display:"flex",borderBottom:`1px solid ${BR}`,marginBottom:22,gap:2,overflowX:"auto"}}>
              {TABS.map(t=>(
                <button key={t.k}
                  onClick={()=>(!mats&&t.k!=="intelligence")||setTab(t.k)}
                  style={{...q.tab(tab===t.k),opacity:(!mats&&t.k!=="intelligence")?0.3:1,cursor:(!mats&&t.k!=="intelligence")?"default":"pointer",whiteSpace:"nowrap"}}>
                  {t.l}
                </button>
              ))}
            </div>

            {tab==="intelligence"&&dossier&&<IntelligencePage parsed={parsed} onGenerateMats={genMats} mats={mats} onViewMats={()=>setTab("mail")}/>}
            {tab==="mail"&&mats?.mail&&<MailTab mail={mats.mail} parsedPersone={parsed["PERSONE CHIAVE"]}/>}
            {tab==="deck"&&mats?.deck&&<DeckTab deck={mats.deck} nome={nome}/>}
            {tab==="briefing"&&mats&&<BriefingTab b={mats}/>}
            {tab==="linkedin"&&mats?.linkedin&&<LinkedInTab linkedin={mats.linkedin} parsedPersone={parsed["PERSONE CHIAVE"]}/>}
            {tab==="workflow"&&mats?.workflow&&<WorkflowTab workflow={mats.workflow}/>}

            <div style={{display:"flex",gap:10,marginTop:28}}>
              <button onClick={reset} style={{...q.btnO(false),fontSize:13}}>← Home</button>
              {prospects.length>0&&<button onClick={()=>{setStep("list");setDossier("");setParsed({});setMats(null);setSaved(false);}} style={{...q.btnO(false),fontSize:13}}>Lista prospect</button>}
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
