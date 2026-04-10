import { useState } from "react";

const RED = "#D0021B";
const RED_LIGHT = "#FDF0F0";
const VERSION = "v3.1.0";

const SECTOR_CONFIG = {
  salute: {
    label: "Salute & Benessere",
    subsectors: ["Ospedali/cliniche private", "Pharma & parafarmaco", "MedTech/dispositivi", "Wellness premium", "HealthTech scale-up"],
  },
  b2b: {
    label: "B2B Industriale",
    subsectors: ["Meccanica di precisione", "Automazione & robotica", "Chimico/materiali avanzati", "Logistica & supply chain", "Energia & utilities B2B"],
  },
  turismo: {
    label: "Turismo & Cultura",
    subsectors: ["Tour operator & DMC", "Hospitality premium", "Destinazioni & DMO", "Cultura & intrattenimento", "Food & wine premium"],
  },
};

const SCORE_COLORS = (s) =>
  s >= 75 ? { text: "#0F6E56", bg: "#E1F5EE" } :
  s >= 55 ? { text: "#854F0B", bg: "#FAEEDA" } :
  { text: "#993C1D", bg: "#FAECE7" };

async function apiCall(action, payload) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.result;
}

function Badge({ score }) {
  const c = SCORE_COLORS(score);
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4 }}>
      {score}/100
    </span>
  );
}

function Spinner({ label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "48px 0" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #eee", borderTop: `3px solid ${RED}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 13, color: "#888", margin: 0 }}>{label}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "#aaa", textTransform: "uppercase", marginBottom: 8 }}>{title}</p>
      {children}
    </div>
  );
}

