# Domino Prospect Engine — istruzioni per Claude Code

## Cosa è
Sales intelligence tool React + Vite + Vercel functions. Backend in
`api/analyze.js` e `api/prospect-list.js`. Frontend in `src/App.jsx`. Carica il
"Domino Brain" (file markdown in `brain/`) a runtime per generare materiali
sales personalizzati.

## Architettura — principio chiave
Il Domino Brain è la fonte canonica dei contenuti su Domino. Vive in OneDrive
e viene sincronizzato in `brain/` solo al momento del deploy.
NON modificare i file in `brain/` direttamente — sono una fotografia.
Le modifiche di contenuto vanno fatte a monte (in OneDrive) e poi
sincronizzate con `scripts/sync-brain.sh`.

## Spec funzionale
La spec dell'app è in `/DOMINO_PROSPECT_ENGINE_SPEC_v4.md` (root del repo).
Vive separata dal brain perché non è contenuto Domino, è la documentazione interna
dell'applicazione (system prompt, JSON schema, architettura).
Quando modifichi system prompt, parseJSON o JSON schema, aggiorna anche la spec.

## Regole di nomenclatura prodotti
TUTTI i prodotti Domino terminano con "!" (Core Sprint!, Design Sprint!,
Build Sprint!, Trainstorming!, Brain & Identity Design Sprint!).
Eccezioni: "Preventivo Emozionale" e "Audit tattico".
Vedi `brain/03_domino_metodi.md`.

## Deploy
Push su `main` → Vercel rileva e fa redeploy automatico.
Niente staging attualmente. Per modifiche rischiose preferisci PR.

## Cosa NON fare
- Non aggiungere dipendenze senza approvazione.
- Non rimuovere il backoff esponenziale in `callClaude`.
- Non modificare `brain/` — i contenuti sono autoritativi su OneDrive.
