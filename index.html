import { useState } from "react";

// ─── UI Components ────────────────────────────────────────────

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      padding: "9px 18px", background: active ? "#E8272A" : "white",
      color: active ? "white" : "#555", border: `1px solid ${active ? "#E8272A" : "#ddd"}`,
      borderRadius: "8px", cursor: "pointer", fontSize: "13px",
      fontWeight: active ? "700" : "400", display: "flex", alignItems: "center", gap: "6px",
      fontFamily: "inherit", transition: "all 0.15s",
    }}>{icon} {label}</button>
  );
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); }}
      style={{ padding: "6px 14px", background: done ? "#16a34a" : "#f3f4f6", color: done ? "white" : "#444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600", fontFamily: "inherit" }}>
      {done ? "✓ Copiato" : "Copia"}
    </button>
  );
}

function ToolBadge({ type }) {
  const cfg = {
    sprint: { bg: "#fff7ed", fg: "#c2410c", border: "#fed7aa", icon: "⚡", label: "Design Sprint!" },
    pe:     { bg: "#f0fdf4", fg: "#15803d", border: "#bbf7d0", icon: "✨", label: "Preventivo Emozionale" },
  };
  const c = cfg[type];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: c.bg, color: c.fg, border: `1px solid ${c.border}`, padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>
      {c.icon} {c.label}
    </span>
  );
}

