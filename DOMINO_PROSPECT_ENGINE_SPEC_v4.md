# DOMINO PROSPECT ENGINE — Specifiche Complete
## Versione sorgente: v4.1.0 (App.jsx) / Versione brain: 5.1

> Documento generato dalla lettura diretta del codice sorgente. Sufficiente per ricreare il sistema identico.

> **Principio architetturale.** Tutte le informazioni canoniche su Domino (identità, servizi, metodi, prezzi, case, settori, GTM verticali, referenze) vivono nei file `.md` della cartella `brain/`. Questa spec **non è una fonte autoritativa** su quei contenuti: dove cita prodotti, prezzi o regole è solo per fornire al modello un *anchor* anti-allucinazione nel system prompt. La fonte canonica resta il brain. Quando il brain cambia, le sezioni 6 (system prompt), 6a (istruzioni GTM) e 22 (descrizione brain) di questa spec vanno riallineate — le altre sezioni dovrebbero restare stabili.

---

## 1. PANORAMICA

Sales intelligence tool interno per il team commerciale di Domino (domino.it). Inserito il nome (o URL) di un'azienda prospect, esegue ricerche web reali con un research agent agentico (multi-turn, fino a 20 iterazioni) e genera: dossier di intelligence strutturato, mail di primo contatto, deck 5 slide, workflow multicanale 14 giorni, messaggio LinkedIn. Export PPT nativo. Integrazione HubSpot CRM. Archivio locale. Modalità lista prospect con scoring.

**v4.0 — Novità principali:**
- **Brain completo a 11 file** — il loader carica tutti i file della cartella `brain/` a runtime, inclusi i 5 nuovi file GTM di settore (07–11). Nessun file hardcodato.
- **Caching del brain** — il brain viene caricato e concatenato una volta sola per processo (in-memory cache) per ridurre I/O e velocizzare le chiamate successive.
- **Domino GTM a 3 livelli** — sostituisce il framework Adobe a 5 layer con tre livelli reali della vendita B2B: C-Level, Head of, Manager/Operativo. Ciascuno con frame commerciale dedicato.
- **Nomenclatura corretta** — tutti i nomi di prodotti/metodi Domino rispecchiano il brain v5.1: `Core Sprint!` (NON "Foundation Sprint"), `Design Sprint!` con la variante di punta 2026 `Brain & Identity Design Sprint!`, `Build Sprint!` (sostituisce la voce storica "Progetto completo"), `Trainstorming!` (oggi anche servizio venduto, da €15K), `Preventivo Emozionale`. Cornice trasversale: **Decision Design**.
- **Exponential backoff** — retry automatico su errori 429/529 con messaggio all'utente.
- **Logo Domino** da domino.it con fallback testuale.
- **Architettura generation** — brain nel messaggio utente (non nel system prompt) per garantire JSON completo e non troncato.
- **parseJSON con normalizzazione** — tutti i campi del JSON vengono validati e completati con default prima di restituire la risposta.

---

## 2. STRUTTURA FILE DEL PROGETTO

```
/
├── api/
│   ├── analyze.js          → Research agent + generazione materiali (Domino GTM 3 livelli)
│   └── prospect-list.js    → Generazione lista prospect qualificata
├── brain/                  → 11 file .md caricati a runtime (aggiornabili senza toccare il codice). Sincronizzato da OneDrive via scripts/sync-brain.sh.
│   ├── 01_domino_identita.md       → Chi siamo, payoff, storia, contatti
│   ├── 02_domino_servizi.md        → 4 aree servizi, stack tech, scenari I5.0
│   ├── 03_domino_metodi.md         → Catalogo 2026: Core Sprint!, Design Sprint! (+ Brain & Identity), Build Sprint!, Trainstorming!, Preventivo Emozionale, pricing
│   ├── 04_domino_case_history.md   → Tutti i case study con KPI
│   ├── 05_domino_settori.md        → Pain point e approccio per verticale
│   ├── 06_domino_referenze.md      → Premi IKA, Sortlist, testimonianze clienti
│   ├── 07_domino_gtm_b2b.md        → Sales play B2B industriale / manifatturiero
│   ├── 08_domino_gtm_salute_beauty.md → Sales play Salute, Sanità, Beauty
│   ├── 09_domino_gtm_turismo_cultura.md → Sales play Turismo & Cultura
│   ├── 10_domino_gtm_finance_pa.md → Sales play Finance, Assicurazioni, PA
│   └── 11_domino_gtm_automotive.md → Sales play Automotive
├── scripts/
│   └── sync-brain.sh       → rsync OneDrive → brain/ + auto-commit + push (lanciato da launchd ogni 10 min)
├── src/
│   ├── App.jsx             → Frontend React completo
│   └── main.jsx            → Entry point React
├── index.html              → HTML shell (background #0a0a0a, lang="it")
├── package.json            → dipendenze
├── vite.config.js          → Vite + proxy /api → localhost:3000
├── vercel.json             → routing Vercel + maxDuration functions
├── DOMINO_PROSPECT_ENGINE_SPEC_v4.md → questa spec (root, fuori da brain/ perché non è contenuto Domino)
└── CLAUDE.md               → istruzioni per Claude Code che lavora sul repo
```

**Principio chiave del brain:** il loader legge **tutti i file `.md` presenti nella cartella `brain/`** a runtime, ordinati per nome. Aggiungere un nuovo file brain non richiede modifiche al codice. Il brain è cached in memoria per il ciclo di vita del processo Vercel.

**Sync OneDrive → repo (v4.1):** Il brain canonico vive su OneDrive in `Documenti/Claude/Projects/Domino Brain/`. `scripts/sync-brain.sh` (lanciato ogni 10 min da un LaunchAgent macOS) fa rsync one-way OneDrive → `brain/`, auto-committa cambi e pusha su `origin/main`. La spec è esclusa dal brain perché descrive l'app, non i contenuti Domino.

---

## 3. CONFIGURAZIONE

### package.json
```json
{
  "name": "domino-prospect-engine",
  "version": "4.0.0",
  "type": "module",
  "private": true,
  "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" },
  "dependencies": {
    "pptxgenjs": "^3.12.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^5.4.10"
  }
}
```

### vite.config.js
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { include: ['pptxgenjs'] },
  server: {
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } }
  }
});
```

### vercel.json
```json
{
  "framework": "vite",
  "functions": {
    "api/analyze.js": { "maxDuration": 300 },
    "api/prospect-list.js": { "maxDuration": 300 }
  },
  "rewrites": [{ "source": "/api/(.*)", "destination": "/api/$1" }]
}
```

`maxDuration: 300` (cap Pro plan) serve perché il research agent agentico con Sonnet 4.6 + web_search può raggiungere ~3-4 min su prospect complessi. Era 60 in v4.0 ma con Sonnet 4.6 sforava sistematicamente.

### Variabile d'ambiente Vercel
`ANTHROPIC_API_KEY` → necessaria per entrambe le functions API.

---

## 4. BACKEND — api/analyze.js

### Brain loader con caching
Il brain viene letto dalla cartella `brain/` una sola volta per ciclo di vita del processo (in-memory cache). I file vengono letti in ordine alfabetico per nome e concatenati con separatore `\n\n---\n\n`.

```js
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// In-memory cache — il brain non cambia durante il ciclo di vita del processo
let _brainCache = null;

