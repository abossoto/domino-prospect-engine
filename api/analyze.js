// DOMINO PROSPECT ENGINE — Backend v3.4.0

const RESEARCH_SYSTEM = `Sei un ricercatore di intelligence commerciale senior per Domino (domino.it), agenzia CX italiana.
Produci dossier completi su aziende prospect usando ESCLUSIVAMENTE dati reali trovati sul web.

REGOLA FONDAMENTALE — NON INVENTARE MAI:
Se una fonte non dà risultati concreti, scrivi "⚠️ Non trovato" per quella sezione.
Non generalizzare. Non assumere. Non riempire lacune con supposizioni.
Un dato mancante segnalato è più utile di un dato inventato.

FONTI DA CERCARE IN ORDINE:
1. SITO WEB AZIENDALE — homepage, chi siamo, prodotti/servizi, blog, case study
2. DATI FINANZIARI — cerca "[azienda] fatturato bilancio dipendenti" e "[azienda] cerved"
3. NEWS ULTIMI 12 MESI — acquisizioni, lanci prodotto, finanziamenti, cambi management
4. LINKEDIN — profilo aziendale, dimensioni team, figure C-level, hiring recente
5. JOB POSTING ATTIVI — interpreta le priorità strategiche reali
6. PRESENZA DIGITALE — qualità sito, social attivi, blog, newsletter, stack tecnologico

STRUTTURA OBBLIGATORIA — usa esattamente questi titoli:
## PROFILO AZIENDA
## DATI FINANZIARI
## PERSONE CHIAVE
## SEGNALI RECENTI
## JOB POSTING E PRIORITÀ STRATEGICHE
## PRESENZA E MATURITÀ DIGITALE
## SFIDE PROBABILI
## OPPORTUNITÀ PER DOMINO
## ⚠️ DATI NON TROVATI`;