function DigitalBadge({ level }) {
  const map = { "Bassa": ["#fef2f2", "#dc2626"], "Media": ["#fffbeb", "#d97706"], "Alta": ["#f0fdf4", "#16a34a"] };
  const key = Object.keys(map).find(k => level?.startsWith(k)) || "Media";
  return <span style={{ background: map[key][0], color: map[key][1], padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>{level}</span>;
}

function SlideCard({ n, titolo, contenuto }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden", marginBottom: "10px" }}>
      <div style={{ background: "#111", padding: "11px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ background: "#E8272A", color: "white", width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>{n}</span>
        <span style={{ color: "white", fontWeight: "600", fontSize: "13px" }}>{titolo}</span>
      </div>
      <div style={{ padding: "12px 16px", fontSize: "13px", color: "#374151", lineHeight: "1.6" }}>{contenuto}</div>
    </div>
  );
}

function WorkflowStep({ step, last }) {
  const colors = { LinkedIn: "#0077B5", Email: "#E8272A", Telefono: "#059669" };
  const icons  = { LinkedIn: "💼", Email: "✉️", Telefono: "📞" };
  return (
    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: last ? 0 : "14px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: "72px" }}>
        <div style={{ background: colors[step.canale] || "#888", color: "white", borderRadius: "7px", padding: "3px 8px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap" }}>
          Giorno {step.giorno}
        </div>
        {!last && <div style={{ width: "2px", height: "18px", background: "#e5e7eb", marginTop: "4px" }} />}
      </div>
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "9px", padding: "10px 14px", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
          <span>{icons[step.canale]}</span>
          <span style={{ fontSize: "11px", fontWeight: "700", color: colors[step.canale] || "#888", textTransform: "uppercase" }}>{step.canale}</span>
        </div>
        <p style={{ margin: 0, fontSize: "13px", color: "#374151", lineHeight: "1.5" }}>{step.azione}</p>
      </div>
    </div>
  );
}

function StatusDot({ done, active }) {
  return (
    <div style={{
      width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
      background: done ? "#16a34a" : active ? "#E8272A" : "#e5e7eb",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: active ? "pulse-dot 1s ease-in-out infinite" : "none",
    }}>
      {done && <span style={{ color: "white", fontSize: "9px", fontWeight: "700" }}>✓</span>}
    </div>
  );
}

function ProgressPanel({ searchCount }) {
  const steps = [
    { label: "Sito web aziendale", t: 0 },
    { label: "Dati finanziari (Cerved, bilanci)", t: 2 },
    { label: "News e comunicati stampa", t: 4 },
    { label: "LinkedIn e persone chiave", t: 6 },
    { label: "Job posting e strategia", t: 9 },
    { label: "Presenza digitale e social", t: 12 },
  ];
  return (
    <div style={{ background: "white", borderRadius: "14px", padding: "32px", border: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "7px", marginBottom: "28px" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: "10px", height: "10px", background: "#E8272A", borderRadius: "50%", animation: `bounce 1s ease-in-out ${i * 0.18}s infinite` }} />
        ))}
      </div>
      <div style={{ maxWidth: "340px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>
        {steps.map((s, i) => {
          const done = searchCount > s.t + 1;
          const active = !done && searchCount >= s.t;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", opacity: done || active ? 1 : 0.35 }}>
              <StatusDot done={done} active={active} />
              <span style={{ fontSize: "13px", color: done ? "#16a34a" : active ? "#E8272A" : "#6b7280", fontWeight: active || done ? "600" : "400" }}>{s.label}</span>
            </div>
          );
        })}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", opacity: searchCount >= 15 ? 1 : 0.35, marginTop: "4px", paddingTop: "12px", borderTop: "1px solid #f3f4f6" }}>
          <StatusDot done={false} active={searchCount >= 15} />
          <span style={{ fontSize: "13px", color: searchCount >= 15 ? "#E8272A" : "#6b7280", fontWeight: searchCount >= 15 ? "600" : "400" }}>Generazione materiali sales</span>
        </div>
      </div>
      <p style={{ color: "#9ca3af", margin: "20px 0 0", textAlign: "center", fontSize: "12px" }}>
        {searchCount} ricerche completate · ~3-4 minuti
      </p>
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}

function ScarsezzaBanner({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", display: "flex", gap: "10px" }}>
      <span style={{ fontSize: "16px", flexShrink: 0 }}>⚠️</span>
      <div>
        <div style={{ fontWeight: "700", fontSize: "12px", color: "#92400e", marginBottom: "3px" }}>Dati parziali — azione consigliata</div>
        <div style={{ fontSize: "12px", color: "#78350f", lineHeight: "1.5" }}>{msg}</div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────

export default function App() {
  const [input, setInput]         = useState("");
  const [note, setNote]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");
  const [tab, setTab]             = useState("intel");

  const EXAMPLES = ["Technogym", "Gruppo Humanitas", "Alpitour", "Generali Assicurazioni", "Danieli Group"];

  async function analyze() {
    if (!input.trim() || loading) return;
    setLoading(true); setError(""); setResult(null); setSearchCount(0);
    try {
      // Fase 1 — avanza il contatore mentre il backend ricerca
      const pollInterval = setInterval(() => setSearchCount(n => Math.min(n + 1, 14)), 8000);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect: input.trim(), note: note.trim() }),
      });

      clearInterval(pollInterval);
      setSearchCount(15); // segnala fase 2

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Errore ${res.status}`);
      setResult(data);
      setTab("intel");
    } catch (err) {
      setError(err.message || "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  const p = result?.prospect || {};
  const strumenti = p.strumenti_rilevanti || [];
  const hasSprint = strumenti.some(s => s?.toLowerCase().includes("sprint"));
  const hasPE     = strumenti.some(s => s?.toLowerCase().includes("emozionale") || s?.toLowerCase().includes("preventivo"));

  const sectionLabel = (label) => (
    <div style={{ fontSize: "11px", fontWeight: "700", color: "#374151", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
      {label}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

      {/* Navbar */}
      <div style={{ background: "#111", height: "54px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", position: "sticky", top: 0, zIndex: 99 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "#E8272A", fontWeight: "900", fontSize: "17px", letterSpacing: "0.04em" }}>domino</span>
          <span style={{ color: "#444", fontSize: "13px" }}>/ Prospect Engine</span>
        </div>
        <span style={{ color: "#555", fontSize: "11px" }}>uso interno · Strategic CX Partner</span>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 20px" }}>

        {/* Input */}
        <div style={{ background: "white", borderRadius: "14px", padding: "24px", marginBottom: "20px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h1 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "800", color: "#111", letterSpacing: "-0.02em" }}>Analizza un prospect</h1>
          <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: "13px" }}>
            Ricerca su sito web · Cerved/bilanci · news · LinkedIn · job posting — materiali sales con dati reali, scarsezza segnalata.
          </p>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && analyze()}
              placeholder="es. Technogym  ·  Gruppo Humanitas  ·  www.alpitour.it"
              disabled={loading}
              style={{ flex: 1, padding: "11px 14px", border: "2px solid #e5e7eb", borderRadius: "9px", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#E8272A"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            <button onClick={analyze} disabled={loading || !input.trim()}
              style={{ padding: "11px 24px", background: loading || !input.trim() ? "#e5e7eb" : "#E8272A", color: loading || !input.trim() ? "#9ca3af" : "white", border: "none", borderRadius: "9px", cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "700", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {loading ? "…" : "Analizza →"}
            </button>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)} disabled={loading}
            placeholder="Note opzionali — es. '200 dealer in Italia' · 'Target: CMO' · 'Lanciano prodotto a settembre'"
            rows={2}
            style={{ width: "100%", padding: "11px 14px", border: "2px solid #e5e7eb", borderRadius: "9px", fontSize: "13px", outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", color: "#374151" }}
            onFocus={e => e.target.style.borderColor = "#E8272A"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
        </div>

        {loading && <ProgressPanel searchCount={searchCount} />}

        {error && !loading && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px 18px", color: "#dc2626", fontSize: "13px", marginBottom: "20px" }}>
            ⚠️ {error}
          </div>
        )}

        {result && !loading && (
          <>
            {/* Summary bar */}
            <div style={{ background: "#111", borderRadius: "11px", padding: "14px 22px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <div style={{ color: "#555", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Prospect</div>
                <div style={{ color: "white", fontWeight: "800", fontSize: "15px" }}>{p.nome}</div>
              </div>
              <div style={{ width: "1px", height: "36px", background: "#333" }} />
              <div>
                <div style={{ color: "#555", fontSize: "10px", textTransform: "uppercase" }}>Settore</div>
                <div style={{ color: "#ccc", fontSize: "13px" }}>{p.settore}</div>
              </div>
              <div style={{ width: "1px", height: "36px", background: "#333" }} />
              <div>
                <div style={{ color: "#555", fontSize: "10px", textTransform: "uppercase" }}>Target</div>
                <div style={{ color: "#ccc", fontSize: "13px" }}>{p.decisore_target}</div>
              </div>
              {(hasSprint || hasPE) && (
                <>
                  <div style={{ width: "1px", height: "36px", background: "#333" }} />
                  <div style={{ display: "flex", gap: "6px" }}>
                    {hasSprint && <ToolBadge type="sprint" />}
                    {hasPE && <ToolBadge type="pe" />}
                  </div>
                </>
              )}
              <div style={{ marginLeft: "auto" }}>
                <div style={{ background: "#E8272A", color: "white", padding: "7px 14px", borderRadius: "7px", fontSize: "12px", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  🎯 {p.hook}
                </div>
              </div>
            </div>

            <ScarsezzaBanner msg={p.scarsezza_dati} />

            {/* Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {[["intel","🔍","Intelligence"],["mail","✉️","Mail"],["deck","📊","Deck"],["workflow","📅","Workflow"],["linkedin","💼","LinkedIn"],["fonti","📋","Fonti"]].map(([t,i,l]) => (
                <TabBtn key={t} active={tab === t} onClick={() => setTab(t)} icon={i} label={l} />
              ))}
            </div>

            <div style={{ background: "white", borderRadius: "14px", padding: "26px", border: "1px solid #e5e7eb", minHeight: "280px" }}>

              {/* INTELLIGENCE */}
              {tab === "intel" && (
                <div>
                  <h2 style={{ margin: "0 0 18px", fontSize: "17px", fontWeight: "700", color: "#111" }}>Intelligence — {p.nome}</h2>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                    {[["Settore",p.settore],["Dimensione",p.dimensione],["Mercati",p.mercati],["Fatturato",p.fatturato_stimato],["Decisore target",p.decisore_target],["Caso studio affine",p.caso_studio_piu_affine]].map(([l, v]) => (
                      <div key={l} style={{ background: "#f9fafb", borderRadius: "9px", padding: "11px 14px" }}>
                        <div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>{l}</div>
                        <div style={{ fontSize: "13px", color: !v || v === "null" ? "#bbb" : "#111", fontWeight: "600", fontStyle: !v || v === "null" ? "italic" : "normal" }}>
                          {v || "Non trovato"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {p.maturita_digitale && (
                    <div style={{ marginBottom: "16px", background: "#f9fafb", borderRadius: "9px", padding: "11px 14px" }}>
                      <div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Maturità digitale</div>
                      <DigitalBadge level={p.maturita_digitale} />
                    </div>
                  )}

                  {p.persone_chiave?.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      {sectionLabel("Persone chiave")}
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {p.persone_chiave.map((pk, i) => (
                          <div key={i} style={{ background: "#f0f8ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "8px 12px", fontSize: "12px" }}>
                            <div style={{ fontWeight: "700", color: "#1d4ed8" }}>{pk.nome}</div>
                            <div style={{ color: "#6b7280" }}>{pk.ruolo}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.segnali_recenti?.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      {sectionLabel("Segnali recenti")}
                      {p.segnali_recenti.map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: "9px", padding: "9px 13px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "7px", marginBottom: "6px", fontSize: "13px", color: "#374151" }}>
                          <span style={{ color: "#16a34a", fontWeight: "700", flexShrink: 0 }}>↑</span> {s}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginBottom: strumenti.length > 0 ? "16px" : 0 }}>
                    {sectionLabel("Sfide probabili")}
                    {p.sfide_probabili?.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: "9px", padding: "9px 13px", background: "#fef2f2", borderRadius: "7px", marginBottom: "6px", fontSize: "13px", color: "#374151" }}>
                        <span style={{ color: "#E8272A", fontWeight: "700", flexShrink: 0 }}>→</span> {s}
                      </div>
                    ))}
                  </div>

                  {strumenti.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      {sectionLabel("Strumenti consigliati")}
                      <div style={{ display: "flex", gap: "8px" }}>
                        {hasSprint && <ToolBadge type="sprint" />}
                        {hasPE && <ToolBadge type="pe" />}
                      </div>
                    </div>
                  )}

                  <div style={{ background: "#111", borderRadius: "9px", padding: "14px 18px" }}>
                    <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "5px" }}>Hook di apertura</div>
                    <div style={{ color: "white", fontSize: "14px", fontStyle: "italic" }}>"{p.hook}"</div>
                  </div>
                </div>
              )}

              {/* MAIL */}
              {tab === "mail" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#111" }}>Mail introduttiva</h2>
                    <CopyBtn text={`Oggetto: ${result.mail?.oggetto}\n\n${result.mail?.corpo}`} />
                  </div>
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: "11px", overflow: "hidden" }}>
                    <div style={{ background: "#f3f4f6", padding: "11px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "700" }}>OGGETTO:</span>
                      <span style={{ fontSize: "14px", color: "#111", fontWeight: "700" }}>{result.mail?.oggetto}</span>
                    </div>
                    <div style={{ padding: "18px 16px", fontSize: "14px", color: "#374151", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                      {result.mail?.corpo}
                    </div>
                  </div>
                </div>
              )}

              {/* DECK */}
              {tab === "deck" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#111" }}>Struttura deck — 5 slide</h2>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {hasSprint && <ToolBadge type="sprint" />}
                      {hasPE && <ToolBadge type="pe" />}
                    </div>
                  </div>
                  {[1,2,3,4,5].map(n => (
                    <SlideCard key={n} n={n} titolo={result.deck?.[`slide_${n}_titolo`]} contenuto={result.deck?.[`slide_${n}_contenuto`]} />
                  ))}
                </div>
              )}

              {/* WORKFLOW */}
              {tab === "workflow" && (
                <div>
                  <h2 style={{ margin: "0 0 22px", fontSize: "17px", fontWeight: "700", color: "#111" }}>Workflow primo contatto</h2>
                  {result.workflow?.map((step, i) => (
                    <WorkflowStep key={i} step={step} last={i === result.workflow.length - 1} />
                  ))}
                </div>
              )}

              {/* LINKEDIN */}
              {tab === "linkedin" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#111" }}>Messaggio LinkedIn</h2>
                    <CopyBtn text={result.linkedin_connection} />
                  </div>
                  <div style={{ background: "#f0f8ff", border: "1px solid #bfdbfe", borderRadius: "11px", padding: "18px", marginBottom: "14px" }}>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ width: "38px", height: "38px", background: "#0077B5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "800", fontSize: "15px", flexShrink: 0 }}>D</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "700", fontSize: "13px", color: "#111", marginBottom: "1px" }}>Domino — Account</div>
                        <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "10px" }}>Richiesta di collegamento</div>
                        <div style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", background: "white", padding: "11px", borderRadius: "7px" }}>{result.linkedin_connection}</div>
                        <div style={{ fontSize: "11px", color: (result.linkedin_connection?.length || 0) > 200 ? "#dc2626" : "#6b7280", marginTop: "6px" }}>
                          {result.linkedin_connection?.length || 0} / 200 caratteri
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "11px 14px", fontSize: "12px", color: "#92400e" }}>
                    💡 <b>Tip:</b> Aggiungi un riferimento a un post recente del tuo interlocutore per aumentare il tasso di accettazione.
                  </div>
                </div>
              )}

              {/* FONTI */}
              {tab === "fonti" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#111" }}>Report di ricerca</h2>
                    <CopyBtn text={result._research_report || ""} />
                  </div>
                  <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px 18px", fontSize: "13px", color: "#374151", lineHeight: "1.7", whiteSpace: "pre-wrap", maxHeight: "520px", overflowY: "auto" }}>
                    {result._research_report || "Report non disponibile."}
                  </div>
                  <p style={{ margin: "10px 0 0", fontSize: "11px", color: "#9ca3af" }}>
                    La sezione ⚠️ DATI NON TROVATI in fondo al report indica dove fare ricerca manuale prima della call.
                  </p>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button onClick={() => { setResult(null); setInput(""); setNote(""); setError(""); }}
                style={{ background: "transparent", border: "1px solid #ddd", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", color: "#777", fontFamily: "inherit" }}>
                ← Analizza un altro prospect
              </button>
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div style={{ textAlign: "center", padding: "52px 24px", color: "#9ca3af" }}>
            <div style={{ fontSize: "44px", marginBottom: "14px" }}>🎯</div>
            <p style={{ margin: "0 0 6px", fontSize: "15px", color: "#6b7280", fontWeight: "700" }}>Inserisci un prospect per iniziare</p>
            <p style={{ margin: "0 0 4px", fontSize: "13px" }}>Sito web · Cerved/bilanci · news · LinkedIn · job posting</p>
            <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#9ca3af" }}>~3-4 minuti · dati reali, scarsezza segnalata esplicitamente</p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "24px" }}>
              {EXAMPLES.map(s => (
                <button key={s} onClick={() => setInput(s)} style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", color: "#555", fontFamily: "inherit" }}>{s}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "12px 16px", fontSize: "12px", color: "#c2410c", maxWidth: "200px", textAlign: "left" }}>
                <div style={{ fontWeight: "700", marginBottom: "4px" }}>⚡ Design Sprint!</div>
                <div style={{ lineHeight: "1.5" }}>Pionieri in Italia da 10 anni. Prototipo in 4 giorni.</div>
              </div>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px 16px", fontSize: "12px", color: "#15803d", maxWidth: "200px", textAlign: "left" }}>
                <div style={{ fontWeight: "700", marginBottom: "4px" }}>✨ Preventivo Emozionale</div>
                <div style={{ lineHeight: "1.5" }}>70% redemption. Dal prezzo al valore.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
