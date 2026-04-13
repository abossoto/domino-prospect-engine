# Domino Prospect Engine — Aggiornamento v3.3

## Cosa c'è in questo ZIP

### `/brain/` — Brain aggiornato (11 file)
File aggiornati o nuovi rispetto alla v3.2:
- `03_domino_metodi.md` — aggiornato v5: pricing completo (audit €1.500, Foundation Sprint €6K, Design Sprint €10K), distinzione Foundation vs Design Sprint, fonte unica per tutti i GTM
- `06_domino_referenze.md` — aggiornato: nomination IKA 2025 (IVECO Design System, IVECO MY METALLICA TRUCK), Fiat IKA 2012 chiarito come fiat.it 21 paesi EMEA
- `07_domino_gtm_b2b.md` — **NUOVO**: 5 sales plays B2B industriale
- `08_domino_gtm_salute_beauty.md` — **NUOVO**: 5 sales plays Salute, Sanità & Beauty
- `09_domino_gtm_turismo_cultura.md` — **NUOVO**: 5 sales plays Turismo & Cultura
- `10_domino_gtm_finance_pa.md` — **NUOVO**: 5 sales plays Finance & PA
- `11_domino_gtm_automotive.md` — **NUOVO**: 5 sales plays Automotive

### `/api/` — Backend con 3 fix applicati
- `analyze.js` — fix LinkedIn (strategia indiretta via Google) + guard fonti_ricerca
- `prospect-list.js` — fix max_tokens (1000→4000) + parseJSON robusto

### `PATCH_App.jsx.md` — Patch per il frontend
Istruzioni per i 2 cambiamenti da applicare manualmente a `src/App.jsx`:
1. FontiTab con guard esplicito su fonti_ricerca
2. saveToArchive che esclude fonti_ricerca da localStorage

---

## Come aggiornare il repo

### 1. Brain files (copia e sostituisci)
```bash
cp brain/*.md /path/to/repo/brain/
```

### 2. API files (copia e sostituisci)
```bash
cp api/analyze.js /path/to/repo/api/
cp api/prospect-list.js /path/to/repo/api/
```

### 3. App.jsx (patch manuale)
Leggi `PATCH_App.jsx.md` e applica le 2 modifiche a `src/App.jsx`.

### 4. Deploy
```bash
git add -A
git commit -m "v3.3: brain GTM completo, fix LinkedIn/fonti/lista"
git push
```
Vercel fa il deploy automaticamente.

---

## Bug risolti in v3.3

| Bug | Causa | Fix |
|---|---|---|
| LinkedIn persone chiave non trovate | LinkedIn blocca crawler diretti | Strategia Google indiretta con `site:linkedin.com` query |
| Tab Fonti mostra schermata vuota | `fonti_ricerca` undefined da archivio + mancanza guard | Guard esplicito in FontiTab + esclusione da localStorage |
| Lista prospect: Unexpected end of JSON | `max_tokens: 1000` troppo basso, JSON troncato | `max_tokens: 4000` + parseJSON robusto con estrazione JSON |
