// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOMINO PROSPECT ENGINE — Backend v3.1.0
// Vercel serverless proxy per Anthropic API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DOMINO_BRAIN = `Sei il motore di intelligence commerciale di Domino (domino.it) — "Proudly Interactive dal 1996".
Torino + Venezia | 50 collaboratori | 30 anni | B Corp certificata.
Payoff: "Semplifichiamo la complessità, liberiamo il potenziale."

4 AREE: Service Design (Design Sprint!), Digital Marketing & CX, Digital Products, IT.

CLIENTI TIPO:
- SALUTE: Ospedale dell'Angelo, Affidea, CDI, Lierac+Phyto, Solgar, LARC
- B2B: Rollon, Comau, Megadyne, Bitron, CNH, Petronas, SKF, Danieli
- TURISMO: Costa Crociere, Alpitour, Biennale Venezia, Visit Piemonte, Fondazione Torino Musei

CASI DI SUCCESSO:
- Fiat EMEA: +40% visite, +120% test drive in 9 mesi (21 paesi)
- Costa Crociere: 120.000 minisiti/anno, 70% redemption col Preventivo Emozionale
- IVECO.com: Premio IKA 2024`;

async function callClaude(userMsg, useWebSearch = false) {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    system: DOMINO_BRAIN,
    messages: [{ role: "user", content: userMsg }],
  };
  if (useWebSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, payload } = req.body;

  try {
    let result = "";

    if (action === "generate_list") {
      const { sector, sectorLabel, subsectors, minFatturato, segnali } = payload;
      const prompt = `Sei un analista di intelligence commerciale per Domino (domino.it), agenzia CX B Corp italiana.

Genera una lista di 8 aziende italiane reali e potenzialmente in target per Domino nel settore: ${sectorLabel}
${subsectors.length ? `Sottosettori preferiti: ${subsectors.join(", ")}` : ""}
Fatturato minimo: ${minFatturato}M€
${segnali.length ? `Segnali di acquisto richiesti: ${segnali.join(", ")}` : ""}

REGOLE:
- Solo aziende REALI esistenti in Italia
- Nessun cliente attuale di Domino (no Fiat, Costa Crociere, Alpitour, Affidea, Comau, Bitron, Rollon ecc.)
- Fatturato minimo ${minFatturato}M€ (stima se non noto)
- Per ogni azienda assegna uno score 0-100 basato su: fit settore (25%), dimensione (25%), gap digitale (20%), segnali acquisto (20%), accessibilità decisore (10%)

Rispondi SOLO con JSON valido, nessun testo prima o dopo:
[
  {
    "nome": "Nome Azienda",
    "settore": "sottosettore specifico",
    "citta": "Città, Regione",
    "fatturato_est": "~XXM€",
    "dipendenti_est": "~XXX",
    "score": 72,
    "hook": "frase breve sul perché è in target Domino",
    "gap": "gap digitale principale rilevato"
  }
]`;
      result = await callClaude(prompt, false);
    }

    else if (action === "research") {
      const { nome, settore, citta, hook } = payload;
      const prompt = `Analizza questa azienda come prospect per Domino (agenzia CX italiana, domino.it):

AZIENDA: ${nome}
${settore ? `Settore: ${settore}` : ""}
${citta ? `Sede: ${citta}` : ""}
${hook ? `Hook rilevato: ${hook}` : ""}

Cerca sul web informazioni aggiornate e produci un dossier strutturato con:
1. PROFILO AZIENDA — cosa fanno, mercati, posizionamento
2. NEWS RECENTI — ultimi 6-12 mesi (annunci, cambi, lanci)
3. DECISION MAKER — CEO/CMO/CDO: nome, LinkedIn, tono
4. DIGITAL GAP — stato attuale del digitale vs opportunità Domino
5. HOOK COMMERCIALE — l'argomento più forte per aprire la conversazione
6. SERVIZI DOMINO CONSIGLIATI — quale area è più rilevante e perché
7. LIVELLO DI URGENZA — basso/medio/alto con motivazione`;
      result = await callClaude(prompt, true);
    }

    else if (action === "materials") {
      const { dossier } = payload;
      const prompt = `Basandoti su questo dossier del prospect, genera i materiali di vendita per Domino:

DOSSIER:
${dossier}

Genera:

## MAIL INTRODUTTIVA (variante Pain-first)
Oggetto: [oggetto]
Corpo: [corpo mail, max 150 parole, prima persona, firma come "Team Domino"]

## DECK — STRUTTURA 6 SLIDE
Slide 1: Titolo personalizzato
Slide 2-3: Specchio dei loro bisogni (non di Domino)
Slide 4-5: Come Domino risolve — con case study affine
Slide 6: Proposta di next step concreta

## SEQUENZA LINKEDIN (3 messaggi)
Messaggio 1 — Connection request (max 50 parole)
Messaggio 2 — Follow-up Giorno 5 (insight settore)
Messaggio 3 — Invio valore Giorno 10

## OPENING SCRIPT CALL (max 100 parole)`;
      result = await callClaude(prompt, false);
    }

    else {
      return res.status(400).json({ error: "Unknown action" });
    }

    return res.status(200).json({ result });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