function Footer() {
  return (
    <div style={{ marginTop: 48, paddingTop: 16, borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, background: RED, borderRadius: 1 }} />
        <span style={{ fontSize: 11, color: RED, fontWeight: 500, letterSpacing: "0.06em" }}>DOMINO</span>
        <span style={{ fontSize: 11, color: "#888" }}>Prospect Engine</span>
      </div>
      <span style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>{VERSION}</span>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("entry");
  const [sector, setSector] = useState(null);
  const [subsectors, setSubsectors] = useState([]);
  const [minFatturato, setMinFatturato] = useState("20");
  const [segnali, setSegnali] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [manualName, setManualName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [dossier, setDossier] = useState("");
  const [materials, setMaterials] = useState(null);
  const [error, setError] = useState(null);

  const segnaliOpts = [
    "Job posting ruoli digital/marketing",
    "Sito web con 3+ anni senza update",
    "Annuncio espansione nuovi mercati",
    "Recente cambio CMO/CDO",
    "PE/investor nel capitale",
    "Presenza fiere internazionali",
  ];

  const toggleSubsector = (s) =>
    setSubsectors((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  const toggleSegnale = (s) =>
    setSegnali((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  async function generateList() {
    setLoading(true); setError(null);
    setLoadingMsg("Genero lista prospect con AI...");
    try {
      const raw = await apiCall("generate_list", {
        sector, sectorLabel: SECTOR_CONFIG[sector].label, subsectors, minFatturato, segnali,
      });
      const start = raw.indexOf("["); const end = raw.lastIndexOf("]");
      if (start === -1 || end === -1) throw new Error("Risposta non valida dal server");
      const parsed = JSON.parse(raw.slice(start, end + 1));
      setProspects(parsed.sort((a, b) => b.score - a.score));
      setStep("list");
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function activateProspect(p) {
    setSelected(p); setStep("research"); setLoading(true); setError(null);
    setLoadingMsg("Research agent attivo — analisi in corso...");
    try {
      const result = await apiCall("research", {
        nome: p.nome || p, settore: p.settore || "", citta: p.citta || "", hook: p.hook || "",
      });
      setDossier(result);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function generateMaterials() {
    setLoading(true); setError(null);
    setLoadingMsg("Generazione materiali sales...");
    try {
      const result = await apiCall("materials", { dossier });
      setMaterials(result); setStep("materials");
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  function reset() {
    setStep("entry"); setSector(null); setSubsectors([]); setMinFatturato("20");
    setSegnali([]); setProspects([]); setSelected(null); setManualName("");
    setDossier(""); setMaterials(null); setError(null);
  }

  const card = { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px 24px", marginBottom: 16 };
  const btn = (active) => ({
    padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer",
    border: active ? `1.5px solid ${RED}` : "0.5px solid var(--color-border-tertiary)",
    background: active ? RED_LIGHT : "var(--color-background-primary)",
    color: active ? RED : "var(--color-text-primary)",
  });
  const pill = (active) => ({
    display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", margin: "4px 4px 4px 0",
    border: active ? `1.5px solid ${RED}` : "0.5px solid var(--color-border-tertiary)",
    background: active ? RED_LIGHT : "var(--color-background-secondary)",
    color: active ? RED : "var(--color-text-secondary)",
  });
  const primaryBtn = { padding: "10px 24px", background: RED, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, background: RED, borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.05em", color: RED }}>DOMINO</span>
          </div>
          <p style={{ fontSize: 18, fontWeight: 500, margin: "4px 0 0" }}>Prospect Engine</p>
        </div>
        {step !== "entry" && <button onClick={reset} style={{ ...btn(false), fontSize: 12, padding: "6px 12px" }}>← Ricomincia</button>}
      </div>

      {error && (
        <div style={{ background: "#FDF0F0", border: "0.5px solid #F09595", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#993C1D" }}>
          Errore: {error}
        </div>
      )}

      {step === "entry" && (
        <div>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 28 }}>Come vuoi procedere?</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div onClick={() => setStep("filter")} style={{ ...card, cursor: "pointer", borderColor: RED, background: RED_LIGHT }}>
              <div style={{ fontSize: 22, marginBottom: 12 }}>🔍</div>
              <p style={{ fontWeight: 500, fontSize: 15, margin: "0 0 6px" }}>Genera lista prospect</p>
              <p style={{ fontSize: 13, color: "#666", margin: 0 }}>Scelgo settore e filtri, l'AI costruisce una lista qualificata con scoring</p>
            </div>
            <div onClick={() => setStep("manual")} style={{ ...card, cursor: "pointer" }}>
              <div style={{ fontSize: 22, marginBottom: 12 }}>🎯</div>
              <p style={{ fontWeight: 500, fontSize: 15, margin: "0 0 6px" }}>Ho un prospect</p>
              <p style={{ fontSize: 13, color: "#666", margin: 0 }}>Inserisco direttamente il nome dell'azienda e genero il dossier</p>
            </div>
          </div>
        </div>
      )}

      {step === "manual" && (
        <div style={card}>
          <Section title="Nome azienda prospect">
            <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)}
              placeholder="es. Humanitas, Mapei, Alpitour..."
              style={{ width: "100%", boxSizing: "border-box" }}
              onKeyDown={(e) => e.key === "Enter" && manualName.trim() && activateProspect(manualName.trim())} />
          </Section>
          <button onClick={() => activateProspect(manualName.trim())} disabled={!manualName.trim()} style={{ ...primaryBtn, opacity: manualName.trim() ? 1 : 0.5 }}>
            Analizza prospect →
          </button>
        </div>
      )}

      {step === "filter" && (
        <div style={card}>
          <Section title="Settore target">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {Object.entries(SECTOR_CONFIG).map(([k, v]) => (
                <button key={k} onClick={() => { setSector(k); setSubsectors([]); }} style={btn(sector === k)}>{v.label}</button>
              ))}
            </div>
          </Section>
          {sector && (
            <Section title="Sottosettori (opzionale)">
              <div>{SECTOR_CONFIG[sector].subsectors.map((s) => (
                <span key={s} onClick={() => toggleSubsector(s)} style={pill(subsectors.includes(s))}>{s}</span>
              ))}</div>
            </Section>
          )}
          <Section title="Fatturato minimo">
            <div style={{ display: "flex", gap: 8 }}>
              {["15", "20", "50", "100"].map((v) => (
                <button key={v} onClick={() => setMinFatturato(v)} style={btn(minFatturato === v)}>{`>${v}M€`}</button>
              ))}
            </div>
          </Section>
          <Section title="Segnali di acquisto (opzionale)">
            <div>{segnaliOpts.map((s) => (
              <span key={s} onClick={() => toggleSegnale(s)} style={pill(segnali.includes(s))}>{s}</span>
            ))}</div>
          </Section>
          <button onClick={generateList} disabled={!sector || loading} style={{ ...primaryBtn, opacity: sector ? 1 : 0.5 }}>
            Genera lista prospect →
          </button>
        </div>
      )}

      {step === "list" && !loading && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: "#666", margin: 0 }}>{prospects.length} prospect qualificati — ordine per score</p>
            <button onClick={() => setStep("filter")} style={{ ...btn(false), fontSize: 12 }}>Modifica filtri</button>
          </div>
          {prospects.map((p, i) => (
            <div key={i} style={{ ...card, cursor: "pointer" }} onClick={() => activateProspect(p)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 500, fontSize: 15 }}>{p.nome}</span>
                    <Badge score={p.score} />
                  </div>
                  <p style={{ fontSize: 12, color: "#888", margin: "0 0 4px" }}>{p.settore} · {p.citta} · {p.fatturato_est} · {p.dipendenti_est} dip.</p>
                  <p style={{ fontSize: 13, margin: "6px 0 2px" }}>{p.hook}</p>
                  {p.gap && <p style={{ fontSize: 12, color: "#993C1D", margin: 0 }}>Gap: {p.gap}</p>}
                </div>
                <span style={{ fontSize: 18, color: "#aaa", marginLeft: 12 }}>→</span>
              </div>
            </div>
          ))}
          {prospects.length === 0 && (
            <div style={{ ...card, textAlign: "center", color: "#888" }}>Nessun prospect generato. Modifica i filtri e riprova.</div>
          )}
        </div>
      )}

      {loading && <Spinner label={loadingMsg} />}

      {step === "research" && !loading && dossier && (
        <div>
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, background: RED_LIGHT, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏢</div>
              <div>
                <p style={{ fontWeight: 500, fontSize: 15, margin: 0 }}>{typeof selected === "string" ? selected : selected?.nome}</p>
                {selected?.score && <Badge score={selected.score} />}
              </div>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", borderTop: "0.5px solid #eee", paddingTop: 16 }}>{dossier}</div>
          </div>
          <button onClick={generateMaterials} style={primaryBtn}>Genera materiali sales →</button>
        </div>
      )}

      {step === "materials" && !loading && materials && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, background: "#0F6E56", borderRadius: "50%" }} />
            <span style={{ fontSize: 13, color: "#0F6E56", fontWeight: 500 }}>Materiali pronti per {typeof selected === "string" ? selected : selected?.nome}</span>
          </div>
          <div style={card}>
            <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{materials}</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={reset} style={primaryBtn}>Nuovo prospect</button>
            {prospects.length > 0 && (
              <button onClick={() => { setStep("list"); setDossier(""); setMaterials(null); }} style={btn(false)}>← Torna alla lista</button>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
