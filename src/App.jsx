import { useState, useEffect } from "react";

const VERSION = "v3.2.0";
const RED = "#D0021B";
const BG = "#1A1714";
const BG_CARD = "#242120";
const BG_CARD2 = "#2c2a28";
const BORDER = "rgba(255,255,255,0.08)";
const BORDER_H = "rgba(255,255,255,0.16)";
const TEXT = "#FFFFFF";
const TEXT2 = "rgba(255,255,255,0.55)";
const TEXT3 = "rgba(255,255,255,0.3)";
const RED_DIM = "rgba(208,2,27,0.18)";

const SECTOR_CONFIG = {
  salute: { label: "Salute & Benessere", sub: ["Ospedali/cliniche private","Pharma & parafarmaco","MedTech/dispositivi","Wellness premium","HealthTech scale-up"] },
  b2b: { label: "B2B Industriale", sub: ["Meccanica di precisione","Automazione & robotica","Chimico/materiali avanzati","Logistica & supply chain","Energia & utilities B2B"] },
  turismo: { label: "Turismo & Cultura", sub: ["Tour operator & DMC","Hospitality premium","Destinazioni & DMO","Cultura & intrattenimento","Food & wine premium"] },
};

const SCORE_C = (s) => s >= 75 ? { t: "#4ade80", b: "rgba(74,222,128,0.12)" } : s >= 55 ? { t: "#fb923c", b: "rgba(251,146,60,0.12)" } : { t: "#f87171", b: "rgba(248,113,113,0.12)" };

async function api(action, payload) {
  const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, payload }) });
  if (!res.ok) throw new Error(`Errore server ${res.status}`);
  const d = await res.json();
  return d.result;
}

