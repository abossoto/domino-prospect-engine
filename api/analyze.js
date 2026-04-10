// DOMINO PROSPECT ENGINE — Backend v3.2.0

const DOMINO_BRAIN = `Sei il motore di intelligence commerciale di Domino (domino.it) — "Proudly Interactive dal 1996".
Torino + Venezia | 50 collaboratori | 30 anni | B Corp certificata.
Payoff: "Semplifichiamo la complessità, liberiamo il potenziale."
4 AREE: Service Design (Design Sprint!), Digital Marketing & CX, Digital Products, IT.
CLIENTI: Fiat/Stellantis, IVECO, Costa Crociere, Alpitour, Rollon, Comau, Megadyne, Bitron, CNH, Affidea, CDI, Lierac.
NUMERI: Fiat EMEA +40% visite +120% test drive in 9 mesi. Costa Crociere 120.000 minisiti/anno 70% redemption. IVECO IKA 2024.`;

async function callClaude(userMsg, useWebSearch = false, maxTokens = 3000) {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: DOMINO_BRAIN,
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
    if (action === "generate_list") {
      const { sectorLabel, subsectors, minFatturato, segnali } = payload;
      const raw = await callClaude(`Sei un analista di intelligence commerciale per Domino (domino.it), agenzia CX B Corp italiana.

Genera una lista di 8 aziende italiane reali in target per Domino nel settore: ${sectorLabel}
${subsectors?.length ? `Sottosettori: ${subsectors.join(", ")}` : ""}
Fatturato minimo: ${minFatturato}M€
${segnali?.length ? `Segnali di acquisto: ${segnali.join(", ")}` : ""}

REGOLE FONDAMENTALI:
- Solo aziende REALI italiane esistenti oggi
- NON includere clienti Domino: Fiat, Stellantis, IVECO, Costa Crociere, Alpitour, Affidea, Comau, Bitron, Rollon, Megadyne, CNH, Petronas, SKF
- Fatturato minimo ${minFatturato}M€
- Score 0-100: fit settore 25%, dimensione 25%, gap digitale 20%, segnali acquisto 20%, accessibilità decisore 10%

Rispondi SOLO con array JSON valido senza testo aggiuntivo:
[{"nome":"","settore":"","citta":"","fatturato_est":"~XXM€","dipendenti_est":"~XXX","score":0,"hook":"","gap":""}]`, false, 4000);
      return res.status(200).json({ result: raw });
    }

    if (action === "research") {
      const { nome, settore, citta, hook } = payload;
      const result = await callClaude(`Analizza questa azienda come prospect per Domino (agenzia CX italiana):

AZIENDA: ${nome}
${settore ? `Settore: ${settore}` : ""}${citta ? `\nSede: ${citta}` : ""}${hook ? `\nHook: ${hook}` : ""}

Cerca sul web e produci un dossier con questi 7 punti esatti:

## 1. PROFILO AZIENDA
Cosa fanno, mercati, posizionamento, dimensione stimata.

## 2. NEWS RECENTI (ultimi 12 mesi)
Annunci, acquisizioni, lanci prodotto, cambi management, finanziamenti. Se non trovi scrivi "Nessuna news rilevante trovata".

## 3. DECISION MAKER TARGET
Nome CEO/CMO/CDO, profilo LinkedIn se trovato, tono comunicativo. Se non trovi scrivi "Non trovato pubblicamente".

## 4. DIGITAL GAP
Stato attuale sito/digital: punti deboli evidenti, tecnologie in uso se rilevabili.

## 5. HOOK COMMERCIALE
L'argomento più forte e specifico per aprire la conversazione con Domino.

## 6. SERVIZI DOMINO PIÙ RILEVANTI
Quale delle 4 aree (Service Design / Digital Marketing CX / Digital Products / IT) e perché.

## 7. URGENZA STIMATA
Basso / Medio / Alto — con motivazione in 1 frase.`, true, 3000);
      return res.status(200).json({ result });
    }

    if (action === "generate_materials") {
      const { dossier, nomeAzienda } = payload;
      const raw = await callClaude(`Sei il sales director di Domino (agenzia CX italiana, domino.it). Basandoti su questo dossier, genera tutti i materiali di vendita.

PROSPECT: ${nomeAzienda}
DOSSIER:
${dossier}

Produci ESATTAMENTE questo JSON (nessun testo fuori dal JSON):
{
  "mail": {
    "oggetto": "oggetto email conciso e personalizzato",
    "corpo": "corpo email pain-first, max 140 parole, tono consulenziale diretto, prima persona plurale, firma Team Domino. NON usare asterischi o markdown."
  },
  "deck": [
    {"n": 1, "titolo": "titolo slide personalizzato su prospect", "contenuto": "2-3 bullet sintetici"},
    {"n": 2, "titolo": "Il loro contesto (non Domino)", "contenuto": "sfide e opportunità del prospect"},
    {"n": 3, "titolo": "Cosa abbiamo visto", "contenuto": "osservazioni specifiche sul loro digital"},
    {"n": 4, "titolo": "Come lo risolviamo", "contenuto": "servizio Domino più rilevante + approccio"},
    {"n": 5, "titolo": "Case study affine", "contenuto": "caso Domino più simile per settore/sfida"},
    {"n": 6, "titolo": "Next step proposto", "contenuto": "proposta concreta di primo incontro"}
  ],
  "linkedin": [
    {"giorno": 1, "tipo": "Connection request", "testo": "max 50 parole, personalizzato, nessun pitch"},
    {"giorno": 5, "tipo": "Follow-up con insight", "testo": "max 80 parole, porta valore settoriale"},
    {"giorno": 10, "tipo": "Invio contenuto", "testo": "max 80 parole, link a caso studio o articolo Domino"}
  ],
  "workflow": [
    {"giorno": 1, "canale": "LinkedIn", "azione": "Connection request al decision maker", "note": ""},
    {"giorno": 3, "canale": "Email", "azione": "Mail introduttiva pain-first", "note": ""},
    {"giorno": 5, "canale": "LinkedIn", "azione": "Follow-up con insight di settore", "note": ""},
    {"giorno": 8, "canale": "Email", "azione": "Invio deck personalizzato", "note": ""},
    {"giorno": 12, "canale": "Phone", "azione": "Chiamata con opening script", "note": "preparare 3 domande aperte"},
    {"giorno": 18, "canale": "LinkedIn", "azione": "Terzo messaggio con contenuto di valore", "note": ""},
    {"giorno": 22, "canale": "Email", "azione": "Follow-up finale con proposta sprint", "note": "proponi Design Sprint! o call esplorativa"}
  ]
}`, false, 4000);
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("JSON non valido nella risposta");
      const parsed = JSON.parse(raw.slice(start, end + 1));
      return res.status(200).json({ result: parsed });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