function loadBrain() {
  if (_brainCache) return _brainCache;
  const brainDir = join(process.cwd(), 'brain');
  const files = readdirSync(brainDir)
    .filter(f => f.endsWith('.md'))
    .sort(); // ordine alfabetico garantisce sequenza 01–11
  _brainCache = files.map(f => {
    try { return readFileSync(join(brainDir, f), 'utf-8'); }
    catch { return `[ATTENZIONE: file brain/${f} non trovato]`; }
  }).join('\n\n---\n\n');
  return _brainCache;
}
```

**Vantaggio del caching:** con 11 file da ~200 righe ciascuno, il caricamento costa ~10ms la prima volta e zero le successive, riducendo la latenza delle chiamate API multiple nello stesso processo.

### Claude API helper — exponential backoff
```js
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function callClaude({ system, messages, tools, max_tokens = 8000 }) {
  const body = { model: 'claude-sonnet-4-6', max_tokens, system, messages, output_config: { effort: 'low' } };
  if (tools?.length) body.tools = tools;

  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    // Overloaded (529) o rate limited (429) → backoff esponenziale
    if (res.status === 529 || res.status === 429) {
      if (attempt >= MAX_RETRIES)
        throw new Error('OVERLOADED:Claude è sovraccarico. Riprova tra qualche minuto.');
      const retryAfter = parseInt(res.headers.get('retry-after') || '0', 10);
      const backoff = retryAfter > 0
        ? retryAfter * 1000
        : Math.min(1000 * Math.pow(2, attempt), 32000);
      await sleep(backoff);
      continue;
    }
    // Errori server transitori → retry max 2 volte
    if (res.status >= 500 && res.status !== 529) {
      if (attempt >= 2)
        throw new Error(`OVERLOADED:Errore temporaneo del server (${res.status}). Sto riprovando…`);
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e?.error?.message || `Claude API ${res.status}`);
    }
    return res.json();
  }
}
```

**Nota:** gli errori `OVERLOADED:` vengono intercettati dal frontend che mostra il messaggio all'utente e ritenta con backoff lato client (4s, 8s, 16s).

**Modello e effort (v4.1):** Il modello è `claude-sonnet-4-6` (Sonnet 4.6, GA). `output_config: { effort: 'low' }` è settato esplicitamente perché Sonnet 4.6 di default usa `effort: 'high'` che fa thinking aggressivo, sforando il budget di 300s nel loop agentico. `low` allinea la latenza a quella di Sonnet 4.0 (modello precedente, in deprecation con retire previsto 15-giu-2026).

### Research Agent — loop agentico multi-turn
```js
async function runResearch(prospect, note) {
  const webSearch = { type: 'web_search_20250305', name: 'web_search' };
  const userContent = `Produci dossier su: "${prospect}"${note ? `\nNote: ${note}` : ''}`;
  let messages = [{ role: 'user', content: userContent }];
  let data = await callClaude({ system: RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });

  let i = 0;
  while (data.stop_reason === 'tool_use' && i < 8) {
    i++;
    const toolBlocks = data.content.filter(b => b.type === 'tool_use');
    if (!toolBlocks.length) break;
    messages = [...messages, { role: 'assistant', content: data.content }];

    const feedback =
      i < 4 ? 'Continua — cerca ancora LinkedIn per nomi manager e Cerved per dati finanziari.' :
      i < 6 ? 'Approfondisci job posting e presenza digitale, poi produci il report.' :
              'Hai abbastanza dati. Produci il report finale completo con tutte le sezioni.';

    const results = toolBlocks.map(b => ({ type: 'tool_result', tool_use_id: b.id, content: feedback }));
    messages = [...messages, { role: 'user', content: results }];
    data = await callClaude({ system: RESEARCH_SYSTEM, messages, tools: [webSearch], max_tokens: 8000 });
  }
  return extractText(data);
}
```

### Flusso principale handler

```
POST /api/analyze  { prospect: string, note?: string, layer?: string, motion?: string }
  1. loadBrain()                         → carica 11 file .md (da cache se già caricati)
  2. runResearch(prospect, note)          → research agent agentico (max 20 iterazioni)
  3. buildGenerationSystem(layer, motion) → system prompt compatto (regole + GTM)
  4. buildUserMessage(brain, prospect, report) → brain + report nel messaggio utente
  5. callClaude(genSystem, userMsg)       → genera JSON materiali (max_tokens: 10000)
  6. parseJSON() + normalizzazione       → JSON validato con default per ogni campo
  7. result.fonti_ricerca = report        → allegato report grezzo
  8. return JSON result
```

**Valori default:** `layer = 'headof'`, `motion = 'bottomup'` se non specificati.

**Architettura generation:** il brain va nel messaggio utente (non nel system prompt) per evitare che l'enorme contesto del brain interferisca con la generazione del JSON. Il system prompt rimane compatto con sole regole e istruzioni GTM.

---

## 5. SYSTEM PROMPT — RESEARCH_SYSTEM (completo)

```
Sei un analista di intelligence commerciale senior per Domino, agenzia CX italiana.
Produci un dossier completo e preciso su un'azienda prospect usando ESCLUSIVAMENTE dati reali trovati sul web.

REGOLA FONDAMENTALE — MAI INVENTARE:
Se una fonte non dà risultati concreti, scrivi "⚠️ Non trovato" per quella sezione.
Un dato mancante segnalato è più utile di un dato inventato.
Se i dati trovati sono pochi, segnala la scarsezza esplicitamente.

FONTI DA CERCARE IN ORDINE:

1. SITO WEB AZIENDALE
   - Leggi homepage + chi siamo + prodotti/servizi + case study
   - Estrai: mission, prodotti/servizi chiave, mercati, clienti nominati, valori
   - Valuta qualità sito: design, CTA, lead generation, blog, newsletter, area riservata

2. DATI FINANZIARI ITALIANI
   - Query: "[azienda] fatturato bilancio dipendenti", "[azienda] site:cerved.com",
     "[azienda] Registro Imprese CCIAA", "[azienda] annual report risultati finanziari"
   - Estrai: forma giuridica, anno fondazione, fatturato ultimo anno, dipendenti, ATECO, rating
   - Se non trovi nulla: "⚠️ Dati finanziari non trovati pubblicamente"

3. NEWS E COMUNICATI (ultimi 12 mesi)
   - Query: "[azienda] news 2024 2025", "[azienda] comunicato stampa acquisizione partnership"
   - Estrai eventi con date precise. Se nulla: "⚠️ Nessuna news rilevante trovata"

4. LINKEDIN
   - Cerca profilo aziendale + persone chiave (CEO, CMO, CDO, Dir. Marketing/Commerciale/Digital/CX)
   - Per ogni persona: nome completo, ruolo, anzianità
   - Se non accessibili: "⚠️ Profili LinkedIn non accessibili"

5. JOB POSTING ATTIVI
   - Query: "[azienda] lavora con noi offerte lavoro", "[azienda] site:linkedin.com/jobs"
   - Interpreta cosa rivelano strategicamente
   - Se nulla: "⚠️ Nessun job posting trovato"

6. PRESENZA DIGITALE E SOCIAL
   - Valuta sito, social attivi, frequenza post, blog, newsletter
   - Rating maturità: Bassa / Media / Alta con motivazione concreta