function downloadDeck(deck, nome) {
  const txt = deck.map(s => `SLIDE ${s.n}: ${s.titolo}\n${"─".repeat(40)}\n${s.contenuto}\n`).join("\n");
  const blob = new Blob([`DECK — ${nome}\nDomino Prospect Engine ${VERSION}\n${"═".repeat(50)}\n\n${txt}`], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `deck_${nome.replace(/\s+/g,"_").toLowerCase()}.txt`; a.click();
  URL.revokeObjectURL(url);
}

const s = {
  wrap: { background: BG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: TEXT, padding: "0 0 60px" },
  header: { borderBottom: `1px solid ${BORDER}`, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(8px)", position: "sticky", top: 0, background: BG, zIndex: 10 },
  logo: { height: 28, objectFit: "contain" },
  logoFallback: { display: "flex", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, background: RED, borderRadius: 2 },
  brand: { fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", color: RED },
  page: { maxWidth: 720, margin: "0 auto", padding: "32px 24px" },
  card: { background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "24px", marginBottom: 16 },
  cardRed: { background: RED_DIM, border: `1px solid rgba(208,2,27,0.3)`, borderRadius: 12, padding: "24px", marginBottom: 16, cursor: "pointer" },
  label: { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: TEXT3, textTransform: "uppercase", marginBottom: 8, display: "block" },
  h1: { fontSize: 26, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em", color: TEXT },
  sub: { fontSize: 14, color: TEXT2, margin: 0 },
  input: { width: "100%", boxSizing: "border-box", background: BG_CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px 16px", color: TEXT, fontSize: 14, outline: "none" },
  btnPrimary: { background: RED, color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em" },
  btnOutline: (a) => ({ background: a ? RED_DIM : "transparent", color: a ? RED : TEXT2, border: `1px solid ${a ? "rgba(208,2,27,0.4)" : BORDER}`, borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" }),
  pill: (a) => ({ display: "inline-block", padding: "5px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", margin: "4px 4px 4px 0", border: `1px solid ${a ? "rgba(208,2,27,0.5)" : BORDER}`, background: a ? RED_DIM : BG_CARD2, color: a ? "#ff6b6b" : TEXT2, fontWeight: 500 }),
  tab: (a) => ({ padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "transparent", color: a ? RED : TEXT2, borderBottom: `2px solid ${a ? RED : "transparent"}`, letterSpacing: "0.03em" }),
};

function Spinner({ msg }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "60px 0" }}>
      <div style={{ width: 36, height: 36, border: `2px solid ${BORDER_H}`, borderTop: `2px solid ${RED}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <span style={{ fontSize: 13, color: TEXT2 }}>{msg}</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Badge({ score }) {
  const c = SCORE_C(score);
  return <span style={{ background: c.b, color: c.t, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4, letterSpacing: "0.04em" }}>{score}/100</span>;
}

function Section({ label, children }) {
  return <div style={{ marginBottom: 24 }}><span style={s.label}>{label}</span>{children}</div>;
}

function Logo() {
  const [err, setErr] = useState(false);
  return err
    ? <div style={s.logoFallback}><div style={s.dot} /><span style={s.brand}>DOMINO</span></div>
    : <img src="https://www.domino.it/hubfs/Domino-next/img/dominologo_short.png" alt="Domino" style={s.logo} onError={() => setErr(true)} />;
}

function MailTab({ mail }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(`Oggetto: ${mail.oggetto}\n\n${mail.corpo}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div>
      <div style={{ background: BG_CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "20px", marginBottom: 12 }}>
        <span style={s.label}>Oggetto</span>
        <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TEXT }}>{mail.oggetto}</p>
      </div>
      <div style={{ background: BG_CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "20px", marginBottom: 16 }}>
        <span style={s.label}>Corpo</span>
        <p style={{ fontSize: 14, lineHeight: 1.75, color: TEXT2, margin: 0, whiteSpace: "pre-wrap" }}>{mail.corpo}</p>
      </div>
      <button onClick={copy} style={{ ...s.btnOutline(false), fontSize: 13 }}>{copied ? "✓ Copiato" : "Copia email"}</button>
    </div>
  );
}

function DeckTab({ deck, nome }) {
  return (
    <div>
      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        {deck.map((sl) => (
          <div key={sl.n} style={{ background: BG_CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: RED, lineHeight: 1, minWidth: 32, letterSpacing: "-0.04em" }}>{sl.n}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px", color: TEXT }}>{sl.titolo}</p>
              <p style={{ fontSize: 13, color: TEXT2, margin: 0, lineHeight: 1.6 }}>{sl.contenuto}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => downloadDeck(deck, nome)} style={s.btnPrimary}>↓ Scarica deck (.txt)</button>
    </div>
  );
}

function LinkedInTab({ linkedin }) {
  const [copied, setCopied] = useState(null);
  const copy = (i, txt) => { navigator.clipboard.writeText(txt); setCopied(i); setTimeout(() => setCopied(null), 2000); };
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {linkedin.map((m, i) => (
        <div key={i} style={{ background: BG_CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ background: RED_DIM, color: RED, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 4 }}>Giorno {m.giorno}</span>
              <span style={{ fontSize: 12, color: TEXT3, fontWeight: 500 }}>{m.tipo}</span>
            </div>
            <button onClick={() => copy(i, m.testo)} style={{ ...s.btnOutline(false), padding: "4px 12px", fontSize: 11 }}>{copied === i ? "✓" : "Copia"}</button>
          </div>
          <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.65, margin: 0 }}>{m.testo}</p>
        </div>
      ))}
    </div>
  );
}

function WorkflowTab({ workflow }) {
  const CANALE_C = { LinkedIn: "#0077b5", Email: RED, Phone: "#22c55e" };
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: 23, top: 12, bottom: 12, width: 1, background: BORDER }} />
      {workflow.map((w, i) => (
        <div key={i} style={{ display: "flex", gap: 16, marginBottom: 20, position: "relative" }}>
          <div style={{ width: 46, height: 46, minWidth: 46, background: BG_CARD2, border: `1px solid ${BORDER}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: CANALE_C[w.canale] || TEXT2 }}>{w.giorno}</span>
          </div>
          <div style={{ background: BG_CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 16px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: CANALE_C[w.canale] || TEXT2, letterSpacing: "0.06em", textTransform: "uppercase" }}>{w.canale}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{w.azione}</span>
            </div>
            {w.note && <p style={{ fontSize: 12, color: TEXT3, margin: 0 }}>{w.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("entry");
  const [sector, setSector] = useState(null);
  const [subs, setSubs] = useState([]);
  const [fatturato, setFatturato] = useState("20");
  const [segnali, setSegnali] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [manual, setManual] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [dossier, setDossier] = useState("");
  const [materials, setMaterials] = useState(null);
  const [tab, setTab] = useState("intelligence");
  const [error, setError] = useState(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
  }, []);

  const SEGNALI_OPTS = ["Job posting ruoli digital/marketing","Sito web con 3+ anni senza update","Annuncio espansione nuovi mercati","Recente cambio CMO/CDO","PE/investor nel capitale","Presenza fiere internazionali"];
  const nome = typeof selected === "string" ? selected : selected?.nome || "";

  const toggleSub = (x) => setSubs(p => p.includes(x) ? p.filter(s => s !== x) : [...p, x]);
  const toggleSeg = (x) => setSegnali(p => p.includes(x) ? p.filter(s => s !== x) : [...p, x]);

  async function generateList() {
    if (!sector) return;
    setLoading(true); setError(null); setLoadMsg("Genero lista prospect...");
    try {
      const raw = await api("generate_list", { sectorLabel: SECTOR_CONFIG[sector].label, subsectors: subs, minFatturato: fatturato, segnali });
      const i = raw.indexOf("["), j = raw.lastIndexOf("]");
      if (i === -1 || j === -1) throw new Error("Lista non generata");
      setProspects(JSON.parse(raw.slice(i, j + 1)).sort((a, b) => b.score - a.score));
      setStep("list");
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function runResearch(p) {
    setSelected(p); setStep("results"); setLoading(true); setError(null);
    setMaterials(null); setTab("intelligence"); setDossier("");
    setLoadMsg("Research agent attivo — analisi in corso...");
    try {
      const r = await api("research", { nome: p.nome || p, settore: p.settore || "", citta: p.citta || "", hook: p.hook || "" });
      setDossier(r);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function generateMaterials() {
    setLoading(true); setError(null); setLoadMsg("Genero mail, deck e workflow...");
    try {
      const r = await api("generate_materials", { dossier, nomeAzienda: nome });
      setMaterials(r); setTab("mail");
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  function reset() {
    setStep("entry"); setSector(null); setSubs([]); setFatturato("20"); setSegnali([]);
    setProspects([]); setSelected(null); setManual(""); setDossier("");
    setMaterials(null); setTab("intelligence"); setError(null);
  }

  return (
    <div style={s.wrap}>
      <header style={s.header}>
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {step !== "entry" && <button onClick={reset} style={{ ...s.btnOutline(false), fontSize: 12, padding: "6px 14px" }}>← Ricomincia</button>}
          <span style={{ fontSize: 11, color: TEXT3, fontFamily: "monospace" }}>{VERSION}</span>
        </div>
      </header>

      <div style={s.page}>
        {error && <div style={{ background: "rgba(208,2,27,0.15)", border: "1px solid rgba(208,2,27,0.35)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#ff8080" }}>Errore: {error}</div>}

        {/* ENTRY */}
        {step === "entry" && (
          <div>
            <h1 style={{ ...s.h1, marginBottom: 8 }}>Prospect Engine</h1>
            <p style={{ ...s.sub, marginBottom: 32 }}>Intelligenza commerciale per il sales team Domino</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div onClick={() => setStep("filter")} style={{ ...s.cardRed, padding: 28 }}>
                <span style={{ fontSize: 24, display: "block", marginBottom: 14 }}>🔍</span>
                <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 8px", color: TEXT }}>Genera lista prospect</p>
                <p style={{ fontSize: 13, color: TEXT2, margin: 0, lineHeight: 1.6 }}>Scelgo settore e filtri, l'AI costruisce una lista qualificata con scoring</p>
              </div>
              <div onClick={() => setStep("manual")} style={{ ...s.card, cursor: "pointer", padding: 28 }}>
                <span style={{ fontSize: 24, display: "block", marginBottom: 14 }}>🎯</span>
                <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 8px", color: TEXT }}>Ho un prospect</p>
                <p style={{ fontSize: 13, color: TEXT2, margin: 0, lineHeight: 1.6 }}>Inserisco il nome dell'azienda e genero intelligence + materiali</p>
              </div>
            </div>
          </div>
        )}

        {/* MANUAL */}
        {step === "manual" && (
          <div style={s.card}>
            <Section label="Nome azienda prospect">
              <input style={s.input} type="text" value={manual} onChange={e => setManual(e.target.value)} placeholder="es. Humanitas, Mapei, NH Hotels..." onKeyDown={e => e.key === "Enter" && manual.trim() && runResearch(manual.trim())} />
            </Section>
            <button onClick={() => runResearch(manual.trim())} disabled={!manual.trim()} style={{ ...s.btnPrimary, opacity: manual.trim() ? 1 : 0.4 }}>Analizza prospect →</button>
          </div>
        )}

        {/* FILTER */}
        {step === "filter" && (
          <div style={s.card}>
            <Section label="Settore target">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {Object.entries(SECTOR_CONFIG).map(([k, v]) => (
                  <button key={k} onClick={() => { setSector(k); setSubs([]); }} style={s.btnOutline(sector === k)}>{v.label}</button>
                ))}
              </div>
            </Section>
            {sector && (
              <Section label="Sottosettori (opzionale)">
                <div>{SECTOR_CONFIG[sector].sub.map(x => <span key={x} onClick={() => toggleSub(x)} style={s.pill(subs.includes(x))}>{x}</span>)}</div>
              </Section>
            )}
            <Section label="Fatturato minimo">
              <div style={{ display: "flex", gap: 8 }}>
                {["15","20","50","100"].map(v => <button key={v} onClick={() => setFatturato(v)} style={s.btnOutline(fatturato === v)}>{`>${v}M€`}</button>)}
              </div>
            </Section>
            <Section label="Segnali di acquisto (opzionale)">
              <div>{SEGNALI_OPTS.map(x => <span key={x} onClick={() => toggleSeg(x)} style={s.pill(segnali.includes(x))}>{x}</span>)}</div>
            </Section>
            <button onClick={generateList} disabled={!sector || loading} style={{ ...s.btnPrimary, opacity: sector ? 1 : 0.4 }}>Genera lista →</button>
          </div>
        )}

        {/* LIST */}
        {step === "list" && !loading && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: TEXT2, margin: 0 }}>{prospects.length} prospect qualificati · ordinati per score</p>
              <button onClick={() => setStep("filter")} style={{ ...s.btnOutline(false), fontSize: 12, padding: "6px 14px" }}>Modifica filtri</button>
            </div>
            {prospects.length === 0
              ? <div style={{ ...s.card, textAlign: "center", color: TEXT2, padding: 40 }}>Nessun prospect generato. Modifica i filtri e riprova.</div>
              : prospects.map((p, i) => (
                <div key={i} onClick={() => runResearch(p)} style={{ ...s.card, cursor: "pointer", transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = BORDER_H}
                  onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{p.nome}</span>
                        <Badge score={p.score} />
                      </div>
                      <p style={{ fontSize: 12, color: TEXT3, margin: "0 0 6px" }}>{p.settore} · {p.citta} · {p.fatturato_est} · {p.dipendenti_est} dip.</p>
                      <p style={{ fontSize: 13, color: TEXT2, margin: "0 0 4px", lineHeight: 1.5 }}>{p.hook}</p>
                      {p.gap && <p style={{ fontSize: 12, color: "rgba(251,146,60,0.8)", margin: 0 }}>Gap: {p.gap}</p>}
                    </div>
                    <span style={{ color: TEXT3, fontSize: 18, marginLeft: 16 }}>→</span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* LOADING */}
        {loading && <Spinner msg={loadMsg} />}

        {/* RESULTS */}
        {step === "results" && !loading && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 42, height: 42, background: RED_DIM, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏢</div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>{nome}</h2>
                {selected?.score && <Badge score={selected.score} />}
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, marginBottom: 24, gap: 4 }}>
              {[
                { key: "intelligence", label: "Intelligence" },
                { key: "mail", label: "Mail", disabled: !materials },
                { key: "deck", label: "Deck", disabled: !materials },
                { key: "linkedin", label: "LinkedIn", disabled: !materials },
                { key: "workflow", label: "Workflow", disabled: !materials },
              ].map(t => (
                <button key={t.key} onClick={() => !t.disabled && setTab(t.key)}
                  style={{ ...s.tab(tab === t.key), opacity: t.disabled ? 0.35 : 1, cursor: t.disabled ? "default" : "pointer" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Intelligence tab */}
            {tab === "intelligence" && dossier && (
              <div>
                <div style={{ ...s.card, padding: 24 }}>
                  <div style={{ fontSize: 14, lineHeight: 1.75, color: TEXT2, whiteSpace: "pre-wrap" }}>{dossier}</div>
                </div>
                {!materials && (
                  <button onClick={generateMaterials} style={s.btnPrimary}>Genera materiali sales →</button>
                )}
                {materials && (
                  <button onClick={() => setTab("mail")} style={s.btnPrimary}>Vedi materiali →</button>
                )}
              </div>
            )}

            {/* Mail tab */}
            {tab === "mail" && materials?.mail && <MailTab mail={materials.mail} />}

            {/* Deck tab */}
            {tab === "deck" && materials?.deck && <DeckTab deck={materials.deck} nome={nome} />}

            {/* LinkedIn tab */}
            {tab === "linkedin" && materials?.linkedin && <LinkedInTab linkedin={materials.linkedin} />}

            {/* Workflow tab */}
            {tab === "workflow" && materials?.workflow && <WorkflowTab workflow={materials.workflow} />}

            {/* Bottom nav */}
            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <button onClick={reset} style={{ ...s.btnOutline(false), fontSize: 13 }}>Nuovo prospect</button>
              {prospects.length > 0 && (
                <button onClick={() => { setStep("list"); setDossier(""); setMaterials(null); }} style={{ ...s.btnOutline(false), fontSize: 13 }}>← Lista</button>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${BORDER}`, padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={s.dot} />
          <span style={{ fontSize: 11, color: RED, fontWeight: 600, letterSpacing: "0.1em" }}>DOMINO</span>
          <span style={{ fontSize: 11, color: TEXT3 }}>Prospect Engine</span>
        </div>
        <span style={{ fontSize: 11, color: TEXT3, fontFamily: "monospace" }}>{VERSION}</span>
      </div>
    </div>
  );
}
