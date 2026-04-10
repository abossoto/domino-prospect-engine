// DOMINO PROSPECT ENGINE — Backend v3.3.0

const RESEARCH_SYSTEM = `Produci dossier completi su aziende prospect usando ESCLUSIVAMENTE dati reali trovati sul web.

REGOLA FONDAMENTALE — NON INVENTARE MAI:
Se una fonte non dà risultati concreti, scrivi esplicitamente "⚠️ Non trovato" per quella sezione.
Non generalizzare. Non assumere. Non riempire lacune con supposizioni.
Un dato mancante segnalato è più utile di un dato inventato.

FONTI DA CERCARE IN ORDINE:
1. SITO WEB AZIENDALE — homepage + chi siamo + prodotti/servizi + case study
2. DATI FINANZIARI — "[azienda] fatturato bilancio dipendenti", "[azienda] site:cerved.com"
3. NEWS ULTIMI 12 MESI — acquisizioni, lanci, finanziamenti, cambi management
4. LINKEDIN — profilo aziendale + nomi CEO, CMO, CDO, Dir. Marketing/Digital
5. JOB POSTING — offerte attive, interpreta priorità strategiche
6. PRESENZA DIGITALE — qualità sito, social attivi, blog, newsletter

STRUTTURA OBBLIGATORIA DEL REPORT:
## PROFILO AZIENDA
## DATI FINANZIARI
## PERSONE CHIAVE
## SEGNALI RECENTI
## JOB POSTING E PRIORITÀ STRATEGICHE
## PRESENZA E MATURITÀ DIGITALE
## SFIDE PROBABILI
## OPPORTUNITÀ PER DOMINO
## ⚠️ DATI NON TROVATI`;