Fai almeno 8-10 ricerche. Quando trovi un URL rilevante, leggi la pagina intera.

STRUTTURA OBBLIGATORIA DEL REPORT:
## PROFILO AZIENDA
## DATI FINANZIARI
## PERSONE CHIAVE
## SEGNALI RECENTI (ultimi 12 mesi)
## JOB POSTING E PRIORITÀ STRATEGICHE
## PRESENZA E MATURITÀ DIGITALE
## SFIDE PROBABILI
## OPPORTUNITÀ PER DOMINO
## ⚠️ DATI NON TROVATI (obbligatoria — guida la ricerca manuale del commerciale)
```

---

## 6. SYSTEM PROMPT — GENERATION_SYSTEM

**Architettura (v4.1):** il system prompt è passato come **array di 2 blocchi**, non come stringa. Il primo blocco contiene il brain (~60K token, stabile across requests) con `cache_control: { type: 'ephemeral' }` per attivare il prompt caching Anthropic. Il secondo blocco contiene regole, istruzioni GTM (variabili per layer/motion) e schema JSON. Il messaggio utente contiene solo prospect + layer + motion + report di intelligence.

Beneficio del caching: alla 2ª chiamata entro 5 min con stesso brain, il primo blocco viene servito a ~10% del costo invece che riprocessato. Break-even a 2 chiamate.

```js
function buildGenerationSystem(brain, layer, motion) {
  const layerInstr = GTM_LAYER_INSTRUCTIONS[layer] || GTM_LAYER_INSTRUCTIONS.headof;
  const motionInstr = GTM_MOTION_INSTRUCTIONS[motion] || GTM_MOTION_INSTRUCTIONS.bottomup;

  const rest = `Sei il generatore di materiali sales di Domino (domino.it), agenzia CX italiana.
Ricevi il Domino Brain (documenti interni) e un report di intelligence su un prospect.
Il tuo compito: produrre materiali sales personalizzati in formato JSON.

REGOLE FONDAMENTALI:
- Usa SOLO informazioni dal report di intelligence — zero invenzioni
- Prima frase sempre sul PROBLEMA del prospect, mai sui servizi di Domino
- Se il report menziona un nome specifico, usalo nella mail e nel LinkedIn
- Se il report cita una notizia recente, agganciatici nell'hook
- Seleziona 2-3 elementi Domino rilevanti per QUEL prospect, non elencare tutto
- Tono diretto, concreto, umano — non da template
- Next step sempre specifico ("30 minuti per capire se c'è fit")

NOMI PRODOTTI DOMINO — USARE ESATTAMENTE QUESTI NOMI (fonte canonica: brain/03_domino_metodi.md, sezione "Catalogo 2026"):
- "Core Sprint!" (€6.000) — NON "Foundation Sprint" (linguaggio startup, noi serviamo enterprise)
- "Design Sprint!" (€10.000) — con le specializzazioni:
  Service Design Sprint! / CX Design Sprint! / Brand Design Sprint! /
  Digital Marketing Design Sprint! / Website Design Sprint! / Intranet Design Sprint! /
  Brain & Identity Design Sprint! (variante di punta 2026 — fondamenta brain aziendale + design system)
- "Build Sprint!" (€20.000–60.000) — esecuzione a blocchi di 2 settimane o 1 mese, perimetro aperto. Sostituisce la voce storica "Progetto completo".
- "Trainstorming!" (a partire da €15.000) — percorso change management 12 mesi (3 sessioni, una ogni 4). Era rituale interno dal 2010, dal 2026 è anche servizio venduto.
- "Preventivo Emozionale" — NON "preventivo emozionale" minuscolo
- "Audit tattico" (€1.500) — entry point, scope fisso 1–2 settimane

SCALA COMMERCIALE 2026 (catalogo a 6 prodotti — fonte: brain/03_domino_metodi.md):
Audit tattico (€1.500) → Core Sprint! (€6K) → Design Sprint! (€10K, variante di punta Brain & Identity) → Build Sprint! (€20K–60K) → Trainstorming! (da €15K, in parallelo o a valle)
Percorso pre-esecuzione tipico: Core Sprint! → Design Sprint! = €16.000 prima del Build Sprint!.

CORNICE TRASVERSALE (fonte: brain/02_domino_servizi.md, sezione "Decision Design — Il cuore del nostro lavoro"):
Decision Design = progettazione delle conseguenze (trade-off, scenari, effetti a 6-12 mesi). Slogan: "da come si naviga a come si sceglie". Citarlo quando il prospect ha bisogno di una cornice strategica — non come tool, come postura.

CASE STUDY — REGOLA DEI 3:
[0] Il più affine: stesso settore O stessa sfida specifica. Spiega PERCHÉ in 1 frase. Includi KPI.
[1] Stesso settore o simile: mostra expertise verticale. Includi KPI.
[2] Metodologia specifica rilevante: Design Sprint! (incluse le sue varianti, p.es. Brain & Identity), Build Sprint!, Preventivo Emozionale, GEO, AI B2B, Internal Comm.
MAI usare solo Fiat e Costa Crociere — usa l'intero repertorio del Brain.

BADGE STRUMENTI — logica di selezione:
- core_sprint: stakeholder divisi, direzione non chiara, mancanza di allineamento interno
- design_sprint_tipo — UNO tra: Service / CX / Brand / Digital Marketing / Website / Intranet / Brain & Identity
  (Brain & Identity è la variante di punta 2026: usarla quando il prospect ha bisogno di fondamenta — brain aziendale interrogabile via AI e/o design system riutilizzabile — prima dei prodotti applicativi)
- preventivo_emozionale: ciclo vendita lungo, rete indiretta, prodotto complesso

REFERENZE: usa 06_domino_referenze.md. Cita premi IKA per automotive/B2B, testimonianze Sortlist
per prospect scettici, certificazione B Corp per sensibilità ESG. Una sola referenza pertinente.

SALES PLAY: usa il file GTM del settore del prospect (07–11).
Cita audit tattici (€1.500) e sales play specifici del verticale quando rilevanti.

━━━ ISTRUZIONI GTM ━━━
${layerInstr}

${motionInstr}

OUTPUT: ESCLUSIVAMENTE JSON puro. Zero testo prima o dopo. Zero markdown. Zero backtick.
Schema obbligatorio — tutti i campi devono essere presenti:
{
  "prospect": {
    "nome": string, "settore": string, "dimensione": "PMI|Mid-market|Enterprise",
    "fatturato_stimato": string|null, "mercati": string,
    "persone_chiave": [{"nome": string, "ruolo": string, "anzianita": string}],
    "segnali_recenti": [string], "sfide_probabili": [string, string, string],
    "maturita_digitale": "Bassa|Media|Alta — motivazione",
    "decisore_target": string,
    "hook": string,
    "strumenti_suggeriti": {
      "core_sprint": bool,
      "design_sprint_tipo": "Service|CX|Brand|Digital Marketing|Website|Intranet|Brain & Identity|null",
      "design_sprint_motivazione": string|null,
      "preventivo_emozionale": bool,
      "preventivo_emozionale_motivazione": string|null
    },
    "casi_studio": [
      {"cliente": string, "progetto": string, "kpi": string, "perche_affine": string, "tipo": "affine"},
      {"cliente": string, "progetto": string, "kpi": string, "perche_affine": string, "tipo": "settore"},
      {"cliente": string, "progetto": string, "kpi": string, "perche_affine": string, "tipo": "metodologia"}
    ]
  },
  "mail": {"oggetto": string, "corpo": string},
  "deck": {
    "slide_1_titolo": string, "slide_1_contenuto": string,
    "slide_2_titolo": string, "slide_2_contenuto": string,
    "slide_3_titolo": string, "slide_3_contenuto": string,
    "slide_4_titolo": string, "slide_4_contenuto": string,
    "slide_5_titolo": string, "slide_5_contenuto": string
  },
  "workflow": [
    {"giorno": 1, "canale": "LinkedIn|Email|Telefono", "azione": string},
    {"giorno": 3, "canale": "...", "azione": string},
    {"giorno": 7, "canale": "...", "azione": string},
    {"giorno": 10, "canale": "...", "azione": string},
    {"giorno": 14, "canale": "...", "azione": string}
  ],
  "linkedin": {"tipo": "Richiesta connessione|InMail", "messaggio": string}
}`;

  return [
    { type: 'text', text: brain, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: rest },
  ];
}
```

`buildUserMessage` non esiste più in v4.1. Il messaggio utente è costruito inline al call site:

```js
const genData = await callClaude({
  system: buildGenerationSystem(brain, layer, motion),
  messages: [{ role: 'user', content: `Prospect: "${prospect}"\nLayer: ${layer} | Motion: ${motion}\n\nReport:\n${researchReport}\n\nGenera i materiali. Solo JSON puro.` }],
  max_tokens: 6000,
});
```

Il brain non passa più nel messaggio utente — vive nel primo blocco system con cache_control.

---

## 6a. DOMINO GTM — 3 LIVELLI (sostituisce Adobe GTM 5 layer)

### Logica commerciale

Il GTM Domino semplifica il framework Adobe a 5 layer in 3 livelli reali della vendita B2B italiana. Non è una sequenza temporale: è la scelta del frame comunicativo in base a **chi è il destinatario** e **cosa vuole sentirsi dire**.

| Livello | Interlocutore | Frame | Bisogno reale |
|---|---|---|---|
| **C-Level** | CEO / CIO / DG | "Il digitale come leva strategica" | Essere ispirato, vedere pattern di successo nel settore |
| **Head of** | Director / VP / Resp. area | "Questa è la scelta giusta — rischio zero" | Munizioni per convincere il CEO sopra e non creare problemi al team sotto |
| **Manager** | Resp. progetto / Specialista | "I feel your pain — lavorerai meno e meglio" | Certezza sul processo, meno carico di lavoro, nessuna sorpresa |

### GTM_LAYER_INSTRUCTIONS (in api/analyze.js)

```js
const GTM_LAYER_INSTRUCTIONS = {

  clevel: `LAYER GTM: C-Level (CEO / CIO / DG)
FRAME: "Il digitale è leva strategica per il tuo business — ecco come altri come te l'hanno usata."
Il CEO non vuole essere venduto: vuole essere ispirato e vedere pattern di successo nel suo settore.
Non parlargli di tool, metodi o agenzie — parlagli di transizioni, opportunità e rischio competitivo.

MAIL:
- Oggetto: osservazione strategica sul settore o momento di mercato, mai "vi proponiamo"
- Apertura: contesto Industry 5.0, transizione digitale, pressione competitiva nel loro verticale
- Corpo: 3-4 righe max. Osservazione acuta + 1 case di impatto nello stesso settore (risultato business)
- CTA: call esplorativa 30 min sul tema — non su Domino, non su un progetto specifico
- Tono: pari a pari. Mai "siamo felici di presentarvi". Mai "vi offriamo".

DECK (5 slide):
- Slide 1: contesto — cosa sta cambiando nel loro settore (dati reali dal report)
- Slide 2: sfida strategica — rischio o opportunità
- Slide 3: come aziende simili l'hanno affrontata — 2 case stesso settore con impatto business
- Slide 4: approccio Domino — visione, B Corp, 30 anni, metodo (NO lista servizi tecnici)
- Slide 5: next step — call esplorativa, zero commitment

WORKFLOW (3 touch, 3 settimane):
- Gg1 [Email]: mail di visione personalizzata sul settore
- Gg8 [LinkedIn]: condividi articolo/ricerca rilevante sul tema — zero pitch Domino
- Gg18 [Email]: follow-up diretto, proponi 30 min di confronto`,

  headof: `LAYER GTM: Head of (Director / VP / Responsabile area)
FRAME: "Questa è la scelta giusta — te lo dimostriamo prima di spendere. Se va storto, siamo noi il problema."
L'Head of ha DUE fronti: convincere il CEO sopra e non creare problemi al team sotto.
Bisogno reale: ridurre il rischio percepito e avere munizioni per la vendita interna.
Non parlargli di visione né di operatività: parlagli di credibilità e metodo.

MAIL:
- Oggetto: pain point specifico del settore formulato come domanda o osservazione concreta
- Apertura: dato o osservazione dal report che dimostra che conosci il loro mondo
- Corpo: collega il problema a come Domino l'ha risolto per qualcuno di simile + KPI.
  Menziona il Core Sprint! come modo per validare prima di investire (€6.000, settimana).
- CTA: call 30 min per capire il loro contesto — non per presentare Domino
- Tono: consulenziale, specifico, orientato a ridurre il rischio.

DECK (5 slide):
- Slide 1: loro settore oggi — dinamiche e pressioni (personalizzato dal report)
- Slide 2: 3 pain point più comuni nel verticale — insight non ovvio che dimostra expertise
- Slide 3: come [cliente affine] l'ha risolto con Domino — case con KPI e contesto simile
- Slide 4: Core Sprint! — validare in una settimana prima di investire il budget (€6.000)
- Slide 5: next step — Core Sprint! o Design Sprint! come primo passo a basso rischio

WORKFLOW (4 touch, 4 settimane):
- Gg1 [Email]: mail settore personalizzata
- Gg7 [LinkedIn]: case study PDF cliente più affine — no pitch
- Gg16 [Email]: proponi Core Sprint! con descrizione e investimento indicativo (€6.000)
- Gg26 [Telefono]: follow-up diretto "ha senso parlarne?"`,

  manager: `LAYER GTM: Manager / Operativo (Resp. progetto / Specialista / Resp. tecnico)
FRAME: "I feel your pain — lavorare con Domino è più semplice di quanto pensi. Lavorerai meno e meglio."
Il manager teme: riunioni infinite, brief che cambiano, deliverable che tornano, il progetto che diventa il suo problema per mesi.
Dagli certezza sul processo — guidate voi, il metodo funziona.
IMPORTANTE: usa i file GTM di settore (07–11) per citare sales play e audit tattici (€1.500) specifici.

MAIL:
- Oggetto: tecnico e specifico sul loro problema operativo (dal report)
- Apertura: osservazione concreta sulla loro situazione attuale (sito, tool, processi)
- Corpo: come Domino gestisce il processo in modo che lui lavori meno, non di più.
  1 risultato concreto (metrica). Menziona l'Audit tattico se pertinente (€1.500, 1–2 settimane).
- CTA: call tecnica 20 min — proponi tu l'agenda concreta
- Tono: diretto, pratico, tra professionisti. Niente filosofia. Parla di process, tool, timeline.

DECK (5 slide):
- Slide 1: analisi loro situazione attuale — cosa funziona e cosa no (dati reali dal report)
- Slide 2: come lavora Domino — il metodo in pratica, chi fa cosa, cosa si chiede al cliente
- Slide 3: risultati per clienti simili — metriche operative, non solo business outcomes
- Slide 4: Audit tattico o Design Sprint! — scope fisso, timeline definita, zero ambiguità (€1.500 o €10.000)
- Slide 5: come sarà lavorare insieme — ruoli chiari, un interlocutore, nessuna sorpresa

WORKFLOW (4 touch, 3 settimane — veloci, i manager decidono in fretta):
- Gg1 [Email]: mail operativa con osservazione specifica
- Gg5 [LinkedIn]: risorsa utile (checklist, audit gratuito, articolo pratico) — no pitch
- Gg12 [Email]: proponi Audit tattico (€1.500) o call tecnica con agenda precisa
- Gg18 [Telefono]: follow-up diretto`,
};
```

### GTM_MOTION_INSTRUCTIONS (invariato)

```js
const GTM_MOTION_INSTRUCTIONS = {
  bottomup: `MOTION GTM: BOTTOM-UP (contatto freddo o inbound)
- Il destinatario non ti conosce: guadagnati la fiducia prima di tutto.
- Inizia SEMPRE con il loro problema o contesto — mai con Domino.
- Usa le referenze come prova di credibilità, non come name-dropping.
- CTA = proporre una conversazione, non una vendita.`,

  topdown: `MOTION GTM: TOP-DOWN (entri con referenza CEO/evento — già "pre-venduto")
- Salta l'introduzione di Domino: vai direttamente al tema operativo.
- Apri mail e LinkedIn con "Su indicazione di [referente]..." o "Dopo il nostro incontro a [evento]...".
- Tono: stai già lavorando insieme, non ti stai presentando.
- CTA operativa: definire il perimetro del progetto, non conoscersi.`,
};
```

---

## 7. parseJSON — normalizzazione completa

Il JSON viene parsato e poi tutti i campi vengono normalizzati con default sicuri. Questo previene crash del frontend anche se il modello omette campi opzionali.

```js
function parseJSON(text) {
  let clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  let parsed = null;
  try { parsed = JSON.parse(clean); } catch {}
  if (!parsed) {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end > start)
      try { parsed = JSON.parse(clean.slice(start, end + 1)); } catch {}
  }
  if (!parsed) throw new Error('Risposta non strutturata dal modello. Riprova.');

  // Normalizzazione — garantisce che tutti i campi esistano
  const p = parsed.prospect || {};
  parsed.prospect = {
    nome: p.nome || 'N/D',
    settore: p.settore || 'N/D',
    dimensione: p.dimensione || 'N/D',
    fatturato_stimato: p.fatturato_stimato || null,
    mercati: p.mercati || 'N/D',
    persone_chiave: Array.isArray(p.persone_chiave) ? p.persone_chiave : [],
    segnali_recenti: Array.isArray(p.segnali_recenti) ? p.segnali_recenti : [],
    sfide_probabili: Array.isArray(p.sfide_probabili) ? p.sfide_probabili : [],
    maturita_digitale: p.maturita_digitale || 'N/D',
    decisore_target: p.decisore_target || 'N/D',
    hook: p.hook || '',
    strumenti_suggeriti: p.strumenti_suggeriti || {},
    casi_studio: Array.isArray(p.casi_studio) ? p.casi_studio : [],
  };
  const m = parsed.mail || {};
  parsed.mail = { oggetto: m.oggetto || '', corpo: m.corpo || '' };
  const d = parsed.deck || {};
  parsed.deck = {
    slide_1_titolo: d.slide_1_titolo || '', slide_1_contenuto: d.slide_1_contenuto || '',
    slide_2_titolo: d.slide_2_titolo || '', slide_2_contenuto: d.slide_2_contenuto || '',
    slide_3_titolo: d.slide_3_titolo || '', slide_3_contenuto: d.slide_3_contenuto || '',
    slide_4_titolo: d.slide_4_titolo || "Chi l'ha fatto con noi", slide_4_contenuto: d.slide_4_contenuto || '',
    slide_5_titolo: d.slide_5_titolo || '', slide_5_contenuto: d.slide_5_contenuto || '',
  };
  parsed.workflow = Array.isArray(parsed.workflow) ? parsed.workflow : [];
  const li = parsed.linkedin || {};
  parsed.linkedin = { tipo: li.tipo || 'InMail', messaggio: li.messaggio || '' };
  return parsed;
}
```

---

## 8. OUTPUT JSON — STRUTTURA COMPLETA

Il JSON è invariato rispetto alla v3, con un'unica modifica: `foundation_sprint` → `core_sprint` nei badge strumenti.

```json
{
  "prospect": {
    "nome": "string",
    "settore": "string",
    "dimensione": "PMI | Mid-market | Enterprise",
    "fatturato_stimato": "string | null",
    "mercati": "string",
    "persone_chiave": [{ "nome": "string", "ruolo": "string", "anzianita": "string" }],
    "segnali_recenti": ["string"],
    "sfide_probabili": ["string", "string", "string"],
    "maturita_digitale": "Bassa | Media | Alta — motivazione concreta",
    "decisore_target": "string",
    "hook": "string — osservazione specifica su dato reale trovato",
    "strumenti_suggeriti": {
      "core_sprint": true,
      "design_sprint_tipo": "Service | CX | Brand | Digital Marketing | Website | Intranet | Brain & Identity | null",
      "design_sprint_motivazione": "string | null",
      "preventivo_emozionale": true,
      "preventivo_emozionale_motivazione": "string | null"
    },
    "casi_studio": [
      { "cliente": "string", "progetto": "string", "kpi": "string", "perche_affine": "string", "tipo": "affine" },
      { "cliente": "string", "progetto": "string", "kpi": "string", "perche_affine": "string", "tipo": "settore" },
      { "cliente": "string", "progetto": "string", "kpi": "string", "perche_affine": "string", "tipo": "metodologia" }
    ]
  },
  "mail": { "oggetto": "string", "corpo": "string — max 150 parole" },
  "deck": {
    "slide_1_titolo": "string", "slide_1_contenuto": "string",
    "slide_2_titolo": "string", "slide_2_contenuto": "string",
    "slide_3_titolo": "string", "slide_3_contenuto": "string",
    "slide_4_titolo": "Chi l'ha fatto con noi", "slide_4_contenuto": "string",
    "slide_5_titolo": "string", "slide_5_contenuto": "string"
  },
  "workflow": [
    { "giorno": 1, "canale": "LinkedIn", "azione": "string" },
    { "giorno": 3, "canale": "Email", "azione": "string" },
    { "giorno": 7, "canale": "LinkedIn", "azione": "string" },
    { "giorno": 10, "canale": "Email", "azione": "string" },
    { "giorno": 14, "canale": "Telefono", "azione": "string" }
  ],
  "linkedin": { "tipo": "Richiesta connessione | InMail", "messaggio": "string — max 300 caratteri" },
  "fonti_ricerca": "string — report grezzo research agent, allegato automaticamente"
}
```

---

## 9. BACKEND — api/prospect-list.js

Endpoint separato per la modalità "Genera Lista Prospect". Stessa struttura agentica di analyze.js: loop multi-turn con web search, max 8 iterazioni (era 15 in v4.0). Stesso exponential backoff in `callClaude` (5 retry su 429/529, 2 retry su 5xx, prefisso `OVERLOADED:`). Stesso `loadBrain` con `readdirSync` dinamico. Stesso `output_config: { effort: 'low' }`. Stesso pattern di `buildListGenSystem` come array di 2 blocchi (brain con `cache_control` + rest). **Non riceve layer/motion.**

```
POST /api/prospect-list
{ settore, geografia, dimensione[], keywords, numero }
```

**ICP Domino:**
- Settori: Automotive, B2B Industriale, Salute & Sanità, Turismo & Cultura, Finance, PA
- Dimensione: Mid-market (50–500 dip.) o Enterprise (500+)
- Segnali positivi: sito datato, poca presenza digitale, crescita recente, job posting digital, cambi management
- Esclude clienti esistenti: Rollon, Bitron, IVECO, Case IH, Stellantis, Comau, IPI, Megadyne, Masi, Costa Crociere, Arca, Alpitour, Biennale Venezia

**Scoring 1–10:** 10 = fit perfetto, 8–9 = ottimo, 6–7 = buon potenziale, 4–5 = da verificare, 1–3 = fuori target.

**Output JSON lista:**
```json
{
  "lista": [{
    "nome": "string", "sito": "string | null", "settore": "string", "sede": "string",
    "dimensione": "PMI | Mid-market | Enterprise", "fatturato_stimato": "string | null",
    "score": 8, "score_motivazione": "string", "segnale_principale": "string", "decisore_probabile": "string"
  }],
  "totale_trovate": 10, "criteri_applicati": "string"
}
```

---

## 10. DESIGN SYSTEM FRONTEND

### Colori (costante `C`)
```js
const C = {
  red:      '#E8272A',
  black:    '#0a0a0a',
  card:     '#141414',
  elevated: '#1e1e1e',
  border:   '#222222',
  text:     '#e8e8e8',
  muted:    '#666666',
  subtle:   '#f5f5f5',
  white:    '#FFFFFF',
};
```

### Font
```js
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
```

### Design Sprint! colors (badge per tipo)
```js
const DS_COLORS = {
  'Service':          { bg: 'rgba(99,102,241,0.12)',  bd: 'rgba(99,102,241,0.4)',  tx: '#a5b4fc' },
  'CX':               { bg: 'rgba(236,72,153,0.12)',  bd: 'rgba(236,72,153,0.4)',  tx: '#f9a8d4' },
  'Brand':            { bg: 'rgba(245,158,11,0.12)',  bd: 'rgba(245,158,11,0.4)',  tx: '#fcd34d' },
  'Digital Marketing':{ bg: 'rgba(16,185,129,0.12)',  bd: 'rgba(16,185,129,0.4)',  tx: '#6ee7b7' },
  'Website':          { bg: 'rgba(59,130,246,0.12)',  bd: 'rgba(59,130,246,0.4)',  tx: '#93c5fd' },
  'Intranet':         { bg: 'rgba(234,88,12,0.12)',   bd: 'rgba(234,88,12,0.4)',   tx: '#fdba74' },
  'Brain & Identity': { bg: 'rgba(232,39,42,0.14)',   bd: 'rgba(232,39,42,0.5)',   tx: '#ff6b6e' },  // rosso Domino — variante di punta 2026
};
```

### Colori canali workflow
```js
const CANAL_COLORS = { LinkedIn: '#0077B5', Email: '#E8272A', Telefono: '#22c55e' };
```

### GTM Layer config — 3 livelli Domino
```js
const GTM_LAYERS = [
  {
    id: 'clevel',
    label: 'C-Level',
    interlocutor: 'CEO / CIO / DG',
    need: '"Inspirami"',
    frame: 'Il digitale come leva strategica',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.1)',
  },
  {
    id: 'headof',
    label: 'Head of',
    interlocutor: 'Director / VP / Resp. area',
    need: '"Aiutami a fare la scelta giusta"',
    frame: 'Rischio zero — munizioni per la vendita interna',
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.1)',
  },
  {
    id: 'manager',
    label: 'Manager / Operativo',
    interlocutor: 'Resp. progetto / Specialista',
    need: '"I feel your pain"',
    frame: 'Lavorerai meno e meglio',
    color: '#059669',
    bg: 'rgba(5,150,105,0.1)',
  },
];
```

### GTM Motion config
```js
const GTM_MOTIONS = [
  { id: 'bottomup', label: '⬆ Bottom-up', desc: 'Contatto freddo o inbound — sali se sei rilevante', sub: 'Pipeline rapida' },
  { id: 'topdown',  label: '⬇ Top-down',  desc: 'Referenza CEO / evento — scendi al team con credibilità', sub: 'Deal più grandi' },
];
```

### Logo in header
```jsx
<img
  src="https://domino.it/wp-content/themes/domino-2024/assets/images/logo-domino-white.svg"
  alt="Domino"
  style={{ height: 22 }}
  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
