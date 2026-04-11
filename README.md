# Domino Prospect Engine v3

Tool AI per il team commerciale. Analisi approfondita dei prospect + materiali sales personalizzati con il DNA Domino.

## Struttura

```
/api/analyze.js     → Serverless function — legge /brain/*.md a runtime
/brain/*.md         → Domino Brain — aggiornabile senza toccare il codice
/src/App.jsx        → React frontend (design system Domino)
/src/main.jsx       → Entry point
/index.html         → HTML shell
/package.json       → React + pptxgenjs
/vite.config.js     → Vite + proxy locale
/vercel.json        → Routing Vercel
```

## Deploy su Vercel

1. Carica su GitHub
2. Importa il repo su vercel.com
3. Aggiungi la variabile d'ambiente:
   ```
   ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxxxxxxxx
   ```
4. Deploy → l'app è online

## Aggiornare il Domino Brain

Modifica solo i file in `/brain/*.md` — nessun tocco al codice.
Dopo ogni modifica: push su GitHub → Vercel rideploya automaticamente.

## HubSpot

1. Vai su app.hubspot.com/private-apps
2. Crea una Private App con permessi: Companies (lettura/scrittura), Notes (scrittura)
3. Nel tool: clicca "○ HubSpot" nell'header → incolla il token

## Sviluppo locale

```bash
npm install
# Crea .env.local con:
# ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx

vercel dev    # backend + frontend insieme su http://localhost:3000
# oppure
npm run dev   # solo frontend (api mock)
```