const GENERATION_SYSTEM = `Sei il motore di intelligence commerciale di Domino (domino.it) — "Proudly Interactive dal 1996".

━━━ IDENTITÀ ━━━
CX agency specializzata in progetti digitali per lo sviluppo delle imprese.
Torino + Venezia | 50 collaboratori | 30 anni di esperienza | Società Benefit | B Corp certificata.
Payoff: "Semplifichiamo la complessità, liberiamo il potenziale."
Posizionamento: "Strategic CX Partner" — ogni punto di contatto è un'opportunità per relazioni solide tra brand e persone, B2B e Consumer.
"Domino mette i risultati prima dello strumento, perché non siamo vendor di software."
30+ riconoscimenti internazionali.

━━━ STRUMENTO 1: DESIGN SPRINT! ━━━
Pionieri in Italia — 10 anni di pratica.
Formula: 4 giorni / 1 team unito agenzia+cliente / 1 prototipo funzionante / 100% clienti soddisfatti.
Produce: Buyer Personas, Customer Journey, Prototipo testato, direzione condivisa.
Beneficio: "Comprimiamo tempi di mesi in giorni. RIDUCENDO I RISCHI DI INVESTIMENTO."
SPECIALIZZAZIONI: Service / CX / Brand / Digital Marketing / Website / Intranet Design Sprint!
CLIENTI: Asalaser, Demak, Danieli, Masi, BCA, Arca Fondi, Texa, IVECO, Case IH, IPI, LINKS.

━━━ STRUMENTO 2: PREVENTIVO EMOZIONALE ━━━
Venditore UN CLICK → minisito personalizzato → mail cliente → 70% redemption.
Clienti: Costa Crociere (120.000 minisiti/anno EMEA), Jeep, Fiat Professional, Petronas, CNH.

━━━ 4 AREE ━━━
1. SERVICE DESIGN — Design Sprint!, Personas, UX
2. DIGITAL MARKETING & CX — Campagne, lead gen, automation, Preventivo Emozionale
3. DIGITAL PRODUCTS — Website, app, intranet, Growth Driven Design
4. INFORMATION TECHNOLOGY — CMS, CRM, integrazioni, AI, Big Data

━━━ NUMERI DA CITARE ━━━
- Fiat EMEA: +40% visite, +120% test drive in 9 mesi (21 paesi)
- Costa Crociere PE: 120.000 minisiti/anno, 70% redemption
- Stellantis intranet: 88.000 dipendenti loggati ogni giorno
- Case IH: 12+ mercati EMEA | ENIT: 34 paesi | Sprint!: 100% soddisfatti

━━━ CLIENTI PER SETTORE ━━━
AUTOMOTIVE: Fiat, Stellantis, IVECO, Jeep, Alfa Romeo, Fiat Professional, Case IH, CIFA, BCA
B2B: Rollon, Comau, Megadyne, Contship, Bitron, CNH, Petronas, IPI, Demak, PipeIn, Bancomat
TURISMO: Costa Crociere, Alpitour, Biennale Venezia, Fondazione Torino Musei, Masi, Visit Piemonte
SALUTE: Lierac+Phyto, LARC, Ospedale dell'Angelo, Affidea, CDI, Solgar
FINANCE: Arca Fondi SGR | ALTRI: RAI, Universal Music Group, SKF, Danieli, San Paolo, Exor

━━━ CASE STUDY ━━━
1. FIAT EMEA — +40% visite, +120% test drive, 21 paesi.
2. COSTA CROCIERE — PE: 120.000 minisiti/anno, 70% redemption.
3. STELLANTIS — Intranet 88.000 dipendenti, FEIEIA Gran Prix 2019.
4. MYIVECO — Customer portal con marketplace post-vendita.
5. JEEP OWNERS GROUP — Community 8 mercati.
6. COMAU — Brand identity B2B internazionale.
7. CONTSHIP ITALIA — Digital transformation da zero, lead gen B2B.
8. CIFA — Configuratore prodotto e lead gen industriale.
9. BR-UNO / IBM WATSON — AI conversazionale.
10. FONDAZIONE TORINO MUSEI — Portale multi-museo, 150.000 opere.
11. ROLLON — GDD 16 mercati, Premio IKA 2023 B2B.
12. ARCA FONDI SGR — Design Sprint! + Salesforce + Advisor Assistant.
13. VERITAS SCOASSE — App pubblica Venezia.
14. LIERAC + PHYTO — Social strategy beauty con Personas.

━━━ NUOVE AREE ━━━
▸ BRAND IDENTITY: Comau, MIND, Danieli Design System, IVECO Design System.
▸ INTERNAL COMM: VALUE TELLER (200+ influencer), ETHICS EXPERIENCE (80% awareness), onboarding IPI.
▸ STARTUP: Gaia, Neosperience Health, Brainkin, Danam.
▸ CULTURA: Biennale Venezia (10+ anni), Museo Cinema Torino, Fondazione Aquileia.
▸ AI B2B (Bitron): chatbot PDF-trained, Product Selector AI, knowledge base multichannel.
▸ eCOMMERCE: Arca Advisory Assistant, Masi enoteca, Biennale.

Ricevi un report di intelligence su un prospect. Genera materiali sales per Domino.

REGOLE:
- Usa SOLO informazioni esplicitamente presenti nel report
- Prima frase sempre sul PROBLEMA del prospect
- Tono diretto, concreto, umano
- Next step sempre specifico

CASE STUDY — OBBLIGATORIO: cita ESATTAMENTE 3 case study:
[0] Stesso settore del prospect
[1] Settore diverso ma sfida simile
[2] Capacità metodologica specifica
VIETATO citare solo Fiat e Costa Crociere.`;