/>
<div style={{ display: 'none' }}>/* fallback testuale [●○●○] domino */</div>
```

---

## 11. FRONTEND — STRUTTURA E STATI

### Stati principali
```js
const [mode, setMode] = useState('analizza');       // 'analizza' | 'lista'
const [input, setInput] = useState('');
const [note, setNote] = useState('');
const [gtmLayer, setGtmLayer] = useState('headof'); // default: Head of
const [gtmMotion, setGtmMotion] = useState('bottomup');
const [loading, setLoading] = useState(false);
const [loadMsg, setLoadMsg] = useState('');
const [result, setResult] = useState(null);
const [tab, setTab] = useState('intel');
const [hsToken, setHsToken] = useState(() => localStorage.getItem('domino_hs_token') || '');
const [hsSyncing, setHsSyncing] = useState(false);
const [hsMsg, setHsMsg] = useState('');
const [showArchive, setShowArchive] = useState(false);
const [showHs, setShowHs] = useState(false);
const [archCount, setArchCount] = useState(() => loadArchive().length);
const [error, setError] = useState('');
```

### handleAnalyze — retry lato client
```js
async function handleAnalyze(overrideInput) {
  const target = overrideInput || input;
  setError(''); setLoading(true); setResult(null); setTab('intel');

  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const wait = Math.min(4000 * Math.pow(2, attempt - 1), 16000);
        setLoadMsg(`Claude è sovraccarico, sto riprovando (tentativo ${attempt + 1})…`);
        await new Promise(r => setTimeout(r, wait));
      }
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect: target, note, layer: gtmLayer, motion: gtmMotion }),
      });
      const data = await res.json();
      if (data.error?.startsWith('OVERLOADED:')) {
        if (attempt >= MAX_RETRIES) throw new Error(data.error.replace('OVERLOADED:', ''));
        continue;
      }
      if (data.error) throw new Error(data.error);
      setResult(data); saveToArchive(data); setArchCount(loadArchive().length);
      setLoading(false); return;
    } catch (e) {
      if (attempt >= MAX_RETRIES || !e.message?.includes('sovraccarico')) {
        setError(e.message); setLoading(false); return;
      }
    }
  }
  setLoading(false);
}
```

### Tab disponibili
```
intel    → 🔍 Intelligence
mail     → ✉️ Mail
deck     → 📊 Deck
workflow → 📅 Workflow
linkedin → 💼 LinkedIn
fonti    → 📋 Fonti + Debug JSON (bottone toggle)
```

### Loading messages
```js
const LOADING_MSGS = [
  'Analisi sito web aziendale...',
  'Ricerca dati finanziari (Cerved/CCIAA)...',
  'Raccolta news ultimi 12 mesi...',
  'Analisi profili LinkedIn...',
  'Verifica job posting attivi...',
  'Valutazione presenza digitale...',
  'Generazione materiali sales personalizzati...',
]; // Rotazione ogni 7.5 secondi
```

### Quick picks
```js
const QUICK_PICKS = ['Technogym', 'Humanitas', 'Alpitour', 'Amplifon', 'Pirelli', "De'Longhi", 'Fincantieri', "Tod's"];
```

---

## 12. COMPONENTE — GtmSelector

Appare nel form input, tra il campo Note e il bottone Analizza. Mostra label, interlocutore, frame e need per ogni livello. La riga selezionata evidenzia border + bg colorati. Motion: 2 card affiancate.

```jsx
function GtmSelector({ layer, setLayer, motion, setMotion }) {
  return (
    <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
      <div>A chi ti rivolgi?</div>
      {GTM_LAYERS.map(l => (
        <div key={l.id} onClick={() => setLayer(l.id)} style={{ border: `1px solid ${layer === l.id ? l.color : C.border}`, background: layer === l.id ? l.bg : 'transparent', ... }}>
          <div style={{ width: 3, height: 38, background: l.color }} />   {/* barra colorata sinistra */}
          <div>
            <span>{l.label}</span> <span>{l.interlocutor}</span>
            <div style={{ color: l.color }}>{l.frame}</div>
          </div>
          <span style={{ fontStyle: 'italic' }}>{l.need}</span>
        </div>
      ))}
      <div>Come stai entrando?</div>
      {GTM_MOTIONS.map(m => (
        <div key={m.id} onClick={() => setMotion(m.id)} style={{ border: `1px solid ${motion === m.id ? C.text : C.border}`, ... }}>
          {m.label} / {m.desc} / {m.sub}
        </div>
      ))}
    </div>
  );
}
```

---

## 13. TAB — INTELLIGENCE (IntelTab)

Visualizza `result.prospect`. Null guard: se `result.prospect` è assente mostra messaggio di errore con link al tab Fonti.

**Grid 3 colonne (6 metriche):** Settore / Dimensione / Fatturato / Mercati / Decisore / Maturità digitale

**Hook card** (sfondo rosso dimmed): `🎯 {prospect.hook}`

**Badge strumenti** — nomi corretti:
- `core_sprint: true` → badge viola "Core Sprint!" (€6.000)
- `design_sprint_tipo` → badge colorato "[Tipo] Design Sprint!" + motivazione 11px
- `preventivo_emozionale: true` → badge verde "Preventivo Emozionale" + motivazione

**3 Casi studio:** [0] rosso "Più affine" / [1] blu "Stesso settore" / [2] grigio "Metodologia"

**Persone chiave:** avatar iniziale + nome + ruolo + anzianità

**Segnali recenti:** lista `→` rosso

**Sfide probabili:** numbered cards bordo rosso dimmed

---

## 14. TAB — MAIL (MailTab)

Null guard: se `mail.oggetto` è vuoto mostra avviso. Card oggetto + card corpo + CopyBtn.

---

## 15. TAB — DECK (DeckTab)

5 slide come card colorate + bottone "⬇ Scarica PPT". Null guard: se `deck.slide_1_titolo` è vuoto mostra avviso.

| Slide | Sfondo | Testo titolo |
|---|---|---|
| 1 — Cover | `#0a0a0a` | bianco |
| 2 — Problema | `#FFFFFF` | `#111` + barra rossa sinistra |
| 3 — Soluzione | `#FFFFFF` | `#111` + barra rossa sinistra |
| 4 — Case study | `#f5f5f5` | `#E8272A` rosso |
| 5 — Next step | `#E8272A` | bianco |