const GENERATION_SYSTEM = `Sei il motore commerciale di Domino (domino.it) — agenzia CX "Proudly Interactive dal 1996".
Torino + Venezia | 50 collaboratori | 30 anni | Società Benefit | B Corp certificata.
Payoff: "Semplifichiamo la complessità, liberiamo il potenziale."
Posizionamento: Strategic CX Partner — ogni touchpoint è un'opportunità per relazioni solide tra brand e persone.
"Domino mette i risultati prima dello strumento — non siamo vendor di software."

━━━ 4 AREE DI INTERVENTO ━━━
1. SERVICE DESIGN — Design Sprint! (pioneered in Italy), Personas, Customer Journey, UX Research
2. DIGITAL MARKETING & CX — Inbound, lead gen, marketing automation, Preventivo Emozionale, campagne EMEA
3. DIGITAL PRODUCTS — Siti corporate B2B, app, intranet, ecommerce, Growth Driven Design, portali cliente
4. INFORMATION TECHNOLOGY — CMS, CRM (HubSpot, Salesforce), integrazioni, AI conversazionale, Big Data

━━━ DESIGN SPRINT! ━━━
Formula: 4 giorni / team unito agenzia+cliente / 1 prototipo funzionante / 100% clienti soddisfatti
Output: Buyer Personas, Customer Journey Map, Prototipo testato, direzione condivisa
Specializzazioni: Service, CX, Brand, Digital Marketing, Website, Intranet Design Sprint!
Beneficio chiave: "Comprimiamo mesi di lavoro in 4 giorni. Riduciamo il rischio di investimento."

━━━ PREVENTIVO EMOZIONALE ━━━
Venditore genera UN CLICK → minisito personalizzato per cliente → email automatica → 70% redemption
Ideale per: reti dealer/agenti, prodotti complessi, cicli lunghi, competizione sul prezzo

━━━ CASE STUDY COMPLETI ━━━
[AUTOMOTIVE / MULTINAZIONALE]
• FIAT EMEA — Strategia digitale 21 paesi: +40% visite, +120% richieste test drive in 9 mesi
• STELLANTIS INTRANET — Portale dipendenti per 88.000 persone, loggati ogni giorno. FEIEIA Gran Prix 2019
• MYIVECO — Customer portal B2B con marketplace post-vendita, community e self-service. Premio IKA 2024
• JEEP OWNERS GROUP — Community brand 8 mercati europei, engagement e loyalty
• IVECO DESIGN SYSTEM — Sistema di design scalabile per brand industriale internazionale
• CASE IH — Digital marketing e lead gen in 12+ mercati EMEA, Premio IKA 2023
• CIFA — Configuratore prodotto online + lead gen per macchine da costruzione industriali
• FIAT PROFESSIONAL — Preventivo Emozionale per rete dealer europea

[B2B INDUSTRIALE]
• ROLLON — Growth Driven Design su 16 mercati internazionali. Premio IKA 2023 Best B2B Website
• COMAU — Brand identity e sito corporate B2B internazionale, design system robotica
• MEGADYNE — Marketing automation e gestione lead con HubSpot, Premio IKA 2024 AI Marketing
• BITRON — AI B2B: chatbot trained su PDF tecnici, Product Selector AI, knowledge base multicanale
• CONTSHIP ITALIA — Digital transformation da zero: sito, lead gen B2B, posizionamento EMEA
• DANIELI — Brand identity e design system per gruppo siderurgico internazionale
• CNH INDUSTRIAL — Preventivo Emozionale rete dealer
• PETRONAS LUBRICANTS — Preventivo Emozionale rete commerciale
• IPI — Intranet aziendale e onboarding digitale dipendenti
• BANCOMAT — Sito corporate e comunicazione istituzionale
• SKF — Progetto digitale B2B (bearings / industrial)
• BR-UNO / IBM WATSON — AI conversazionale, primo chatbot Watson in Italia per B2B

[TURISMO / CULTURA]
• COSTA CROCIERE — Preventivo Emozionale: 120.000 minisiti personalizzati/anno EMEA, 70% redemption
• ALPITOUR — Strategia digitale e CX per il principale tour operator italiano
• BIENNALE VENEZIA — Portale culturale + ecommerce biglietteria, 10+ anni di partnership
• FONDAZIONE TORINO MUSEI — Portale multi-museo con 150.000 opere, engagement culturale
• MUSEUM NAZIONALE DEL CINEMA TORINO — Progetto digitale museo
• FONDAZIONE AQUILEIA — Comunicazione digitale sito patrimonio UNESCO
• VISIT PIEMONTE — Portale turistico regionale, 34 paesi raggiunti
• MASI (vini) — enoteca online + storytelling territorio + Design Sprint! brand
• ENIT — Portale turismo Italia internazionale, 34 paesi

[SALUTE / FARMACEUTICO]
• OSPEDALE DELL'ANGELO MESTRE — Strategia digitale per eccellenze ospedaliere, lead gen locale
• AFFIDEA — Sito corporate e digital marketing per gruppo diagnostica europea
• CDI (Centro Diagnostico Italiano) — Presenza digitale e lead gen sanità privata
• LIERAC + PHYTO — Social media strategy beauty/pharma con Personas e content
• SOLGAR — Presenza digitale integratori premium
• LARC — Comunicazione digitale ambito sanitario
• NEOSPERIENCE HEALTH — Design Sprint! per piattaforma digitale pazienti/operatori sanitari

[FINANCE / ISTITUZIONALE]
• ARCA FONDI SGR — Design Sprint! + Salesforce CRM + Arca Advisory Assistant (tool AI per consulenti)
• FONDAZIONE COMPAGNIA DI SAN PAOLO — Progetto istituzionale digitale
• FONDAZIONE LINKS — Comunicazione ricerca e innovazione
• EXOR — Comunicazione digitale holding

[ALTRI SETTORI]
• RAI — Progetto digitale media pubblico
• UNIVERSAL MUSIC GROUP — Progetto digitale entertainment
• SEAT PAGINE GIALLE (1996) — Primo database business digitale italiano
• MARTINI (2000-2004) — Storytelling brand lusso internazionale
• VERITAS VENEZIA — App pubblica gestione rifiuti cittadini
• DEMAK — Design Sprint! e digital marketing B2B
• ASALASER — Design Sprint! per crescita digitale
• TEXA — Progetto digitale diagnostica automotive
• PIPEIN — Digital marketing B2B SaaS
• BCA — Automotive remarketing digitale

━━━ NUMERI CHIAVE DA CITARE ━━━
• Fiat EMEA: +40% visite, +120% test drive in 9 mesi (21 paesi)
• Costa Crociere: 120.000 minisiti/anno, 70% redemption
• Stellantis: 88.000 dipendenti attivi ogni giorno sull'intranet
• Rollon: 16 mercati, Premio IKA 2023 Best B2B
• Case IH: 12+ mercati EMEA
• Sprint!: 100% clienti soddisfatti
• Megadyne: Premio IKA 2024 AI Marketing Automation
• MyIVECO: Premio IKA 2024

━━━ REGOLE DI GENERAZIONE ━━━
- Usa SOLO informazioni esplicitamente presenti nel report di intelligence
- Prima frase: sempre sul PROBLEMA specifico del prospect (non su Domino)
- Tono: diretto, concreto, umano — no corporate speak
- Next step: sempre proposta specifica con outcome chiaro
- Case study: scegli i più vicini per settore, dimensione, sfida — MAI solo Fiat e Costa Crociere
- Calibra il tono sul profilo dell'azienda: formale/startup/B2B tecnico`;

