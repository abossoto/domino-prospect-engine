# Domino Prospect Engine

Sales intelligence per Domino. Dato il nome di un'azienda, ricerca sul web chi è,
come sta e chi ci lavora, e produce i materiali per contattarla: mail, deck a 5
slide, workflow di touch, messaggio LinkedIn. In alternativa, dato un settore,
costruisce una lista di prospect qualificati con scoring.

React + Vite sul frontend, Vercel Functions sul backend, Claude per ricerca e
generazione. I contenuti su Domino vivono nel **Domino Brain**, una cartella di
file markdown caricata a runtime.

Produzione: https://domino-prospect-engine.vercel.app

---

## Come funziona

Entrambe le modalità sono spezzate in due fasi, ognuna con la sua function.
Il motivo è il `maxDuration` di 300 secondi di Vercel: una sola function che
faccia ricerca *e* generazione ci va troppo vicino, e quando sfora l'utente
riceve un 504 senza spiegazione.

### Analizza un prospect

```
POST /api/research    { prospect, note }
                      → { report, incompleto, persone_verificate }

POST /api/generate    { prospect, layer, motion, report }
                      → materiali sales in JSON
```

La fase 1 fa ricerca web e, se `ROCKETREACH_API_KEY` è configurata, arricchisce i
decisori con nomi, ruoli, profili LinkedIn e email verificate. Le due cose girano
in parallelo, quindi RocketReach non aggiunge latenza.

La fase 2 riceve il report e produce il JSON. Il frontend tiene il report in
stato: cambiare layer o motion GTM rigenera solo i materiali, senza rifare le
ricerche.

### Genera una lista di prospect

```
POST /api/prospect-search   { settore, geografia, dimensione[], keywords, numero }
                            → { report }

POST /api/prospect-rank     { criteri…, report }
                            → { lista[], totale_trovate, criteri_applicati }
```

`/api/analyze` e `/api/prospect-list` restano disponibili e concatenano le
rispettive due fasi in una sola chiamata. Sono lì per compatibilità: il frontend
non li usa.

---

## Il Domino Brain

I file in `brain/` sono la fonte canonica dei contenuti su Domino — identità,
servizi, metodi, prezzi, case history, referenze, sales play per settore.

> **Non modificare `brain/` in questo repo.** È una fotografia. La fonte vive su
> OneDrive in `Documenti/Claude/Projects/Domino Brain/`, e `scripts/sync-brain.sh`
> la replica qui ogni 10 minuti via LaunchAgent, con commit e push automatici.
> Il sync è a senso unico e usa `--delete`: qualsiasi modifica fatta qui viene
> sovrascritta al giro successivo.

Il loader legge tutti i `.md` della cartella in ordine alfabetico, meno quelli in
`BRAIN_EXCLUDE` (`api/_shared.js`). Aggiungere un file al brain non richiede
modifiche al codice.

Il brain pesa circa 160.000 token e viene inviato a ogni generazione come primo
blocco `system` con `cache_control` a un'ora. Il blocco è identico in tutti gli
endpoint proprio per condividere una sola voce di cache: **se lo modifichi in un
punto solo, la cache si rompe ovunque.**

---

## Setup

```bash
npm install
```

Poi un file `.env.local` nella root (è in `.gitignore`):

```
ANTHROPIC_API_KEY=sk-ant-...
ROCKETREACH_API_KEY=...
```

| Variabile | Obbligatoria | A cosa serve |
|---|---|---|
| `ANTHROPIC_API_KEY` | sì | ricerca e generazione |
| `ROCKETREACH_API_KEY` | no | decisori verificati con email e LinkedIn |

Senza `ROCKETREACH_API_KEY` l'arricchimento viene saltato in silenzio e tutto il
resto funziona. È deliberato: nessun errore di RocketReach — chiave scaduta,
rate limit, crediti finiti — deve poter far fallire un'analisi.

Su Vercel le stesse variabili vanno in **Settings → Environment Variables**.
Attenzione: si applicano solo ai deployment *nuovi*, mai a quelli già costruiti.

---

## Sviluppo

```bash
npm run dev
```

Vite serve il frontend e fa proxy di `/api` su `localhost:3000`. Per avere anche
le function in locale serve `vercel dev` al posto di `npm run dev`.

Per provare un singolo endpoint senza interfaccia, gli handler sono funzioni
`(req, res)` ordinarie e si possono invocare da Node passando un `req` finto.