---

## 16. EXPORT PPT (pptxgenjs)

**`import pptxgen from 'pptxgenjs'`** — importato nel bundle React, NON da CDN.

Layout: LAYOUT_WIDE (13.33" × 7.5"). Badge strumenti in slide 3 usa `core_sprint` (non `foundation_sprint`).

**Filename:** `domino-prospect-{nome-kebab}.pptx`

---

## 17. TAB — WORKFLOW (WorkflowTab)

5 step (Gg1/3/7/10/14), badge canale colorato. Null guard su array vuoto.

---

## 18. TAB — LINKEDIN (LinkedInTab)

Badge tipo + CopyBtn + contatore caratteri (rosso se > 300). Null guard su `linkedin.messaggio`.

---

## 19. TAB — FONTI (FontiTab)

Report grezzo research agent. Toggle "Debug JSON" per mostrare `JSON.stringify(result, null, 2)` — utile per diagnosticare problemi di generazione.

---

## 20. ARCHIVIO

**Storage key:** `domino_pe_arch` in localStorage. Max 50 voci.

```js
function saveToArchive(r) {
  const a = loadArchive();
  a.unshift({ ...r, _savedAt: new Date().toISOString() });
  localStorage.setItem('domino_pe_arch', JSON.stringify(a.slice(0, 50)));
}
```

