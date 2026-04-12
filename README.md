# Domino Prospect Engine — v3.2.0

Sales intelligence tool interno per il team commerciale di Domino.

## Funzionalità

- **Analizza Prospect** — inserisci nome o URL azienda → dossier di intelligence completo, mail di primo contatto, deck 5 slide, workflow 14 giorni, messaggio LinkedIn
- **GTM Layer/Motion (v3.2)** — seleziona chi è il destinatario (L1–L5) e come stai entrando (Bottom-up / Top-down) → tutti i materiali si adattano automaticamente
- **Genera Lista Prospect** — scegli settore, area, dimensione → lista qualificata con scoring 1-10
- **Export PPT** — deck 5 slide brand Domino in un click
- **Sync HubSpot** — crea/aggiorna azienda e allega nota strutturata
- **Archivio locale** — ultime 50 analisi salvate in localStorage

## Setup locale

```bash
npm install
npm run dev
```

Crea un file `.env` (o imposta la variabile su Vercel):

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Deploy su Vercel

1. Push su GitHub
2. Importa il repo su Vercel
3. Imposta `ANTHROPIC_API_KEY` in **Settings → Environment Variables**
4. Deploy automatico a ogni push su `main`

## Struttura progetto

```
├── api/
│   ├── analyze.js          ← research agent + generazione materiali (con GTM)
│   └── prospect-list.js    ← generazione lista prospect qualificata
├── brain/
│   ├── 01_domino_identita.md
│   ├── 02_domino_servizi.md
│   ├── 03_domino_metodi.md
│   ├── 04_domino_case_history.md
│   ├── 05_domino_settori.md
│   └── 06_domino_referenze.md
├── src/
│   ├── App.jsx             ← frontend React completo
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

**Il brain è aggiornabile senza toccare il codice.** Modifica i file `.md` in `/brain/` e fai push.

## GTM Layer/Motion

| Layer | Interlocutore | Bisogno |
|-------|--------------|---------|
| L1 — Experience Vision | CEO / C-Suite | "Inspirami" |
| L2 — Settori | Director / VP Marketing | "Connettiti col mio mondo" |
| L3 — Use Cases | Director / Head of | "Rendilo tangibile" |
| L4 — Tech Categories | Manager / Specialista | "Trovami dove cerco" |
| L5 — Sales Play | Manager / Procurement | "Sei nell'RFP?" |

| Motion | Descrizione |
|--------|------------|
| ⬆ Bottom-up | Contatto freddo o inbound — costruisci credibilità prima |
| ⬇ Top-down | Referenza CEO / evento — vai diretto al tema operativo |