```bash
npm run build      # build di produzione in dist/
npm run preview    # serve la build
```

---

## Deploy

Push su `main` → Vercel fa il redeploy da solo. Non c'è staging, quindi per le
modifiche rischiose conviene passare da una PR.

Dopo il deploy, il modo più rapido per capire se è andata è confrontare l'hash
del bundle servito con quello dell'ultima build locale:

```bash
curl -s https://domino-prospect-engine.vercel.app/ | grep -o 'index-[^"]*\.js'
```

Per i cambi che toccano solo le function l'hash non cambia: lì conviene chiamare
un endpoint con un body incompleto e verificare che risponda `400` con il
messaggio di validazione giusto.

---

## Struttura

```
api/
  _shared.js          modello, brain, cache, callClaude, scadenza per richiesta
  _research.js        fase 1 analisi — RESEARCH_SYSTEM, gestione pause_turn
  _generate.js        fase 2 analisi — prompt GTM, schema JSON, parseJSON
  _people.js          arricchimento decisori via RocketReach (opzionale)
  _list.js            liste — ricerca aziende e scoring
  research.js         endpoint analisi fase 1
  generate.js         endpoint analisi fase 2
  analyze.js          endpoint storico, le due fasi insieme
  prospect-search.js  endpoint lista fase 1
  prospect-rank.js    endpoint lista fase 2
  prospect-list.js    endpoint storico, le due fasi insieme
brain/                fonte canonica dei contenuti Domino (sync da OneDrive)
scripts/sync-brain.sh rsync OneDrive → brain/ con commit e push
src/
  App.jsx             frontend completo
  pptBuilder.js       export PPTX (import dinamico)
  dossierBuilder.js   export DOCX (import dinamico)
  designSystem.js     token del Domino Design System
```

I file `api/` che iniziano con `_` non vengono esposti come route da Vercel.

`pptxgenjs` e `docx` pesano insieme circa 750 kB e sono caricati con `import()`
dinamico solo al click sui pulsanti di export: il bundle iniziale è 272 kB invece
di 1.028 kB.

---

## Documentazione

[`DOMINO_PROSPECT_ENGINE_SPEC_v4.md`](DOMINO_PROSPECT_ENGINE_SPEC_v4.md) è la
specifica completa: system prompt integrali, schema JSON, architettura, design
system, changelog. Sta fuori da `brain/` perché documenta l'applicazione, non i
contenuti Domino.

Quando modifichi system prompt, `parseJSON` o lo schema JSON, aggiorna anche la
spec.

[`CLAUDE.md`](CLAUDE.md) contiene le istruzioni per chi lavora sul repo con
Claude Code.

---

## Cose da sapere prima di metterci mano

**`web_search` è un tool server-side.** Anthropic esegue le ricerche da sé e
restituisce blocchi `server_tool_use`: `stop_reason` non vale mai `tool_use`, e
non c'è nessun loop client-side da orchestrare. L'unica cosa da gestire è
`pause_turn`, che arriva quando il loop del server esaurisce le sue iterazioni
con il lavoro ancora aperto.

**`max_uses` sul tool di ricerca non è un parametro neutro.** Se è troppo basso
il modello esaurisce le ricerche nella fase di scoperta e restituisce un
risultato vuoto con HTTP 200 — un fallimento silenzioso. Va calibrato sul
compito: 20 per l'analisi di un prospect, 40 per la lista.

**I timeout per chiamata non bastano.** `creaScadenza()` fissa una scadenza
unica per richiesta che viene propagata a ogni chiamata, perché la somma dei
timeout individuali può superare di molto il `maxDuration` della function. Se
cambi `maxDuration` in `vercel.json`, aggiorna `MAX_DURATA_MS` in `_shared.js`.

**I dati di contatto non si deducono.** Email e URL LinkedIn si copiano solo dal
blocco verificato di RocketReach, e il sito di un'azienda solo dal report di
ricerca. Un indirizzo costruito a partire dal dominio sembra plausibile ed è
sbagliato: rimbalza, o peggio arriva alla persona sbagliata.

**Tutti i prodotti Domino finiscono con `!`** — Core Sprint!, Design Sprint!,
Build Sprint!, Trainstorming! Non è enfasi, è il nome ufficiale. Le eccezioni
sono "Preventivo Emozionale" e "Audit tattico". `parseJSON` normalizza le
occorrenze mancanti, ma il prompt lo ripete perché la normalizzazione è una
rete, non la regola.