**ArchiveModal:** lista ordinate per data, click → `setResult(item); setMode('analizza')`. Hover border rosso.

---

## 21. INTEGRAZIONE HUBSPOT

Token `pat-eu1-...` salvato in localStorage. Chiamate dirette dal frontend all'API HubSpot:
1. Search company per nome
2. PATCH o POST company con `name, industry, description, hs_lead_status: 'IN_PROGRESS'`
3. POST nota strutturata (settore, dimensione, hook, sfide, workflow, casi studio)

**Permessi token:** Companies (read/write) + Notes (write).

---

## 22. BRAIN — CONTENUTO DEI 11 FILE

### File esistenti (brain v5.1)
- `01_domino_identita.md` — 50 persone, 30 anni, B Corp 2025, payoff, **manifesto a 5 pilastri**, tabella *"Da agenzia digital a Strategic CX Partner"*, **5 rivoluzioni in 30 anni** ('95→'25), clienti per settore, Sortlist
- `02_domino_servizi.md` (**v4.2**) — **Decision Design come cuore del lavoro** (sezione di apertura, con citazione Codice Etico 2024), 4 macro-aree, stack tech, scenari I5.0, Trainstorming!
- `03_domino_metodi.md` (**v5.1**) — Catalogo 2026 a 6 prodotti (tabella sintetica + percorso a 4 Sprint!), **Core Sprint!** (€6K), **Design Sprint!** (€10K) con la variante di punta 2026 **Brain & Identity Design Sprint!**, **Build Sprint!** (€20-60K, sostituisce "Progetto completo"), **Trainstorming!** (da €15K, oggi anche servizio venduto), Preventivo Emozionale, scala commerciale, regola sul gratuito
- `04_domino_case_history.md` — tutti i case con KPI: IVECO IKA 2024, Stellantis, Fiat EMEA, Case IH, Costa Crociere, Masi, Frascold, Bitron, Arca, ENIT...
- `05_domino_settori.md` — pain point per verticale: Automotive, B2B, Salute, Turismo, Finance, PA
- `06_domino_referenze.md` — 16 premi IKA (tabella completa), 10 testimonianze Sortlist, formule di pitch, B Corp