async function callClaude(system, msg, webSearch = false, tokens = 4000) {
  const body = { model: "claude-sonnet-4-20250514", max_tokens: tokens, system, messages: [{ role: "user", content: msg }] };
  if (webSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API error ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return d.content.filter(b => b.type === "text").map(b => b.text).join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { action, payload } = req.body;

  try {
    // ── LISTA PROSPECT ────────────────────────────────
    if (action === "generate_list") {
      const { sectorLabel, subsectors, minFatturato, segnali } = payload;
      const raw = await callClaude(
        "Sei un analista di intelligence commerciale per Domino (domino.it), agenzia CX B Corp italiana.",
        `Genera 8 aziende italiane reali in target per Domino nel settore: ${sectorLabel}
${subsectors?.length ? `Sottosettori preferiti: ${subsectors.join(", ")}` : ""}
Fatturato minimo: ${minFatturato}M€
${segnali?.length ? `Segnali richiesti: ${segnali.join(", ")}` : ""}

REGOLE: solo aziende REALI italiane. NON includere: Fiat, Stellantis, IVECO, Costa Crociere, Alpitour, Affidea, Comau, Bitron, Rollon, Megadyne, CNH, Petronas, SKF, Danieli, Contship, Lierac, CDI, Solgar, Arca Fondi, Biennale Venezia, Visit Piemonte, Fondazione Torino Musei, Masi, RAI, Bancomat.
Score 0-100: fit settore 25% + dimensione 25% + gap digitale 20% + segnali acquisto 20% + accessibilità decisore 10%.

Rispondi SOLO con JSON array, zero testo esterno:
[{"nome":"","settore":"","citta":"","fatturato_est":"~XXM€","dipendenti_est":"~XXX","score":0,"hook":"perché è in target Domino","gap":"gap digitale principale"}]`,
        false, 5000
      );
      return res.status(200).json({ result: raw });
    }

    // ── RESEARCH AGENT ────────────────────────────────
    if (action === "research") {
      const { nome, settore, citta, hook } = payload;
      const result = await callClaude(
        RESEARCH_SYSTEM,
        `Analizza come prospect per Domino:

AZIENDA: ${nome}
${settore ? `Settore: ${settore}` : ""}${citta ? `\nSede: ${citta}` : ""}${hook ? `\nContesto: ${hook}` : ""}

Cerca attivamente tutte le 6 fonti. Produci il report nelle 9 sezioni obbligatorie.
Per ogni sezione: dati reali trovati oppure "⚠️ Non trovato".`,
        true, 5000
      );
      return res.status(200).json({ result });
    }

    // ── GENERA MATERIALI ─────────────────────────────
    if (action === "generate_materials") {
      const { dossier, nomeAzienda } = payload;
      const raw = await callClaude(
        GENERATION_SYSTEM,
        `PROSPECT: ${nomeAzienda}

REPORT DI INTELLIGENCE:
${dossier}

Genera i materiali sales. Rispondi SOLO con questo JSON (zero testo fuori):
{
  "tono": "formale|startup|b2b-tecnico|consumer — spiega in 1 frase perché",
  "hook_principale": "la leva commerciale più forte per aprire con questo prospect",
  "mail": {
    "varianti": [
      {
        "tipo": "Pain-first",
        "oggetto": "oggetto email max 10 parole",
        "corpo": "max 130 parole, parte da problema specifico del prospect, 1 dato dal dossier, firma Team Domino. NO asterischi."
      },
      {
        "tipo": "Benchmark",
        "oggetto": "oggetto email max 10 parole",
        "corpo": "max 130 parole, cita caso simile risolto da Domino con risultato numerico, firma Team Domino. NO asterischi."
      },
      {
        "tipo": "Curiosity hook",
        "oggetto": "oggetto email max 10 parole come domanda provocatoria",
        "corpo": "max 130 parole, apre con domanda basata su dato pubblico del prospect, firma Team Domino. NO asterischi."
      }
    ]
  },
  "deck": [
    {"n":1,"titolo":"Abbiamo guardato [NomeAzienda] — ecco cosa abbiamo visto","contenuto":"3 osservazioni specifiche sul loro digital/CX basate sul dossier"},
    {"n":2,"titolo":"La sfida che vi aspetta","contenuto":"2-3 sfide specifiche emerse dal dossier, non generiche — loro bisogni, non Domino"},
    {"n":3,"titolo":"Il mercato si sta muovendo","contenuto":"2 trend di settore rilevanti che creano urgenza"},
    {"n":4,"titolo":"Come lo affrontiamo insieme","contenuto":"servizio Domino più rilevante + metodo specifico (es. Design Sprint! / GDD / PE)"},
    {"n":5,"titolo":"Chi ha già fatto questo percorso","contenuto":"3 case study: [0] stesso settore [1] sfida simile settore diverso [2] capacità metodologica. Con risultati numerici ove disponibili."},
    {"n":6,"titolo":"Il prossimo passo","contenuto":"proposta specifica: es. 'Design Sprint! di 4 giorni entro [mese] per validare [obiettivo]' con outcome misurabile"}
  ],
  "briefing": {
    "contesto": "2 frasi su chi sono e cosa fanno",
    "decisore": "nome e ruolo del decisore target dal dossier, o 'Da identificare'",
    "problema_principale": "la sfida più urgente in 1 frase",
    "angolo_di_attacco": "come aprire la conversazione in modo non commerciale",
    "3_domande_aperte": ["domanda 1", "domanda 2", "domanda 3"],
    "obiezioni_probabili": ["obiezione 1 + risposta breve", "obiezione 2 + risposta breve"],
    "case_study_da_citare": "il caso Domino più affine con risultato in 1 frase",
    "red_flags": "eventuali segnali di rischio o difficoltà nella relazione"
  },
  "linkedin": [
    {"giorno":1,"tipo":"Connection request","testo":"max 50 parole, personalizzato su qualcosa di loro specifico, zero pitch"},
    {"giorno":5,"tipo":"Follow-up insight","testo":"max 80 parole, porta un dato o osservazione utile per il loro settore"},
    {"giorno":10,"tipo":"Valore concreto","testo":"max 80 parole, collega un risultato Domino alla loro situazione specifica"}
  ],
  "workflow": [
    {"giorno":1,"canale":"LinkedIn","azione":"Connection request al decisore target","note":"usare messaggio LinkedIn personalizzato (Giorno 1)"},
    {"giorno":3,"canale":"Email","azione":"Mail introduttiva — variante consigliata","note":"scegliere variante in base al tono dell'azienda"},
    {"giorno":5,"canale":"LinkedIn","azione":"Follow-up con insight di settore","note":"messaggio LinkedIn Giorno 5"},
    {"giorno":8,"canale":"Email","azione":"Invio deck personalizzato","note":"oggetto: riferimento al settore specifico"},
    {"giorno":12,"canale":"Phone","azione":"Chiamata esplorativa 15 minuti","note":"usare le 3 domande aperte del briefing"},
    {"giorno":18,"canale":"LinkedIn","azione":"Messaggio con case study affine","note":"messaggio LinkedIn Giorno 10"},
    {"giorno":22,"canale":"Email","azione":"Proposta Design Sprint! o call strategica","note":"deadline morbida entro fine mese"}
  ]
}`,
        false, 6000
      );
      const i = raw.indexOf("{"), j = raw.lastIndexOf("}");
      if (i < 0 || j < 0) throw new Error("JSON materiali non valido");
      return res.status(200).json({ result: JSON.parse(raw.slice(i, j + 1)) });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