async function callClaude(system, userMsg, useWebSearch = false, maxTokens = 3000) {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userMsg }],
  };
  if (useWebSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { action, payload } = req.body;

  try {
    // ── GENERA LISTA PROSPECT ─────────────────────────────
    if (action === "generate_list") {
      const { sectorLabel, subsectors, minFatturato, segnali } = payload;
      const raw = await callClaude(
        "Sei un analista di intelligence commerciale per Domino (domino.it), agenzia CX B Corp italiana.",
        `Genera una lista di 8 aziende italiane reali in target per Domino nel settore: ${sectorLabel}
${subsectors?.length ? `Sottosettori preferiti: ${subsectors.join(", ")}` : ""}
Fatturato minimo: ${minFatturato}M€
${segnali?.length ? `Segnali di acquisto: ${segnali.join(", ")}` : ""}

REGOLE FONDAMENTALI:
- Solo aziende REALI italiane esistenti oggi
- NON includere clienti Domino: Fiat, Stellantis, IVECO, Costa Crociere, Alpitour, Affidea, Comau, Bitron, Rollon, Megadyne, CNH, Petronas, SKF, Danieli, Contship, Lierac, CDI, Solgar
- Fatturato minimo ${minFatturato}M€ stimato
- Score 0-100: fit settore 25%, dimensione 25%, gap digitale 20%, segnali acquisto 20%, accessibilità decisore 10%

Rispondi SOLO con array JSON valido, nessun testo prima o dopo:
[{"nome":"","settore":"","citta":"","fatturato_est":"~XXM€","dipendenti_est":"~XXX","score":0,"hook":"perché è in target Domino","gap":"gap digitale principale"}]`,
        false, 4000
      );
      return res.status(200).json({ result: raw });
    }

    // ── RESEARCH AGENT ────────────────────────────────────
    if (action === "research") {
      const { nome, settore, citta, hook } = payload;
      const result = await callClaude(
        RESEARCH_SYSTEM,
        `Analizza questa azienda come prospect per Domino:

AZIENDA: ${nome}
${settore ? `Settore dichiarato: ${settore}` : ""}
${citta ? `Sede: ${citta}` : ""}
${hook ? `Contesto iniziale: ${hook}` : ""}

Cerca tutte le fonti indicate e produci il report completo nelle 9 sezioni obbligatorie.
Per ogni sezione: se trovi dati reali scrivili, se non trovi scrivi ⚠️ Non trovato.`,
        true, 4000
      );
      return res.status(200).json({ result });
    }

    // ── GENERA MATERIALI SALES ────────────────────────────
    if (action === "generate_materials") {
      const { dossier, nomeAzienda } = payload;
      const raw = await callClaude(
        GENERATION_SYSTEM,
        `PROSPECT: ${nomeAzienda}

REPORT DI INTELLIGENCE:
${dossier}

Genera i materiali sales in questo JSON esatto (nessun testo fuori dal JSON):
{
  "mail": {
    "oggetto": "oggetto email conciso e personalizzato, max 10 parole",
    "corpo": "corpo email pain-first, max 140 parole, tono consulenziale diretto, prima persona plurale, firma Team Domino. Cita 1 dato specifico dal dossier. NON usare asterischi o markdown."
  },
  "deck": [
    {"n":1,"titolo":"titolo slide personalizzato su prospect","contenuto":"2-3 punti chiave che mostrano che li abbiamo studiati"},
    {"n":2,"titolo":"La sfida che vediamo","contenuto":"problemi specifici emersi dal dossier, non generici"},
    {"n":3,"titolo":"Il contesto di mercato","contenuto":"trend di settore rilevanti per loro"},
    {"n":4,"titolo":"Come lo affrontiamo","contenuto":"servizio Domino più rilevante + approccio specifico"},
    {"n":5,"titolo":"Tre case study affini","contenuto":"esattamente 3 case study: [0] stesso settore [1] sfida simile [2] capacità metodologica"},
    {"n":6,"titolo":"Il prossimo passo concreto","contenuto":"proposta specifica: Design Sprint! in data X, o call esplorativa di 30min, con outcome chiaro"}
  ],
  "linkedin": [
    {"giorno":1,"tipo":"Connection request","testo":"max 50 parole, personalizzato su qualcosa di loro, nessun pitch commerciale"},
    {"giorno":5,"tipo":"Follow-up con insight","testo":"max 80 parole, porta un dato o osservazione rilevante per il loro settore"},
    {"giorno":10,"tipo":"Invio contenuto","testo":"max 80 parole, collega un case study Domino alla loro situazione specifica"}
  ],
  "workflow": [
    {"giorno":1,"canale":"LinkedIn","azione":"Connection request al decision maker identificato","note":"usare messaggio LinkedIn personalizzato"},
    {"giorno":3,"canale":"Email","azione":"Mail introduttiva pain-first","note":"allegare nessun file, solo testo"},
    {"giorno":5,"canale":"LinkedIn","azione":"Follow-up con insight di settore","note":""},
    {"giorno":8,"canale":"Email","azione":"Invio deck personalizzato","note":"oggetto: 'come lavoriamo con [settore]'"},
    {"giorno":12,"canale":"Phone","azione":"Chiamata esplorativa 15 minuti","note":"3 domande aperte pronte, no pitch"},
    {"giorno":18,"canale":"LinkedIn","azione":"Terzo messaggio con case study affine","note":""},
    {"giorno":22,"canale":"Email","azione":"Proposta Design Sprint! o call strategica","note":"scadenza morbida: 'entro fine mese'"}
  ]
}`,
        false, 4000
      );
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("JSON materiali non valido");
      return res.status(200).json({ result: JSON.parse(raw.slice(start, end + 1)) });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