### File GTM di settore (nuovi)
- `07_domino_gtm_b2b.md` — sales play B2B, audit tattici (SEO/GEO, Digital Mktg, CX), pricing, ICP
- `08_domino_gtm_salute_beauty.md` — 3 sub-target (strutture sanitarie, beauty premium, farma), plays per ognuno
- `09_domino_gtm_turismo_cultura.md` — 3 sub-target (destinazioni, tour operator, istituzioni culturali)
- `10_domino_gtm_finance_pa.md` — approccio opportunistico (referral-driven), sub-target SGR/banche/PA
- `11_domino_gtm_automotive.md` — storia più profonda Domino, 5 premi IKA, clienti OEM, plays per espansione

---

## 23. NOTE IMPLEMENTATIVE CRITICHE

**Brain caching (2 livelli, v4.1):**
1. *Filesystem cache* — `let _brainCache = null` a livello modulo. Prima chiamata legge `brain/*.md`, le successive usano la cache in-memory. Su Vercel ogni serverless function ha il suo ciclo di vita.
2. *Anthropic prompt cache* — il brain è il primo blocco del `system` array con `cache_control: { type: 'ephemeral' }`. TTL 5 min. Risparmio: ~90% sul costo input del brain (~60K token) dalla 2ª chiamata. Break-even a 2 chiamate.

**Sync brain da OneDrive:** il brain canonico vive su `~/Library/CloudStorage/OneDrive-DominoSRL/Documenti/Claude/Projects/Domino Brain/`. `scripts/sync-brain.sh` (lanciato ogni 10 min da `~/Library/LaunchAgents/com.domino.brain-sync.plist`) fa rsync one-way OneDrive → `brain/`, auto-commit, push. Richiede Full Disk Access su `/bin/bash` per accedere ai cloud storage da contesto launchd.

**Nomenclatura prodotti:** il system prompt di generation include esplicitamente i nomi corretti come *anchor* anti-allucinazione. La fonte canonica resta `brain/03_domino_metodi.md` (sezione "Catalogo 2026"). Errori tipici da prevenire: "Foundation Sprint" al posto di "Core Sprint!", "Progetto completo" al posto di "Build Sprint!", "preventivo emozionale" minuscolo, "Trainstorming" senza `!` quando citato come prodotto.

**JSON parsing robusto:** 3 tentativi — parse diretto, estrazione da `{...}`, errore. Seguita da normalizzazione completa di tutti i campi.

**CORS headers** su entrambe le functions (OPTIONS + headers standard).

**pptxgenjs** importato nel bundle React → richiede `optimizeDeps: { include: ['pptxgenjs'] }`.

**Analisi diretta da lista:** click "Analizza →" in ListaView imposta `input` e switcha a modalità `analizza`.

**Retry doppio:** il backend fa backoff esponenziale internamente (fino a 32s, 5 tentativi). Il frontend fa backoff addizionale sui prefissi `OVERLOADED:` (4s, 8s, 16s, 3 tentativi).

**Debug JSON:** il tab Fonti ha un bottone toggle che mostra `JSON.stringify(result, null, 2)` per diagnosticare problemi senza aprire DevTools.

---

## 24. DEPLOY

1. Push su GitHub (`abossoto/domino-prospect-engine`)
2. Vercel rileva automaticamente framework Vite
3. Impostare `ANTHROPIC_API_KEY` in Vercel → Settings → Environment Variables
4. Deploy automatico a ogni push sul branch `main`.

---

## 25. CHANGELOG DOC

- **2026-05-01** — release **v4.1.0** (latency fix + prompt caching + sync OneDrive):
  - **Modello:** `claude-sonnet-4-20250514` → `claude-sonnet-4-6` (Sonnet 4.0 in deprecation, retire 15-giu-2026).
  - **Effort:** aggiunto `output_config: { effort: 'low' }` in `callClaude` (entrambe le functions). Sonnet 4.6 default `high` sforava il budget Vercel.
  - **`maxDuration`:** 60 → 300 in `vercel.json` (max Pro plan). Necessario per il loop agentico Sonnet 4.6 + web_search.
  - **Iter loop:** research agent in `analyze.js` 20 → 8 (soglie feedback 8/15 → 4/6). `prospect-list.js` 15 → 8 (soglia 8 → 5).
  - **Backoff:** aggiunto exponential backoff in `prospect-list.js` `callClaude` (era assente in v4.0 nonostante la spec lo dichiarasse — bug fix di documentazione).
  - **Brain loader dinamico:** `prospect-list.js` `loadBrain()` ora usa `readdirSync` come `analyze.js` (era hardcoded con array di 11 nomi).
  - **Prompt caching attivo:** `system` ora passato come array di 2 blocchi: `[{ type:'text', text: brain, cache_control:{ type:'ephemeral' }}, { type:'text', text: rest }]`. Il brain (~60K token) è cachato Anthropic-side per 5 min.
  - **Spec spostata fuori da brain/:** la spec descrive l'app, non i contenuti Domino. `loadBrain()` non la include più nel system prompt → ~13K token risparmiati per ogni call.
  - **`personas_clienti_da_GTM.md`:** rimosso da `brain/` (non più presente nel sorgente OneDrive canonico).
  - **`scripts/sync-brain.sh`:** nuovo script rsync OneDrive → `brain/` con auto-commit + push. Lanciato ogni 10 min da LaunchAgent macOS (`com.domino.brain-sync`).
  - **`buildUserMessage` rimossa:** il messaggio utente è costruito inline. Il brain non passa più nel messaggio utente, vive nel primo blocco system.

- **2026-04-30** — riallineamento al brain v5.1 (presentazione interna *"A new Domino"*, aprile 2026):
  - Aggiunto principio architetturale in apertura (brain = fonte canonica, spec = orchestratore).
  - Versione brain dichiarata 5.0 → 5.1.
  - System prompt generation aggiornato: aggiunti **Build Sprint!** (sostituisce "Progetto completo") e **Brain & Identity Design Sprint!** (variante di punta 2026); **Trainstorming!** ora dichiarato come servizio venduto e non più solo rituale interno; aggiunto blocco *Decision Design* come cornice trasversale; corretto typo *"Core Sprint! NON Core Sprint!"* → *"NON Foundation Sprint"*.
  - Schema JSON e `parseJSON`: aggiunto valore `Brain & Identity` a `design_sprint_tipo`.
  - Frontend `DS_COLORS`: aggiunto colore rosso Domino per la variante `Brain & Identity`.
  - Sezione 22: descrizione `01/02/03_*.md` aggiornata coi nuovi contenuti (manifesto a 5 pilastri, 5 rivoluzioni in 30 anni, Decision Design come cuore, catalogo 2026 a 6 prodotti).
  - Note implementative: ricordo che la fonte canonica dei nomi prodotto resta `brain/03_domino_metodi.md`.
